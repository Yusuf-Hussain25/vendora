import Link from "next/link";
import { ArrowRight, CreditCard, MapPinned, PackageCheck, ShieldCheck } from "lucide-react";
import prisma from "@/lib/prisma";
import { getCategoryCounts, getLiveDeals, getStoresWithStats, productCardSelect, visibleProduct } from "@/lib/queries";
import Hero from "@/components/home/Hero";
import CategoryRow from "@/components/home/CategoryRow";
import FlashBanner from "@/components/home/FlashBanner";
import PromoPanels from "@/components/home/PromoPanels";
import StoreRow from "@/components/home/StoreRow";
import ProductGrid from "@/components/product/ProductGrid";

function SectionTitle({ title, href, linkLabel = "View all" }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6">
      <h2 className="text-[26px] sm:text-[30px] font-semibold tracking-[-0.02em]">{title}</h2>
      {href && (
        <Link href={href} className="link-arrow shrink-0">
          {linkLabel}
          <ArrowRight />
        </Link>
      )}
    </div>
  );
}

export default async function HomePage() {
  const [deals, bestSellers, stores, counts, featured] = await Promise.all([
    getLiveDeals(10),
    prisma.product.findMany({ where: visibleProduct, select: productCardSelect, orderBy: { soldCount: "desc" }, take: 10 }),
    getStoresWithStats(),
    getCategoryCounts(),
    // The electronics store with the most products leads the hero (it sells the pictured headphones)
    prisma.store.findFirst({
      where: { status: "APPROVED", isActive: true, products: { some: { category: "electronics", isActive: true } } },
      orderBy: { products: { _count: "desc" } },
      select: { name: true, username: true, tagline: true },
    }),
  ]);

  const popularStores = [...stores].sort((a, b) => b.sold - a.sold).slice(0, 8);
  // Lead with the most notable deal from each department, then fill with the rest
  const byValue = [...deals].sort((a, b) => b.mrp - a.mrp);
  const leaders = byValue.filter((d, i, list) => list.findIndex((x) => x.category === d.category) === i);
  const dealPicks = [...leaders, ...byValue.filter((d) => !leaders.includes(d))].slice(0, 6);

  return (
    <>
      <Hero featured={featured} />

      <section className="container-x pt-14 sm:pt-20">
        <SectionTitle title="Shop by category" href="/shop" linkLabel="All products" />
        <CategoryRow counts={counts} />
      </section>

      {deals.length > 0 && (
        <section className="container-x pt-14 sm:pt-20">
          <FlashBanner endsAt={deals[0].dealEndsAt} count={deals.length} />
          <div className="mt-8">
            <SectionTitle title="Today's flash deals" href="/deals" />
            {/* 6 cards fill 2x3 and 3x2 grids; the sixth hides on the 5-column desktop row */}
            <ProductGrid products={dealPicks} columns={5} showStore className="lg:[&>*:nth-child(6)]:hidden" />
          </div>
        </section>
      )}

      <section className="container-x pt-14 sm:pt-20">
        <PromoPanels groceryCount={counts.grocery || 0} electronicsCount={counts.electronics || 0} />
      </section>

      <section className="container-x pt-14 sm:pt-20">
        <SectionTitle title="Best sellers this month" href="/shop?sort=popular" />
        <ProductGrid products={bestSellers} columns={5} showStore className="sm:max-lg:[&>*:nth-child(10)]:hidden" />
      </section>

      <section className="container-x pt-14 sm:pt-20">
        <SectionTitle title="Popular local stores" href="/stores" linkLabel="View all stores" />
        <StoreRow stores={popularStores} />
      </section>

      <section className="container-x pt-14 sm:pt-20 scroll-mt-28" id="how-it-works">
        <div className="grid lg:grid-cols-[0.9fr_1.4fr] gap-10 lg:gap-16 border-t border-border pt-12 sm:pt-16">
          <div>
            <p className="eyebrow">How it works</p>
            <h2 className="font-display mt-4 text-[40px] sm:text-[48px] leading-[1.04]">
              One checkout, <em className="text-emphasis">many stores.</em>
            </h2>
            <p className="mt-4 max-w-md text-text-2 leading-relaxed">
              Fill one cart from any number of independent shops. Each store packs its part, a nearby rider brings it over, and
              you follow every step on the map.
            </p>
            <Link href="/shop" className="btn btn-primary mt-7">
              Start shopping
              <ArrowRight />
            </Link>
          </div>
          <ol className="grid sm:grid-cols-2 gap-x-10 gap-y-9">
            {[
              [CreditCard, "Pay once", "Check out by card or cash on delivery, even when your cart spans several stores."],
              [PackageCheck, "Packed by the store", "Sellers confirm and pack your items. You see every step as it happens."],
              [MapPinned, "Follow your rider", "Once it's picked up, the rider's location updates on your order page every few seconds."],
              [ShieldCheck, "Code at the door", "Your order is only marked delivered when you share your 4-digit code."],
            ].map(([Icon, title, text], i) => (
              <li key={title} className="border-t border-border pt-5">
                <div className="flex items-center justify-between">
                  <Icon className="w-5 h-5 text-accent-text" strokeWidth={1.6} />
                  <span className="text-xs text-text-3 tabular-nums">0{i + 1}</span>
                </div>
                <h3 className="mt-4 text-[17px] font-semibold">{title}</h3>
                <p className="mt-1.5 text-[14px] text-text-2 leading-relaxed">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
