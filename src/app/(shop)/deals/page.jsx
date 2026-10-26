import Link from "next/link";
import { Timer, Zap } from "lucide-react";
import { getLiveDeals } from "@/lib/queries";
import { dealEndsWithin, effectivePrice } from "@/lib/pricing";
import { money } from "@/lib/format";
import ProductGrid from "@/components/product/ProductGrid";
import EmptyState from "@/components/ui/EmptyState";
import DealCountdown from "@/components/product/DealCountdown";

export const metadata = { title: "Flash deals" };

export default async function DealsPage() {
  const deals = await getLiveDeals(60);
  const endingSoon = deals.filter((d) => dealEndsWithin(d, 12 * 3_600_000));
  const biggestSaving = deals.reduce((best, d) => Math.max(best, d.mrp - effectivePrice(d)), 0);

  return (
    <div className="container-x pt-8">
      <section className="relative overflow-hidden card !rounded-[32px] p-6 sm:p-10">
        <div className="absolute -right-20 -top-28 w-96 h-96 rounded-full bg-deal opacity-20 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div>
            <span className="badge badge-deal">
              <Zap className="fill-current" />
              Live now
            </span>
            <h1 className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight">Flash deals</h1>
            <p className="mt-3 max-w-lg text-text-2 text-[17px]">
              Sellers drop prices for a few hours at a time. When the clock hits zero the price goes back up.
            </p>
          </div>
          {deals[0] && (
            <div className="grid grid-cols-3 gap-3 sm:gap-6">
              <div>
                <p className="text-2xl sm:text-3xl font-semibold">{deals.length}</p>
                <p className="text-xs text-text-3">deals live</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-semibold">{endingSoon.length}</p>
                <p className="text-xs text-text-3">ending within 12h</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-semibold text-deal">{money(biggestSaving)}</p>
                <p className="text-xs text-text-3">biggest saving</p>
              </div>
            </div>
          )}
        </div>
        {deals[0] && (
          <div className="relative mt-8 flex flex-wrap items-center gap-3 text-sm text-text-2">
            <Timer className="w-4 h-4 text-deal" />
            Next price goes back up in
            <DealCountdown endsAt={deals[0].dealEndsAt} variant="blocks" />
          </div>
        )}
      </section>

      <div className="mt-10">
        {deals.length ? (
          <ProductGrid products={deals} priorityCount={4} />
        ) : (
          <EmptyState
            icon={Timer}
            title="No deals running right now"
            action={
              <Link href="/shop" className="btn btn-secondary">
                Browse the shop
              </Link>
            }
          >
            Sellers start new flash deals every day. Check back later.
          </EmptyState>
        )}
      </div>
    </div>
  );
}
