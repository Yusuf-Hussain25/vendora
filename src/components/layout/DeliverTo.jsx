"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, MapPin } from "lucide-react";
import { toast } from "sonner";
import { setDefaultAddress } from "@/actions/address";
import useDismiss from "./useDismiss";

// Shows where orders will be delivered. Picking an address makes it the default at checkout.
export default function DeliverTo({ addresses, signedIn }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(null);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, ref, close);

  const current = addresses.find((a) => a.isDefault) || addresses[0];
  const label = current ? `${current.city} ${current.zip}` : "San Francisco";

  const choose = async (id) => {
    setBusy(id);
    const result = await setDefaultAddress(id);
    setBusy(null);
    if (result.error) return toast.error(result.error);
    setOpen(false);
    toast.success("Delivery address updated");
    router.refresh();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        className="flex items-center gap-2 h-10 px-2 rounded-md hover:bg-surface-2 transition text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`Deliver to ${label}. Change delivery address`}
      >
        <MapPin className="w-[18px] h-[18px] text-text shrink-0" />
        <span className="leading-tight">
          <span className="block text-[11px] text-text-3">Deliver to</span>
          <span className="flex items-center gap-1 text-[13px] font-medium whitespace-nowrap">
            {label}
            <ChevronDown className="w-3.5 h-3.5 text-text-3" />
          </span>
        </span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-lg bg-panel border border-border shadow-lg p-2 fade-up z-50">
          {signedIn ? (
            <>
              <p className="px-3 pt-2 pb-1 text-xs text-text-3">Deliver to</p>
              {addresses.length ? (
                addresses.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => !a.isDefault && choose(a.id)}
                    disabled={Boolean(busy)}
                    className="w-full flex items-start gap-3 px-3 py-2.5 rounded-md text-left hover:bg-surface-2 transition"
                  >
                    <MapPin className="w-4 h-4 mt-0.5 text-text-3 shrink-0" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium">{a.label}</span>
                      <span className="block text-xs text-text-2 truncate">
                        {a.street}, {a.city} {a.zip}
                      </span>
                    </span>
                    {busy === a.id ? <span className="spinner mt-1" /> : a.isDefault && <Check className="w-4 h-4 mt-0.5 text-accent-text" />}
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-sm text-text-2">No saved addresses yet.</p>
              )}
              <div className="rule my-1.5" />
              <Link href="/account/addresses" onClick={close} className="block px-3 py-2 text-sm font-medium hover:underline underline-offset-4">
                Manage addresses
              </Link>
            </>
          ) : (
            <div className="p-3">
              <p className="text-sm font-medium">We deliver across San Francisco</p>
              <p className="mt-1 text-xs text-text-2">Log in to choose a saved address for checkout.</p>
              <Link href="/login" onClick={close} className="btn btn-primary btn-sm btn-block mt-3">
                Log in
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
