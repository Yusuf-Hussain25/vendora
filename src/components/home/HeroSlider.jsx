"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, ShieldCheck, Truck } from "lucide-react";

const AUTOPLAY_MS = 7000;
const pad = (n) => String(n).padStart(2, "0");

export default function HeroSlider({ slides }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  const go = useCallback((step) => setIndex((i) => (i + step + count) % count), [count]);

  // Gentle autoplay; stops on hover/focus and for people who prefer reduced motion
  useEffect(() => {
    if (paused || count < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => go(1), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, count, go]);

  if (!count) return null;

  return (
    <div
      className="relative min-h-[440px] sm:min-h-[540px] lg:min-h-[600px] -mx-4 sm:mx-0 hero-bleed"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured launches"
    >
      {slides.map((s, i) => (
        <div
          key={s.key}
          className={`absolute inset-0 transition-opacity duration-700 ease-out ${i === index ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          aria-hidden={i !== index}
          role="group"
          aria-roledescription="slide"
          aria-label={`${i + 1} of ${count}: ${s.title}`}
        >
          <Image src={s.image} alt={s.alt} fill priority={i === 0} placeholder="blur" sizes="(max-width: 1024px) 100vw, 58vw" className="object-cover" style={{ objectPosition: s.position }} />
          {/* Soft fade into the page on the left so photo and type read as one composition */}
          <div className="absolute inset-y-0 left-0 w-[30%] hidden lg:block bg-gradient-to-r from-bg via-bg/60 to-transparent" aria-hidden="true" />

          <div className="absolute left-4 right-4 bottom-4 sm:right-auto sm:left-8 sm:bottom-10 lg:left-[9%] lg:bottom-[9%] sm:w-[330px] bg-ivory/92 backdrop-blur-[2px] text-[#171916] p-5 sm:p-6 rounded-lg shadow-lg">
            <p className="text-[11px] uppercase tracking-[.18em] text-[#656761]">{s.eyebrow}</p>
            <p className="font-display text-[32px] sm:text-[38px] leading-[1.05] mt-2">{s.title}</p>
            <p className="text-[14px] text-[#656761] mt-2">{s.line}</p>
            <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-[#656761]">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" strokeWidth={1.6} />
                {s.perks[0]}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Truck className="w-4 h-4" strokeWidth={1.6} />
                {s.perks[1]}
              </span>
            </p>
            <Link href={s.href} tabIndex={i === index ? 0 : -1} className="btn mt-5 bg-forest text-ivory hover:bg-[#0a2c22] group">
              Shop now
              <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      ))}

      {count > 1 && (
        <div className="absolute right-4 sm:right-8 bottom-[calc(100%-56px)] sm:bottom-10 flex items-center gap-3 text-[#171916]">
          <button onClick={() => go(-1)} className="grid place-items-center w-11 h-11 rounded-full bg-ivory/90 hover:bg-white shadow-md transition" aria-label="Previous slide">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="h-11 px-4 grid place-items-center rounded-full bg-ivory/90 shadow-md text-[14px] font-medium tabular-nums" aria-live="polite">
            {pad(index + 1)} <span className="opacity-70">/ {pad(count)}</span>
          </span>
          <button onClick={() => go(1)} className="grid place-items-center w-11 h-11 rounded-full bg-ivory/90 hover:bg-white shadow-md transition" aria-label="Next slide">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
