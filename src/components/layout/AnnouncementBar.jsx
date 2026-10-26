import Link from "next/link";
import { Truck } from "lucide-react";
import { money } from "@/lib/format";
import { FREE_DELIVERY_OVER } from "@/lib/pricing";

// coupon: the best live public coupon from the database, or null
export default function AnnouncementBar({ coupon }) {
  return (
    <div className="bg-forest text-ivory/90 text-[12.5px]">
      <div className="container-x h-9 flex items-center justify-between gap-4">
        <p className="truncate">
          {coupon ? (
            <>
              <span className="font-medium text-ivory">{coupon.description}</span>
              <span className="mx-2 opacity-40">|</span>
              Use code <span className="font-semibold tracking-wide text-ivory">{coupon.code}</span>
            </>
          ) : (
            <>Independent stores, one checkout</>
          )}
        </p>
        <div className="hidden md:flex items-center gap-5 shrink-0">
          <span className="inline-flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5" />
            Free delivery over {money(FREE_DELIVERY_OVER)} per store
          </span>
          <span className="opacity-30">|</span>
          <Link href="/account/orders" className="hover:text-ivory hover:underline underline-offset-4">
            Track order
          </Link>
          <Link href="/sell" className="hover:text-ivory hover:underline underline-offset-4">
            Sell on Vendora
          </Link>
        </div>
      </div>
    </div>
  );
}
