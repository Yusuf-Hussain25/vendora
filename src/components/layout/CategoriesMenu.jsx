"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { CATEGORIES } from "@/lib/catalog";
import useDismiss from "./useDismiss";

export default function CategoriesMenu({ counts = {} }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, ref, close);

  return (
    <div className="relative" ref={ref}>
      <button
        className={`inline-flex items-center gap-1.5 h-9 px-3.5 text-[15.5px] transition ${open ? "text-accent-text" : "text-text hover:text-accent-text"}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        Categories
        <ChevronDown className={`w-3.5 h-3.5 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 mt-3 w-[440px] rounded-lg bg-panel border border-border shadow-lg p-3 fade-up z-50">
          <ul className="grid grid-cols-2 gap-1">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/shop?category=${c.slug}`} onClick={close} className="group flex items-center gap-3 p-2 rounded-md hover:bg-surface-2 transition">
                  <span className="relative w-11 h-11 rounded-md overflow-hidden bg-media shrink-0">
                    {/* Decorative thumbnails; the label carries the meaning */}
                    <span className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(/images/categories/${c.slug}.jpg)` }} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{c.name}</span>
                    <span className="block text-xs text-text-3">{counts[c.slug] || 0} items</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="rule my-2" />
          <Link href="/shop" onClick={close} className="link-arrow px-2 py-1.5">
            Browse everything
            <ArrowRight />
          </Link>
        </div>
      )}
    </div>
  );
}
