"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Boxes,
  CircleSlash,
  ClipboardCheck,
  Download,
  History,
  IndianRupee,
  PackageCheck,
  PackagePlus,
  Search,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { applyStockCount, getStockHistory, restockProducts, setReorderLevel } from "@/actions/inventory";
import { CATEGORIES, categoryBySlug } from "@/lib/catalog";
import { dateTime, money, moneyCompact, timeAgo } from "@/lib/format";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";

const STATUS = {
  ok: { label: "In stock", badge: "badge-success" },
  low: { label: "Low stock", badge: "badge-warning" },
  out: { label: "Out of stock", badge: "badge-danger" },
  slow: { label: "Slow mover", badge: "badge-info" },
  hidden: { label: "Hidden", badge: "" },
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "ok", label: "In stock" },
  { value: "low", label: "Low stock" },
  { value: "out", label: "Out of stock" },
  { value: "slow", label: "Slow movers" },
  { value: "hidden", label: "Hidden" },
];

const REASONS = {
  INITIAL: ["Opening stock", ""],
  SALE: ["Sold", "badge-info"],
  CANCEL: ["Returned to stock", "badge-success"],
  RESTOCK: ["Restocked", "badge-success"],
  COUNT: ["Stock count", "badge-warning"],
  ADJUST: ["Edited", ""],
};

const COLUMNS = [
  ["name", "Product"],
  ["category", "Category"],
  ["price", "Price"],
  ["stock", "In system"],
  ["status", "Status"],
  ["sold30", "Sold 30d"],
  ["daysLeft", "Days left"],
  ["reorderLevel", "Alert at"],
];

const STATUS_ORDER = { out: 0, low: 1, slow: 2, ok: 3, hidden: 4 };

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function parseCsv(text) {
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cells = [];
    let cur = "";
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (quoted && ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') quoted = !quoted;
      else if (ch === "," && !quoted) {
        cells.push(cur);
        cur = "";
      } else cur += ch;
    }
    cells.push(cur);
    rows.push(cells.map((c) => c.trim()));
  }
  return rows;
}

function Summary({ summary }) {
  const cards = [
    [Boxes, "Products", summary.total, `${summary.units.toLocaleString("en-IN")} units on hand`],
    [PackageCheck, "In stock", summary.inStock, summary.slow ? `Plus ${summary.slow} slow ${summary.slow === 1 ? "mover" : "movers"}` : "Selling normally"],
    [AlertTriangle, "Low stock", summary.low, "At or below the alert level", "text-warning"],
    [CircleSlash, "Out of stock", summary.out, summary.hidden ? `${summary.hidden} hidden from shoppers` : "Can't be ordered", "text-danger"],
    [IndianRupee, "Stock value", moneyCompact(summary.value), "At selling price"],
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {cards.map(([Icon, label, value, hint, tone], i) => (
        // The odd fifth card spans the full row on phones instead of sitting alone
        <div key={label} className={`card p-4 ${i === cards.length - 1 ? "col-span-2 lg:col-span-1" : ""}`}>
          <div className="flex items-center justify-between text-sm text-text-2">
            {label}
            <Icon className={`w-[18px] h-[18px] ${tone || "text-accent-text"}`} strokeWidth={1.7} />
          </div>
          <p className={`mt-2 text-[26px] font-semibold tracking-tight ${tone || ""}`}>{value}</p>
          <p className="text-xs text-text-3 mt-0.5">{hint}</p>
        </div>
      ))}
    </div>
  );
}

