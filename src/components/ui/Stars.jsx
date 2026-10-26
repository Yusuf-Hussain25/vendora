import { Star } from "lucide-react";

export default function Stars({ value = 0, size = 14, count, className = "" }) {
  const label = `${value.toFixed(1)} out of 5 stars`;
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="inline-flex" role="img" aria-label={label}>
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = Math.max(0, Math.min(1, value - i + 1));
          return (
            <span key={i} className="relative" style={{ width: size, height: size }}>
              <Star className="absolute inset-0 text-text-3/50" style={{ width: size, height: size }} strokeWidth={1.5} />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className="text-amber-400 fill-amber-400" style={{ width: size, height: size }} strokeWidth={1.5} />
              </span>
            </span>
          );
        })}
      </span>
      {count !== undefined && <span className="text-xs text-text-3">({count})</span>}
    </span>
  );
}
