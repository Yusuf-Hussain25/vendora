"use client";

import { useEffect, useState } from "react";
import { Check, LocateFixed, MapPin } from "lucide-react";
import { toast } from "sonner";
import { saveAddress } from "@/actions/address";
import { isPinCode, STATES } from "@/lib/india";

const LABELS = ["Home", "Work", "Other"];

export default function AddressForm({ address, defaultName = "", onSaved, onCancel }) {
  const [form, setForm] = useState({
    name: address?.name || defaultName,
    phone: (address?.phone || "").replace(/^\+91\s?/, ""),
    zip: address?.zip || "",
    street: address?.street || "",
    city: address?.city || "",
    state: address?.state || "",
  });
  const [label, setLabel] = useState(address?.label || "Home");
  const [isDefault, setIsDefault] = useState(Boolean(address?.isDefault));
  const [coords, setCoords] = useState(address?.lat ? { lat: address.lat, lng: address.lng } : null);
  const [states, setStates] = useState(STATES);
  const [cities, setCities] = useState([]);
  const [localities, setLocalities] = useState([]);
  const [pinStatus, setPinStatus] = useState(null); // null | "checking" | "found" | "unknown"
  const [locating, setLocating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // States and union territories from the live API (falls back to the bundled list)
  useEffect(() => {
    fetch("/api/geo/states")
      .then((r) => r.json())
      .then((d) => d.states?.length && setStates(d.states))
      .catch(() => {});
  }, []);

  // City suggestions for the chosen state
  useEffect(() => {
    if (!form.state) return;
    let cancelled = false;
    fetch(`/api/geo/cities?state=${encodeURIComponent(form.state)}`)
      .then((r) => r.json())
      .then((d) => !cancelled && setCities(d.cities || []))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [form.state]);

  // A complete PIN code fills in the city and state from India Post
  const onPin = async (e) => {
    const zip = e.target.value.replace(/\D/g, "").slice(0, 6);
    setForm((f) => ({ ...f, zip }));
    setLocalities([]);
    if (!isPinCode(zip)) {
      setPinStatus(null);
      return;
    }
    setPinStatus("checking");
    try {
      const res = await fetch(`/api/geo/pincode/${zip}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setForm((f) => ({ ...f, city: data.city || f.city, state: states.includes(data.state) ? data.state : f.state }));
      setLocalities(data.localities || []);
      setPinStatus("found");
    } catch {
      setPinStatus("unknown");
    }
  };

  const addLocality = (name) =>
    setForm((f) => ({ ...f, street: f.street.toLowerCase().includes(name.toLowerCase()) ? f.street : [f.street.trim(), name].filter(Boolean).join(", ") }));

  const locate = () => {
    if (!navigator.geolocation) return toast.error("Your browser can't share its location.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast.success("Location pinned for your rider");
      },
      () => {
        setLocating(false);
        toast.error("We couldn't get your location. We'll use your PIN code instead.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result = await saveAddress({ ...form, label, id: address?.id, isDefault, ...(coords || {}) });
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    toast.success(address ? "Address updated" : "Address saved");
    onSaved?.(result.address);
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="segmented" role="group" aria-label="Address label">
        {LABELS.map((l) => (
          <button key={l} type="button" aria-pressed={label === l} onClick={() => setLabel(l)}>
            {l}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="addr-name">
            Full name
          </label>
          <input id="addr-name" className="input" value={form.name} onChange={set("name")} autoComplete="name" required />
        </div>
        <div>
          <label className="label" htmlFor="addr-phone">
            Mobile number
          </label>
          <div className="flex items-center rounded-md border border-border bg-panel focus-within:border-accent focus-within:ring-[3px] focus-within:ring-accent-soft">
            <span className="pl-3.5 pr-2 text-sm text-text-2 border-r border-border">+91</span>
            <input
              id="addr-phone"
              className="w-full bg-transparent px-3 min-h-[44px] text-sm outline-none"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/[^\d\s]/g, "").slice(0, 11) }))}
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="98765 43210"
              required
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="addr-zip">
            PIN code
          </label>
          <input id="addr-zip" className="input tracking-[.12em]" value={form.zip} onChange={onPin} inputMode="numeric" autoComplete="postal-code" placeholder="560038" required />
          <p className="mt-1.5 text-xs h-4 text-text-3" aria-live="polite">
            {pinStatus === "checking" && "Looking up your area…"}
            {pinStatus === "found" && (
              <span className="inline-flex items-center gap-1 text-success">
                <Check className="w-3.5 h-3.5" /> City and state filled in
              </span>
            )}
            {pinStatus === "unknown" && "We couldn't find that PIN. Please fill in the city and state."}
          </p>
        </div>
        <div>
          <label className="label" htmlFor="addr-state">
            State / union territory
          </label>
          <select id="addr-state" className="select" value={form.state} onChange={set("state")} required>
            <option value="" disabled>
              Choose…
            </option>
            {states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="label" htmlFor="addr-street">
            Flat, house no., building, street and area
          </label>
          <input id="addr-street" className="input" value={form.street} onChange={set("street")} autoComplete="street-address" placeholder="Flat 4B, Lakeview Apartments, 12th Main Road" required />
          {localities.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Localities for this PIN code">
              {localities.map((l) => (
                <button key={l} type="button" className="chip !h-7 !text-xs" onClick={() => addLocality(l)}>
                  <MapPin />
                  {l}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="label" htmlFor="addr-city">
            City / district
          </label>
          <input id="addr-city" className="input" value={form.city} onChange={set("city")} list="addr-city-options" autoComplete="address-level2" required />
          <datalist id="addr-city-options">
            {cities.slice(0, 400).map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div>
          <span className="label">Country</span>
          <p className="input flex items-center text-text-2 bg-surface-2 cursor-not-allowed" aria-readonly="true">
            India
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface px-4 py-3">
        <div className="text-sm">
          <p className="font-medium">{coords ? "Location pinned" : "Pin your exact location"}</p>
          <p className="text-xs text-text-3">{coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : "Optional. Otherwise we place you by PIN code on the delivery map."}</p>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={locate} disabled={locating}>
          {locating ? <span className="spinner" /> : coords ? <Check /> : <LocateFixed />}
          {coords ? "Update" : "Use my location"}
        </button>
      </div>

      <label className="flex items-center gap-3 text-sm text-text-2 cursor-pointer">
        <input type="checkbox" className="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
        Make this my default address
      </label>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button className="btn btn-primary" disabled={busy}>
          {busy && <span className="spinner" />}
          Save address
        </button>
      </div>
    </form>
  );
}