export default function InventoryView({ rows, summary, readOnly = false, showStore = false }) {
  const router = useRouter();
  const fileRef = useRef(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState({ key: "status", dir: "asc" });
  const [selected, setSelected] = useState(() => new Set());
  const [counting, setCounting] = useState(false);
  const [counts, setCounts] = useState({});
  const [restock, setRestock] = useState(null); // [{ id, name, qty }]
  const [restockNote, setRestockNote] = useState("");
  const [history, setHistory] = useState(null);
  const [busy, setBusy] = useState(false);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (category && r.category !== category) return false;
      if (q && !`${r.name} ${r.sku || ""} ${r.subCategory || ""} ${r.store?.name || ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
    const value = (r) => {
      if (sort.key === "status") return STATUS_ORDER[r.status] * 1e6 + (r.daysLeft ?? 999999);
      if (sort.key === "daysLeft") return r.daysLeft ?? Infinity;
      if (sort.key === "category") return categoryBySlug(r.category)?.name || r.category;
      return r[sort.key];
    };
    return [...list].sort((a, b) => {
      const x = value(a);
      const y = value(b);
      const cmp = typeof x === "string" ? x.localeCompare(y) : x - y;
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [rows, query, filter, category, sort]);

  const countLines = Object.entries(counts).filter(([, v]) => v !== "");
  const diffs = countLines
    .map(([id, v]) => ({ id, change: Number(v) - (rows.find((r) => r.id === id)?.stock ?? 0) }))
    .filter((d) => d.change !== 0);

  const toggleSort = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  const toggleRow = (id) =>
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allShownSelected = shown.length > 0 && shown.every((r) => selected.has(r.id));

  const exportCsv = () => {
    const header = ["SKU", "Product", ...(showStore ? ["Store"] : []), "Category", "Type", "Price (INR)", "In system", "Counted", "Status", "Sold (30 days)", "Days left", "Alert at", "What to do"];
    const lines = shown.map((r) =>
      [r.sku, r.name, ...(showStore ? [r.store.name] : []), categoryBySlug(r.category)?.name, r.subCategory, r.price, r.stock, "", STATUS[r.status].label, r.sold30, r.daysLeft ?? "", r.reorderLevel, r.action.label]
        .map(csvEscape)
        .join(",")
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vendora-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${shown.length} products`);
  };

  // Import a sheet with SKU and Counted columns (e.g. the export, filled in after a shelf count)
  const importCsv = async (file) => {
    if (!file) return;
    const rowsIn = parseCsv(await file.text());
    if (rowsIn.length < 2) return toast.error("That file has no rows.");
    const head = rowsIn[0].map((h) => h.toLowerCase());
    const skuCol = head.indexOf("sku");
    const countCol = head.findIndex((h) => h === "counted" || h === "count");
    if (skuCol < 0 || countCol < 0) return toast.error("The sheet needs 'SKU' and 'Counted' columns.");
    const bySku = Object.fromEntries(rows.map((r) => [String(r.sku).toUpperCase(), r.id]));
    const next = {};
    let unmatched = 0;
    for (const line of rowsIn.slice(1)) {
      const value = line[countCol];
      if (value === "" || value == null) continue;
      const id = bySku[String(line[skuCol]).toUpperCase()];
      if (!id) {
        unmatched += 1;
        continue;
      }
      next[id] = String(Math.max(0, Math.floor(Number(value)) || 0));
    }
    setCounts(next);
    setCounting(true);
    if (fileRef.current) fileRef.current.value = "";
    toast.success(`Loaded ${Object.keys(next).length} counts${unmatched ? `, ${unmatched} SKUs not found` : ""}. Review the differences, then apply.`);
  };

  const applyCount = async () => {
    setBusy(true);
    const result = await applyStockCount(countLines.map(([id, counted]) => ({ id, counted })));
    setBusy(false);
    if (result.error) return toast.error(result.error);
    toast.success(result.adjusted ? `Count applied: ${result.adjusted} products corrected (net ${result.net > 0 ? "+" : ""}${result.net} units)` : "Everything matched. No changes needed.");
    setCounts({});
    setCounting(false);
    router.refresh();
  };

  const openRestock = (list) => {
    setRestockNote("");
    setRestock(list.map((r) => ({ id: r.id, name: r.name, qty: String(r.action.kind === "restock" ? r.action.qty : Math.max(r.reorderLevel * 2, 10)) })));
  };

  const submitRestock = async () => {
    setBusy(true);
    const result = await restockProducts(restock.map((r) => ({ id: r.id, qty: r.qty })), restockNote);
    setBusy(false);
    if (result.error) return toast.error(result.error);
    toast.success(`Restocked ${result.count} ${result.count === 1 ? "product" : "products"} (+${result.units} units)`);
    setRestock(null);
    setSelected(new Set());
    router.refresh();
  };

  const saveLevel = async (row, value) => {
    if (String(row.reorderLevel) === value) return;
    const result = await setReorderLevel(row.id, value);
    if (result.error) return toast.error(result.error);
    toast.success(`Alert level for ${row.name} set to ${value}`);
    router.refresh();
  };

  const openHistory = async (row) => {
    setHistory({ row, loading: true });
    const result = await getStockHistory(row.id);
    if (result.error) {
      toast.error(result.error);
      setHistory(null);
      return;
    }
    setHistory({ row, movements: result.movements });
  };

  if (!rows.length) {
    return (
      <EmptyState icon={Boxes} title="No products yet">
        Products appear here with their stock as soon as they&apos;re listed.
      </EmptyState>
    );
  }

  return (
    <div className="space-y-6">
      <Summary summary={summary} />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3 pointer-events-none" />
          <input className="input !pl-10 !min-h-10 !h-10 !rounded-full" placeholder="Search name or SKU" aria-label="Search inventory" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className="select !min-h-10 !h-10 !w-auto !rounded-full !text-[13px]" aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-2 ml-auto">
          <button className="btn btn-secondary btn-sm" onClick={exportCsv}>
            <Download />
            Export CSV
          </button>
          {!readOnly && (
            <>
              <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => importCsv(e.target.files?.[0])} />
              <button className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>
                <Upload />
                Import counts
              </button>
              <button className={`btn btn-sm ${counting ? "btn-secondary" : "btn-primary"}`} onClick={() => (counting ? (setCounting(false), setCounts({})) : setCounting(true))}>
                {counting ? <X /> : <ClipboardCheck />}
                {counting ? "Cancel count" : "Start stock count"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const n = f.value === "all" ? rows.length : rows.filter((r) => r.status === f.value).length;
          return (
            <button key={f.value} className="chip" data-active={filter === f.value} onClick={() => setFilter(f.value)}>
              {f.label}
              <span className="text-text-3">{n}</span>
            </button>
          );
        })}
      </div>

      {counting && (
        <div className="rounded-lg border border-accent/30 bg-accent-soft px-4 py-3 text-sm">
          <strong>Stock count mode.</strong> Type what is physically on the shelf in the <em>Counted</em> column. Differences from the system appear in
          red or green. Nothing changes until you press <strong>Apply count</strong>.
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1080px]">
            <thead>
              <tr className="text-left text-xs text-text-3 border-b border-border bg-surface">
                {!readOnly && (
                  <th className="pl-4 pr-1 py-3 w-8">
                    <input
                      type="checkbox"
                      className="checkbox"
                      aria-label="Select all shown products"
                      checked={allShownSelected}
                      onChange={() => setSelected(allShownSelected ? new Set() : new Set(shown.map((r) => r.id)))}
                    />
                  </th>
                )}
                {COLUMNS.slice(0, 1).map(([key, label]) => (
                  <th key={key} className="font-medium px-3 py-3">
                    <SortButton label={label} active={sort.key === key} dir={sort.dir} onClick={() => toggleSort(key)} />
                  </th>
                ))}
                {showStore && <th className="font-medium px-3 py-3">Store</th>}
                {COLUMNS.slice(1, 4).map(([key, label]) => (
                  <th key={key} className={`font-medium px-3 py-3 whitespace-nowrap ${key === "category" ? "" : "text-right"}`}>
                    <SortButton label={label} active={sort.key === key} dir={sort.dir} onClick={() => toggleSort(key)} />
                  </th>
                ))}
                {counting && (
                  <>
                    <th className="font-medium px-3 py-3 text-right text-accent-text">Counted</th>
                    <th className="font-medium px-3 py-3 text-right text-accent-text">Difference</th>
                  </>
                )}
                {COLUMNS.slice(4).map(([key, label]) => (
                  <th key={key} className={`font-medium px-3 py-3 whitespace-nowrap ${key === "status" ? "" : "text-right"}`}>
                    <SortButton label={label} active={sort.key === key} dir={sort.dir} onClick={() => toggleSort(key)} />
                  </th>
                ))}
                <th className="font-medium px-3 py-3">What to do</th>
                <th className="px-3 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {shown.map((r) => {
                const counted = counts[r.id] ?? "";
                const diff = counted === "" ? null : Number(counted) - r.stock;
                return (
                  <tr key={r.id} className={`transition-colors ${selected.has(r.id) ? "bg-accent-soft" : "hover:bg-surface"}`}>
                    {!readOnly && (
                      <td className="pl-4 pr-1 py-2.5">
                        <input type="checkbox" className="checkbox" aria-label={`Select ${r.name}`} checked={selected.has(r.id)} onChange={() => toggleRow(r.id)} />
                      </td>
                    )}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-3 min-w-[220px]">
                        <span className="relative w-10 h-10 rounded-md bg-media shrink-0 overflow-hidden">
                          <Image src={r.images[0]} alt="" fill sizes="40px" className="object-contain p-1 blend-media" />
                        </span>
                        <span className="min-w-0">
                          <Link href={`/product/${r.id}`} className="block font-medium truncate max-w-[260px] hover:underline underline-offset-4">
                            {r.name}
                          </Link>
                          <span className="block text-xs text-text-3 font-mono">{r.sku || "No SKU"}</span>
                        </span>
                      </div>
                    </td>
                    {showStore && <td className="px-3 py-2.5 text-text-2 whitespace-nowrap">{r.store.name}</td>}
                    <td className="px-3 py-2.5 text-text-2 whitespace-nowrap">
                      {categoryBySlug(r.category)?.name}
                      {r.subCategory && <span className="block text-xs text-text-3">{r.subCategory}</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">{money(r.price)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{r.stock}</td>
                    {counting && (
                      <>
                        <td className="px-3 py-2 text-right">
                          <input
                            className="input !min-h-8 !h-8 !w-20 !px-2 text-right tabular-nums"
                            inputMode="numeric"
                            aria-label={`Counted quantity for ${r.name}`}
                            placeholder="–"
                            value={counted}
                            onChange={(e) => setCounts((c) => ({ ...c, [r.id]: e.target.value.replace(/\D/g, "") }))}
                          />
                        </td>
                        <td className={`px-3 py-2.5 text-right font-semibold tabular-nums ${diff > 0 ? "text-success" : diff < 0 ? "text-danger" : "text-text-3"}`}>
                          {diff == null ? "" : diff === 0 ? "Matches" : `${diff > 0 ? "+" : ""}${diff}`}
                        </td>
                      </>
                    )}
                    <td className="px-3 py-2.5">
                      <span className={`badge ${STATUS[r.status].badge}`}>{STATUS[r.status].label}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{r.sold30}</td>
                    <td className={`px-3 py-2.5 text-right tabular-nums ${r.daysLeft != null && r.daysLeft < 7 ? "text-warning font-semibold" : ""}`}>
                      {r.daysLeft == null ? <span className="text-text-3">—</span> : r.daysLeft > 365 ? "365+" : `~${r.daysLeft}`}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {readOnly ? (
                        <span className="tabular-nums">{r.reorderLevel}</span>
                      ) : (
                        <input
                          key={r.reorderLevel}
                          className="input !min-h-8 !h-8 !w-16 !px-2 text-right tabular-nums"
                          inputMode="numeric"
                          aria-label={`Low-stock alert level for ${r.name}`}
                          defaultValue={r.reorderLevel}
                          onBlur={(e) => saveLevel(r, e.target.value.replace(/\D/g, "") || "0")}
                          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                        />
                      )}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {r.action.kind === "restock" && !readOnly ? (
                        <button className={`btn btn-sm ${r.status === "out" ? "btn-primary" : "btn-secondary"}`} onClick={() => openRestock([r])}>
                          <PackagePlus />
                          {r.action.label}
                        </button>
                      ) : r.action.kind === "deal" && !readOnly ? (
                        <Link href="/seller/products" className="btn btn-ghost btn-sm !text-accent-text">
                          <Zap />
                          {r.action.label}
                        </Link>
                      ) : (
                        <span className={`text-[13px] ${r.action.kind === "restock" ? "text-warning font-medium" : "text-text-3"}`}>{r.action.label}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openHistory(r)} aria-label={`Stock history for ${r.name}`} title="Stock history">
                        <History />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!shown.length && <p className="p-8 text-center text-sm text-text-2">No products match these filters.</p>}
        <div className="px-4 py-3 border-t border-border text-xs text-text-3 flex flex-wrap justify-between gap-2">
          <span>
            Showing {shown.length} of {rows.length} products · Days left uses the last 30 days of sales
          </span>
          <span>Low stock = at or below the alert level, or under a week of stock left</span>
        </div>
      </div>

      {/* Sticky action bars */}
      {!readOnly && (selected.size > 0 || counting) && (
        <div className="sticky bottom-4 z-30">
          <div className="mx-auto w-fit max-w-full flex flex-wrap items-center gap-3 rounded-full bg-forest text-ivory pl-5 pr-2 py-2 shadow-lg">
            {counting ? (
              <>
                <span className="text-sm">
                  {countLines.length} counted · {diffs.length} {diffs.length === 1 ? "difference" : "differences"}
                  {diffs.length > 0 && ` · net ${diffs.reduce((s, d) => s + d.change, 0) > 0 ? "+" : ""}${diffs.reduce((s, d) => s + d.change, 0)} units`}
                </span>
                <button className="btn btn-light btn-sm" onClick={applyCount} disabled={busy || !countLines.length}>
                  {busy ? <span className="spinner" /> : <ClipboardCheck />}
                  Apply count
                </button>
              </>
            ) : (
              <>
                <span className="text-sm">{selected.size} selected</span>
                <button className="btn btn-light btn-sm" onClick={() => openRestock(rows.filter((r) => selected.has(r.id)))}>
                  <PackagePlus />
                  Restock selected
                </button>
                <button className="btn btn-sm text-ivory/80 hover:text-ivory" onClick={() => setSelected(new Set())}>
                  Clear
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <Modal open={Boolean(restock)} onClose={() => setRestock(null)} title="Restock" description="Units are added to what's already in stock." size="lg">
        {restock && (
          <div className="space-y-4">
            <ul className="divide-y divide-border max-h-[45vh] overflow-y-auto">
              {restock.map((r, i) => (
                <li key={r.id} className="flex items-center justify-between gap-4 py-2.5">
                  <span className="text-sm truncate">{r.name}</span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-text-3">Add</span>
                    <input
                      className="input !min-h-9 !h-9 !w-24 text-right tabular-nums"
                      inputMode="numeric"
                      aria-label={`Units to add for ${r.name}`}
                      value={r.qty}
                      onChange={(e) => setRestock((list) => list.map((x, j) => (j === i ? { ...x, qty: e.target.value.replace(/\D/g, "") } : x)))}
                    />
                  </span>
                </li>
              ))}
            </ul>
            <div>
              <label className="label" htmlFor="restock-note">
                Note <span className="text-text-3 font-normal">(optional, e.g. supplier or invoice number)</span>
              </label>
              <input id="restock-note" className="input" value={restockNote} onChange={(e) => setRestockNote(e.target.value)} maxLength={120} />
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn btn-ghost" onClick={() => setRestock(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={submitRestock} disabled={busy}>
                {busy ? <span className="spinner" /> : <PackagePlus />}
                Add {restock.reduce((s, r) => s + (Number(r.qty) || 0), 0)} units
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(history)} onClose={() => setHistory(null)} title="Stock history" description={history ? `${history.row.name} · ${history.row.sku || "No SKU"} · ${history.row.stock} in stock now` : ""} size="lg">
        {history?.loading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-10" />
            ))}
          </div>
        ) : history?.movements?.length ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-text-3 border-b border-border">
                <th className="font-medium py-2">When</th>
                <th className="font-medium py-2">What</th>
                <th className="font-medium py-2 text-right">Change</th>
                <th className="font-medium py-2 text-right">Stock after</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {history.movements.map((m) => (
                <tr key={m.id}>
                  <td className="py-2.5 pr-3 whitespace-nowrap">
                    <span className="block">{dateTime(m.createdAt)}</span>
                    <span className="block text-xs text-text-3">{timeAgo(m.createdAt)}</span>
                  </td>
                  <td className="py-2.5 pr-3">
                    <span className={`badge ${REASONS[m.reason][1]}`}>{REASONS[m.reason][0]}</span>
                    {m.note && m.note !== REASONS[m.reason][0] && <span className="block text-xs text-text-3 mt-1">{m.note}</span>}
                  </td>
                  <td className={`py-2.5 text-right font-semibold tabular-nums ${m.change > 0 ? "text-success" : m.change < 0 ? "text-danger" : ""}`}>
                    {m.change > 0 ? "+" : ""}
                    {m.change}
                  </td>
                  <td className="py-2.5 text-right tabular-nums">{m.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-text-2">No stock changes recorded yet.</p>
        )}
      </Modal>
    </div>
  );
}

function SortButton({ label, active, dir, onClick }) {
  return (
    <button className={`inline-flex items-center gap-1 hover:text-text ${active ? "text-text" : ""}`} onClick={onClick}>
      {label}
      {active && (dir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
    </button>
  );
}
