"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ShoppingBag, User, Zap } from "lucide-react";
import { useCart } from "@/components/providers/CartProvider";
import { useUser } from "@/components/providers/UserProvider";

export default function MobileTabBar() {
  const pathname = usePathname();
  const { count } = useCart();
  const user = useUser();

  const tabs = [
    { href: "/", label: "Home", icon: Home, match: (p) => p === "/" },
    { href: "/shop", label: "Shop", icon: LayoutGrid, match: (p) => p.startsWith("/shop") || p.startsWith("/product") },
    { href: "/deals", label: "Deals", icon: Zap, match: (p) => p.startsWith("/deals") },
    { href: "/cart", label: "Cart", icon: ShoppingBag, match: (p) => p.startsWith("/cart") || p.startsWith("/checkout"), badge: count },
    {
      href: user ? "/account/orders" : "/login",
      label: user ? "Account" : "Log in",
      icon: User,
      match: (p) => p.startsWith("/account") || p.startsWith("/login"),
    },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 glass !bg-panel-solid !border-x-0 !border-b-0 pb-[env(safe-area-inset-bottom)]"
      aria-label="Quick navigation"
    >
      <div className="grid grid-cols-5 h-16">
        {tabs.map(({ href, label, icon: Icon, match, badge }) => {
          const active = match(pathname);
          return (
            <Link
              key={label}
              href={href}
              className={`relative flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition ${
                active ? "text-accent-text" : "text-text-3 hover:text-text"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <span className="relative">
                <Icon className="w-[22px] h-[22px]" strokeWidth={active ? 2.2 : 1.8} />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full text-[10px] font-bold grid place-items-center bg-accent text-on-accent">
                    {badge}
                  </span>
                )}
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
