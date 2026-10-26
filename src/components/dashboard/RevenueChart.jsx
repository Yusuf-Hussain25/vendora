"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money, moneyCompact } from "@/lib/format";

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const { revenue, orders } = payload[0].payload;
  return (
    <div className="rounded-[14px] bg-panel-solid border border-border shadow-md px-3.5 py-2.5 text-sm">
      <p className="text-xs text-text-3">{label}</p>
      <p className="font-semibold">{money(revenue)}</p>
      <p className="text-xs text-text-2">
        {orders} {orders === 1 ? "order" : "orders"}
      </p>
    </div>
  );
}

// data: [{ day: "Oct 12", revenue, orders }]
export default function RevenueChart({ data, height = 260 }) {
  return (
    <div style={{ height }} role="img" aria-label="Revenue over the last 14 days">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="revenue-stroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2dd4bf" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "var(--text-3)", fontSize: 12 }} interval="preserveStartEnd" minTickGap={24} />
          <YAxis tickLine={false} axisLine={false} width={52} tick={{ fill: "var(--text-3)", fontSize: 12 }} tickFormatter={moneyCompact} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border-strong)" }} />
          <Area type="monotone" dataKey="revenue" stroke="url(#revenue-stroke)" strokeWidth={2.5} fill="url(#revenue-fill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
