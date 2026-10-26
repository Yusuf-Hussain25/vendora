import Link from "next/link";

// Vendora mark: a shopping-bag silhouette whose body folds into a "V"
export function LogoMark({ size = 32, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="vendora-mark" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2dd4bf" />
          <stop offset=".45" stopColor="#14b8a6" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="10" fill="url(#vendora-mark)" />
      <path d="M12 11V9.5a4 4 0 0 1 8 0V11" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".85" />
      <path d="M8.5 13.5 16 24l7.5-10.5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="13.5" r="1.6" fill="#fff" />
    </svg>
  );
}

export default function Logo({ href = "/", size = 32, showText = true, className = "" }) {
  return (
    <Link href={href} className={`inline-flex items-center gap-2.5 shrink-0 ${className}`} aria-label="Vendora home">
      <LogoMark size={size} />
      {showText && <span className="text-[19px] font-semibold tracking-tight">Vendora</span>}
    </Link>
  );
}
