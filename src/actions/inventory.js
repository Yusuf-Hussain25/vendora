"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { assertSeller, assertUser } from "@/lib/session";
import { logMovement } from "@/lib/inventory";

const fail = (error) => ({ error: error?.message || "Something went wrong. Please try again." });
const MAX = 100000;

function refresh() {
  revalidatePath("/seller/inventory");
  revalidatePath("/seller/products");
  revalidatePath("/seller");
  revalidatePath("/admin/inventory");
}

// Loads the seller's own products for the given ids, refusing anything that isn't theirs
async function ownProducts(user, ids) {
  const unique = [...new Set(ids)];
  const products = await prisma.product.findMany({ where: { id: { in: unique }, storeId: user.store.id } });
  if (products.length !== unique.length) throw new Error("Some of those products aren't in your store.");
  return Object.fromEntries(products.map((p) => [p.id, p]));
}

// Adds stock to one or more products: [{ id, qty }]
export async function restockProducts(items, note) {
  try {
    const user = await assertSeller();
    const lines = (Array.isArray(items) ? items : [])
      .map((i) => ({ id: String(i.id), qty: Math.floor(Number(i.qty)) }))
      .filter((i) => i.qty !== 0);
    if (!lines.length) return { error: "Enter how many units to add." };
    if (lines.some((i) => !(i.qty > 0 && i.qty <= MAX))) return { error: "Restock quantities must be between 1 and 100,000." };
    const owned = await ownProducts(user, lines.map((i) => i.id));

    await prisma.$transaction(async (tx) => {
      for (const { id, qty } of lines) {
        const product = await tx.product.update({ where: { id }, data: { stock: { increment: qty } } });
        await logMovement(tx, {
          productId: id, storeId: owned[id].storeId, change: qty, balance: product.stock, reason: "RESTOCK",
          note: String(note || "").trim().slice(0, 120) || null, userId: user.id,
        });
      }
    });
    refresh();
    return { ok: true, count: lines.length, units: lines.reduce((s, i) => s + i.qty, 0) };
  } catch (error) {
    return fail(error);
  }
}

// Applies a physical count: [{ id, counted }]. Only products whose count differs change.
export async function applyStockCount(items) {
  try {
    const user = await assertSeller();
    const lines = (Array.isArray(items) ? items : [])
      .filter((i) => i.counted !== "" && i.counted != null)
      .map((i) => ({ id: String(i.id), counted: Math.floor(Number(i.counted)) }));
    if (!lines.length) return { error: "Enter at least one counted quantity." };
    if (lines.some((i) => !Number.isInteger(i.counted) || i.counted < 0 || i.counted > MAX)) {
      return { error: "Counted quantities must be whole numbers from 0 upwards." };
    }
    const owned = await ownProducts(user, lines.map((i) => i.id));

    let adjusted = 0;
    let net = 0;
    await prisma.$transaction(async (tx) => {
      for (const { id, counted } of lines) {
        // Read inside the transaction so a sale that just happened is taken into account
        const current = await tx.product.findUnique({ where: { id }, select: { stock: true } });
        const change = counted - current.stock;
        if (!change) continue;
        await tx.product.update({ where: { id }, data: { stock: counted } });
        await logMovement(tx, {
          productId: id, storeId: owned[id].storeId, change, balance: counted, reason: "COUNT",
          note: `Stock count: system ${current.stock}, counted ${counted}`, userId: user.id,
        });
        adjusted += 1;
        net += change;
      }
    });
    refresh();
    return { ok: true, checked: lines.length, adjusted, net };
  } catch (error) {
    return fail(error);
  }
}

export async function setReorderLevel(productId, level) {
  try {
    const user = await assertSeller();
    const value = Math.floor(Number(level));
    if (!Number.isInteger(value) || value < 0 || value > 10000) return { error: "Alert level must be between 0 and 10,000." };
    await ownProducts(user, [productId]);
    await prisma.product.update({ where: { id: productId }, data: { reorderLevel: value } });
    refresh();
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

// Recent stock movements for one product (its store owner or an admin)
export async function getStockHistory(productId) {
  try {
    const user = await assertUser();
    const product = await prisma.product.findUnique({ where: { id: String(productId) }, select: { storeId: true, name: true, stock: true, sku: true } });
    if (!product) return { error: "Product not found." };
    const allowed = user.role === "ADMIN" || user.store?.id === product.storeId;
    if (!allowed) return { error: "You don't have access to this product." };
    const movements = await prisma.stockMovement.findMany({
      where: { productId: String(productId) },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, change: true, balance: true, reason: true, note: true, createdAt: true },
    });
    return { product, movements };
  } catch (error) {
    return fail(error);
  }
}
