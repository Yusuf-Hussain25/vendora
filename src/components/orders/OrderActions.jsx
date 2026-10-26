"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { cancelOrder, rateItem } from "@/actions/orders";
import Modal from "@/components/ui/Modal";

export function CancelOrderButton({ orderId }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const cancel = async () => {
    setBusy(true);
    const result = await cancelOrder(orderId);
    setBusy(false);
    setConfirming(false);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Order cancelled");
      router.refresh();
    }
  };

  return (
    <>
      <button className="btn btn-danger btn-block" onClick={() => setConfirming(true)}>
        Cancel order
      </button>
      <Modal open={confirming} onClose={() => setConfirming(false)} title="Cancel this order?" description="The store will be told straight away. This can't be undone." size="sm">
        <div className="flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={() => setConfirming(false)}>
            Keep order
          </button>
          <button className="btn btn-danger" onClick={cancel} disabled={busy}>
            {busy && <span className="spinner" />}
            Cancel order
          </button>
        </div>
      </Modal>
    </>
  );
}

export function RateButton({ orderId, productId, productName, existing }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(existing?.rating || 0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState(existing?.review || "");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const result = await rateItem({ orderId, productId, rating, review });
    setBusy(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Thanks for your review!");
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      <button className={`btn btn-sm ${existing ? "btn-ghost" : "btn-secondary"}`} onClick={() => setOpen(true)}>
        <Star className={existing ? "fill-amber-400 text-amber-400" : ""} />
        {existing ? `${existing.rating}/5 · Edit` : "Rate"}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Rate this item" description={productName}>
        <form onSubmit={submit} className="space-y-5">
          <div className="flex gap-1" role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                onMouseEnter={() => setHover(n)}
                onClick={() => setRating(n)}
                className="p-1 transition hover:scale-110"
              >
                <Star className={`w-8 h-8 ${(hover || rating) >= n ? "fill-amber-400 text-amber-400" : "text-text-3"}`} />
              </button>
            ))}
          </div>
          <div>
            <label className="label" htmlFor="review">
              Your review
            </label>
            <textarea id="review" className="textarea" placeholder="What did you like or dislike?" value={review} onChange={(e) => setReview(e.target.value)} maxLength={1000} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" disabled={busy || !rating}>
              {busy && <span className="spinner" />}
              Submit review
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
