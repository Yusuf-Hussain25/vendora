import Link from "next/link";
import { Compass } from "lucide-react";
import Logo from "@/components/ui/Logo";

export default function NotFound() {
  return (
    <main className="min-h-dvh grid place-items-center px-4">
      <div className="text-center max-w-md">
        <Logo className="justify-center" />
        <span className="mt-10 mx-auto grid place-items-center w-16 h-16 rounded-[12px] bg-accent-soft text-accent-text">
          <Compass className="w-7 h-7" />
        </span>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">We couldn&apos;t find that page</h1>
        <p className="mt-3 text-text-2">The product may have sold out, or the link might be mistyped.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className="btn btn-primary">
            Go home
          </Link>
          <Link href="/shop" className="btn btn-secondary">
            Browse the shop
          </Link>
        </div>
      </div>
    </main>
  );
}
