import Link from "next/link";
import { BadgeCheck, LockKeyhole, MapPinned, Truck } from "lucide-react";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { CATEGORIES } from "@/lib/catalog";
import { FREE_DELIVERY_OVER } from "@/lib/pricing";
import { money } from "@/lib/format";

const columns = [
  {
    title: "Shop",
    links: CATEGORIES.map((c) => ({ href: `/shop?category=${c.slug}`, label: c.name })),
  },
  {
    title: "Marketplace",
    links: [
      { href: "/deals", label: "Flash deals" },
      { href: "/stores", label: "All stores" },
      { href: "/shop?sort=newest", label: "New arrivals" },
      { href: "/shop?sort=popular", label: "Best sellers" },
    ],
  },
  {
    title: "Your account",
    links: [
      { href: "/account/orders", label: "Track an order" },
      { href: "/account/wishlist", label: "Wishlist" },
      { href: "/account/addresses", label: "Addresses" },
      { href: "/sell", label: "Sell on Vendora" },
    ],
  },
];

const promises = [
  [Truck, "Same-day delivery", `Free over ${money(FREE_DELIVERY_OVER)} per store`],
  [LockKeyhole, "Secure checkout", "Card or cash on delivery"],
  [BadgeCheck, "Verified local stores", "Every seller is reviewed"],
  [MapPinned, "Live order tracking", "Follow your rider on the map"],
];

export default function Footer() {
  return (
    <footer className="mt-20 sm:mt-28 border-t border-border">
      <div className="container-x grid grid-cols-2 lg:grid-cols-4 gap-6 py-10 border-b border-border">
        {promises.map(([Icon, title, text]) => (
          <div key={title} className="flex items-center gap-3.5">
            <span className="grid place-items-center w-11 h-11 rounded-full border border-border shrink-0">
              <Icon className="w-5 h-5 text-accent-text" strokeWidth={1.6} />
            </span>
            <span>
              <span className="block text-[14px] font-medium">{title}</span>
              <span className="block text-[12.5px] text-text-3">{text}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="container-x py-14 grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-[14px] text-text-2 leading-relaxed">
            Independent stores, one cart. Fashion, fresh groceries and everyday goods, delivered by local riders you can follow on the
            map.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="text-[13px] font-semibold uppercase tracking-[.12em]">{col.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-[14px] text-text-2 hover:text-text transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="container-x py-5 pb-24 lg:pb-5 flex flex-col sm:flex-row gap-3 sm:items-center justify-between text-[12.5px] text-text-3">
          <p>© {new Date().getFullYear()} Vendora. A portfolio project by Yusuf Hussain.</p>
          <div className="flex items-center gap-4">
            <p>Prices in {process.env.NEXT_PUBLIC_CURRENCY || "USD"} · payments in test mode</p>
            <ThemeToggle className="btn-sm" />
          </div>
        </div>
      </div>
    </footer>
  );
}
