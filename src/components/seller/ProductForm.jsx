"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { generateListing, saveProduct } from "@/actions/seller";
import { CATEGORIES, SIZE_PRESETS } from "@/lib/catalog";
import { money, percentOff } from "@/lib/format";
import ImageInput from "./ImageInput";

const empty = {
  name: "",
  description: "",
  brand: "",
  category: "",
  subCategory: "",
  unit: "",
  price: "",
  mrp: "",
  stock: "25",
  tags: "",
  images: [],
  sizes: [],
};

export default function ProductForm({ product, aiEnabled }) {
  const router = useRouter();
  const [form, setForm] = useState(() =>
    product
      ? { ...empty, ...product, brand: product.brand || "", subCategory: product.subCategory || "", unit: product.unit || "", tags: product.tags.join(", "), price: String(product.price), mrp: String(product.mrp), stock: String(product.stock) }
      : empty
  );
  const [busy, setBusy] = useState(false);
  const [writing, setWriting] = useState(false);
  const [customSize, setCustomSize] = useState("");

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const toggleSize = (size) => setForm((f) => ({ ...f, sizes: f.sizes.includes(size) ? f.sizes.filter((s) => s !== size) : [...f.sizes, size] }));

  const writeWithAI = async () => {
    setWriting(true);
    const result = await generateListing(form.images[0]);
    setWriting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    const l = result.listing;
    setForm((f) => ({
      ...f,
      name: l.name || f.name,
      description: l.description || f.description,
      brand: l.brand || f.brand,
      tags: l.tags || f.tags,
      category: f.category || l.category,
    }));
    toast.success("Draft written from your photo. Give it a quick check.");
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const result = await saveProduct({ ...form, id: product?.id });
    setBusy(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(product ? "Product updated" : "Product is live in your store");
    router.push("/seller/products");
    router.refresh();
  };

  const price = Number(form.price) || 0;
  const mrp = Number(form.mrp) || 0;
  const off = percentOff(mrp, price);

  return (
    <form onSubmit={submit} className="grid xl:grid-cols-[1.4fr_1fr] gap-6 items-start">
      <div className="space-y-6">
        <section className="card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-semibold">Photos</h2>
              <p className="text-sm text-text-3">Up to 6. The first one is the cover.</p>
            </div>
            {aiEnabled && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={writeWithAI} disabled={writing || !form.images.length}>
                {writing ? <span className="spinner" /> : <Sparkles className="text-accent-text" />}
                {writing ? "Writing…" : "Write with AI"}
              </button>
            )}
          </div>
          <ImageInput value={form.images} onChange={(images) => setForm((f) => ({ ...f, images }))} />
        </section>

        <section className="card p-5 sm:p-6 space-y-4">
          <h2 className="font-semibold">Details</h2>
          <div>
            <label className="label" htmlFor="p-name">
              Name
            </label>
            <input id="p-name" className="input" value={form.name} onChange={set("name")} placeholder="Linen relaxed shirt" required maxLength={120} />
          </div>
          <div>
            <label className="label" htmlFor="p-desc">
              Description
            </label>
            <textarea id="p-desc" className="textarea !min-h-[140px]" value={form.description} onChange={set("description")} placeholder="What it is, what it's made of, why people love it." required maxLength={4000} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="p-brand">
                Brand <span className="text-text-3 font-normal">(optional)</span>
              </label>
              <input id="p-brand" className="input" value={form.brand} onChange={set("brand")} maxLength={60} />
            </div>
            <div>
              <label className="label" htmlFor="p-tags">
                Tags <span className="text-text-3 font-normal">(comma separated)</span>
              </label>
              <input id="p-tags" className="input" value={form.tags} onChange={set("tags")} placeholder="linen, summer, shirt" />
            </div>
          </div>
        </section>

        <section className="card p-5 sm:p-6 space-y-4">
          <h2 className="font-semibold">Variants</h2>
          <div>
            <p className="label">Sizes</p>
            <div className="flex flex-wrap gap-2">
              {[...new Set([...SIZE_PRESETS.apparel, ...SIZE_PRESETS.shoes, ...form.sizes])].map((s) => (
                <button key={s} type="button" className="chip !min-w-[44px] justify-center" data-active={form.sizes.includes(s)} onClick={() => toggleSize(s)} aria-pressed={form.sizes.includes(s)}>
                  {s}
                </button>
              ))}
              <input
                className="input !min-h-[34px] !h-[34px] !w-24 !rounded-full !text-[13px]"
                placeholder="+ Custom"
                aria-label="Add a custom size"
                value={customSize}
                onChange={(e) => setCustomSize(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (customSize.trim()) toggleSize(customSize.trim().toUpperCase());
                    setCustomSize("");
                  }
                }}
              />
            </div>
            <p className="mt-2 text-xs text-text-3">Leave empty for items without sizes. Shoppers must pick one when sizes are set.</p>
          </div>
          <div>
            <label className="label" htmlFor="p-unit">
              Pack size <span className="text-text-3 font-normal">(for groceries, e.g. 1 kg, 6 pcs)</span>
            </label>
            <input id="p-unit" className="input sm:max-w-xs" value={form.unit} onChange={set("unit")} maxLength={30} />
          </div>
        </section>
      </div>

      <div className="space-y-6 xl:sticky xl:top-6">
        <section className="card p-5 sm:p-6 space-y-4">
          <h2 className="font-semibold">Department</h2>
          <div>
            <label className="label" htmlFor="p-cat">
              Department
            </label>
            <select id="p-cat" className="select" value={form.category} onChange={set("category")} required>
              <option value="" disabled>
                Choose…
              </option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="p-sub">
              Type <span className="text-text-3 font-normal">(e.g. Dresses, Fruits &amp; veg)</span>
            </label>
            <input id="p-sub" className="input" value={form.subCategory} onChange={set("subCategory")} maxLength={40} />
          </div>
        </section>

        <section className="card p-5 sm:p-6 space-y-4">
          <h2 className="font-semibold">Price and stock</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="p-price">
                Selling price
              </label>
              <input id="p-price" className="input" inputMode="decimal" value={form.price} onChange={set("price")} placeholder="29.99" required />
            </div>
            <div>
              <label className="label" htmlFor="p-mrp">
                Original price
              </label>
              <input id="p-mrp" className="input" inputMode="decimal" value={form.mrp} onChange={set("mrp")} placeholder="39.99" />
            </div>
          </div>
          {price > 0 && (
            <p className="text-sm text-text-2">
              Shoppers see <span className="font-semibold text-text">{money(price)}</span>
              {off > 0 && <span className="text-accent-text"> · {off}% off</span>}
            </p>
          )}
          <div>
            <label className="label" htmlFor="p-stock">
              In stock
            </label>
            <input id="p-stock" className="input" inputMode="numeric" value={form.stock} onChange={set("stock")} required />
          </div>
        </section>

        <div className="flex gap-2">
          <button type="button" className="btn btn-secondary btn-lg flex-1" onClick={() => router.back()}>
            Cancel
          </button>
          <button className="btn btn-primary btn-lg flex-1" disabled={busy}>
            {busy && <span className="spinner" />}
            {product ? "Save changes" : "Publish"}
          </button>
        </div>
      </div>
    </form>
  );
}
