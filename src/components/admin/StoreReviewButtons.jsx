"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pause, Play, X } from "lucide-react";
import { toast } from "sonner";
import { reviewStore, setStoreActive } from "@/actions/admin";

export default function StoreReviewButtons({ storeId, status = "PENDING", isActive = true }) {
  const router = useRouter();
  const [busy, setBusy] = useState(null);

  const run = async (key, action, message) => {
    setBusy(key);
    const result = await action();
    setBusy(null);
    if (result.error) return toast.error(result.error);
    toast.success(message);
    router.refresh();
  };

  if (status === "PENDING" || status === "REJECTED") {
    return (
      <div className="flex gap-2">
        <button className="btn btn-primary btn-sm" disabled={Boolean(busy)} onClick={() => run("approve", () => reviewStore(storeId, "APPROVED"), "Store approved and live")}>
          {busy === "approve" ? <span className="spinner" /> : <Check />}
          Approve
        </button>
        {status === "PENDING" && (
          <button className="btn btn-danger btn-sm" disabled={Boolean(busy)} onClick={() => run("reject", () => reviewStore(storeId, "REJECTED"), "Application rejected")}>
            {busy === "reject" ? <span className="spinner" /> : <X />}
            Reject
          </button>
        )}
      </div>
    );
  }

  return (
    <button
      className={`btn btn-sm ${isActive ? "btn-secondary" : "btn-primary"}`}
      disabled={Boolean(busy)}
      onClick={() => run("toggle", () => setStoreActive(storeId, !isActive), isActive ? "Store paused and hidden" : "Store is live again")}
    >
      {busy === "toggle" ? <span className="spinner" /> : isActive ? <Pause /> : <Play />}
      {isActive ? "Pause" : "Resume"}
    </button>
  );
}
