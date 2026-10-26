"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { assertSeller, assertUser } from "@/lib/session";
import { categoryBySlug } from "@/lib/catalog";
import { round2 } from "@/lib/pricing";
import { SELLER_TRANSITIONS, withStatus } from "@/lib/orders";
import { logMovement, newSku } from "@/lib/inventory";

const text = (value, max = 200) => String(value ?? "").trim().slice(0, max);
const isHttps = (url) => /^https:\/\/\S+$/i.test(url);
// Store artwork may also be an image bundled with the app (e.g. the seeded monogram logos)
const isImage = (url) => isHttps(url) || /^\/[\w\-./]+\.(svg|png|jpe?g|webp)$/i.test(url);
const fail = (error) => ({ error: error?.message || "Something went wrong. Please try again." });

// ------------------------------------------------------------------ store

function cleanStore(input) {
  const data = {
    name: text(input.name, 60),
    username: text(input.username, 30).toLowerCase(),
    tagline: text(input.tagline, 90),
    description: text(input.description, 1200),
    logo: text(input.logo, 500),
    banner: text(input.banner, 500) || null,
    email: text(input.email, 120).toLowerCase(),
    phone: text(input.phone, 30),
    address: text(input.address, 160),
    city: text(input.city, 60),
  };
  if (data.name.length < 2) return { error: "Give your store a name." };
  if (!/^[a-z0-9-]{3,30}$/.test(data.username)) return { error: "Store link must be 3-30 lowercase letters, numbers or dashes." };
  if (data.tagline.length < 8) return { error: "Add a short tagline (at least 8 characters)." };
  if (data.description.length < 30) return { error: "Describe your store in at least 30 characters." };
  if (!isImage(data.logo)) return { error: "Add a logo image." };
  if (data.banner && !isImage(data.banner)) return { error: "The banner must be an https image link." };
  if (!/^\S+@\S+\.\S+$/.test(data.email)) return { error: "Enter a valid contact email." };
  if (data.phone.length < 7) return { error: "Enter a contact phone number." };
  if (!data.address || !data.city) return { error: "Add your pickup address and city." };
  const lat = Number(input.lat);
  const lng = Number(input.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng) && (lat || lng)) Object.assign(data, { lat, lng });
  return { data };
}

