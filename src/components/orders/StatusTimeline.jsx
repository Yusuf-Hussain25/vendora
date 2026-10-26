import { Check, CircleX } from "lucide-react";
import { STATUS_FLOW, statusMeta } from "@/lib/catalog";
import { dateTime } from "@/lib/format";

export default function StatusTimeline({ status, history = [] }) {
  const at = Object.fromEntries(history.map((h) => [h.status, h.at]));

  if (status === "CANCELLED") {
    const note = history.find((h) => h.status === "CANCELLED")?.note;
    return (
      <div className="flex items-start gap-3 rounded-[10px] p-4 bg-sale-soft border border-sale/30">
        <CircleX className="w-5 h-5 text-danger shrink-0" />
        <div>
          <p className="text-sm font-semibold">Order cancelled</p>
          <p className="text-xs text-text-3 mt-0.5">
            {note ? `${note} · ` : ""}
            {at.CANCELLED && dateTime(at.CANCELLED)}
          </p>
        </div>
      </div>
    );
  }

  const current = STATUS_FLOW.indexOf(status);
  return (
    <ol className="relative">
      {STATUS_FLOW.map((step, i) => {
        const done = i < current || status === "DELIVERED";
        const active = i === current && status !== "DELIVERED";
        return (
          <li key={step} className="relative flex gap-4 pb-6 last:pb-0">
            {i < STATUS_FLOW.length - 1 && (
              <span className={`absolute left-[13px] top-7 bottom-0 w-0.5 ${i < current ? "bg-accent" : "bg-border-strong"}`} aria-hidden="true" />
            )}
            <span
              className={`relative z-10 grid place-items-center w-7 h-7 rounded-full shrink-0 ${
                done ? "bg-accent text-on-accent" : active ? "bg-accent-soft text-accent-text ring-2 ring-accent" : "bg-surface-2 text-text-3"
              }`}
            >
              {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : <span className={`w-2 h-2 rounded-full ${active ? "bg-accent pulse-dot text-accent" : "bg-text-3/50"}`} />}
            </span>
            <div className="pt-0.5">
              <p className={`text-sm font-medium ${done || active ? "" : "text-text-3"}`}>{statusMeta(step).label}</p>
              {at[step] && <p className="text-xs text-text-3 mt-0.5">{dateTime(at[step])}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
