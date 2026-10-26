const currency = process.env.NEXT_PUBLIC_CURRENCY || "USD";

const moneyFormat = new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 });
const compactMoney = new Intl.NumberFormat("en-US", { style: "currency", currency, notation: "compact", maximumFractionDigits: 1 });
const compactNumber = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export const CURRENCY = currency;

export const money = (value) => moneyFormat.format(Number(value) || 0);
export const moneyCompact = (value) => compactMoney.format(Number(value) || 0);
export const numberCompact = (value) => compactNumber.format(Number(value) || 0);

export const percentOff = (mrp, price) => (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0);

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const units = [
  ["year", 31536000],
  ["month", 2592000],
  ["week", 604800],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

export function timeAgo(date) {
  const seconds = (new Date(date).getTime() - Date.now()) / 1000;
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

export const shortDate = (date) =>
  new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export const dateTime = (date) =>
  new Date(date).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "?";

export const slugify = (text = "") =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
