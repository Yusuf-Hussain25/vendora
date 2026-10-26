"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, ShoppingBag } from "lucide-react";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useCart } from "@/components/providers/CartProvider";
import AccountMenu from "./AccountMenu";
import SearchBar from "./SearchBar";

const links = [
  { href: "/shop", label: "Shop" },
  { href: "/deals", label: "Flash deals" },
  { href: "/stores", label: "Stores" },
  { href: "/sell", label: "Sell" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-40 glass !border-x-0 !border-t-0">
      <div className="container-x flex items-center gap-3 lg:gap-6 h-16">
        <Logo />
        <nav className="hidden lg:flex items-center gap-1" aria-label="Main">
          {links.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`px-3.5 h-9 inline-flex items-center rounded-full text-sm font-medium transition ${
                  active ? "bg-surface-2 text-text" : "text-text-2 hover:text-text hover:bg-surface"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <Suspense fallback={<div className="hidden md:block flex-1" />}>
          <SearchBar className="hidden md:block flex-1 max-w-xl ml-auto" />
        </Suspense>
        <div className="flex items-center gap-1 ml-auto md:ml-0">
          <ThemeToggle />
          <Link href="/account/wishlist" className="btn btn-ghost btn-icon hidden sm:inline-flex" aria-label="Wishlist">
            <Heart />
          </Link>
          <Link href="/cart" className="btn btn-ghost btn-icon relative" aria-label={`Cart, ${count} items`}>
            <ShoppingBag />
            {count > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10.5px] font-bold grid place-items-center text-white bg-[image:var(--accent-grad)] ring-2 ring-bg">
                {count}
              </span>
            )}
          </Link>
          <div className="ml-1">
            <AccountMenu />
          </div>
        </div>
      </div>
      <div className="container-x pb-3 md:hidden">
        <Suspense fallback={<div className="h-11" />}>
          <SearchBar />
        </Suspense>
      </div>
    </header>
  );
}
