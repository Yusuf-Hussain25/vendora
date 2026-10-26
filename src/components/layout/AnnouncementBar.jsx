import Link from "next/link";
import { BadgeCheck, Gift, Package, Truck } from "lucide-react";
import { money } from "@/lib/format";
import { FREE_DELIVERY_OVER } from "@/lib/pricing";

const Divider = () => <span className="h-4 w-px bg-ivory/25" aria-hidden="true" />;

// coupon: the best live public coupon from the database, or null
export default function AnnouncementBar({ coupon }) {
  return (
    <div className="bg-forest text-ivory/90 text-[13px]">
      <div className="container-x h-10 flex items-center justify-between gap-4">
        <p className="flex items-center gap-3 min-w-0">
          <Gift className="w-4 h-4 text-[#e8c66a] shrink-0" />
          {coupon ? (
            <>
              <span className="truncate">
                <span className="font-semibold text-[#e8c66a]">{coupon.discount}% OFF</span>{" "}
                {coupon.forNewUser ? "on your first order" : coupon.description.replace(/^\d+% off\s*/i, "")}
              </span>
              <span className="hidden sm:inline-flex items-center gap-3">
                <Divider />
                <span>
                  Use code <span className="font-semibold tracking-wide text-ivory">{coupon.code}</span>
                </span>
              </span>
            </>
          ) : (
            <span>Independent stores, one checkout</span>
          )}
        </p>
        <div className="hidden md:flex items-center gap-4 shrink-0">
          <span className="inline-flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Free delivery over {money(FREE_DELIVERY_OVER)} per store
          </span>
          <Divider />
          <Link href="/account/orders" className="inline-flex items-center gap-2 hover:text-ivory hover:underline underline-offset-4">
            <Package className="w-4 h-4" />
            Track order
          </Link>
          <Divider />
          <Link href="/sell" className="inline-flex items-center gap-2 hover:text-ivory hover:underline underline-offset-4">
            <BadgeCheck className="w-4 h-4" />
            Sell on Vendora
          </Link>
        </div>
      </div>
    </div>
  );
}
