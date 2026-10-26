"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, MapPin, Package } from "lucide-react";

const tabs = [
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
];

export default function AccountNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 border-b border-border overflow-x-auto no-scrollbar" aria-label="Account">
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`relative inline-flex items-center gap-2 px-4 h-11 text-sm font-medium whitespace-nowrap transition ${
              active ? "text-text" : "text-text-3 hover:text-text"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {active && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-[image:var(--accent-grad)]" />}
          </Link>
        );
      })}
    </nav>
  );
}
