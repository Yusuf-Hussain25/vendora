"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { assertUser, AuthError } from "@/lib/session";
import { couponProblem, deliveryFeeFor, effectivePrice, parseLineKey, round2 } from "@/lib/pricing";
import { BUYER_CAN_CANCEL, newDeliveryOtp, newOrderNumber, placedOrder, stripe, withStatus } from "@/lib/orders";
import { CURRENCY } from "@/lib/format";

const fail = (error) => ({ error: error instanceof AuthError ? error.message : error?.message || String(error) });

async function isNewCustomer(userId) {
  return (await prisma.order.count({ where: { userId, ...placedOrder, status: { not: "CANCELLED" } } })) === 0;
}

// Coupon preview for the cart and checkout summary. The real check runs again in placeOrder.
export async function previewCoupon(code, subtotal) {
  try {
    const user = await assertUser();
    const coupon = await prisma.coupon.findUnique({ where: { code: String(code || "").trim().toUpperCase() } });
    const problem = couponProblem(coupon, { subtotal, isNewCustomer: await isNewCustomer(user.id) });
    if (problem) return { error: problem };
    return { coupon: { code: coupon.code, discount: coupon.discount, description: coupon.description } };
  } catch (error) {
    return fail(error);
  }
}

class CheckoutError extends Error {}

