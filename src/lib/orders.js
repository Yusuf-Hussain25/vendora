import "server-only";
import { randomInt } from "node:crypto";
import Stripe from "stripe";
import prisma from "@/lib/prisma";

export const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
export const stripeEnabled = Boolean(stripe);

export const newOrderNumber = () => `VND-${randomInt(100000, 999999)}`;
export const newDeliveryOtp = () => String(randomInt(1000, 10000));

// Card orders only count once they're paid; abandoned Stripe checkouts stay hidden
export const placedOrder = { OR: [{ paymentMethod: "COD" }, { isPaid: true }] };

export const withStatus = (history, status, note) => [
  ...(Array.isArray(history) ? history : []),
  { status, at: new Date().toISOString(), ...(note ? { note } : {}) },
];

// Which status changes each role may make, from -> allowed next statuses
export const SELLER_TRANSITIONS = {
  PLACED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PACKED", "CANCELLED"],
};

export const BUYER_CAN_CANCEL = ["PLACED", "CONFIRMED"];

// Not a server action on purpose: only the success page and the verified webhook may call this.
// Marks a Stripe checkout as paid. Used by the success page and the webhook (idempotent).
export async function markCheckoutPaid(checkoutId, userId) {
  const orders = await prisma.order.findMany({ where: { checkoutId, userId, paymentMethod: "STRIPE" } });
  if (!orders.length) return 0;
  await prisma.$transaction([
    prisma.order.updateMany({ where: { checkoutId, userId, isPaid: false }, data: { isPaid: true } }),
    prisma.user.update({ where: { id: userId }, data: { cart: {} } }),
  ]);
  return orders.length;
}
