import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

// Live delivery status, polled by the tracking page. Visible to the buyer, the store,
// the assigned rider and admins only.
export async function GET(_request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      userId: true,
      riderId: true,
      status: true,
      riderLat: true,
      riderLng: true,
      riderSeenAt: true,
      updatedAt: true,
      store: { select: { ownerId: true } },
    },
  });

  const allowed =
    order && (order.userId === user.id || order.riderId === user.id || order.store.ownerId === user.id || user.role === "ADMIN");
  if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(
    {
      status: order.status,
      rider: order.riderLat != null ? { lat: order.riderLat, lng: order.riderLng, seenAt: order.riderSeenAt } : null,
      updatedAt: order.updatedAt,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
