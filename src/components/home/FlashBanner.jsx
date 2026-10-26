import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import DealCountdown from "@/components/product/DealCountdown";
import flash from "../../../public/images/editorial/flash.jpg";

// endsAt: when the soonest live deal ends; count: how many deals are live
export default function FlashBanner({ endsAt, count }) {
  return (
    <div className="relative overflow-hidden rounded-lg bg-forest text-ivory">
      <div className="absolute inset-y-0 right-0 w-[46%] hidden md:block">
        <Image src={flash} alt="" fill sizes="45vw" placeholder="blur" className="object-cover object-[50%_45%] opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-forest via-forest/50 to-transparent" />
      </div>
      <div className="relative grid md:grid-cols-[1fr_auto] gap-8 items-center p-7 sm:p-10 lg:px-12">
        <div className="max-w-md">
          <p className="inline-flex items-center gap-2 text-[12px] font-semibold tracking-[.18em] uppercase text-[#e8c66a]">
            <Zap className="w-4 h-4 fill-current" />
            Flash deals
          </p>
          <h2 className="font-display mt-3 text-[34px] sm:text-[42px] leading-[1.05]">Limited-time offers from local stores.</h2>
          <p className="mt-3 text-[15px] text-ivory/75">
            {count} {count === 1 ? "price drop" : "price drops"} running now. When the clock hits zero, prices go back up.
          </p>
          <Link href="/deals" className="btn btn-light mt-6">
            View all deals
            <ArrowRight />
          </Link>
        </div>
        {endsAt && (
          <div className="md:mr-[2%] rounded-lg bg-forest/70 backdrop-blur-[2px] border border-ivory/15 p-4">
            <p className="text-[13px] text-ivory/80 mb-3">Next deal ends in</p>
            <DealCountdown endsAt={endsAt} variant="tiles" />
          </div>
        )}
      </div>
    </div>
  );
}
