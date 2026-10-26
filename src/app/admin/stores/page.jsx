import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Store } from "lucide-react";
import prisma from "@/lib/prisma";
import { placedOrder } from "@/lib/orders";
import { money, shortDate } from "@/lib/format";
import { PageHeader } from "@/components/dashboard/Widgets";
import StoreReviewButtons from "@/components/admin/StoreReviewButtons";
import EmptyState from "@/components/ui/EmptyState";

export const metadata = { title: "Stores" };

const TABS = [
  { value: "PENDING", label: "Applications" },
  { value: "APPROVED", label: "Live" },
  { value: "REJECTED", label: "Rejected" },
];

export default async function AdminStores({ searchParams }) {
  const { tab = "APPROVED" } = await searchParams;
  const status = TABS.some((t) => t.value === tab) ? tab : "APPROVED";

  const [stores, counts, sales] = await Promise.all([
    prisma.store.findMany({
      where: { status },
      include: { owner: { select: { name: true, email: true } }, _count: { select: { products: true } } },
      orderBy: { createdAt: status === "PENDING" ? "asc" : "desc" },
    }),
    prisma.store.groupBy({ by: ["status"], _count: true }),
    prisma.order.groupBy({ by: ["storeId"], where: { ...placedOrder, status: { not: "CANCELLED" } }, _sum: { total: true } }),
  ]);
  const countFor = Object.fromEntries(counts.map((c) => [c.status, c._count]));
  const salesFor = Object.fromEntries(sales.map((s) => [s.storeId, s._sum.total]));

  return (
    <>
      <PageHeader title="Stores" subtitle="Review applications and pause stores that break the rules." />
      <div className="flex flex-wrap gap-2 mb-5">
        {TABS.map((t) => (
          <Link key={t.value} href={`/admin/stores?tab=${t.value}`} className="chip" data-active={status === t.value}>
            {t.label}
            <span className="text-text-3">{countFor[t.value] || 0}</span>
          </Link>
        ))}
      </div>

      {stores.length ? (
        <div className="grid md:grid-cols-2 gap-4">
          {stores.map((s) => (
            <article key={s.id} className="card p-5">
              <div className="flex items-start gap-4">
                <Image src={s.logo} alt="" width={56} height={56} className="w-14 h-14 rounded-[16px] bg-surface-2 object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{s.name}</h2>
                    {status === "APPROVED" && <span className={`badge ${s.isActive ? "badge-success" : "badge-warning"}`}>{s.isActive ? "Live" : "Paused"}</span>}
                  </div>
                  <p className="text-sm text-text-2 line-clamp-1">{s.tagline}</p>
                  <p className="text-xs text-text-3 mt-1">
                    {s.owner.name} · {s.owner.email}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm text-text-2 line-clamp-3">{s.description}</p>
              <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-text-3">Products</dt>
                  <dd className="font-medium">{s._count.products}</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-3">Sales</dt>
                  <dd className="font-medium">{money(salesFor[s.id] || 0)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-3">{status === "PENDING" ? "Applied" : "Since"}</dt>
                  <dd className="font-medium">{shortDate(s.createdAt)}</dd>
                </div>
              </dl>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                {status === "APPROVED" ? (
                  <Link href={`/store/${s.username}`} className="btn btn-ghost btn-sm -ml-2">
                    <ExternalLink />
                    View store
                  </Link>
                ) : (
                  <span className="text-xs text-text-3">
                    {s.address}, {s.city}
                  </span>
                )}
                <StoreReviewButtons storeId={s.id} status={s.status} isActive={s.isActive} />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState icon={Store} title={status === "PENDING" ? "No applications waiting" : "Nothing here"}>
          {status === "PENDING" ? "New store applications show up here for review." : "Stores in this state will be listed here."}
        </EmptyState>
      )}
    </>
  );
}
