"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { assertUser, AuthError } from "@/lib/session";

const FIELDS = ["label", "name", "phone", "street", "city", "state", "zip", "country"];

function clean(input) {
  const data = {};
  for (const field of FIELDS) data[field] = String(input?.[field] || "").trim().slice(0, 120);
  if (!data.label) data.label = "Home";
  const missing = FIELDS.filter((f) => !data[f]);
  if (missing.length) return { error: `Please fill in: ${missing.join(", ")}.` };
  if (!/^[+\d][\d\s()-]{6,}$/.test(data.phone)) return { error: "Enter a valid phone number." };
  const lat = Number(input?.lat);
  const lng = Number(input?.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && (lat || lng)) {
    data.lat = lat;
    data.lng = lng;
  }
  return { data };
}

export async function saveAddress(input) {
  try {
    const user = await assertUser();
    const { data, error } = clean(input);
    if (error) return { error };

    const count = await prisma.address.count({ where: { userId: user.id } });
    const makeDefault = Boolean(input?.isDefault) || count === 0;

    const address = await prisma.$transaction(async (tx) => {
      if (makeDefault) await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
      if (input?.id) {
        const existing = await tx.address.findFirst({ where: { id: input.id, userId: user.id } });
        if (!existing) throw new AuthError("Address not found.");
        return tx.address.update({ where: { id: existing.id }, data: { ...data, ...(makeDefault ? { isDefault: true } : {}) } });
      }
      return tx.address.create({ data: { ...data, userId: user.id, isDefault: makeDefault } });
    });

    revalidatePath("/account/addresses");
    revalidatePath("/checkout");
    return { address };
  } catch (error) {
    return { error: error.message };
  }
}

export async function deleteAddress(id) {
  try {
    const user = await assertUser();
    const address = await prisma.address.findFirst({ where: { id, userId: user.id } });
    if (!address) return { error: "Address not found." };
    await prisma.address.delete({ where: { id } });
    if (address.isDefault) {
      const next = await prisma.address.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
      if (next) await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
    revalidatePath("/account/addresses");
    return { ok: true };
  } catch (error) {
    return { error: error.message };
  }
}

export async function setDefaultAddress(id) {
  try {
    const user = await assertUser();
    const address = await prisma.address.findFirst({ where: { id, userId: user.id } });
    if (!address) return { error: "Address not found." };
    await prisma.$transaction([
      prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } }),
      prisma.address.update({ where: { id }, data: { isDefault: true } }),
    ]);
    revalidatePath("/account/addresses");
    return { ok: true };
  } catch (error) {
    return { error: error.message };
  }
}
