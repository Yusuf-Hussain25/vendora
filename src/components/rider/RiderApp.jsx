"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bike, CheckCircle2, Coffee, MapPin, PackageCheck, Power, Store } from "lucide-react";
import { toast } from "sonner";
import { acceptDelivery, setOnline } from "@/actions/rider";
import { distanceKm, formatKm } from "@/lib/geo";
import { money, timeAgo } from "@/lib/format";
import { PageHeader, StatCard } from "@/components/dashboard/Widgets";
import EmptyState from "@/components/ui/EmptyState";
import ActiveDelivery from "./ActiveDelivery";

export default function RiderApp({ rider, active, available, stats }) {
  const router = useRouter();
  const [online, setOnlineState] = useState(rider.isOnline);
  const [busy, setBusy] = useState(null);

  const toggleOnline = async () => {
    setBusy("online");
    const result = await setOnline(!online);
    setBusy(null);
    if (result.error) return toast.error(result.error);
    setOnlineState(!online);
    toast.success(online ? "You're offline. Enjoy the break!" : "You're online. New pickups will appear below.");
    router.refresh();
  };

  const accept = async (orderId) => {
    setBusy(orderId);
    const result = await acceptDelivery(orderId);
    setBusy(null);
    if (result.error) {
      toast.error(result.error);
      router.refresh();
      return;
    }
    toast.success("Delivery accepted. Head to the store for pickup.");
    router.refresh();
  };

  return (
    <>
      <PageHeader title={`Hi, ${rider.name.split(" ")[0]}`} subtitle={online ? "You're online and visible to stores." : "You're offline. Go online to pick up deliveries."}>
        <button className={`btn ${online ? "btn-secondary" : "btn-primary"}`} onClick={toggleOnline} disabled={busy === "online"}>
          {busy === "online" ? <span className="spinner" /> : <Power />}
          {online ? "Go offline" : "Go online"}
        </button>
      </PageHeader>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard icon={Bike} label="Active" value={active.length} hint="Up to 3 at a time" />
        <StatCard icon={CheckCircle2} label="Today" value={stats.deliveredToday} hint="Delivered" tone="info" />
        <StatCard icon={PackageCheck} label="All time" value={stats.deliveredTotal} hint="Delivered" tone="warning" />
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Your deliveries</h2>
        {active.length ? (
          <div className="space-y-5">
            {active.map((order) => (
              <ActiveDelivery key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <EmptyState icon={Coffee} title="No active deliveries" className="!py-10">
            {online ? "Accept a pickup below to get started." : "Go online to see orders waiting for a rider."}
          </EmptyState>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          Ready for pickup
          {online && available.length > 0 && <span className="badge badge-accent">{available.length}</span>}
        </h2>
        {!online ? (
          <p className="text-sm text-text-2">Go online to see packed orders near you.</p>
        ) : available.length ? (
          <ul className="grid md:grid-cols-2 gap-3">
            {available.map((o) => {
              const home = o.shippingAddress;
              const km = distanceKm(o.store, home);
              return (
                <li key={o.id} className="card p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-sm">{o.number}</span>
                    <span className="text-xs text-text-3">placed {timeAgo(o.createdAt)}</span>
                  </div>
                  <div className="mt-4 space-y-3 text-sm">
                    <p className="flex items-start gap-2.5">
                      <Store className="w-4 h-4 text-accent-2 shrink-0 mt-0.5" />
                      <span>
                        <span className="font-medium">{o.store.name}</span>
                        <span className="block text-text-3">{o.store.address}</span>
                      </span>
                    </p>
                    <p className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-accent-text shrink-0 mt-0.5" />
                      <span>
                        <span className="font-medium">{home.city}</span>
                        <span className="block text-text-3">
                          {home.zip} · {formatKm(km)} trip
                        </span>
                      </span>
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-sm text-text-2">
                      {o.items.reduce((s, i) => s + i.quantity, 0)} items · {o.paymentMethod === "COD" ? `collect ${money(o.total)}` : "prepaid"}
                    </span>
                    <button className="btn btn-primary btn-sm" onClick={() => accept(o.id)} disabled={Boolean(busy)}>
                      {busy === o.id && <span className="spinner" />}
                      Accept
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-text-2">No packed orders are waiting right now. They&apos;ll appear here as stores finish packing.</p>
        )}
      </section>
    </>
  );
}
