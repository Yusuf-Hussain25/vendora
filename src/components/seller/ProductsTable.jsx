"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, PackageOpen, Pencil, Search, Star, Timer, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";
import { deleteProduct, endFlashDeal, setProductActive, setProductStock, startFlashDeal } from "@/actions/seller";
import { isDealLive } from "@/lib/pricing";
import { money } from "@/lib/format";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import DealCountdown from "@/components/product/DealCountdown";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "active", label: "Live" },
  { value: "hidden", label: "Hidden" },
  { value: "low", label: "Low stock" },
  { value: "deal", label: "On deal" },
];

function StockInput({ product, onSaved }) {
  const [value, setValue] = useState(String(product.stock));
  const save = async () => {
    if (value === String(product.stock)) return;
    const result = await setProductStock(product.id, value);
    if (result.error) {
      toast.error(result.error);
      setValue(String(product.stock));
    } else {
      toast.success(`Stock updated to ${value}`);
      onSaved();
    }
  };
  return (
    <input
      className={`input !min-h-9 !h-9 !w-20 !px-2.5 text-center ${product.stock <= 5 ? "!border-warning/50" : ""}`}
      inputMode="numeric"
      aria-label={`Stock for ${product.name}`}
      value={value}
      onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
      onBlur={save}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
    />
  );
}

