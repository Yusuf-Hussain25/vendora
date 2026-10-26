"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { assignRider } from "@/actions/admin";

export default function AssignRider({ orderId, riders }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const assign = async (riderId) => {
    if (!riderId) return;
    setBusy(true);
    const result = await assignRider(orderId, riderId);
    setBusy(false);
    if (result.error) return toast.error(result.error);
    toast.success("Rider assigned");
    router.refresh();
  };

  return (
    <select
      className="select !min-h-[34px] !h-[34px] !py-0 !text-[13px] !rounded-full !w-auto"
      aria-label="Assign a rider"
      defaultValue=""
      disabled={busy}
      onChange={(e) => assign(e.target.value)}
    >
      <option value="" disabled>
        Assign rider…
      </option>
      {riders.map((r) => (
        <option key={r.id} value={r.id}>
          {r.name}
          {r.isOnline ? " · online" : " · offline"}
        </option>
      ))}
    </select>
  );
}
