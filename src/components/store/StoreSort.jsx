"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SORT_OPTIONS } from "@/lib/catalog";

export default function StoreSort() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const change = (value) => {
    const next = new URLSearchParams();
    if (value !== "featured") next.set("sort", value);
    router.push(next.size ? `${pathname}?${next}` : pathname, { scroll: false });
  };

  return (
    <select
      aria-label="Sort products"
      className="select !min-h-[34px] !h-[34px] !py-0 !rounded-full !text-[13px] !w-auto"
      value={params.get("sort") || "featured"}
      onChange={(e) => change(e.target.value)}
    >
      {SORT_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