export async function placeOrder({ lines, addressId, couponCode, paymentMethod }) {
  try {
    const user = await assertUser();
    if (!["COD", "STRIPE"].includes(paymentMethod)) return { error: "Choose a payment method." };
    if (paymentMethod === "STRIPE" && !stripe) return { error: "Card payments aren't available right now." };

    const entries = Object.entries(lines || {}).filter(([, qty]) => Number(qty) > 0);
    if (!entries.length) return { error: "Your cart is empty." };

    const address = await prisma.address.findFirst({ where: { id: addressId, userId: user.id } });
    if (!address) return { error: "Choose a delivery address." };

    const ids = [...new Set(entries.map(([key]) => parseLineKey(key).productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: ids }, isActive: true, store: { status: "APPROVED", isActive: true } },
      include: { store: { select: { id: true, name: true } } },
    });
    const byId = Object.fromEntries(products.map((p) => [p.id, p]));

    // Validate every line against the live catalog; prices always come from the database
    const now = Date.now();
    const items = [];
    for (const [key, rawQty] of entries) {
      const { productId, size } = parseLineKey(key);
      const product = byId[productId];
      const quantity = Math.min(10, Math.floor(Number(rawQty)));
      if (!product) return { error: "Something in your cart is no longer available. Please review your cart." };
      if (product.sizes.length && !product.sizes.includes(size)) return { error: `Choose a size for ${product.name}.` };
      items.push({ product, size: product.sizes.length ? size : null, quantity, price: effectivePrice(product, now) });
    }

    // Stock is checked across sizes, since it's tracked per product
    const wanted = {};
    for (const item of items) wanted[item.product.id] = (wanted[item.product.id] || 0) + item.quantity;
    for (const [id, qty] of Object.entries(wanted)) {
      if (byId[id].stock < qty) return { error: `Only ${byId[id].stock} of ${byId[id].name} left. Please lower the quantity.` };
    }

    const subtotal = round2(items.reduce((sum, i) => sum + i.price * i.quantity, 0));
    let coupon = null;
    if (couponCode) {
      coupon = await prisma.coupon.findUnique({ where: { code: String(couponCode).trim().toUpperCase() } });
      const problem = couponProblem(coupon, { subtotal, isNewCustomer: await isNewCustomer(user.id) });
      if (problem) return { error: problem };
    }

    const byStore = Map.groupBy(items, (i) => i.product.store.id);
    const checkoutId = randomUUID();
    const shippingAddress = {
      label: address.label,
      name: address.name,
      phone: address.phone,
      street: address.street,
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country,
      lat: address.lat,
      lng: address.lng,
    };

    const orders = await prisma.$transaction(async (tx) => {
      // Reserve stock first; a concurrent order can't push it below zero
      for (const [id, qty] of Object.entries(wanted)) {
        const { count } = await tx.product.updateMany({
          where: { id, stock: { gte: qty } },
          data: { stock: { decrement: qty }, soldCount: { increment: qty } },
        });
        if (!count) throw new CheckoutError(`${byId[id].name} just sold out. Please review your cart.`);
      }

      const created = [];
      for (const [storeId, storeItems] of byStore) {
        const storeSubtotal = round2(storeItems.reduce((sum, i) => sum + i.price * i.quantity, 0));
        const discount = coupon ? round2((storeSubtotal * coupon.discount) / 100) : 0;
        const deliveryFee = deliveryFeeFor(storeSubtotal);
        created.push(
          await tx.order.create({
            data: {
              number: newOrderNumber(),
              checkoutId,
              userId: user.id,
              storeId,
              shippingAddress,
              subtotal: storeSubtotal,
              discount,
              deliveryFee,
              total: round2(storeSubtotal - discount + deliveryFee),
              couponCode: coupon?.code || null,
              paymentMethod,
              status: "PLACED",
              statusHistory: withStatus([], "PLACED"),
              deliveryOtp: newDeliveryOtp(),
              items: {
                create: storeItems.map((i) => ({
                  productId: i.product.id,
                  name: i.product.name,
                  image: i.product.images[0],
                  size: i.size,
                  unit: i.product.unit,
                  quantity: i.quantity,
                  price: i.price,
                })),
              },
            },
            include: { store: { select: { name: true } } },
          })
        );
      }
      return created;
    });

    if (paymentMethod === "COD") {
      await prisma.user.update({ where: { id: user.id }, data: { cart: {} } });
      revalidatePath("/account/orders");
      return { ok: true, redirect: `/account/orders?placed=${checkoutId}` };
    }

    const origin = (await headers()).get("origin") || process.env.NEXT_PUBLIC_APP_URL;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      line_items: orders.map((o) => ({
        quantity: 1,
        price_data: {
          currency: CURRENCY.toLowerCase(),
          unit_amount: Math.round(o.total * 100),
          product_data: { name: `${o.store.name} · order ${o.number}` },
        },
      })),
      metadata: { checkoutId, userId: user.id },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancelled?checkout=${checkoutId}`,
    });
    return { ok: true, redirect: session.url };
  } catch (error) {
    if (error instanceof CheckoutError) return { error: error.message };
    console.error("placeOrder failed", error);
    return fail(error instanceof AuthError ? error : new Error("We couldn't place your order. Please try again."));
  }
}

// Releases the stock held by an abandoned card checkout
export async function cancelUnpaidCheckout(checkoutId) {
  try {
    const user = await assertUser();
    const orders = await prisma.order.findMany({
      where: { checkoutId, userId: user.id, paymentMethod: "STRIPE", isPaid: false, status: { not: "CANCELLED" } },
      include: { items: true },
    });
    await prisma.$transaction(async (tx) => {
      for (const order of orders) {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity }, soldCount: { decrement: item.quantity } },
          });
        }
        await tx.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED", statusHistory: withStatus(order.statusHistory, "CANCELLED", "Payment not completed") },
        });
      }
    });
    return { ok: true, count: orders.length };
  } catch (error) {
    return fail(error);
  }
}

export async function cancelOrder(orderId) {
  try {
    const user = await assertUser();
    const order = await prisma.order.findFirst({ where: { id: orderId, userId: user.id }, include: { items: true } });
    if (!order) return { error: "Order not found." };
    if (!BUYER_CAN_CANCEL.includes(order.status)) return { error: "This order has already been packed and can't be cancelled." };

    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity }, soldCount: { decrement: item.quantity } },
        });
      }
      await tx.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED", statusHistory: withStatus(order.statusHistory, "CANCELLED", "Cancelled by you") },
      });
    });
    revalidatePath(`/account/orders/${orderId}`);
    revalidatePath("/account/orders");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function rateItem({ orderId, productId, rating, review }) {
  try {
    const user = await assertUser();
    const stars = Math.round(Number(rating));
    const text = String(review || "").trim();
    if (stars < 1 || stars > 5) return { error: "Choose between 1 and 5 stars." };
    if (text.length < 3) return { error: "Add a few words about the item." };
    if (text.length > 1000) return { error: "Keep your review under 1000 characters." };

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: user.id, status: "DELIVERED", items: { some: { productId } } },
    });
    if (!order) return { error: "You can review items once they've been delivered to you." };

    await prisma.rating.upsert({
      where: { userId_productId_orderId: { userId: user.id, productId, orderId } },
      update: { rating: stars, review: text },
      create: { userId: user.id, productId, orderId, rating: stars, review: text },
    });
    const agg = await prisma.rating.aggregate({ where: { productId }, _avg: { rating: true }, _count: true });
    await prisma.product.update({ where: { id: productId }, data: { ratingAvg: agg._avg.rating || 0, ratingCount: agg._count } });

    revalidatePath(`/account/orders/${orderId}`);
    revalidatePath(`/product/${productId}`);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}
