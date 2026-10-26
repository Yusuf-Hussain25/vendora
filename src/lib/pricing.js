import { money } from "@/lib/format";

// Pricing rules shared by the cart (client) and checkout (server), so totals always match.

// Amounts in rupees
export const FREE_DELIVERY_OVER = 499;
export const DELIVERY_FEE = 49;

export const isDealLive = (product, now = Date.now()) =>
  product.dealPrice != null && product.dealEndsAt != null && new Date(product.dealEndsAt).getTime() > now;

export const dealEndsWithin = (product, ms, now = Date.now()) => new Date(product.dealEndsAt).getTime() - now < ms;

export const effectivePrice = (product, now) => (isDealLive(product, now) ? product.dealPrice : product.price);

export const round2 = (n) => Math.round(n * 100) / 100;

// Cart lines are keyed "productId" or "productId:size"
export const lineKey = (productId, size) => (size ? `${productId}:${size}` : productId);

export const parseLineKey = (key) => {
  const [productId, size] = key.split(":");
  return { productId, size: size || null };
};

// One delivery fee per store, waived when that store's subtotal reaches the threshold
export const deliveryFeeFor = (storeSubtotal) => (storeSubtotal >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE);

export const isExpired = (coupon, now = Date.now()) => new Date(coupon.expiresAt).getTime() <= now;

export function couponProblem(coupon, { subtotal, isNewCustomer, now = Date.now() }) {
  if (!coupon) return "That code doesn't exist.";
  if (isExpired(coupon, now)) return "That code has expired.";
  if (coupon.forNewUser && !isNewCustomer) return "That code is for your first order only.";
  if (subtotal < coupon.minOrder) return `Add items worth ${money(coupon.minOrder)} or more to use this code.`;
  return null;
}
