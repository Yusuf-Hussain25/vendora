"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgePercent,
  Boxes,
  Bike,
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  Menu,
  Package,
  Settings,
  ShieldCheck,
  Store,
  Users,
  X,
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Avatar from "@/components/ui/Avatar";

const NAV = {
  seller: [
    { href: "/seller", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/seller/products", label: "Products", icon: Package },
    { href: "/seller/inventory", label: "Inventory", icon: Boxes, badgeKey: "inventory" },
    { href: "/seller/orders", label: "Orders", icon: ClipboardList, badgeKey: "orders" },
    { href: "/seller/settings", label: "Store settings", icon: Settings },
  ],
  admin: [
    { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/admin/stores", label: "Stores", icon: Store, badgeKey: "stores" },
    { href: "/admin/orders", label: "Orders", icon: ClipboardList },
    { href: "/admin/inventory", label: "Inventory", icon: Boxes },
    { href: "/admin/riders", label: "Riders", icon: Bike },
    { href: "/admin/coupons", label: "Coupons", icon: BadgePercent },
    { href: "/admin/users", label: "Customers", icon: Users },
  ],
  rider: [{ href: "/rider", label: "Deliveries", icon: Bike, exact: true }],
};

const TITLES = { seller: "Seller hub", admin: "Admin console", rider: "Rider app" };
const ICONS = { seller: Store, admin: ShieldCheck, rider: Bike };

export default function DashboardShell({ area, user, subtitle, badges = {}, children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const AreaIcon = ICONS[area];

  const nav = (
    <nav className="space-y-1" aria-label={TITLES[area]}>
      {NAV[area].map(({ href, label, icon: Icon, exact, badgeKey }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        const badge = badgeKey ? badges[badgeKey] : 0;
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 px-3 h-11 rounded-[8px] text-sm font-medium transition ${
              active ? "bg-accent-soft text-accent-text" : "text-text-2 hover:bg-surface-2 hover:text-text"
            }`}
          >
            <Icon className="w-[18px] h-[18px]" />
            <span className="flex-1">{label}</span>
            {badge > 0 && <span className="badge badge-accent">{badge}</span>}
          </Link>
        );
      })}
    </nav>
  );

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="px-2">
        <Logo />
        <div className="mt-6 flex items-center gap-3 rounded-[10px] border border-border bg-surface p-3">
          <span className="grid place-items-center w-9 h-9 rounded-[12px] bg-accent text-on-accent">
            <AreaIcon className="w-[18px] h-[18px]" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{TITLES[area]}</p>
            {subtitle && <p className="text-xs text-text-3 truncate">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="mt-6 flex-1">{nav}</div>
      <div className="space-y-1 pt-4 border-t border-border">
        <Link href="/" className="flex items-center gap-3 px-3 h-10 rounded-[8px] text-sm text-text-2 hover:bg-surface-2 hover:text-text transition">
          <ExternalLink className="w-4 h-4" />
          Back to the store
        </Link>
        <div className="flex items-center gap-3 px-3 pt-3">
          <Avatar src={user.image} name={user.name} size={34} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-text-3 truncate">{user.email}</p>
          </div>
          <ThemeToggle className="btn-sm" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[270px_1fr]">
      <aside className="hidden lg:block sticky top-0 h-dvh p-5 border-r border-border glass !border-y-0 !border-l-0">{sidebar}</aside>

      <header className="lg:hidden sticky top-0 z-40 glass !border-x-0 !border-t-0 h-16 px-4 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button className="btn btn-ghost btn-icon" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}>
            <Menu />
          </button>
        </div>
      </header>

      {open && (
        <div className="lg:hidden fixed inset-0 z-[90]">
          <button className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-label="Close menu" />
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-[300px] bg-panel-solid border-r border-border p-5 fade-up">
            <button className="absolute top-4 right-4 btn btn-ghost btn-icon btn-sm" onClick={() => setOpen(false)} aria-label="Close menu">
              <X />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      <main className="min-w-0 px-4 sm:px-6 lg:px-10 py-6 lg:py-10 max-w-[1280px]">{children}</main>
    </div>
  );
}