export default function ProductsTable({ products }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [dealFor, setDealFor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [percent, setPercent] = useState(20);
  const [hours, setHours] = useState(12);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (filter === "active") return p.isActive;
      if (filter === "hidden") return !p.isActive;
      if (filter === "low") return p.stock <= 5;
      if (filter === "deal") return isDealLive(p);
      return true;
    });
  }, [products, query, filter]);

  const run = async (action, message) => {
    setBusy(true);
    const result = await action();
    setBusy(false);
    if (result.error) {
      toast.error(result.error);
      return false;
    }
    toast.success(typeof message === "function" ? message(result) : message);
    router.refresh();
    return true;
  };

  if (!products.length) {
    return (
      <EmptyState
        icon={PackageOpen}
        title="List your first product"
        action={
          <Link href="/seller/products/new" className="btn btn-primary">
            Add product
          </Link>
        }
      >
        Add photos, a price and stock. The AI assistant can write the description for you.
      </EmptyState>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3 pointer-events-none" />
          <input className="input !pl-10 !min-h-10 !h-10 !rounded-full" placeholder="Search your products" aria-label="Search products" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button key={f.value} className="chip" data-active={filter === f.value} onClick={() => setFilter(f.value)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="text-left text-xs text-text-3 border-b border-border">
                <th className="font-medium px-5 py-3">Product</th>
                <th className="font-medium px-3 py-3">Price</th>
                <th className="font-medium px-3 py-3">Stock</th>
                <th className="font-medium px-3 py-3">Sales</th>
                <th className="font-medium px-3 py-3">Status</th>
                <th className="font-medium px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {shown.map((p) => {
                const deal = isDealLive(p);
                return (
                  <tr key={p.id} className="hover:bg-surface transition">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="relative w-12 h-12 rounded-[12px] bg-surface-2 shrink-0">
                          <Image src={p.images[0]} alt="" fill sizes="48px" className="object-contain p-1" />
                        </span>
                        <div className="min-w-0">
                          <Link href={`/product/${p.id}`} className="font-medium hover:text-accent-text transition line-clamp-1">
                            {p.name}
                          </Link>
                          <p className="text-xs text-text-3">{p.subCategory || p.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {deal ? (
                        <>
                          <p className="font-semibold text-deal">{money(p.dealPrice)}</p>
                          <p className="text-xs text-text-3 flex items-center gap-1">
                            <Timer className="w-3 h-3" />
                            <DealCountdown endsAt={p.dealEndsAt} />
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold">{money(p.price)}</p>
                          {p.mrp > p.price && <p className="text-xs text-text-3 line-through">{money(p.mrp)}</p>}
                        </>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <StockInput key={p.stock} product={p} onSaved={() => router.refresh()} />
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <p>{p.soldCount} sold</p>
                      <p className="text-xs text-text-3 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {p.ratingCount ? `${p.ratingAvg.toFixed(1)} (${p.ratingCount})` : "No reviews"}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`badge ${p.isActive ? "badge-success" : ""}`}>{p.isActive ? "Live" : "Hidden"}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          className={`btn btn-ghost btn-icon btn-sm ${deal ? "!text-deal" : ""}`}
                          title={deal ? "End flash deal" : "Start a flash deal"}
                          aria-label={deal ? `End flash deal on ${p.name}` : `Start a flash deal on ${p.name}`}
                          disabled={busy}
                          onClick={() => (deal ? run(() => endFlashDeal(p.id), "Flash deal ended") : setDealFor(p))}
                        >
                          <Zap className={deal ? "fill-current" : ""} />
                        </button>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          title={p.isActive ? "Hide from shoppers" : "Show to shoppers"}
                          aria-label={p.isActive ? `Hide ${p.name}` : `Show ${p.name}`}
                          disabled={busy}
                          onClick={() => run(() => setProductActive(p.id, !p.isActive), p.isActive ? "Hidden from the store" : "Live in the store")}
                        >
                          {p.isActive ? <EyeOff /> : <Eye />}
                        </button>
                        <Link href={`/seller/products/${p.id}`} className="btn btn-ghost btn-icon btn-sm" title="Edit" aria-label={`Edit ${p.name}`}>
                          <Pencil />
                        </Link>
                        <button className="btn btn-ghost btn-icon btn-sm !text-danger" title="Delete" aria-label={`Delete ${p.name}`} disabled={busy} onClick={() => setDeleting(p)}>
                          <Trash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!shown.length && <p className="p-8 text-center text-sm text-text-2">No products match.</p>}
      </div>

      <Modal open={Boolean(dealFor)} onClose={() => setDealFor(null)} title="Start a flash deal" description={dealFor?.name} size="sm">
        {dealFor && (
          <div className="space-y-5">
            <div>
              <label className="label" htmlFor="deal-percent">
                Discount: {percent}% off
              </label>
              <input id="deal-percent" type="range" min={5} max={70} step={5} value={percent} onChange={(e) => setPercent(Number(e.target.value))} className="w-full accent-[var(--accent)]" />
              <p className="mt-1 text-sm text-text-2">
                {money(dealFor.price)} → <span className="font-semibold text-deal">{money(dealFor.price * (1 - percent / 100))}</span>
              </p>
            </div>
            <div>
              <p className="label">Runs for</p>
              <div className="segmented">
                {[3, 6, 12, 24, 48].map((h) => (
                  <button key={h} type="button" aria-pressed={hours === h} onClick={() => setHours(h)}>
                    {h}h
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn btn-ghost" onClick={() => setDealFor(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={busy}
                onClick={async () => (await run(() => startFlashDeal(dealFor.id, percent, hours), "Flash deal is live")) && setDealFor(null)}
              >
                {busy ? <span className="spinner" /> : <Zap />}
                Start deal
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(deleting)} onClose={() => setDeleting(null)} title="Delete this product?" description={deleting?.name} size="sm">
        <p className="text-sm text-text-2">If it has been ordered before, it&apos;s hidden instead so past orders stay intact.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={() => setDeleting(null)}>
            Keep it
          </button>
          <button
            className="btn btn-danger"
            disabled={busy}
            onClick={async () =>
              (await run(() => deleteProduct(deleting.id), (r) => (r.archived ? "Hidden, since it has past orders" : "Product deleted"))) && setDeleting(null)
            }
          >
            {busy && <span className="spinner" />}
            Delete
          </button>
        </div>
      </Modal>
    </>
  );
}
