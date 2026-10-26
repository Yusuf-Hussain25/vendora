import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CirclePlay, LockKeyhole, MapPinned, Truck } from "lucide-react";
import hero from "../../../public/images/editorial/hero.jpg";

const trust = [
  [Truck, "Same-day", "delivery"],
  [LockKeyhole, "Secure", "checkout"],
  [BadgeCheck, "Verified", "local stores"],
  [MapPinned, "Live order", "tracking"],
];

// featured: a real store from the catalog, shown as the caption inside the photograph
export default function Hero({ featured }) {
  return (
    <section className="border-b border-border overflow-x-clip">
      <div className="container-x grid lg:grid-cols-[1fr_1.05fr] gap-10 lg:gap-0 items-stretch">
        <div className="py-12 sm:py-16 lg:py-24 lg:pr-14 flex flex-col justify-center">
          <p className="eyebrow">Local stores · One cart · Fast delivery</p>
          <h1 className="font-display mt-6 text-[48px] sm:text-[60px] xl:text-[72px] text-text">
            Everything you need, from <em className="text-emphasis">local stores.</em>
          </h1>
          <p className="mt-6 max-w-[460px] text-[16.5px] leading-relaxed text-text-2">
            Discover fashion, groceries, electronics and home goods from independent stores, all in one place.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/shop" className="btn btn-primary btn-lg group">
              Start shopping
              <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a href="#how-it-works" className="btn btn-secondary btn-lg">
              <CirclePlay />
              How it works
            </a>
          </div>
          <ul className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-5 max-w-[560px]">
            {trust.map(([Icon, a, b]) => (
              <li key={a} className="flex items-center gap-2.5">
                <Icon className="w-5 h-5 text-accent-text shrink-0" strokeWidth={1.6} />
                <span className="text-[12.5px] leading-tight text-text-2">
                  {a}
                  <br />
                  {b}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative min-h-[420px] sm:min-h-[520px] -mx-4 sm:mx-0 hero-bleed">
          <Image
            src={hero}
            alt="Wireless headphones resting on a warm, sunlit surface"
            fill
            priority
            placeholder="blur"
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-cover object-[50%_60%]"
          />
          {featured && (
            <Link
              href={`/store/${featured.username}`}
              className="group absolute left-4 bottom-4 sm:left-8 sm:bottom-8 max-w-[200px] sm:max-w-[260px] bg-ivory/95 text-[#171916] px-4 py-3 sm:px-5 sm:py-4 rounded-md"
            >
              <span className="block text-[11px] uppercase tracking-[.16em] text-[#656761]">Featured store</span>
              <span className="block font-display text-[22px] sm:text-[26px] leading-tight mt-1">{featured.name}</span>
              <span className="hidden sm:block text-[13px] text-[#656761] mt-1 leading-snug">{featured.tagline}</span>
              <span className="mt-2 sm:mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium">
                Shop now
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
