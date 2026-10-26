import Link from "next/link";

// Vendora mark: two leaves growing from one stem into a "V"
export function LogoMark({ size = 30, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={`text-accent ${className}`}>
      <path d="M15.6 28.5C10.4 23.4 5.2 15.6 5.4 4.6c6.3 2.6 10.6 9.9 10.2 23.9Z" fill="currentColor" />
      <path d="M16.6 28.5c.5-10.6 4.6-18.6 11.2-22.4.9 10-4.2 17.6-11.2 22.4Z" fill="currentColor" opacity=".72" />
      <path d="M15.4 26.5C12.6 20.5 10 14.2 7.4 8.4M17.2 26.3c2-6.4 4.8-12.1 8.8-17" stroke="var(--bg)" strokeWidth="1" strokeLinecap="round" fill="none" opacity=".55" />
    </svg>
  );
}

export default function Logo({ href = "/", size = 30, showText = true, className = "" }) {
  return (
    <Link href={href} className={`inline-flex items-center gap-2 shrink-0 ${className}`} aria-label="Vendora home">
      <LogoMark size={size} />
      {showText && <span className="font-display text-[27px] leading-none tracking-[-0.01em] text-text">Vendora</span>}
    </Link>
  );
}
