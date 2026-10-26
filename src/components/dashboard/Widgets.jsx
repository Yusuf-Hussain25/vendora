// Server-safe dashboard building blocks (no client state), so pages can pass icon components

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1.5 text-text-2">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, hint, tone = "accent" }) {
  const tones = {
    accent: "bg-accent-soft text-accent-text",
    info: "bg-[rgba(99,102,241,.15)] text-[#a5b4fc]",
    warning: "bg-[rgba(245,158,11,.15)] text-warning",
    deal: "bg-[rgba(251,113,133,.15)] text-deal",
  };
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-2">{label}</p>
        <span className={`grid place-items-center w-9 h-9 rounded-[12px] ${tones[tone]}`}>
          <Icon className="w-[18px] h-[18px]" />
        </span>
      </div>
      <p className="mt-3 text-[28px] font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-text-3">{hint}</p>}
    </div>
  );
}
