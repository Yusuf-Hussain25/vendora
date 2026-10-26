import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bike, MapPin, ShieldCheck, Store, Timer } from "lucide-react";
import { effectivePrice } from "@/lib/pricing";
import { money, numberCompact } from "@/lib/format";
import DealCountdown from "@/components/product/DealCountdown";

export default function Hero({ deals, stats }) {
  const [main, second, third] = deals;

  return (
    <section className="container-x pt-8 sm:pt-14 pb-6">
      <div className="grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-14 items-center">
        <div className="fade-up">
          <span className="inline-flex items-center gap-2 h-8 pl-1.5 pr-3.5 rounded-full border border-border bg-surface text-[13px] text-text-2">
            <span className="grid place-items-center w-5 h-5 rounded-full bg-accent-soft text-accent-text">
              <Bike className="w-3 h-3" />
            </span>
            Same-day delivery across San Francisco
          </span>
          <h1 className="mt-5 text-[40px] leading-[1.04] sm:text-6xl lg:text-[68px] font-semibold tracking-[-0.035em]">
            Independent stores.
            <br />
            <span className="text-gradient">One cart.</span>
            <br />
            Live delivery.
          </h1>
          <p className="mt-5 max-w-xl text-[17px] text-text-2 leading-relaxed">
            Fashion, fresh groceries, electronics and home goods from {stats.stores} local sellers. Check out once, then
            follow your rider on the map until it&apos;s at your door.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop" className="btn btn-primary btn-lg group">
              Start shopping
              <ArrowRight className="transition group-hover:translate-x-0.5" />
            </Link>
            <Link href="/deals" className="btn btn-secondary btn-lg">
              <Timer />
              Today&apos;s flash deals
            </Link>
          </div>
          <dl className="mt-10 grid grid-cols-3 max-w-md gap-6">
            {[
              [numberCompact(stats.products), "products"],
              [stats.stores, "verified stores"],
              [`${stats.rating.toFixed(1)}★`, "average rating"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd className="text-2xl font-semibold tracking-tight">{value}</dd>
                <dd className="text-xs text-text-3 mt-0.5">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Live preview built from real deals in the catalog */}
        {main && (
          <div className="relative h-[440px] sm:h-[520px] fade-up" style={{ animationDelay: "120ms" }}>
            <div className="absolute inset-x-6 top-4 bottom-10 rounded-[36px] bg-[image:var(--accent-grad-soft)] blur-2xl" aria-hidden="true" />
            <Link
              href={`/product/${main.id}`}
              className="absolute left-0 sm:left-4 top-0 w-[64%] sm:w-[54%] card !rounded-[28px] p-3 shadow-lg transition hover:-translate-y-1"
            >
              <div className="relative aspect-square rounded-[20px] bg-surface-2 overflow-hidden">
                <Image src={main.images[0]} alt={main.name} fill priority sizes="320px" className="object-contain p-5" />
                <span className="absolute top-3 left-3 badge badge-deal">
                  <Timer />
                  <DealCountdown endsAt={main.dealEndsAt} />
                </span>
              </div>
              <div className="px-1.5 pt-3 pb-1">
                <p className="text-xs text-text-3">{main.store.name}</p>
                <p className="font-medium truncate">{main.name}</p>
                <p className="mt-1 flex items-baseline gap-2">
                  <span className="text-lg font-semibold text-deal">{money(effectivePrice(main))}</span>
                  <span className="text-sm text-text-3 line-through">{money(main.mrp)}</span>
                </p>
              </div>
            </Link>

            {second && (
              <Link
                href={`/product/${second.id}`}
                className="absolute right-0 top-0 w-[40%] sm:w-[36%] card !rounded-[24px] p-2.5 shadow-lg transition hover:-translate-y-1"
              >
                <div className="relative aspect-square rounded-[16px] bg-surface-2">
                  <Image src={second.images[0]} alt={second.name} fill sizes="200px" className="object-contain p-3" />
                </div>
                <p className="px-1 pt-2 text-sm font-medium truncate">{second.name}</p>
                <p className="px-1 text-sm font-semibold text-deal">{money(effectivePrice(second))}</p>
              </Link>
            )}

            <div className="absolute right-0 bottom-16 sm:bottom-14 w-[64%] sm:w-[50%] card !rounded-[22px] p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <span className="relative grid place-items-center w-10 h-10 rounded-full bg-accent-soft text-accent-text">
                  <Bike className="w-5 h-5" />
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-success text-success pulse-dot ring-2 ring-panel-solid" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Your rider is 4 min away</p>
                  <p className="text-xs text-text-3 truncate">Order {stats.liveOrder || "VND-31024"} · on the way</p>
                </div>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                <div className="h-full w-[72%] rounded-full bg-[image:var(--accent-grad)]" />
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-text-3">
                <span className="inline-flex items-center gap-1">
                  <Store className="w-3 h-3" /> Picked up
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Your door
                </span>
              </div>
            </div>

            {third && (
              <div className="absolute left-2 sm:left-10 bottom-0 card !rounded-[20px] px-4 py-3 shadow-lg flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-accent-text shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Delivery code protected</p>
                  <p className="text-xs text-text-3">Share your 4-digit code at the door</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
