import Link from "next/link";
import { ArrowRight, Bike, CreditCard, MapPinned, PackageCheck, ShieldCheck, Store, Timer } from "lucide-react";
import prisma from "@/lib/prisma";
import { CATEGORIES } from "@/lib/catalog";
import { getCategoryCounts, getLiveDeals, getStoresWithStats, productCardSelect, visibleProduct } from "@/lib/queries";
import Hero from "@/components/home/Hero";
import SectionHeader from "@/components/ui/SectionHeader";
import CategoryIcon from "@/components/ui/CategoryIcon";
import ProductGrid, { ProductRail } from "@/components/product/ProductGrid";
import StoreCard from "@/components/store/StoreCard";
import DealCountdown from "@/components/product/DealCountdown";

export default async function HomePage() {
  const [deals, trending, fresh, newest, stores, storeCount, counts, ratingAgg, liveOrder] = await Promise.all([
    getLiveDeals(12),
    prisma.product.findMany({ where: visibleProduct, select: productCardSelect, orderBy: { soldCount: "desc" }, take: 8 }),
    prisma.product.findMany({
      where: { ...visibleProduct, category: "grocery" },
      select: productCardSelect,
      orderBy: [{ soldCount: "desc" }],
      take: 10,
    }),
    prisma.product.findMany({ where: visibleProduct, select: productCardSelect, orderBy: { createdAt: "desc" }, take: 8 }),
    getStoresWithStats({ take: 6 }),
    prisma.store.count({ where: { status: "APPROVED", isActive: true } }),
    getCategoryCounts(),
    prisma.product.aggregate({ where: { ...visibleProduct, ratingCount: { gt: 0 } }, _avg: { ratingAvg: true } }),
    prisma.order.findFirst({ where: { status: "OUT_FOR_DELIVERY" }, select: { number: true }, orderBy: { updatedAt: "desc" } }),
  ]);

  const stats = {
    products: Object.values(counts).reduce((a, b) => a + b, 0),
    stores: storeCount,
    rating: ratingAgg._avg.ratingAvg || 0,
    liveOrder: liveOrder?.number,
  };
  const soonestDeal = deals[0];
  // Lead the hero with the most eye-catching deals: priciest first, one per department
  const heroDeals = [...deals]
    .sort((a, b) => b.mrp - a.mrp)
    .filter((d, i, list) => list.findIndex((x) => x.category === d.category) === i && d.category !== "home")
    .slice(0, 3);

  return (
    <>
      <Hero deals={heroDeals} stats={stats} />

      {/* Departments */}
      <section className="container-x mt-14">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/shop?category=${c.slug}`}
              className="group card p-4 flex flex-col gap-3 transition hover:-translate-y-0.5 hover:border-border-strong"
            >
              <span
                className="grid place-items-center w-11 h-11 rounded-[14px] transition group-hover:scale-110"
                style={{ background: `${c.hue}22`, color: c.hue }}
              >
                <CategoryIcon name={c.icon} className="w-5 h-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold">{c.name}</span>
                <span className="block text-xs text-text-3 mt-0.5">{counts[c.slug] || 0} items</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Flash deals */}
      {deals.length > 0 && (
        <section className="container-x mt-20">
          <SectionHeader eyebrow="Flash deals" title="Prices drop, clocks tick" subtitle="Limited-time prices from across the marketplace." href="/deals">
            {soonestDeal && (
              <div className="hidden md:flex items-center gap-3 ml-auto mr-2 text-sm text-text-2">
                <Timer className="w-4 h-4 text-deal" />
                Next deal ends in
                <DealCountdown endsAt={soonestDeal.dealEndsAt} variant="blocks" />
              </div>
            )}
          </SectionHeader>
          <ProductRail products={deals} />
        </section>
      )}

      {/* Trending */}
      <section className="container-x mt-20">
        <SectionHeader eyebrow="Trending" title="What everyone's buying" href="/shop?sort=popular" />
        <ProductGrid products={trending} />
      </section>

      {/* Stores */}
      <section className="container-x mt-20">
        <SectionHeader eyebrow="Stores" title="Meet the sellers" subtitle="Every store is reviewed by our team before it goes live." href="/stores" linkLabel="All stores" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map((s) => (
            <StoreCard key={s.id} store={s} />
          ))}
        </div>
      </section>

      {/* Groceries */}
      {fresh.length > 0 && (
        <section className="container-x mt-20">
          <SectionHeader eyebrow="Fresh today" title="Groceries in under two hours" subtitle="Fruit, veg, dairy and pantry staples from Fresh Fields Market." href="/shop?category=grocery" />
          <ProductRail products={fresh} />
        </section>
      )}

      {/* How delivery works */}
      <section className="container-x mt-20">
        <div className="card !rounded-[32px] p-6 sm:p-10 lg:p-12 relative overflow-hidden">
          <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-[image:var(--accent-grad)] opacity-20 blur-3xl" aria-hidden="true" />
          <div className="relative grid lg:grid-cols-[1fr_1.4fr] gap-10 items-center">
            <div>
              <p className="eyebrow">Delivery</p>
              <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">Watch your order cross the city</h2>
              <p className="mt-3 text-text-2 leading-relaxed">
                Each store packs its part of your order. A nearby rider picks it up and you follow them live on the map. Hand over
                your 4-digit code at the door and you&apos;re done.
              </p>
              <Link href="/account/orders" className="btn btn-secondary mt-6">
                Track an order
                <ArrowRight />
              </Link>
            </div>
            <ol className="grid sm:grid-cols-2 gap-3">
              {[
                [CreditCard, "One checkout", "Pay once by card or cash on delivery, even across several stores."],
                [PackageCheck, "Packed by the store", "Sellers confirm and pack. You see every step as it happens."],
                [MapPinned, "Live rider map", "The rider's location updates every few seconds while they ride."],
                [ShieldCheck, "Code at the door", "Your order is only marked delivered when you share your code."],
              ].map(([Icon, title, text], i) => (
                <li key={title} className="rounded-[20px] border border-border bg-surface p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid place-items-center w-9 h-9 rounded-[12px] bg-accent-soft text-accent-text">
                      <Icon className="w-[18px] h-[18px]" />
                    </span>
                    <span className="text-xs font-mono text-text-3">0{i + 1}</span>
                  </div>
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-text-2 leading-relaxed">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* New arrivals */}
      <section className="container-x mt-20">
        <SectionHeader eyebrow="Just in" title="New arrivals" href="/shop?sort=newest" />
        <ProductGrid products={newest} />
      </section>

      {/* Sell CTA */}
      <section className="container-x mt-20">
        <div className="relative overflow-hidden rounded-[32px] p-8 sm:p-12 bg-[image:var(--accent-grad)] text-white">
          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_80%_20%,white,transparent_45%)]" aria-hidden="true" />
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-xl">
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">Open your store on Vendora</h2>
              <p className="mt-3 text-white/85 text-[17px] leading-relaxed">
                List products in minutes, let AI write your descriptions, and get paid while our riders handle delivery.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/sell" className="btn btn-lg bg-white text-[#0b1517] hover:bg-white/90">
                <Store />
                Start selling
              </Link>
              <Link href="/stores" className="btn btn-lg bg-white/15 text-white border-white/30 hover:bg-white/25">
                <Bike />
                See our sellers
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
