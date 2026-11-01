"use client";

import { useEffect } from "react";

const KEY = "vendora-db-warm";
// Neon pauses after 5 idle minutes, so one ping every 4 minutes at most is enough
const EVERY_MS = 4 * 60 * 1000;

// Quietly wakes the database while someone is on the site. Renders nothing.
export default function DbWarmup() {
  useEffect(() => {
    try {
      const last = Number(sessionStorage.getItem(KEY) || 0);
      if (Date.now() - last < EVERY_MS) return;
      sessionStorage.setItem(KEY, String(Date.now()));
    } catch {
      // Storage can be blocked (private mode); pinging anyway is harmless
    }
    fetch("/api/warm", { cache: "no-store" }).catch(() => {});
  }, []);
  return null;
}
