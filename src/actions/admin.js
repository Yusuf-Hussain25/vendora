"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { assertRole } from "@/lib/session";
import { withStatus } from "@/lib/orders";

const fail = (error) => ({ error: error?.message || "Something went wrong. Please try again." });

export async function reviewStore(storeId, decision) {
  try {
    await assertRole("ADMIN");
    if (!["APPROVED", "REJECTED"].includes(decision)) return { error: "Unknown decision." };
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return { error: "Store not found." };
    await prisma.store.update({ where: { id: storeId }, data: { status: decision, isActive: true } });
    revalidatePath("/admin/stores");
    revalidatePath("/admin");
    revalidatePath("/stores");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function setStoreActive(storeId, isActive) {
  try {
    await assertRole("ADMIN");
    await prisma.store.update({ where: { id: storeId }, data: { isActive: Boolean(isActive) } });
    revalidatePath("/admin/stores");
    revalidatePath("/stores");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function createCoupon(input) {
  try {
    await assertRole("ADMIN");
    const code = String(input.code || "").trim().toUpperCase();
    const discount = Number(input.discount);
    const minOrder = Number(input.minOrder) || 0;
    const days = Number(input.days);
    const description = String(input.description || "").trim().slice(0, 120);
    if (!/^[A-Z0-9]{3,20}$/.test(code)) return { error: "Codes are 3-20 letters or numbers." };
    if (!(discount >= 1 && discount <= 90)) return { error: "Discount must be between 1% and 90%." };
    if (!(days >= 1 && days <= 365)) return { error: "Choose how many days it lasts (1-365)." };
    if (description.length < 4) return { error: "Add a short description shoppers will see." };
    if (await prisma.coupon.findUnique({ where: { code } })) return { error: "That code already exists." };

    await prisma.coupon.create({
      data: {
        code,
        description,
        discount,
        minOrder,
        forNewUser: Boolean(input.forNewUser),
        isPublic: input.isPublic !== false,
        expiresAt: new Date(Date.now() + days * 86_400_000),
      },
    });
    revalidatePath("/admin/coupons");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteCoupon(code) {
  try {
    await assertRole("ADMIN");
    await prisma.coupon.delete({ where: { code } });
    revalidatePath("/admin/coupons");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function assignRider(orderId, riderId) {
  try {
    await assertRole("ADMIN");
    const rider = await prisma.user.findFirst({ where: { id: riderId, role: "RIDER" } });
    if (!rider) return { error: "Rider not found." };
    const order = await prisma.order.findFirst({ where: { id: orderId, status: "PACKED" } });
    if (!order) return { error: "Only packed orders can be assigned." };
    await prisma.order.update({
      where: { id: orderId },
      data: { riderId, statusHistory: withStatus(order.statusHistory, "PACKED", `Rider ${rider.name} assigned by admin`) },
    });
    revalidatePath("/admin/orders");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function createRider(input) {
  try {
    await assertRole("ADMIN");
    const name = String(input.name || "").trim();
    const email = String(input.email || "").trim().toLowerCase();
    const password = String(input.password || "");
    const vehicle = String(input.vehicle || "Bicycle").trim().slice(0, 40);
    const phone = String(input.phone || "").trim().slice(0, 30) || null;
    if (name.length < 2) return { error: "Enter the rider's name." };
    if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Enter a valid email." };
    if (password.length < 8) return { error: "Use a password of at least 8 characters." };
    if (await prisma.user.findUnique({ where: { email } })) return { error: "An account with that email already exists." };

    // Create the user and credential account the way Better Auth stores them. Calling
    // auth.api.signUpEmail here would sign the admin's browser in as the new rider.
    const id = randomUUID().replace(/-/g, "");
    await prisma.user.create({
      data: {
        id,
        name,
        email,
        role: "RIDER",
        vehicle,
        phone,
        emailVerified: true,
        accounts: { create: { id: randomUUID().replace(/-/g, ""), accountId: id, providerId: "credential", password: await hashPassword(password) } },
      },
    });

    revalidatePath("/admin/riders");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}