export async function applyForStore(input) {
  try {
    const user = await assertUser();
    const { data, error } = cleanStore(input);
    if (error) return { error };

    const existing = await prisma.store.findUnique({ where: { ownerId: user.id } });
    if (existing && existing.status !== "REJECTED") return { error: "You already have a store." };
    const taken = await prisma.store.findFirst({ where: { username: data.username, NOT: { ownerId: user.id } } });
    if (taken) return { error: "That store link is taken. Try another." };

    // A rejected application can be edited and sent again
    if (existing) await prisma.store.update({ where: { id: existing.id }, data: { ...data, status: "PENDING" } });
    else await prisma.store.create({ data: { ...data, ownerId: user.id } });

    revalidatePath("/sell");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function updateStore(input) {
  try {
    const user = await assertSeller();
    const { data, error } = cleanStore(input);
    if (error) return { error };
    const taken = await prisma.store.findFirst({ where: { username: data.username, NOT: { id: user.store.id } } });
    if (taken) return { error: "That store link is taken. Try another." };
    await prisma.store.update({ where: { id: user.store.id }, data });
    revalidatePath("/seller/settings");
    revalidatePath(`/store/${data.username}`);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

// ------------------------------------------------------------------ products

function cleanProduct(input) {
  const images = (Array.isArray(input.images) ? input.images : []).map((u) => text(u, 500)).filter(isHttps).slice(0, 6);
  const sizes = [...new Set((Array.isArray(input.sizes) ? input.sizes : []).map((s) => text(s, 8)).filter(Boolean))].slice(0, 12);
  const tags = [...new Set(text(input.tags, 300).split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))].slice(0, 10);
  const price = round2(Number(input.price));
  const mrp = round2(Number(input.mrp) || price);
  const stock = Math.floor(Number(input.stock));

  const data = {
    name: text(input.name, 120),
    description: text(input.description, 4000),
    brand: text(input.brand, 60) || null,
    category: text(input.category, 30),
    subCategory: text(input.subCategory, 40) || null,
    unit: text(input.unit, 30) || null,
    images,
    sizes,
    tags,
    price,
    mrp,
    stock,
  };
  if (data.name.length < 3) return { error: "Give the product a name." };
  if (data.description.length < 20) return { error: "Add a description of at least 20 characters." };
  if (!categoryBySlug(data.category)) return { error: "Choose a department." };
  if (!images.length) return { error: "Add at least one product image." };
  if (!(price > 0) || price > 100000) return { error: "Enter a valid price." };
  if (mrp < price) return { error: "The original price can't be lower than the selling price." };
  if (!Number.isInteger(stock) || stock < 0 || stock > 100000) return { error: "Enter how many you have in stock." };
  return { data };
}

export async function saveProduct(input) {
  try {
    const user = await assertSeller();
    const { data, error } = cleanProduct(input);
    if (error) return { error };

    let product;
    if (input.id) {
      const existing = await prisma.product.findFirst({ where: { id: input.id, storeId: user.store.id } });
      if (!existing) return { error: "Product not found." };
      product = await prisma.$transaction(async (tx) => {
        const updated = await tx.product.update({ where: { id: existing.id }, data });
        await logMovement(tx, {
          productId: updated.id, storeId: updated.storeId, change: updated.stock - existing.stock, balance: updated.stock,
          reason: "ADJUST", note: "Edited on the product form", userId: user.id,
        });
        return updated;
      });
    } else {
      product = await prisma.$transaction(async (tx) => {
        const created = await tx.product.create({ data: { ...data, sku: newSku(), storeId: user.store.id } });
        await logMovement(tx, {
          productId: created.id, storeId: created.storeId, change: created.stock, balance: created.stock,
          reason: "INITIAL", note: "Opening stock", userId: user.id,
        });
        return created;
      });
    }
    revalidatePath("/seller/products");
    revalidatePath(`/product/${product.id}`);
    return { ok: true, id: product.id };
  } catch (error) {
    return fail(error);
  }
}

async function ownProduct(productId) {
  const user = await assertSeller();
  const product = await prisma.product.findFirst({ where: { id: productId, storeId: user.store.id } });
  if (!product) throw new Error("Product not found.");
  return product;
}

export async function setProductActive(productId, isActive) {
  try {
    await ownProduct(productId);
    await prisma.product.update({ where: { id: productId }, data: { isActive: Boolean(isActive) } });
    revalidatePath("/seller/products");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function setProductStock(productId, stock) {
  try {
    const product = await ownProduct(productId);
    const value = Math.floor(Number(stock));
    if (!Number.isInteger(value) || value < 0 || value > 100000) return { error: "Enter a stock level from 0 upwards." };
    await prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id: productId }, data: { stock: value } });
      await logMovement(tx, {
        productId, storeId: product.storeId, change: value - product.stock, balance: value, reason: "ADJUST", note: "Edited in the products table",
      });
    });
    revalidatePath("/seller/products");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteProduct(productId) {
  try {
    await ownProduct(productId);
    // Products that appear in orders are hidden instead of deleted, so order history stays intact
    const ordered = await prisma.orderItem.count({ where: { productId } });
    if (ordered) await prisma.product.update({ where: { id: productId }, data: { isActive: false } });
    else await prisma.product.delete({ where: { id: productId } });
    revalidatePath("/seller/products");
    return { ok: true, archived: ordered > 0 };
  } catch (error) {
    return fail(error);
  }
}

export async function startFlashDeal(productId, percent, hours) {
  try {
    const product = await ownProduct(productId);
    const off = Math.round(Number(percent));
    const length = Number(hours);
    if (!(off >= 5 && off <= 70)) return { error: "Pick a discount between 5% and 70%." };
    if (!(length >= 1 && length <= 72)) return { error: "Deals can run from 1 to 72 hours." };
    await prisma.product.update({
      where: { id: productId },
      data: { dealPrice: round2(product.price * (1 - off / 100)), dealEndsAt: new Date(Date.now() + length * 3_600_000) },
    });
    revalidatePath("/seller/products");
    revalidatePath("/deals");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function endFlashDeal(productId) {
  try {
    await ownProduct(productId);
    await prisma.product.update({ where: { id: productId }, data: { dealPrice: null, dealEndsAt: null } });
    revalidatePath("/seller/products");
    revalidatePath("/deals");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

// ------------------------------------------------------------------ orders

export async function sellerUpdateOrder(orderId, status) {
  try {
    const user = await assertSeller();
    const order = await prisma.order.findFirst({ where: { id: orderId, storeId: user.store.id }, include: { items: true } });
    if (!order) return { error: "Order not found." };
    if (!SELLER_TRANSITIONS[order.status]?.includes(status)) return { error: "That step isn't available for this order any more." };

    await prisma.$transaction(async (tx) => {
      if (status === "CANCELLED") {
        for (const item of order.items) {
          const product = await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity }, soldCount: { decrement: item.quantity } },
          });
          await logMovement(tx, {
            productId: item.productId, storeId: order.storeId, change: item.quantity, balance: product.stock,
            reason: "CANCEL", note: `Order ${order.number}: cancelled by the store`, userId: user.id, orderId: order.id,
          });
        }
      }
      await tx.order.update({
        where: { id: order.id },
        data: { status, statusHistory: withStatus(order.statusHistory, status, status === "CANCELLED" ? "Cancelled by the store" : undefined) },
      });
    });
    revalidatePath("/seller/orders");
    revalidatePath("/seller");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

// ------------------------------------------------------------------ AI listing assistant

export async function generateListing(imageUrl) {
  try {
    await assertSeller();
    if (!process.env.AI_API_KEY) return { error: "The AI assistant isn't configured." };
    if (!isHttps(String(imageUrl || ""))) return { error: "Add a product image first." };

    // Send the image inline so any OpenAI-compatible provider can read it
    const image = await fetch(imageUrl);
    if (!image.ok) return { error: "We couldn't load that image." };
    const type = image.headers.get("content-type") || "image/jpeg";
    if (!type.startsWith("image/")) return { error: "That link isn't an image." };
    const bytes = Buffer.from(await image.arrayBuffer());
    if (bytes.length > 6 * 1024 * 1024) return { error: "That image is too large for the assistant (6 MB max)." };

    const res = await fetch(`${process.env.AI_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.AI_API_KEY}` },
      body: JSON.stringify({
        model: process.env.AI_MODEL,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'You write product listings for an online marketplace. Look at the photo and reply with JSON only: {"name": string (max 60 chars), "description": string (2-3 friendly sentences, no hype, no prices), "brand": string or "", "tags": string[] (3-5 lowercase words), "category": one of "fashion","grocery","electronics","home","beauty","accessories","sports"}.',
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Write the listing for this product." },
              { type: "image_url", image_url: { url: `data:${type};base64,${bytes.toString("base64")}` } },
            ],
          },
        ],
      }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data?.error?.message || "The AI assistant is unavailable right now." };

    const raw = data.choices?.[0]?.message?.content || "";
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    return {
      listing: {
        name: text(parsed.name, 120),
        description: text(parsed.description, 4000),
        brand: text(parsed.brand, 60),
        tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5).join(", ") : "",
        category: categoryBySlug(parsed.category) ? parsed.category : "",
      },
    };
  } catch (error) {
    console.error("generateListing failed", error);
    return { error: "The AI assistant couldn't read that image. Try another photo." };
  }
}
