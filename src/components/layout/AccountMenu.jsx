"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bike, Heart, LayoutDashboard, LogOut, MapPin, Package, ShieldCheck, Store } from "lucide-react";
import { toast } from "sonner";
import { signOut } from "@/lib/auth-client";
import { useUser } from "@/components/providers/UserProvider";
import Avatar from "@/components/ui/Avatar";

export default function AccountMenu() {
  const user = useUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) {
    return (
      <Link href="/login" className="btn btn-primary btn-sm">
        Log in
      </Link>
    );
  }

  const logout = async () => {
    setOpen(false);
    await signOut();
    toast.success("You're logged out");
    router.push("/");
    router.refresh();
  };

  const items = [
    { href: "/account/orders", label: "My orders", icon: Package },
    { href: "/account/wishlist", label: "Wishlist", icon: Heart },
    { href: "/account/addresses", label: "Addresses", icon: MapPin },
  ];
  if (user.isSeller) items.push({ href: "/seller", label: "Seller dashboard", icon: LayoutDashboard });
  else items.push({ href: "/sell", label: user.store ? "Store application" : "Sell on Vendora", icon: Store });
  if (user.role === "ADMIN") items.push({ href: "/admin", label: "Admin console", icon: ShieldCheck });
  if (user.role === "RIDER") items.push({ href: "/rider", label: "Rider app", icon: Bike });

  return (
    <div className="relative" ref={ref}>
      <button
        className="flex items-center rounded-full p-0.5 hover:ring-2 hover:ring-border-strong transition"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-expanded={open}
      >
        <Avatar src={user.image} name={user.name} size={34} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-[20px] bg-panel-solid border border-border shadow-lg p-2 fade-up z-50">
          <div className="px-3 py-2.5 mb-1">
            <p className="font-semibold truncate">{user.name}</p>
            <p className="text-xs text-text-3 truncate">{user.email}</p>
          </div>
          {items.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 h-10 rounded-[12px] text-sm text-text-2 hover:bg-surface-2 hover:text-text transition"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
          <div className="h-px bg-border my-1.5" />
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 h-10 rounded-[12px] text-sm text-text-2 hover:bg-surface-2 hover:text-text transition"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
