"use client";

import { useState } from "react";
import { Check, LocateFixed } from "lucide-react";
import { toast } from "sonner";
import { saveAddress } from "@/actions/address";

const LABELS = ["Home", "Work", "Other"];

export default function AddressForm({ address, defaultName = "", onSaved, onCancel }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [label, setLabel] = useState(address?.label || "Home");
  const [coords, setCoords] = useState(address?.lat ? { lat: address.lat, lng: address.lng } : null);
  const [locating, setLocating] = useState(false);

  const locate = () => {
    if (!navigator.geolocation) {
      toast.error("Your browser can't share its location.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast.success("Location pinned for your rider");
      },
      () => {
        setLocating(false);
        toast.error("We couldn't get your location. You can still save the address.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    setError("");
    const result = await saveAddress({ ...form, label, id: address?.id, isDefault: form.isDefault === "on", ...(coords || {}) });
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    toast.success(address ? "Address updated" : "Address saved");
    onSaved?.(result.address);
  };

  const field = (name, labelText, props = {}) => (
    <div className={props.wide ? "sm:col-span-2" : ""}>
      <label className="label" htmlFor={`addr-${name}`}>
        {labelText}
      </label>
      <input id={`addr-${name}`} name={name} className="input" defaultValue={address?.[name] ?? props.defaultValue ?? ""} required {...props.input} />
    </div>
  );

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
        {field("name", "Full name", { defaultValue: defaultName, input: { autoComplete: "name" } })}
        {field("phone", "Phone", { input: { type: "tel", autoComplete: "tel", placeholder: "+1 415 555 0100" } })}
        {field("street", "Street address", { wide: true, input: { autoComplete: "street-address", placeholder: "1458 Valencia St, Apt 3" } })}
        {field("city", "City", { defaultValue: "San Francisco", input: { autoComplete: "address-level2" } })}
        {field("state", "State", { defaultValue: "CA", input: { autoComplete: "address-level1" } })}
        {field("zip", "ZIP code", { input: { autoComplete: "postal-code", inputMode: "numeric" } })}
        {field("country", "Country", { defaultValue: "United States", input: { autoComplete: "country-name" } })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-border bg-surface px-4 py-3">
        <div className="text-sm">
          <p className="font-medium">{coords ? "Location pinned" : "Pin your location"}</p>
          <p className="text-xs text-text-3">{coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : "Helps your rider find the door on the live map."}</p>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={locate} disabled={locating}>
          {locating ? <span className="spinner" /> : coords ? <Check /> : <LocateFixed />}
          {coords ? "Update" : "Use my location"}
        </button>
      </div>

      <label className="flex items-center gap-3 text-sm text-text-2 cursor-pointer">
        <input type="checkbox" name="isDefault" className="checkbox" defaultChecked={address?.isDefault} />
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
