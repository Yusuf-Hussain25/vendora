"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgePercent, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createCoupon, deleteCoupon } from "@/actions/admin";
import { money, shortDate } from "@/lib/format";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";

export default function CouponManager({ coupons }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(null);

  const create = async (e) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget));
    setBusy("create");
    const result = await createCoupon({ ...form, forNewUser: form.forNewUser === "on", isPublic: form.isPublic === "on" });
    setBusy(null);
    if (result.error) return toast.error(result.error);
    toast.success(`Coupon ${form.code.toUpperCase()} created`);
    setOpen(false);
    router.refresh();
  };

  const remove = async (code) => {
    setBusy(code);
    const result = await deleteCoupon(code);
    setBusy(null);
    if (result.error) return toast.error(result.error);
    toast.success(`Coupon ${code} deleted`);
    router.refresh();
  };

  return (
    <>
      <div className="flex justify-end -mt-4 mb-5">
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Plus />
          New coupon
        </button>
      </div>
      {coupons.length ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {coupons.map((c) => (
            <article key={c.code} className={`card p-5 relative overflow-hidden ${c.expired ? "opacity-60" : ""}`}>
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-accent opacity-15" aria-hidden="true" />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-lg font-semibold tracking-wide">{c.code}</p>
                  <p className="text-sm text-text-2 mt-0.5">{c.description}</p>
                </div>
                <span className="text-2xl font-semibold text-accent-text">{c.discount}%</span>
              </div>
              <div className="relative mt-4 flex flex-wrap gap-1.5">
                {c.expired ? <span className="badge badge-danger">Expired</span> : <span className="badge badge-success">Active</span>}
                {c.forNewUser && <span className="badge badge-info">First order only</span>}
                {!c.isPublic && <span className="badge">Hidden</span>}
                {c.minOrder > 0 && <span className="badge">Min {money(c.minOrder)}</span>}
              </div>
              <div className="relative mt-4 flex items-center justify-between text-xs text-text-3">
                <span>
                  Used {c.used} {c.used === 1 ? "time" : "times"} · {c.expired ? "ended" : "ends"} {shortDate(c.expiresAt)}
                </span>
                <button className="btn btn-ghost btn-icon btn-sm !text-danger" onClick={() => remove(c.code)} disabled={busy === c.code} aria-label={`Delete coupon ${c.code}`}>
                  {busy === c.code ? <span className="spinner" /> : <Trash2 />}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState icon={BadgePercent} title="No coupons yet">
          Create a code to run a promotion or welcome new shoppers.
        </EmptyState>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New coupon">
        <form onSubmit={create} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="c-code">
                Code
              </label>
              <input id="c-code" name="code" className="input uppercase" placeholder="SUMMER15" required maxLength={20} />
            </div>
            <div>
              <label className="label" htmlFor="c-discount">
                Discount (%)
              </label>
              <input id="c-discount" name="discount" type="number" min={1} max={90} className="input" defaultValue={10} required />
            </div>
            <div>
              <label className="label" htmlFor="c-min">
                Minimum order
              </label>
              <input id="c-min" name="minOrder" type="number" min={0} step="0.01" className="input" defaultValue={0} />
            </div>
            <div>
              <label className="label" htmlFor="c-days">
                Lasts (days)
              </label>
              <input id="c-days" name="days" type="number" min={1} max={365} className="input" defaultValue={14} required />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="c-desc">
              Description
            </label>
            <input id="c-desc" name="description" className="input" placeholder="15% off summer essentials" required maxLength={120} />
          </div>
          <label className="flex items-center gap-3 text-sm text-text-2">
            <input type="checkbox" name="forNewUser" className="checkbox" />
            Only for a shopper&apos;s first order
          </label>
          <label className="flex items-center gap-3 text-sm text-text-2">
            <input type="checkbox" name="isPublic" className="checkbox" defaultChecked />
            Public (shown in promotions)
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" disabled={busy === "create"}>
              {busy === "create" && <span className="spinner" />}
              Create coupon
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
