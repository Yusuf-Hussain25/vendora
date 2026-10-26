"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export default function Modal({ open, onClose, title, description, children, size = "md" }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const previous = document.activeElement;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const width = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" }[size];

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <button aria-label="Close dialog" className="absolute inset-0 bg-black/55 backdrop-blur-sm fade-up" onClick={onClose} />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${width} max-h-[92dvh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] bg-panel-solid border border-border shadow-lg fade-up outline-none`}
      >
        {title && (
          <div className="sticky top-0 z-10 flex items-start justify-between gap-4 px-6 pt-6 pb-4 bg-panel-solid">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
              {description && <p className="mt-1 text-sm text-text-2">{description}</p>}
            </div>
            <button className="btn btn-ghost btn-icon btn-sm -mr-2 -mt-1" onClick={onClose} aria-label="Close">
              <X />
            </button>
          </div>
        )}
        <div className={title ? "px-6 pb-6" : "p-6"}>{children}</div>
      </div>
    </div>
  );
}
