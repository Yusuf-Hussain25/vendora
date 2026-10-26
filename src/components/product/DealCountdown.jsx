"use client";

import { useEffect, useState } from "react";

const pad = (n) => String(n).padStart(2, "0");

function parts(endsAt) {
  const ms = Math.max(0, new Date(endsAt).getTime() - Date.now());
  const s = Math.floor(ms / 1000);
  return { h: Math.floor(s / 3600), m: Math.floor((s % 3600) / 60), s: s % 60, done: ms === 0 };
}

// Counts down to a real deal end time. Variants: inline text, blocks (light) or tiles (on forest).
export default function DealCountdown({ endsAt, variant = "inline", className = "" }) {
  const [time, setTime] = useState(() => parts(endsAt));

  useEffect(() => {
    const id = setInterval(() => setTime(parts(endsAt)), 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (time.done) return <span className={`text-xs opacity-70 ${className}`}>Deal ended</span>;

  if (variant === "tiles" || variant === "blocks") {
    const tile =
      variant === "tiles"
        ? "bg-ivory text-forest"
        : "bg-panel border border-border text-text";
    return (
      <div className={`flex items-center gap-2 ${className}`} role="timer" aria-label={`${time.h} hours ${time.m} minutes left`}>
        {[
          [time.h, "Hours"],
          [time.m, "Minutes"],
          [time.s, "Seconds"],
        ].map(([v, label]) => (
          <span key={label} className={`w-[62px] sm:w-[68px] py-2 rounded-md text-center ${tile}`}>
            <span className="block text-2xl sm:text-[28px] font-semibold leading-none tabular-nums" suppressHydrationWarning>
              {pad(v)}
            </span>
            <span className="block mt-1 text-[10.5px] opacity-70">{label}</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <span className={`tabular-nums ${className}`} suppressHydrationWarning>
      {time.h > 0 && `${time.h}h `}
      {pad(time.m)}m {pad(time.s)}s
    </span>
  );
}
