import "server-only";
import { unstable_cache } from "next/cache";

// How long public catalog data (homepage rows, header counts, the promo bar) is served
// from the cache before it is refreshed in the background. Guests get these pages without
// waiting on the database, which matters when a serverless Postgres is waking up.
export const CATALOG_TTL = 120;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

// The data cache stores JSON, so Dates come back as strings on a cache hit. Turn them back
// into Dates so cached and fresh results look the same to the code that uses them.
function reviveDates(value) {
  if (value instanceof Date) return value;
  if (typeof value === "string") return ISO_DATE.test(value) ? new Date(value) : value;
  if (Array.isArray(value)) return value.map(reviveDates);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, reviveDates(v)]));
  }
  return value;
}

export function cachedQuery(fn, key, revalidate = CATALOG_TTL) {
  const cached = unstable_cache(fn, key, { revalidate, tags: ["catalog"] });
  return async (...args) => reviveDates(await cached(...args));
}
