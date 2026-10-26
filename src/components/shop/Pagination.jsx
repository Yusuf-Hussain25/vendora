import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, pages, searchParams, basePath = "/shop" }) {
  if (pages <= 1) return null;

  const href = (p) => {
    const next = new URLSearchParams(searchParams);
    if (p > 1) next.set("page", String(p));
    else next.delete("page");
    const qs = next.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const numbers = Array.from({ length: pages }, (_, i) => i + 1).filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 1);

  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Pagination">
      {page > 1 ? (
        <Link href={href(page - 1)} className="btn btn-secondary btn-icon btn-sm" aria-label="Previous page">
          <ChevronLeft />
        </Link>
      ) : (
        <span className="btn btn-secondary btn-icon btn-sm opacity-40" aria-hidden="true">
          <ChevronLeft />
        </span>
      )}
      {numbers.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && p - numbers[i - 1] > 1 && <span className="px-1 text-text-3">…</span>}
          <Link href={href(p)} className={`btn btn-sm min-w-[34px] !px-2 ${p === page ? "btn-primary" : "btn-ghost"}`} aria-current={p === page ? "page" : undefined}>
            {p}
          </Link>
        </span>
      ))}
      {page < pages ? (
        <Link href={href(page + 1)} className="btn btn-secondary btn-icon btn-sm" aria-label="Next page">
          <ChevronRight />
        </Link>
      ) : (
        <span className="btn btn-secondary btn-icon btn-sm opacity-40" aria-hidden="true">
          <ChevronRight />
        </span>
      )}
    </nav>
  );
}
