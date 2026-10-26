import Link from "next/link";
import { ArrowRight, BadgeCheck, Bike, Clock3, LineChart, Sparkles, Store, XCircle, Zap } from "lucide-react";
import { getCurrentUser, isSeller } from "@/lib/session";
import StoreForm from "@/components/seller/StoreForm";

export const metadata = { title: "Sell on Vendora" };

const perks = [
  [Sparkles, "AI listings", "Snap a photo and get a name, description and tags drafted for you."],
  [Zap, "Flash deals", "Run timed price drops that land on the homepage deals rail."],
  [Bike, "Riders included", "Pack the order and a nearby rider picks it up. No courier contracts."],
  [LineChart, "Live dashboard", "Revenue, low-stock alerts and reviews in one place."],
];

export default async function SellPage() {
  const user = await getCurrentUser();
  const store = user?.store;

  let panel;
  if (!user) {
    panel = (
      <div className="card p-6 sm:p-8 text-center">
        <h2 className="text-xl font-semibold">Create an account to apply</h2>
        <p className="mt-2 text-text-2">It takes a minute. You can keep shopping with the same account.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/login?mode=signup&next=/sell" className="btn btn-primary">
            Sign up
          </Link>
          <Link href="/login?next=/sell" className="btn btn-secondary">
            Log in
          </Link>
        </div>
      </div>
    );
  } else if (isSeller(user)) {
    panel = (
      <div className="card p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <BadgeCheck className="w-10 h-10 text-accent-text shrink-0" />
        <div className="flex-1">
          <h2 className="text-xl font-semibold">{store.name} is live</h2>
          <p className="mt-1 text-text-2">Manage products, deals and orders from your seller hub.</p>
        </div>
        <Link href="/seller" className="btn btn-primary">
          Open seller hub
          <ArrowRight />
        </Link>
      </div>
    );
  } else if (store?.status === "PENDING") {
    panel = (
      <div className="card p-6 sm:p-8 flex items-start gap-5">
        <Clock3 className="w-10 h-10 text-warning shrink-0" />
        <div>
          <h2 className="text-xl font-semibold">{store.name} is being reviewed</h2>
          <p className="mt-1 text-text-2">Our team checks every new store. You&apos;ll be able to open your seller hub as soon as it&apos;s approved.</p>
        </div>
      </div>
    );
  } else if (store && !store.isActive) {
    panel = (
      <div className="card p-6 sm:p-8 flex items-start gap-5">
        <XCircle className="w-10 h-10 text-danger shrink-0" />
        <div>
          <h2 className="text-xl font-semibold">{store.name} is paused</h2>
          <p className="mt-1 text-text-2">An admin has paused this store. Contact support to have it reopened.</p>
        </div>
      </div>
    );
  } else {
    panel = (
      <>
        {store?.status === "REJECTED" && (
          <div className="mb-6 flex items-start gap-3 rounded-[18px] p-4 bg-[rgba(244,63,94,.08)] border border-[rgba(244,63,94,.25)]">
            <XCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
            <p className="text-sm">Your last application wasn&apos;t approved. Update the details below and send it again.</p>
          </div>
        )}
        <StoreForm store={store} mode="apply" defaults={{ email: user.email }} />
      </>
    );
  }

  return (
    <div className="container-x pt-10">
      <section className="max-w-3xl">
        <p className="eyebrow">Sell on Vendora</p>
        <h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight">Your store, our shoppers and riders</h1>
        <p className="mt-4 text-lg text-text-2 leading-relaxed">
          Open a storefront in minutes. We bring the customers, checkout and same-day delivery; you bring the products.
        </p>
      </section>
      <ul className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {perks.map(([Icon, title, text]) => (
          <li key={title} className="card p-5">
            <span className="grid place-items-center w-10 h-10 rounded-[14px] bg-accent-soft text-accent-text">
              <Icon className="w-5 h-5" />
            </span>
            <h2 className="mt-4 font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-text-2 leading-relaxed">{text}</p>
          </li>
        ))}
      </ul>
      <section className="mt-12 max-w-4xl">
        <h2 className="text-2xl font-semibold tracking-tight mb-6 flex items-center gap-2">
          <Store className="w-6 h-6 text-accent-text" />
          {isSeller(user) ? "Your store" : "Apply to open a store"}
        </h2>
        {panel}
      </section>
    </div>
  );
}
