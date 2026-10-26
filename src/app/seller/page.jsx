import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, ArrowRight, ClipboardList, DollarSign, Plus, Star, Timer } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireSeller } from "@/lib/session";
import { placedOrder } from "@/lib/orders";
import { dailyRevenue } from "@/lib/stats";
import { money, timeAgo } from "@/lib/format";
import { PageHeader, StatCard } from "@/components/dashboard/Widgets";
import RevenueChart from "@/components/dashboard/RevenueChart";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";

export const metadata = { title: "Overview" };

export default async function SellerOverview() {
  const user = await requireSeller();
  const storeId = user.store.id;
  const since = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate() - 29));

  const [chart, revenue, toHandle, rating, recent, lowStock, liveDeals] = await Promise.all([
    dailyRevenue({ storeId }),
    prisma.order.aggregate({
      where: { storeId, ...placedOrder, status: { not: "CANCELLED" }, createdAt: { gte: since } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.order.count({ where: { storeId, ...placedOrder, status: { in: ["PLACED", "CONFIRMED"] } } }),
    prisma.product.aggregate({ where: { storeId, ratingCount: { gt: 0 } }, _avg: { ratingAvg: true }, _sum: { ratingCount: true } }),
    prisma.order.findMany({
      where: { storeId, ...placedOrder },
      include: { user: { select: { name: true } }, items: { select: { quantity: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.product.findMany({
      where: { storeId, isActive: true, stock: { lte: 5 } },
      select: { id: true, name: true, images: true, stock: true },
      orderBy: { stock: "asc" },
      take: 5,
    }),
    prisma.product.count({ where: { storeId, dealEndsAt: { gt: new Date() } } }),
  ]);

  return (
    <>
      <PageHeader title={`Hi, ${user.name.split(" ")[0]}`} subtitle={`Here's how ${user.store.name} is doing.`}>
        <Link href={`/store/${user.store.username}`} className="btn btn-secondary">
          View storefront
        </Link>
        <Link href="/seller/products/new" className="btn btn-primary">
          <Plus />
          Add product
        </Link>
      </PageHeader>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Revenue, 30 days" value={money(revenue._sum.total || 0)} hint={`${revenue._count} orders`} />
        <StatCard icon={ClipboardList} label="Needs attention" value={toHandle} hint="Orders to confirm or pack" tone="warning" />
        <StatCard
          icon={Star}
          label="Store rating"
          value={rating._avg.ratingAvg ? rating._avg.ratingAvg.toFixed(2) : "–"}
          hint={`${rating._sum.ratingCount || 0} reviews`}
          tone="info"
        />
        <StatCard icon={Timer} label="Live flash deals" value={liveDeals} hint="Running right now" tone="deal" />
      </div>

      <div className="mt-6 grid xl:grid-cols-[1.6fr_1fr] gap-6">
        <section className="card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold">Revenue, last 14 days</h2>
            <span className="text-sm text-text-3">{money(chart.reduce((s, d) => s + d.revenue, 0))}</span>
          </div>
          <RevenueChart data={chart} />
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            Running low
          </h2>
          {lowStock.length ? (
            <ul className="space-y-3">
              {lowStock.map((p) => (
                <li key={p.id} className="flex items-center gap-3">
                  <span className="relative w-11 h-11 rounded-[12px] bg-surface-2 shrink-0">
                    <Image src={p.images[0]} alt="" fill sizes="44px" className="object-contain p-1" />
                  </span>
                  <Link href={`/seller/products/${p.id}`} className="flex-1 min-w-0 text-sm truncate hover:text-accent-text transition">
                    {p.name}
                  </Link>
                  <span className={`badge ${p.stock === 0 ? "badge-danger" : "badge-warning"}`}>{p.stock === 0 ? "Sold out" : `${p.stock} left`}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-2">Everything is well stocked.</p>
          )}
        </section>
      </div>

      <section className="mt-6 card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Latest orders</h2>
          <Link href="/seller/orders" className="btn btn-ghost btn-sm">
            All orders
            <ArrowRight />
          </Link>
        </div>
        {recent.length ? (
          <ul className="divide-y divide-border">
            {recent.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                <span className="font-mono text-sm">{o.number}</span>
                <span className="text-sm text-text-2 flex-1 min-w-[120px]">
                  {o.user.name} · {o.items.reduce((s, i) => s + i.quantity, 0)} items
                </span>
                <StatusBadge status={o.status} />
                <span className="text-sm text-text-3 w-28 text-right">{timeAgo(o.createdAt)}</span>
                <span className="text-sm font-semibold w-20 text-right">{money(o.total)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={ClipboardList} title="No orders yet" className="!border-0 !bg-transparent !py-8">
            Orders show up here the moment a shopper checks out.
          </EmptyState>
        )}
      </section>
    </>
  );
}
