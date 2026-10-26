import Image from "next/image";
import { initials } from "@/lib/format";

const palette = ["#14b8a6", "#6366f1", "#f472b6", "#f59e0b", "#38bdf8", "#a78bfa", "#fb7185", "#34d399"];

const colorFor = (seed = "") => palette[[...seed].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % palette.length];

export default function Avatar({ src, name = "", size = 36, online, className = "" }) {
  return (
    <span className={`relative inline-flex shrink-0 ${className}`} style={{ width: size, height: size }}>
      {src ? (
        <Image
          src={src}
          alt={name}
          width={size}
          height={size}
          className="rounded-full object-cover w-full h-full ring-1 ring-border"
        />
      ) : (
        <span
          className="w-full h-full rounded-full grid place-items-center font-semibold text-white ring-1 ring-border"
          style={{ background: colorFor(name), fontSize: Math.max(11, size * 0.38) }}
          aria-label={name}
        >
          {initials(name)}
        </span>
      )}
      {online !== undefined && (
        <span
          className={`absolute bottom-0 right-0 rounded-full ring-2 ring-bg ${online ? "bg-success" : "bg-text-3"}`}
          style={{ width: size * 0.28, height: size * 0.28 }}
          aria-label={online ? "Online" : "Offline"}
        />
      )}
    </span>
  );
}
