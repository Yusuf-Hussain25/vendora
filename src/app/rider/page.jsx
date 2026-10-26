import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { placedOrder } from "@/lib/orders";
import RiderApp from "@/components/rider/RiderApp";

const orderSelect = {
  id: true,
  number: true,
  status: true,
  total: true,
  paymentMethod: true,
  isPaid: true,
  createdAt: true,
  shippingAddress: true,
  riderLat: true,
  riderLng: true,
  items: { select: { quantity: true } },
  user: { select: { name: true, image: true } },
  store: { select: { name: true, logo: true, address: true, city: true, phone: true, lat: true, lng: true } },
};

export default async function RiderPage() {
  const rider = await requireRole("RIDER", "/rider");
  const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));

  const [active, available, deliveredToday, deliveredTotal] = await Promise.all([
    prisma.order.findMany({
      where: { riderId: rider.id, status: { in: ["PACKED", "OUT_FOR_DELIVERY"] } },
      select: orderSelect,
      orderBy: { createdAt: "asc" },
    }),
    prisma.order.findMany({
      where: { status: "PACKED", riderId: null, ...placedOrder },
      select: orderSelect,
      orderBy: { updatedAt: "asc" },
      take: 20,
    }),
    prisma.order.count({ where: { riderId: rider.id, status: "DELIVERED", updatedAt: { gte: startOfDay } } }),
    prisma.order.count({ where: { riderId: rider.id, status: "DELIVERED" } }),
  ]);

  return (
    <RiderApp
      rider={{ name: rider.name, isOnline: rider.isOnline, vehicle: rider.vehicle }}
      active={active}
      available={available}
      stats={{ deliveredToday, deliveredTotal }}
    />
  );
}
