import "server-only";
import prisma from "@/lib/prisma";
import { placedOrder } from "@/lib/orders";

const DAY = 86_400_000;

// Revenue and order counts per day for the last `days` days (cancelled orders excluded)
export async function dailyRevenue({ storeId, days = 14 } = {}) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setTime(start.getTime() - (days - 1) * DAY);

  const orders = await prisma.order.findMany({
    where: { ...(storeId ? { storeId } : {}), ...placedOrder, status: { not: "CANCELLED" }, createdAt: { gte: start } },
    select: { total: true, createdAt: true },
  });

  const buckets = Array.from({ length: days }, (_, i) => {
    const date = new Date(start.getTime() + i * DAY);
    return { key: date.toDateString(), day: date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), revenue: 0, orders: 0 };
  });
  const byKey = Object.fromEntries(buckets.map((b) => [b.key, b]));
  for (const o of orders) {
    const bucket = byKey[new Date(o.createdAt).toDateString()];
    if (bucket) {
      bucket.revenue = Math.round((bucket.revenue + o.total) * 100) / 100;
      bucket.orders += 1;
    }
  }
  return buckets.map(({ day, revenue, orders: count }) => ({ day, revenue, orders: count }));
}
