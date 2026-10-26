import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { CATEGORIES } from "@/lib/catalog";

const columns = [
  {
    title: "Shop",
    links: CATEGORIES.slice(0, 5).map((c) => ({ href: `/shop?category=${c.slug}`, label: c.name })),
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
    title: "Account",
    links: [
      { href: "/account/orders", label: "Track an order" },
      { href: "/account/wishlist", label: "Wishlist" },
      { href: "/sell", label: "Open a store" },
      { href: "/login", label: "Log in" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="container-x py-14 grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-sm text-text-2 leading-relaxed">
            Independent stores, one cart. Fashion, fresh groceries and everyday goods delivered by local riders you can
            follow on the map.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold">{col.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-text-2 hover:text-text transition">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="container-x py-6 pb-24 lg:pb-6 flex flex-col sm:flex-row gap-2 justify-between text-xs text-text-3">
          <p>© {new Date().getFullYear()} Vendora. A portfolio project by Yusuf Hussain.</p>
          <p>Prices shown in {process.env.NEXT_PUBLIC_CURRENCY || "USD"}. Payments in test mode.</p>
        </div>
      </div>
    </footer>
  );
}
