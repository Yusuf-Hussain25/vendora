import Image from "next/image";
import { redirect } from "next/navigation";
import { Bike, ShieldCheck, Sparkles, Store, Timer } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { googleEnabled } from "@/lib/auth";
import { getLiveDeals } from "@/lib/queries";
import { effectivePrice } from "@/lib/pricing";
import { money } from "@/lib/format";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import AuthCard from "@/components/auth/AuthCard";

export const metadata = { title: "Log in or sign up" };

// Only allow same-site relative redirects after login
const safeNext = (next) => (typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/");

export default async function LoginPage({ searchParams }) {
  const { next, mode } = await searchParams;
  if (await getCurrentUser()) redirect(safeNext(next));

  const deals = (await getLiveDeals(12)).filter((d) => ["fashion", "electronics", "accessories", "beauty"].includes(d.category)).slice(0, 3);

  const demos = [
    { role: "Shopper & seller", email: process.env.NEXT_PUBLIC_DEMO_EMAIL },
    { role: "Rider", email: process.env.NEXT_PUBLIC_DEMO_RIDER_EMAIL },
    { role: "Admin", email: process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL },
  ].filter((d) => d.email && process.env.NEXT_PUBLIC_DEMO_PASSWORD);

  return (
    <main className="min-h-dvh grid lg:grid-cols-[1.1fr_1fr]">
      {/* Brand hero */}
      <section className="relative hidden lg:flex flex-col justify-between p-12 xl:p-16 overflow-hidden border-r border-border">
        <div className="absolute -left-40 -top-40 w-[560px] h-[560px] rounded-full bg-[image:var(--accent-grad)] opacity-[.18] blur-3xl" aria-hidden="true" />
        <Logo className="relative" />
        <div className="relative max-w-xl">
          <h1 className="text-5xl xl:text-6xl font-semibold tracking-[-0.035em] leading-[1.05]">
            Every store you love, <span className="text-gradient">one checkout.</span>
          </h1>
          <p className="mt-5 text-lg text-text-2 leading-relaxed">
            Shop independent sellers, catch flash deals before the timer runs out, and follow your rider live to your door.
          </p>

          {deals.length > 0 && (
            <div className="mt-10 grid grid-cols-3 gap-3">
              {deals.map((d) => (
                <div key={d.id} className="card !rounded-[20px] p-2.5">
                  <div className="relative aspect-square rounded-[14px] bg-surface-2">
                    <Image src={d.images[0]} alt={d.name} fill sizes="160px" className="object-contain p-3" />
                    <span className="absolute top-2 left-2 badge badge-deal !h-5 !text-[10px]">
                      <Timer />
                      Deal
                    </span>
                  </div>
                  <p className="mt-2 px-1 text-xs font-medium truncate">{d.name}</p>
                  <p className="px-1 text-sm font-semibold text-deal">{money(effectivePrice(d))}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <ul className="relative grid grid-cols-2 gap-3 max-w-xl">
          {[
            [Store, "Independent sellers", "Every store is reviewed"],
            [Bike, "Live delivery map", "Track riders in real time"],
            [ShieldCheck, "Code at the door", "Only you can confirm it"],
            [Sparkles, "AI listing help", "Sellers list in minutes"],
          ].map(([Icon, title, text]) => (
            <li key={title} className="flex items-start gap-3 rounded-[18px] border border-border bg-surface p-4">
              <Icon className="w-5 h-5 text-accent-text shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-text-3 mt-0.5">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Auth card */}
      <section className="relative flex flex-col px-4 py-6 sm:p-10">
        <div className="flex items-center justify-between lg:justify-end">
          <Logo className="lg:hidden" />
          <ThemeToggle />
        </div>
        <div className="flex-1 grid place-items-center py-8">
          <AuthCard
            initialMode={mode === "signup" ? "signup" : "login"}
            next={safeNext(next)}
            googleEnabled={googleEnabled}
            demos={demos}
            demoPassword={demos.length ? process.env.NEXT_PUBLIC_DEMO_PASSWORD : null}
          />
        </div>
      </section>
    </main>
  );
}
