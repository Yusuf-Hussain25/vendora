"use client";

import { useEffect } from "react";

// Closes a popover on outside click or Escape
export default function useDismiss(open, ref, close) {
  useEffect(() => {
    if (!open) return;
    const onPointer = (e) => !ref.current?.contains(e.target) && close();
    const onKey = (e) => e.key === "Escape" && close();
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, ref, close]);
}
