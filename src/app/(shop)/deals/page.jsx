import Link from "next/link";
import { Timer } from "lucide-react";
import { getLiveDeals } from "@/lib/queries";
import { dealEndsWithin, effectivePrice } from "@/lib/pricing";
import { money } from "@/lib/format";
import ProductGrid from "@/components/product/ProductGrid";
import EmptyState from "@/components/ui/EmptyState";
import FlashBanner from "@/components/home/FlashBanner";

export const metadata = { title: "Flash deals" };

export default async function DealsPage() {
  const deals = await getLiveDeals(60);
  const endingSoon = deals.filter((d) => dealEndsWithin(d, 12 * 3_600_000));
  const biggestSaving = deals.reduce((best, d) => Math.max(best, d.mrp - effectivePrice(d)), 0);

  return (
    <div className="container-x pt-8">
      {deals.length ? (
        <>
          <FlashBanner endsAt={deals[0].dealEndsAt} count={deals.length} />
          <dl className="mt-8 grid grid-cols-3 border-y border-border divide-x divide-border">
            {[
              [deals.length, "deals live now"],
              [endingSoon.length, "ending within 12 hours"],
              [money(biggestSaving), "biggest saving today"],
            ].map(([value, label]) => (
              <div key={label} className="px-4 sm:px-8 py-5 first:pl-0">
                <dt className="sr-only">{label}</dt>
                <dd className="font-display text-[30px] sm:text-[40px] leading-none">{value}</dd>
                <dd className="mt-2 text-[13px] text-text-3">{label}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-10">
            <ProductGrid products={deals} priorityCount={5} columns={5} showStore />
          </div>
        </>
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
  );
}
