"use client";

import { useState } from "react";
import { BadgePercent, X } from "lucide-react";
import { previewCoupon } from "@/actions/orders";
import { useUser } from "@/components/providers/UserProvider";

export default function CouponField({ subtotal, coupon, onChange }) {
  const user = useUser();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (coupon) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-[14px] px-3.5 py-2.5 bg-accent-soft border border-[rgba(20,184,166,.3)]">
        <span className="flex items-center gap-2 text-sm">
          <BadgePercent className="w-4 h-4 text-accent-text" />
          <span>
            <span className="font-semibold text-accent-text">{coupon.code}</span> · {coupon.description}
          </span>
        </span>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onChange(null)} aria-label="Remove coupon">
          <X />
        </button>
      </div>
    );
  }

  const apply = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    if (!user) {
      setError("Log in to use a coupon.");
      return;
    }
    setBusy(true);
    setError("");
    const result = await previewCoupon(code, subtotal);
    setBusy(false);
    if (result.error) setError(result.error);
    else {
      onChange(result.coupon);
      setCode("");
    }
  };

  return (
    <form onSubmit={apply}>
      <div className="flex gap-2">
        <input
          className="input !min-h-10 !h-10 uppercase placeholder:normal-case"
          placeholder="Coupon code"
          aria-label="Coupon code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button className="btn btn-secondary btn-sm !h-10 shrink-0" disabled={busy || !code.trim()}>
          {busy ? <span className="spinner" /> : "Apply"}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
