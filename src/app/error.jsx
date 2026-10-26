"use client";

import Link from "next/link";
import { RotateCcw, TriangleAlert } from "lucide-react";

export default function Error({ error, reset }) {
  const dev = process.env.NODE_ENV !== "production";
  return (
    <main className="min-h-dvh grid place-items-center px-4">
      <div className="text-center max-w-md">
        <span className="mx-auto grid place-items-center w-16 h-16 rounded-[22px] bg-[rgba(244,63,94,.12)] text-danger">
          <TriangleAlert className="w-7 h-7" />
        </span>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="mt-3 text-text-2">We couldn&apos;t load this page. Please try again in a moment.</p>
        {dev && error?.message && (
          <pre className="mt-5 text-left text-xs whitespace-pre-wrap rounded-[14px] bg-surface-2 border border-border p-4 text-text-2">{error.message}</pre>
        )}
        <div className="mt-8 flex justify-center gap-3">
          <button className="btn btn-primary" onClick={reset}>
            <RotateCcw />
            Try again
          </button>
          <Link href="/" className="btn btn-secondary">
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
