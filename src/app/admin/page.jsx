import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bike, DollarSign, ShoppingBag, Store, Users } from "lucide-react";
import prisma from "@/lib/prisma";
import { placedOrder } from "@/lib/orders";
import { dailyRevenue } from "@/lib/stats";
import { ORDER_STATUSES } from "@/lib/catalog";
import { money, timeAgo } from "@/lib/format";
import { PageHeader, StatCard } from "@/components/dashboard/Widgets";
import RevenueChart from "@/components/dashboard/RevenueChart";
import StoreReviewButtons from "@/components/admin/StoreReviewButtons";

export default async function AdminOverview() {
  const since = new Date(new Date().setHours(0, 0, 0, 0) - 29 * 86_400_000);

  const [chart, gmv, customers, riders, pending, byStatus, topStores] = await Promise.all([
    dailyRevenue({ days: 14 }),
    prisma.order.aggregate({ where: { ...placedOrder, status: { not: "CANCELLED" }, createdAt: { gte: since } }, _sum: { total: true }, _count: true }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.user.count({ where: { role: "RIDER", isOnline: true } }),
    prisma.store.findMany({ where: { status: "PENDING" }, include: { owner: { select: { name: true } } }, orderBy: { createdAt: "asc" } }),
    prisma.order.groupBy({ by: ["status"], where: placedOrder, _count: true }),
    prisma.order.groupBy({
      by: ["storeId"],
      where: { ...placedOrder, status: { not: "CANCELLED" }, createdAt: { gte: since } },
      _sum: { total: true },
      _count: true,
      orderBy: { _sum: { total: "desc" } },
      take: 5,
    }),
  ]);

  const storeInfo = await prisma.store.findMany({
    where: { id: { in: topStores.map((s) => s.storeId) } },
    select: { id: true, name: true, logo: true, username: true },
  });
  const storeById = Object.fromEntries(storeInfo.map((s) => [s.id, s]));
  const statusCount = Object.fromEntries(byStatus.map((s) => [s.status, s._count]));
  const totalOrders = byStatus.reduce((s, x) => s + x._count, 0);

  return (
    <>
      <PageHeader title="Marketplace overview" subtitle="Sales, stores and deliveries across Vendora." />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Sales, 30 days" value={money(gmv._sum.total || 0)} hint={`${gmv._count} orders`} />
        <StatCard icon={Store} label="Store applications" value={pending.length} hint="Waiting for review" tone="warning" />
        <StatCard icon={Users} label="Customers" value={customers} hint="Registered shoppers" tone="info" />
        <StatCard icon={Bike} label="Riders online" value={riders} hint="Ready for pickups" tone="deal" />
      </div>

      <div className="mt-6 grid xl:grid-cols-[1.6fr_1fr] gap-6">
        <section className="card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold">Sales, last 14 days</h2>
            <span className="text-sm text-text-3">{money(chart.reduce((s, d) => s + d.revenue, 0))}</span>
          </div>
          <RevenueChart data={chart} />
        </section>
        <section className="card p-5 sm:p-6">
          <h2 className="font-semibold mb-4">Orders by status</h2>
          <ul className="space-y-3">
            {ORDER_STATUSES.map((s) => {
              const count = statusCount[s.value] || 0;
              return (
                <li key={s.value}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-text-2">{s.short}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${totalOrders ? (count / totalOrders) * 100 : 0}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="mt-6 grid xl:grid-cols-2 gap-6">
        <section className="card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Store applications</h2>
            <Link href="/admin/stores" className="btn btn-ghost btn-sm">
              All stores
              <ArrowRight />
            </Link>
          </div>
          {pending.length ? (
            <ul className="divide-y divide-border">
              {pending.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-3 py-3">
                  <Image src={s.logo} alt="" width={40} height={40} className="w-10 h-10 rounded-[12px] bg-surface-2 object-cover" />
                  <div className="flex-1 min-w-[140px]">
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-text-3">
                      {s.owner.name} · applied {timeAgo(s.createdAt)}
                    </p>
                  </div>
                  <StoreReviewButtons storeId={s.id} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-2">No applications waiting. You&apos;re all caught up.</p>
          )}
        </section>
        <section className="card p-5 sm:p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-text-3" />
            Top stores, 30 days
          </h2>
          <ol className="space-y-3">
            {topStores.map((row, i) => {
              const store = storeById[row.storeId];
              return (
                <li key={row.storeId} className="flex items-center gap-3">
                  <span className="w-5 text-sm text-text-3">{i + 1}</span>
                  <Image src={store.logo} alt="" width={36} height={36} className="w-9 h-9 rounded-[10px] bg-surface-2" />
                  <Link href={`/store/${store.username}`} className="flex-1 text-sm font-medium hover:text-accent-text transition">
                    {store.name}
                  </Link>
                  <span className="text-xs text-text-3">{row._count} orders</span>
                  <span className="text-sm font-semibold w-24 text-right">{money(row._sum.total)}</span>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </>
  );
}
