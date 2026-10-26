"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export default function SearchBar({ className = "", autoFocus = false }) {
  const router = useRouter();
  const params = useSearchParams();

  const submit = (e) => {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q")?.toString().trim();
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
  };

  return (
    <form onSubmit={submit} role="search" className={`relative ${className}`}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-2 pointer-events-none" />
      <input
        // Re-mount when the URL query changes so the box shows the current search
        key={params.get("q") || ""}
        name="q"
        type="search"
        defaultValue={params.get("q") || ""}
        placeholder="Search products, brands and local stores"
        aria-label="Search products"
        autoFocus={autoFocus}
        className="input !rounded-full !pl-11 !h-11 !min-h-0 !bg-surface-2 !border-transparent focus:!border-accent focus:!bg-panel"
      />
    </form>
  );
}
