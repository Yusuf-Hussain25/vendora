"use client";

import { useEffect, useState } from "react";

const pad = (n) => String(n).padStart(2, "0");

function parts(endsAt) {
  const ms = Math.max(0, new Date(endsAt).getTime() - Date.now());
  const s = Math.floor(ms / 1000);
  return { h: Math.floor(s / 3600), m: Math.floor((s % 3600) / 60), s: s % 60, done: ms === 0 };
}

export default function DealCountdown({ endsAt, variant = "inline", className = "" }) {
  const [time, setTime] = useState(() => parts(endsAt));

  useEffect(() => {
    const id = setInterval(() => setTime(parts(endsAt)), 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (time.done) return <span className={`text-xs text-text-3 ${className}`}>Deal ended</span>;

  if (variant === "blocks") {
    return (
      <div className={`flex items-center gap-1.5 font-mono ${className}`} suppressHydrationWarning aria-label="Time left on this deal">
        {[time.h, time.m, time.s].map((v, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className="min-w-[38px] h-10 px-1.5 grid place-items-center rounded-[12px] bg-surface-2 border border-border text-lg font-semibold tabular-nums" suppressHydrationWarning>
              {pad(v)}
            </span>
            {i < 2 && <span className="text-text-3">:</span>}
          </span>
        ))}
      </div>
    );
  }

  return (
    <span className={`font-mono tabular-nums ${className}`} suppressHydrationWarning>
      {time.h > 0 && `${time.h}h `}
      {pad(time.m)}m {pad(time.s)}s
    </span>
  );
}
