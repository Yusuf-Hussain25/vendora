"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LocateFixed } from "lucide-react";
import { toast } from "sonner";
import { applyForStore, updateStore } from "@/actions/seller";
import { slugify } from "@/lib/format";
import ImageInput from "./ImageInput";

export default function StoreForm({ store, mode = "apply", defaults = {} }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: store?.name || "",
    username: store?.username || "",
    tagline: store?.tagline || "",
    description: store?.description || "",
    email: store?.email || defaults.email || "",
    phone: store?.phone || "",
    address: store?.address || "",
    city: store?.city || "San Francisco",
    lat: store?.lat ?? null,
    lng: store?.lng ?? null,
  });
  const [logo, setLogo] = useState(store?.logo ? [store.logo] : []);
  const [banner, setBanner] = useState(store?.banner ? [store.banner] : []);
  const [usernameTouched, setUsernameTouched] = useState(Boolean(store));
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [key]: value, ...(key === "name" && !usernameTouched ? { username: slugify(value) } : {}) }));
  };

  const locate = () =>
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, lat: pos.coords.latitude, lng: pos.coords.longitude }));
        toast.success("Pickup point pinned");
      },
      () => toast.error("We couldn't get your location.")
    );

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const payload = { ...form, logo: logo[0] || "", banner: banner[0] || "" };
    const result = mode === "apply" ? await applyForStore(payload) : await updateStore(payload);
    setBusy(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(mode === "apply" ? "Application sent. We'll review it shortly." : "Store details saved");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="card p-5 sm:p-6 space-y-4">
        <h2 className="font-semibold">Your store</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="s-name">
              Store name
            </label>
            <input id="s-name" className="input" value={form.name} onChange={set("name")} placeholder="Urban Sprout" required maxLength={60} />
          </div>
          <div>
            <label className="label" htmlFor="s-username">
              Store link
            </label>
            <div className="flex items-center rounded-[12px] border border-border bg-surface focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft transition">
              <span className="pl-3.5 text-sm text-text-3 whitespace-nowrap">vendora/store/</span>
              <input
                id="s-username"
                className="w-full bg-transparent py-2.5 pr-3.5 text-sm min-h-[44px] outline-none"
                value={form.username}
                onChange={(e) => {
                  setUsernameTouched(true);
                  setForm((f) => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }));
                }}
                required
                maxLength={30}
              />
            </div>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="s-tagline">
            Tagline
          </label>
          <input id="s-tagline" className="input" value={form.tagline} onChange={set("tagline")} placeholder="Houseplants and planters for small spaces" required maxLength={90} />
        </div>
        <div>
          <label className="label" htmlFor="s-desc">
            About the store
          </label>
          <textarea id="s-desc" className="textarea" value={form.description} onChange={set("description")} placeholder="What you sell, where it comes from, what makes you different." required maxLength={1200} />
        </div>
      </section>

      <section className="card p-5 sm:p-6 grid sm:grid-cols-[160px_1fr] gap-6">
        <div>
          <p className="label">Logo</p>
          <ImageInput value={logo} onChange={setLogo} single folder="vendora/stores" />
        </div>
        <div>
          <p className="label">
            Banner <span className="text-text-3 font-normal">(optional, wide image)</span>
          </p>
          <ImageInput value={banner} onChange={setBanner} single folder="vendora/stores" />
        </div>
      </section>

      <section className="card p-5 sm:p-6 space-y-4">
        <h2 className="font-semibold">Contact and pickup</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="s-email">
              Contact email
            </label>
            <input id="s-email" type="email" className="input" value={form.email} onChange={set("email")} required />
          </div>
          <div>
            <label className="label" htmlFor="s-phone">
              Phone
            </label>
            <input id="s-phone" type="tel" className="input" value={form.phone} onChange={set("phone")} required />
          </div>
          <div>
            <label className="label" htmlFor="s-address">
              Pickup address
            </label>
            <input id="s-address" className="input" value={form.address} onChange={set("address")} placeholder="2201 Mission St" required />
          </div>
          <div>
            <label className="label" htmlFor="s-city">
              City
            </label>
            <input id="s-city" className="input" value={form.city} onChange={set("city")} required />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-border bg-surface px-4 py-3">
          <p className="text-sm text-text-2">
            {form.lat ? `Pickup pinned at ${Number(form.lat).toFixed(4)}, ${Number(form.lng).toFixed(4)}` : "Pin your pickup point so riders see it on the map."}
          </p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={locate}>
            <LocateFixed />
            {form.lat ? "Update pin" : "Use my location"}
          </button>
        </div>
      </section>

      <div className="flex justify-end">
        <button className="btn btn-primary btn-lg" disabled={busy}>
          {busy && <span className="spinner" />}
          {mode === "apply" ? "Send application" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
