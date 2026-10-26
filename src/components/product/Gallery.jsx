"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";

export default function Gallery({ images, name }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const count = images.length;
  const go = (step) => setIndex((i) => (i + step + count) % count);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e) => {
      if (e.key === "Escape") setZoom(false);
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % count);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + count) % count);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [zoom, count]);

  return (
    <div className="flex flex-col-reverse sm:flex-row gap-3">
      {count > 1 && (
        <div className="flex sm:flex-col gap-2.5 overflow-x-auto no-scrollbar">
          {images.map((src, i) => (
            <button
              key={src}
              onClick={() => setIndex(i)}
              className={`relative shrink-0 w-[72px] h-[72px] rounded-[10px] bg-surface-2 border transition ${
                i === index ? "border-accent ring-2 ring-accent-soft" : "border-border hover:border-border-strong"
              }`}
              aria-label={`Show image ${i + 1} of ${count}`}
              aria-current={i === index}
            >
              <Image src={src} alt="" fill sizes="72px" className="object-contain p-2" />
            </button>
          ))}
        </div>
      )}
      <div className="relative flex-1 aspect-square card !rounded-[14px] overflow-hidden group">
        <button className="absolute inset-0 cursor-zoom-in" onClick={() => setZoom(true)} aria-label="Open full-size image">
          <Image src={images[index]} alt={name} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-contain p-8 sm:p-12" />
        </button>
        <span className="absolute top-4 right-4 btn btn-secondary btn-icon btn-sm pointer-events-none opacity-0 group-hover:opacity-100 transition">
          <Expand />
        </span>
        {count > 1 && (
          <>
            <button onClick={() => go(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 btn btn-secondary btn-icon btn-sm" aria-label="Previous image">
              <ChevronLeft />
            </button>
            <button onClick={() => go(1)} className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-secondary btn-icon btn-sm" aria-label="Next image">
              <ChevronRight />
            </button>
          </>
        )}
      </div>

      {zoom && (
        <div className="fixed inset-0 z-[100] bg-[#111512]/95 fade-up" role="dialog" aria-modal="true" aria-label={`${name} images`}>
          <button className="absolute top-4 right-4 z-10 btn btn-secondary btn-icon" onClick={() => setZoom(false)} aria-label="Close">
            <X />
          </button>
          <div className="absolute inset-6 sm:inset-16">
            <Image src={images[index]} alt={name} fill sizes="100vw" className="object-contain" />
          </div>
          {count > 1 && (
            <>
              <button onClick={() => go(-1)} className="absolute left-4 top-1/2 -translate-y-1/2 btn btn-secondary btn-icon" aria-label="Previous image">
                <ChevronLeft />
              </button>
              <button onClick={() => go(1)} className="absolute right-4 top-1/2 -translate-y-1/2 btn btn-secondary btn-icon" aria-label="Next image">
                <ChevronRight />
              </button>
              <p className="absolute bottom-5 inset-x-0 text-center text-sm text-white/70">
                {index + 1} / {count}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
