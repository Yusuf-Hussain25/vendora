import Image from "next/image";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { categoryBySlug } from "@/lib/catalog";

export default function StoreRow({ stores }) {
  return (
    <ul className="-mx-4 sm:mx-0 px-4 sm:px-0 flex lg:grid lg:grid-cols-4 gap-3 overflow-x-auto no-scrollbar snap-x">
      {stores.map((s) => (
        <li key={s.id} className="snap-start shrink-0 w-[72%] sm:w-[44%] lg:w-auto">
          <Link href={`/store/${s.username}`} className="group flex items-center gap-4 p-4 bg-panel border border-border rounded-lg transition-colors hover:border-border-strong">
            <Image src={s.logo} alt={`${s.name} logo`} width={56} height={56} className="w-14 h-14 rounded-full object-cover shrink-0" />
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-[15px] font-medium">
                <span className="truncate">{s.name}</span>
                <BadgeCheck className="w-4 h-4 text-accent-text shrink-0" aria-label="Verified store" />
              </span>
              <span className="block text-[13px] text-text-3">
                {categoryBySlug(s.mainCategory)?.name || "Marketplace"} · {s.productCount} products
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
