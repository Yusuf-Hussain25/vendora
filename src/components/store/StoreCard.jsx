import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Package, Star } from "lucide-react";
import { numberCompact } from "@/lib/format";

export default function StoreCard({ store }) {
  return (
    <Link
      href={`/store/${store.username}`}
      className="group card overflow-hidden flex flex-col transition duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-border-strong"
    >
      <div className="relative h-28 bg-surface-2">
        {store.banner && (
          <Image src={store.banner} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>
      <div className="px-5 pb-5 -mt-8 relative flex-1 flex flex-col">
        <Image
          src={store.logo}
          alt={`${store.name} logo`}
          width={64}
          height={64}
          className="w-16 h-16 rounded-full ring-4 ring-panel object-cover bg-surface-2"
        />
        <h3 className="mt-3 font-semibold flex items-center gap-1.5">
          {store.name}
          <BadgeCheck className="w-4 h-4 text-accent-text" aria-label="Verified store" />
        </h3>
        <p className="mt-1 text-sm text-text-2 line-clamp-2">{store.tagline}</p>
        <div className="mt-auto pt-4 flex items-center gap-4 text-xs text-text-3">
          <span className="inline-flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-text-2 font-medium">{store.rating ? store.rating.toFixed(1) : "New"}</span>
            {store.reviews > 0 && `(${store.reviews})`}
          </span>
          <span className="inline-flex items-center gap-1">
            <Package className="w-3.5 h-3.5" />
            {store.productCount} products
          </span>
          {store.sold > 0 && <span>{numberCompact(store.sold)} sold</span>}
        </div>
      </div>
    </Link>
  );
}
