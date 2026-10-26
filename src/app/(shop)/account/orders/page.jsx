import Image from "next/image";
import Link from "next/link";
import { ChevronRight, PackageCheck, PackageSearch, Radio } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { placedOrder } from "@/lib/orders";
import { money, shortDate, timeAgo } from "@/lib/format";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";

export const metadata = { title: "My orders" };

const ACTIVE = ["PLACED", "CONFIRMED", "PACKED", "OUT_FOR_DELIVERY"];

export default async function OrdersPage({ searchParams }) {
  const user = await requireUser("/account/orders");
  const { placed } = await searchParams;
  const orders = await prisma.order.findMany({
    where: { userId: user.id, ...placedOrder },
    include: { store: { select: { name: true, logo: true } }, items: { select: { image: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  if (!orders.length) {
    return (
      <EmptyState
        icon={PackageSearch}
        title="No orders yet"
        action={
          <Link href="/shop" className="btn btn-primary">
            Start shopping
          </Link>
        }
      >
        When you place an order, you&apos;ll be able to follow it here step by step.
      </EmptyState>
    );
  }

  const justPlaced = placed ? orders.filter((o) => o.checkoutId === placed) : [];
  const active = orders.filter((o) => ACTIVE.includes(o.status));
  const past = orders.filter((o) => !ACTIVE.includes(o.status));

  const row = (o) => (
    <li key={o.id}>
      <Link href={`/account/orders/${o.id}`} className="card p-4 sm:p-5 flex items-center gap-4 hover:border-border-strong transition group">
        <div className="flex -space-x-3 shrink-0">
          {o.items.slice(0, 3).map((item, i) => (
            <span key={i} className="relative w-14 h-14 rounded-[8px] bg-surface-2 ring-2 ring-bg-elev overflow-hidden">
              <Image src={item.image} alt={item.name} fill sizes="56px" className="object-contain p-1.5" />
            </span>
          ))}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{o.store.name}</span>
            <StatusBadge status={o.status} />
            {o.status === "OUT_FOR_DELIVERY" && (
              <span className="badge badge-accent">
                <Radio className="pulse-dot" />
                Live
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-text-3 truncate">
            {o.number} · {o.items.length} {o.items.length === 1 ? "item" : "items"} · {ACTIVE.includes(o.status) ? `placed ${timeAgo(o.createdAt)}` : shortDate(o.createdAt)}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-semibold">{money(o.total)}</p>
          <p className="text-xs text-text-3">{o.paymentMethod === "COD" ? (o.isPaid ? "Paid" : "Cash on delivery") : "Paid by card"}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-text-3 group-hover:text-text transition hidden sm:block" />
      </Link>
    </li>
  );

  return (
    <div className="space-y-8">
      {justPlaced.length > 0 && (
        <div className="flex items-center gap-4 rounded-[12px] p-5 bg-accent-soft border border-accent/25 fade-up">
          <PackageCheck className="w-8 h-8 text-accent-text shrink-0" />
          <div>
            <p className="font-semibold">Order placed. Thank you!</p>
            <p className="text-sm text-text-2">
              {justPlaced.length > 1 ? `Your items are coming from ${justPlaced.length} stores, each tracked separately.` : "We've sent it to the store. Follow every step below."}
            </p>
          </div>
        </div>
      )}
      {active.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-text-2 mb-3">In progress · {active.length}</h2>
          <ul className="space-y-3">{active.map(row)}</ul>
        </section>
      )}
      {past.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-text-2 mb-3">Past orders · {past.length}</h2>
          <ul className="space-y-3">{past.map(row)}</ul>
        </section>
      )}
    </div>
  );
}
