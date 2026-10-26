import Link from "next/link";
import { ArrowRight, BadgeCheck, CirclePlay, MapPinned, ShieldCheck, Truck } from "lucide-react";
import iphone from "../../../public/images/editorial/hero-iphone.jpg";
import macbook from "../../../public/images/editorial/hero-macbook.jpg";
import groceries from "../../../public/images/editorial/groceries.jpg";
import { money } from "@/lib/format";
import HeroSlider from "./HeroSlider";

const trust = [
  [Truck, "Same-day", "delivery"],
  [ShieldCheck, "Secure", "checkout"],
  [BadgeCheck, "Verified", "local stores"],
  [MapPinned, "Live order", "tracking"],
];

// picks: real catalog records for each slide ({ id, name, price, store }), or null when missing
export default function Hero({ picks }) {
  const slides = [
    picks.iphone && {
      key: "iphone",
      image: iphone,
      alt: "iPhone 17 Pro on a sunlit wooden table",
      position: "45% 50%",
      eyebrow: `New at ${picks.iphone.store.name}`,
      title: picks.iphone.name,
      line: `From ${money(picks.iphone.price)} · Inclusive of GST`,
      perks: ["Official warranty", "Fast delivery"],
      href: `/product/${picks.iphone.id}`,
    },
    picks.macbook && {
      key: "macbook",
      image: macbook,
      alt: "MacBook Pro 14-inch with M5 in Space Black on a desk",
      position: "50% 55%",
      eyebrow: `Just launched at ${picks.macbook.store.name}`,
      title: picks.macbook.name,
      line: `From ${money(picks.macbook.price)} · Inclusive of GST`,
      perks: ["Official warranty", "No-cost delivery"],
      href: `/product/${picks.macbook.id}`,
    },
    picks.kirana && {
      key: "kirana",
      image: groceries,
      alt: "Fresh vegetables and fruit on a wooden board",
      position: "60% 50%",
      eyebrow: "Daily essentials",
      title: picks.kirana.name,
      line: `${picks.kirana.count} pantry favourites from ${money(picks.kirana.from)}`,
      perks: ["Printed MRP", "Delivered today"],
      href: `/store/${picks.kirana.username}`,
    },
  ].filter(Boolean);

  return (
    <section className="relative border-b border-border overflow-x-clip">
      <div className="container-x grid lg:grid-cols-[1fr_1fr] items-stretch">
        <div className="relative z-10 py-12 sm:py-16 lg:py-20 lg:pr-10 flex flex-col justify-center">
          <p className="eyebrow">
            Local stores <span className="mx-2 opacity-60">•</span> One cart <span className="mx-2 opacity-60">•</span> Fast delivery
          </p>
          <h1 className="font-display mt-6 text-[48px] sm:text-[62px] xl:text-[68px] leading-[0.98] text-text">
            Everything you need, <br className="hidden sm:block" />
            from <em className="text-emphasis">local stores.</em>
          </h1>
          <p className="mt-6 max-w-[470px] text-[17px] leading-relaxed text-text-2">
            Discover fashion, groceries, electronics and home goods from independent stores, all in one place.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/shop" className="btn btn-primary btn-lg group !h-[54px] !px-8 !text-[16px]">
              Start shopping
              <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a href="#how-it-works" className="btn btn-secondary btn-lg !h-[54px] !px-7 !text-[16px]">
              <CirclePlay />
              How it works
            </a>
          </div>
          <ul className="mt-12 grid grid-cols-2 sm:flex sm:flex-nowrap gap-y-5">
            {trust.map(([Icon, a, b], i) => (
              <li key={a} className={`flex items-center gap-2.5 sm:pr-4 sm:mr-4 ${i < trust.length - 1 ? "sm:border-r border-border" : ""}`}>
                <Icon className="w-[22px] h-[22px] text-text shrink-0" strokeWidth={1.5} />
                <span className="text-[12.5px] leading-tight text-text-2 whitespace-nowrap">
                  {a}
                  <br />
                  {b}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <HeroSlider slides={slides} />
      </div>
    </section>
  );
}
