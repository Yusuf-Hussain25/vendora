import Image from "next/image";
import { notFound } from "next/navigation";
import { BadgeCheck, CalendarDays, Mail, MapPin, Package, PackageOpen, Star } from "lucide-react";
import prisma from "@/lib/prisma";
import { searchProducts } from "@/lib/queries";
import { numberCompact, shortDate } from "@/lib/format";
import ProductGrid from "@/components/product/ProductGrid";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/shop/Pagination";
import StoreSort from "@/components/store/StoreSort";

async function getStore(username) {
  return prisma.store.findFirst({ where: { username, status: "APPROVED", isActive: true } });
}

export async function generateMetadata({ params }) {
  const { username } = await params;
  const store = await getStore(username);
  return store ? { title: store.name, description: store.tagline } : { title: "Store not found" };
}

export default async function StorePage({ params, searchParams }) {
  const { username } = await params;
  const sp = await searchParams;
  const store = await getStore(username);
  if (!store) notFound();

  const [{ items, total, page, pages }, stats] = await Promise.all([
    searchProducts({ store: username, sort: sp.sort, page: sp.page }),
    prisma.product.aggregate({
      where: { storeId: store.id, ratingCount: { gt: 0 } },
      _avg: { ratingAvg: true },
      _sum: { ratingCount: true, soldCount: true },
    }),
  ]);

  return (
    <div className="container-x pt-6">
      <section className="card !rounded-[14px] overflow-hidden">
        <div className="relative h-40 sm:h-56 bg-surface-2">
          {store.banner && <Image src={store.banner} alt="" fill priority sizes="100vw" className="object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        </div>
        <div className="px-5 sm:px-8 pb-6 sm:pb-8 -mt-12 relative">
          <div className="flex flex-col gap-4">
            <Image src={store.logo} alt={`${store.name} logo`} width={104} height={104} className="w-24 h-24 sm:w-[104px] sm:h-[104px] rounded-full ring-4 ring-panel object-cover bg-surface-2" />
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-[38px] sm:text-[46px] flex items-center gap-2">
                {store.name}
                <BadgeCheck className="w-6 h-6 text-accent-text shrink-0" aria-label="Verified store" />
              </h1>
              <p className="mt-1 text-text-2">{store.tagline}</p>
            </div>
          </div>
          <p className="mt-5 max-w-3xl text-sm text-text-2 leading-relaxed">{store.description}</p>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-2">
            <span className="inline-flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              {stats._avg.ratingAvg ? `${stats._avg.ratingAvg.toFixed(1)} from ${stats._sum.ratingCount} reviews` : "No reviews yet"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Package className="w-4 h-4" />
              {total} products · {numberCompact(stats._sum.soldCount || 0)} sold
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {store.address}, {store.city}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4" />
              Selling since {shortDate(store.createdAt)}
            </span>
            <a href={`mailto:${store.email}`} className="inline-flex items-center gap-1.5 hover:text-text transition">
              <Mail className="w-4 h-4" />
              {store.email}
            </a>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between gap-4 mb-5">
          <h2 className="text-xl font-semibold tracking-tight">All products</h2>
          <StoreSort />
        </div>
        {items.length ? (
          <>
            <ProductGrid products={items} />
            <Pagination page={page} pages={pages} searchParams={sp} basePath={`/store/${username}`} />
          </>
        ) : (
          <EmptyState icon={PackageOpen} title="No products listed yet">
            This store is still stocking its shelves.
          </EmptyState>
        )}
      </section>
    </div>
  );
}
