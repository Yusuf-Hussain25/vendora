"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { parseLineKey } from "@/lib/pricing";

const MAX_QTY = 10;

// Keep only well-formed lines with sane quantities
function cleanLines(lines) {
  const clean = {};
  if (!lines || typeof lines !== "object") return clean;
  for (const [key, qty] of Object.entries(lines).slice(0, 60)) {
    const n = Math.floor(Number(qty));
    if (typeof key === "string" && key.length < 80 && n > 0) clean[key] = Math.min(n, MAX_QTY);
  }
  return clean;
}

export async function saveCart(lines) {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  await prisma.user.update({ where: { id: user.id }, data: { cart: cleanLines(lines) } });
  return { ok: true };
}

export async function getCartProducts(keys) {
  const ids = [...new Set((keys || []).map((key) => parseLineKey(key).productId))].slice(0, 60);
  if (!ids.length) return [];
  return prisma.product.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      name: true,
      images: true,
      price: true,
      mrp: true,
      dealPrice: true,
      dealEndsAt: true,
      unit: true,
      sizes: true,
      stock: true,
      isActive: true,
      category: true,
      store: { select: { id: true, name: true, username: true, logo: true, isActive: true, status: true } },
    },
  });
}
