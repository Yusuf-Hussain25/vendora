import { money, percentOff } from "@/lib/format";

export default function Price({ price, mrp, size = "md", showOff = true, className = "" }) {
  const off = percentOff(mrp, price);
  const main = { sm: "text-[15px]", md: "text-lg", lg: "text-3xl" }[size];
  return (
    <span className={`inline-flex items-baseline flex-wrap gap-x-2 gap-y-0.5 ${className}`}>
      <span className={`${main} font-semibold tracking-tight`}>{money(price)}</span>
      {off > 0 && <span className="text-sm text-text-3 line-through">{money(mrp)}</span>}
      {showOff && off > 0 && <span className="text-sm font-semibold text-accent-text">{off}% off</span>}
    </span>
  );
}
