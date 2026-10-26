import Image from "next/image";
import { redirect } from "next/navigation";
import { Bike, ShieldCheck, Sparkles, Store } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { googleEnabled } from "@/lib/auth";
import Link from "next/link";
import Logo, { LogoMark } from "@/components/ui/Logo";
import workspace from "../../../public/images/editorial/workspace.jpg";
import ThemeToggle from "@/components/ui/ThemeToggle";
import AuthCard from "@/components/auth/AuthCard";

export const metadata = { title: "Log in or sign up" };

// Only allow same-site relative redirects after login
const safeNext = (next) => (typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/");

export default async function LoginPage({ searchParams }) {
  const { next, mode } = await searchParams;
  if (await getCurrentUser()) redirect(safeNext(next));


  const demos = [
    { role: "Shopper & seller", email: process.env.NEXT_PUBLIC_DEMO_EMAIL },
    { role: "Rider", email: process.env.NEXT_PUBLIC_DEMO_RIDER_EMAIL },
    { role: "Admin", email: process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL },
  ].filter((d) => d.email && process.env.NEXT_PUBLIC_DEMO_PASSWORD);

  return (
    <main className="min-h-dvh grid lg:grid-cols-[1.1fr_1fr] bg-bg">
      {/* Brand hero: one art-directed photograph with the promise set in serif */}
      <section className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-forest text-ivory">
        <Image src={workspace} alt="" fill priority placeholder="blur" sizes="55vw" className="object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest via-forest/60 to-forest/20" aria-hidden="true" />
        <div className="relative p-12 xl:p-16">
          <Link href="/" className="inline-flex items-center gap-2 text-ivory" aria-label="Vendora home">
            <LogoMark size={30} className="!text-ivory" />
            <span className="font-display text-[27px] leading-none">Vendora</span>
          </Link>
        </div>
        <div className="relative p-12 xl:p-16 max-w-2xl">
          <p className="text-[11.5px] uppercase tracking-[.18em] text-ivory/70">Local stores · One cart · Fast delivery</p>
          <h1 className="font-display mt-5 text-[56px] xl:text-[68px] leading-[1.02]">
            Every store you love, <em className="italic text-[#cfe3d6]">one checkout.</em>
          </h1>
          <p className="mt-5 text-[17px] text-ivory/80 leading-relaxed max-w-lg">
            Shop independent sellers, catch flash deals before the timer runs out, and follow your rider live to your door.
          </p>
          <ul className="mt-10 grid grid-cols-2 gap-x-8 gap-y-5 border-t border-ivory/20 pt-8">
            {[
              [Store, "Independent sellers", "Every store is reviewed"],
              [Bike, "Live delivery map", "Follow your rider in real time"],
              [ShieldCheck, "Code at the door", "Only you can confirm delivery"],
              [Sparkles, "AI listing help", "Sellers list in minutes"],
            ].map(([Icon, title, text]) => (
              <li key={title} className="flex items-start gap-3">
                <Icon className="w-5 h-5 shrink-0 mt-0.5 text-[#cfe3d6]" strokeWidth={1.6} />
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs text-ivory/65 mt-0.5">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
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
