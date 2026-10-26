"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function toggleWishlist(productId) {
  const user = await getCurrentUser();
  if (!user) return { error: "Log in to save items to your wishlist." };

  const key = { userId_productId: { userId: user.id, productId } };
  const existing = await prisma.wishlistItem.findUnique({ where: key });

  if (existing) {
    await prisma.wishlistItem.delete({ where: key });
  } else {
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) return { error: "That product is no longer available." };
    await prisma.wishlistItem.create({ data: { userId: user.id, productId } });
  }

  revalidatePath("/account/wishlist");
  return { saved: !existing };
}
