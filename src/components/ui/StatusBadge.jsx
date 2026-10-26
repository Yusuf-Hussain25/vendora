import { statusMeta } from "@/lib/catalog";

export default function StatusBadge({ status, className = "" }) {
  const meta = statusMeta(status);
  return <span className={`badge badge-${meta.tone} ${className}`}>{meta.short}</span>;
}
