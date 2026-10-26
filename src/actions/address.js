"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { assertUser, AuthError } from "@/lib/session";
import { COUNTRY, isPinCode, normalisePhone, normaliseState } from "@/lib/india";
import { geocodePinCode } from "@/lib/geo-india";

const FIELDS = ["label", "name", "phone", "street", "city", "state", "zip"];
const LABELS = { name: "full name", phone: "mobile number", street: "house and street", city: "city", state: "state", zip: "PIN code" };

// Vendora delivers within India only
function clean(input) {
  const data = {};
  for (const field of FIELDS) data[field] = String(input?.[field] || "").trim().slice(0, 120);
  if (!data.label) data.label = "Home";
  const missing = FIELDS.filter((f) => f !== "label" && !data[f]);
  if (missing.length) return { error: `Please fill in your ${missing.map((f) => LABELS[f]).join(", ")}.` };

  const phone = normalisePhone(data.phone);
  if (!phone) return { error: "Enter a 10-digit Indian mobile number." };
  const state = normaliseState(data.state);
  if (!state) return { error: "Choose your state or union territory." };
  if (!isPinCode(data.zip)) return { error: "Enter a valid 6-digit PIN code." };
  Object.assign(data, { phone, state, country: COUNTRY });

  const lat = Number(input?.lat);
  const lng = Number(input?.lng);
  // Pins must fall inside India's bounding box
  if (Number.isFinite(lat) && Number.isFinite(lng) && lat > 6 && lat < 37.5 && lng > 68 && lng < 97.5) {
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
    // No GPS pin? Place the address at its PIN code so the delivery map still works.
    if (data.lat == null) Object.assign(data, (await geocodePinCode(data.zip)) || {});

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
