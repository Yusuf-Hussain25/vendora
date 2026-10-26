import Link from "next/link";
import prisma from "@/lib/prisma";
import { placedOrder } from "@/lib/orders";
import { ORDER_STATUSES } from "@/lib/catalog";
import { money, timeAgo } from "@/lib/format";
import { PageHeader } from "@/components/dashboard/Widgets";
import StatusBadge from "@/components/ui/StatusBadge";
import AssignRider from "@/components/admin/AssignRider";

export const metadata = { title: "Orders" };

export default async function AdminOrders({ searchParams }) {
  const { status } = await searchParams;
  const filter = ORDER_STATUSES.some((s) => s.value === status) ? status : null;

  const [orders, riders, counts] = await Promise.all([
    prisma.order.findMany({
      where: { ...placedOrder, ...(filter ? { status: filter } : {}) },
      include: {
        user: { select: { name: true } },
        store: { select: { name: true } },
        rider: { select: { name: true } },
        items: { select: { quantity: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.user.findMany({ where: { role: "RIDER" }, select: { id: true, name: true, isOnline: true }, orderBy: { isOnline: "desc" } }),
    prisma.order.groupBy({ by: ["status"], where: placedOrder, _count: true }),
  ]);
  const countFor = Object.fromEntries(counts.map((c) => [c.status, c._count]));

  return (
    <>
      <PageHeader title="Orders" subtitle="Every order across the marketplace. Assign a rider to packed orders nobody has picked up." />
      <div className="flex flex-wrap gap-2 mb-5">
        <Link href="/admin/orders" className="chip" data-active={!filter}>
          All
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link key={s.value} href={`/admin/orders?status=${s.value}`} className="chip" data-active={filter === s.value}>
            {s.short}
            <span className="text-text-3">{countFor[s.value] || 0}</span>
          </Link>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead>
              <tr className="text-left text-xs text-text-3 border-b border-border">
                <th className="font-medium px-5 py-3">Order</th>
                <th className="font-medium px-3 py-3">Customer</th>
                <th className="font-medium px-3 py-3">Store</th>
                <th className="font-medium px-3 py-3">Status</th>
                <th className="font-medium px-3 py-3">Rider</th>
                <th className="font-medium px-5 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-surface transition">
                  <td className="px-5 py-3">
                    <p className="font-mono">{o.number}</p>
                    <p className="text-xs text-text-3">{timeAgo(o.createdAt)}</p>
                  </td>
                  <td className="px-3 py-3">
                    {o.user.name}
                    <p className="text-xs text-text-3">{o.items.reduce((s, i) => s + i.quantity, 0)} items</p>
                  </td>
                  <td className="px-3 py-3">{o.store.name}</td>
                  <td className="px-3 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-3 py-3">
                    {o.rider ? o.rider.name : o.status === "PACKED" ? <AssignRider orderId={o.id} riders={riders} /> : <span className="text-text-3">–</span>}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <p className="font-semibold">{money(o.total)}</p>
                    <p className="text-xs text-text-3">{o.paymentMethod === "COD" ? "Cash" : "Card"}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!orders.length && <p className="p-8 text-center text-sm text-text-2">No orders with this status.</p>}
      </div>
    </>
  );
}
