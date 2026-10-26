import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function SectionHeader({ eyebrow, title, subtitle, href, linkLabel = "See all", children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="text-2xl sm:text-[28px] font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="mt-1.5 text-text-2">{subtitle}</p>}
      </div>
      {children}
      {href && (
        <Link href={href} className="btn btn-ghost btn-sm group">
          {linkLabel}
          <ArrowRight className="transition group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
