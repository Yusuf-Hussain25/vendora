import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CATEGORIES } from "@/lib/catalog";

export default function CategoryRow({ counts }) {
  return (
    <div className="-mx-4 sm:mx-0 px-4 sm:px-0 flex lg:grid lg:grid-cols-7 gap-3 overflow-x-auto no-scrollbar snap-x">
      {CATEGORIES.map((c) => (
        <Link
          key={c.slug}
          href={`/shop?category=${c.slug}`}
          className="group snap-start shrink-0 w-[42%] sm:w-[28%] lg:w-auto bg-panel border border-border rounded-lg overflow-hidden transition-colors hover:border-border-strong"
        >
          <span className="relative block aspect-[4/5] bg-media overflow-hidden">
            <Image
              src={`/images/categories/${c.slug}.jpg`}
              alt=""
              fill
              sizes="(max-width: 1024px) 40vw, 14vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
          </span>
          <span className="flex items-center justify-between gap-2 px-3.5 py-3">
            <span className="min-w-0">
              <span className="block text-[14px] font-medium leading-tight">{c.name}</span>
              <span className="block text-[12px] text-text-3">{counts[c.slug] || 0} items</span>
            </span>
            <span className="grid place-items-center w-7 h-7 shrink-0 rounded-full border border-border text-text-2 transition-colors group-hover:bg-accent group-hover:border-accent group-hover:text-on-accent">
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}
