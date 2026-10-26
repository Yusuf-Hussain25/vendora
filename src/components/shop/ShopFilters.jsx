"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, Star, X } from "lucide-react";
import { CATEGORIES, SORT_OPTIONS } from "@/lib/catalog";
import CategoryIcon from "@/components/ui/CategoryIcon";

// Filter state lives in the URL so results are shareable and survive refresh
function useFilterParams() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const update = (changes) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === undefined || value === "" || value === false) next.delete(key);
      else next.set(key, String(value));
    }
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  };

  return { params, update };
}

function PriceForm({ params, update, onDone }) {
  const [min, setMin] = useState(params.get("min") || "");
  const [max, setMax] = useState(params.get("max") || "");

  const apply = (e) => {
    e.preventDefault();
    update({ min: min || null, max: max || null });
    onDone?.();
  };

  return (
    <form onSubmit={apply} className="flex items-center gap-2">
      <input className="input !min-h-10 !h-10" inputMode="decimal" placeholder="Min" aria-label="Minimum price" value={min} onChange={(e) => setMin(e.target.value.replace(/[^\d.]/g, ""))} />
      <span className="text-text-3">–</span>
      <input className="input !min-h-10 !h-10" inputMode="decimal" placeholder="Max" aria-label="Maximum price" value={max} onChange={(e) => setMax(e.target.value.replace(/[^\d.]/g, ""))} />
      <button className="btn btn-secondary btn-sm shrink-0" type="submit">
        Go
      </button>
    </form>
  );
}

function FilterPanel({ subCategories, hideCategory, onDone }) {
  const { params, update } = useFilterParams();
  const category = params.get("category");
  const sub = params.get("sub");
  const rating = params.get("rating");

  return (
    <div className="space-y-7">
      {!hideCategory && (
        <section>
          <h3 className="text-sm font-semibold mb-3">Department</h3>
          <div className="space-y-1">
            <button
              onClick={() => update({ category: null, sub: null })}
              className={`w-full flex items-center gap-3 px-3 h-10 rounded-[12px] text-sm transition ${
                !category ? "bg-accent-soft text-accent-text font-medium" : "text-text-2 hover:bg-surface-2 hover:text-text"
              }`}
            >
              All departments
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.slug}
                onClick={() => update({ category: c.slug, sub: null })}
                className={`w-full flex items-center gap-3 px-3 h-10 rounded-[12px] text-sm transition ${
                  category === c.slug ? "bg-accent-soft text-accent-text font-medium" : "text-text-2 hover:bg-surface-2 hover:text-text"
                }`}
                aria-pressed={category === c.slug}
              >
                <CategoryIcon name={c.icon} className="w-4 h-4" />
                {c.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {subCategories.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold mb-3">Type</h3>
          <div className="flex flex-wrap gap-2">
            {subCategories.map((s) => (
              <button key={s.name} className="chip" data-active={sub === s.name} onClick={() => update({ sub: sub === s.name ? null : s.name })}>
                {s.name}
                <span className="text-text-3">{s.count}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="text-sm font-semibold mb-3">Price</h3>
        {/* Re-mount when the URL changes so "Clear all" also clears the inputs */}
        <PriceForm key={`${params.get("min")}-${params.get("max")}`} params={params} update={update} onDone={onDone} />
      </section>

      <section>
        <h3 className="text-sm font-semibold mb-3">Customer rating</h3>
        <div className="flex flex-wrap gap-2">
          {[4, 3].map((r) => (
            <button key={r} className="chip" data-active={rating === String(r)} onClick={() => update({ rating: rating === String(r) ? null : r })}>
              <Star className="fill-amber-400 text-amber-400" />
              {r} & up
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Availability</h3>
        <label className="flex items-center gap-3 text-sm text-text-2 cursor-pointer">
          <input type="checkbox" className="checkbox" checked={params.get("deals") === "1"} onChange={(e) => update({ deals: e.target.checked ? 1 : null })} />
          On flash deal
        </label>
        <label className="flex items-center gap-3 text-sm text-text-2 cursor-pointer">
          <input type="checkbox" className="checkbox" checked={params.get("instock") === "1"} onChange={(e) => update({ instock: e.target.checked ? 1 : null })} />
          In stock only
        </label>
      </section>
    </div>
  );
}

export function ShopSidebar(props) {
  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-24 card p-5">
        <FilterPanel {...props} />
      </div>
    </aside>
  );
}

export function ShopToolbar({ total, subCategories, hideCategory }) {
  const { params, update } = useFilterParams();
  const [open, setOpen] = useState(false);
  const sort = params.get("sort") || "featured";

  const active = [
    ["q", params.get("q") && `“${params.get("q")}”`],
    ["sub", params.get("sub")],
    ["min", params.get("min") && `From ${params.get("min")}`],
    ["max", params.get("max") && `Up to ${params.get("max")}`],
    ["rating", params.get("rating") && `${params.get("rating")}★ & up`],
    ["deals", params.get("deals") && "Flash deals"],
    ["instock", params.get("instock") && "In stock"],
  ].filter(([, label]) => label);

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-text-2">
          <span className="font-semibold text-text">{total}</span> {total === 1 ? "product" : "products"}
        </p>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary btn-sm lg:hidden" onClick={() => setOpen(true)}>
            <SlidersHorizontal />
            Filters
          </button>
          <label className="sr-only" htmlFor="sort">
            Sort by
          </label>
          <select id="sort" className="select !min-h-[34px] !h-[34px] !py-0 !rounded-full !text-[13px] !w-auto" value={sort} onChange={(e) => update({ sort: e.target.value === "featured" ? null : e.target.value })}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {active.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {active.map(([key, label]) => (
            <button key={key} className="chip" data-active="true" onClick={() => update({ [key]: null })} aria-label={`Remove filter ${label}`}>
              {label}
              <X />
            </button>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={() => update(Object.fromEntries(active.map(([k]) => [k, null])))}>
            Clear all
          </button>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <button className="absolute inset-0 bg-black/40" aria-label="Close filters" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-[14px] bg-panel-solid border-t border-border p-6 fade-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setOpen(false)} aria-label="Close filters">
                <X />
              </button>
            </div>
            <FilterPanel subCategories={subCategories} hideCategory={hideCategory} onDone={() => setOpen(false)} />
            <button className="btn btn-primary btn-block mt-8" onClick={() => setOpen(false)}>
              Show {total} results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
