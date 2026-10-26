"use client";

import "./globals.css";

// Shown when the root layout itself fails, e.g. DATABASE_URL or BETTER_AUTH_SECRET is missing
export default function GlobalError({ error, reset }) {
  const dev = process.env.NODE_ENV !== "production";
  return (
    <html lang="en">
      <body>
        <main className="min-h-dvh grid place-items-center px-4" style={{ fontFamily: "system-ui, sans-serif" }}>
          <div className="text-center max-w-lg">
            <h1 className="text-3xl font-semibold tracking-tight">Vendora can&apos;t start yet</h1>
            <p className="mt-3 text-text-2">
              {dev ? "The app is missing some configuration. Check your .env file against .env.example." : "We hit a problem loading the store. Please try again shortly."}
            </p>
            {dev && error?.message && (
              <pre className="mt-5 text-left text-xs whitespace-pre-wrap rounded-[14px] bg-surface-2 border border-border p-4 text-text-2">{error.message}</pre>
            )}
            <button className="btn btn-primary mt-8" onClick={reset}>
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
