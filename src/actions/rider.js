"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { assertRole } from "@/lib/session";
import { withStatus } from "@/lib/orders";

const fail = (error) => ({ error: error?.message || "Something went wrong. Please try again." });

export async function setOnline(isOnline) {
  try {
    const rider = await assertRole("RIDER");
    await prisma.user.update({ where: { id: rider.id }, data: { isOnline: Boolean(isOnline) } });
    revalidatePath("/rider");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function acceptDelivery(orderId) {
  try {
    const rider = await assertRole("RIDER");
    if (!rider.isOnline) return { error: "Go online to accept deliveries." };
    const active = await prisma.order.count({ where: { riderId: rider.id, status: { in: ["PACKED", "OUT_FOR_DELIVERY"] } } });
    if (active >= 3) return { error: "Finish one of your current deliveries first (3 at a time)." };

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    // Only claim it if nobody else has, even if two riders tap at the same moment
    const { count } = await prisma.order.updateMany({
      where: { id: orderId, status: "PACKED", riderId: null },
      data: { riderId: rider.id, statusHistory: withStatus(order?.statusHistory, "PACKED", `Rider ${rider.name} assigned`) },
    });
    if (!count) return { error: "Another rider just took this one." };
    revalidatePath("/rider");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

async function myOrder(orderId, statuses) {
  const rider = await assertRole("RIDER");
  const order = await prisma.order.findFirst({ where: { id: orderId, riderId: rider.id, status: { in: statuses } } });
  if (!order) throw new Error("This delivery isn't assigned to you any more.");
  return { rider, order };
}

export async function markPickedUp(orderId, location) {
  try {
    const { order } = await myOrder(orderId, ["PACKED"]);
    const spot = validSpot(location);
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "OUT_FOR_DELIVERY",
        statusHistory: withStatus(order.statusHistory, "OUT_FOR_DELIVERY"),
        ...(spot ? { riderLat: spot.lat, riderLng: spot.lng, riderSeenAt: new Date() } : {}),
      },
    });
    revalidatePath("/rider");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

function validSpot(location) {
  const lat = Number(location?.lat);
  const lng = Number(location?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

// Called every few seconds while the rider shares their location
export async function updateLocation(orderId, location) {
  try {
    const { order } = await myOrder(orderId, ["OUT_FOR_DELIVERY"]);
    const spot = validSpot(location);
    if (!spot) return { error: "Invalid location." };
    await prisma.order.update({ where: { id: order.id }, data: { riderLat: spot.lat, riderLng: spot.lng, riderSeenAt: new Date() } });
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function completeDelivery(orderId, otp) {
  try {
    const { order } = await myOrder(orderId, ["OUT_FOR_DELIVERY"]);
    if (String(otp || "").trim() !== order.deliveryOtp) return { error: "That code doesn't match. Ask the customer to check their order page." };
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "DELIVERED", isPaid: true, statusHistory: withStatus(order.statusHistory, "DELIVERED") },
    });
    revalidatePath("/rider");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}
