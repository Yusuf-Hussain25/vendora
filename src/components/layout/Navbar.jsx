"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, ShoppingBag, X } from "lucide-react";
import { CATEGORIES } from "@/lib/catalog";
import Logo from "@/components/ui/Logo";
import { useCart } from "@/components/providers/CartProvider";
import AccountMenu from "./AccountMenu";
import SearchBar from "./SearchBar";
import CategoriesMenu from "./CategoriesMenu";
import DeliverTo from "./DeliverTo";

const links = [
  { href: "/shop", label: "Shop" },
  { href: "/deals", label: "Flash Deals" },
  { href: "/stores", label: "Stores" },
];

export default function Navbar({ categoryCounts, addresses, signedIn }) {
  const pathname = usePathname();
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-bg border-b border-border">
      <div className="container-x flex items-center gap-2 lg:gap-6 h-[68px]">
        <button className="btn btn-ghost btn-icon lg:hidden -ml-2" onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen}>
          <Menu />
        </button>
        <Logo />
        <nav className="hidden lg:flex items-center" aria-label="Main">
          {links.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative h-9 px-3 inline-flex items-center text-sm transition ${active ? "text-text font-medium" : "text-text-2 hover:text-text"}`}
              >
                {label}
                {active && <span className="absolute left-3 right-3 -bottom-[16px] h-[2px] bg-accent" />}
              </Link>
            );
          })}
          <CategoriesMenu counts={categoryCounts} />
        </nav>
        <Suspense fallback={<div className="hidden md:block flex-1" />}>
          <SearchBar className="hidden md:block flex-1 max-w-[460px] ml-auto" />
        </Suspense>
        <div className="flex items-center gap-0.5 ml-auto md:ml-0">
          <div className="hidden xl:block">
            <DeliverTo addresses={addresses} signedIn={signedIn} />
          </div>
          <Link href="/account/wishlist" className="btn btn-ghost btn-icon hidden sm:inline-flex" aria-label="Wishlist">
            <Heart />
          </Link>
          <Link href="/cart" className="btn btn-ghost btn-icon relative" aria-label={`Cart, ${count} items`}>
            <ShoppingBag />
            {count > 0 && (
              <span className="absolute top-1 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10.5px] font-semibold grid place-items-center bg-accent text-on-accent">
                {count}
              </span>
            )}
          </Link>
          <div className="ml-1.5">
            <AccountMenu />
          </div>
        </div>
      </div>
      <div className="container-x pb-3 md:hidden">
        <Suspense fallback={<div className="h-11" />}>
          <SearchBar />
        </Suspense>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <button className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} aria-label="Close menu" />
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-[340px] bg-bg border-r border-border flex flex-col fade-up">
            <div className="flex items-center justify-between h-[68px] px-4 border-b border-border">
              <Logo />
              <button className="btn btn-ghost btn-icon" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                <X />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <nav className="space-y-0.5" aria-label="Mobile">
                {[...links, { href: "/sell", label: "Sell on Vendora" }].map(({ href, label }) => (
                  <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="flex items-center h-11 px-2 text-[15px] font-medium rounded-md hover:bg-surface-2">
                    {label}
                  </Link>
                ))}
              </nav>
              <p className="eyebrow mt-6 mb-2 px-2">Categories</p>
              <ul className="space-y-0.5">
                {CATEGORIES.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/shop?category=${c.slug}`} onClick={() => setMenuOpen(false)} className="flex items-center justify-between h-11 px-2 rounded-md hover:bg-surface-2 text-[15px]">
                      {c.name}
                      <span className="text-xs text-text-3">{categoryCounts?.[c.slug] || 0}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-6 border-t border-border pt-4">
                <DeliverTo addresses={addresses} signedIn={signedIn} />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
