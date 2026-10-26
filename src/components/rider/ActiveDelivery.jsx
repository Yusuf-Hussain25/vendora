"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, CheckCircle2, MapPin, Navigation, Phone, Play, Radio, Square, Store } from "lucide-react";
import { toast } from "sonner";
import { completeDelivery, markPickedUp, updateLocation } from "@/actions/rider";
import { distanceKm, formatKm, lerp } from "@/lib/geo";
import { money } from "@/lib/format";
import { INDIA_CENTER } from "@/lib/india";
import StatusBadge from "@/components/ui/StatusBadge";
import LazyDeliveryMap from "@/components/map/LazyDeliveryMap";

const SIM_STEPS = 16;
const SIM_EVERY_MS = 3000;

export default function ActiveDelivery({ order }) {
  const router = useRouter();
  const store = order.store.lat != null ? { lat: order.store.lat, lng: order.store.lng } : null;
  // Addresses are placed by PIN code when saved; fall back to the store, then the centre of India
  const home = order.shippingAddress.lat != null ? { lat: order.shippingAddress.lat, lng: order.shippingAddress.lng } : store || INDIA_CENTER;

  const [spot, setSpot] = useState(order.riderLat != null ? { lat: order.riderLat, lng: order.riderLng } : null);
  const [mode, setMode] = useState(null); // "gps" | "sim" | null
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(null);
  const watchRef = useRef(null);
  const timerRef = useRef(null);
  const lastSentRef = useRef(0);

  const stopSharing = () => {
    if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
    clearInterval(timerRef.current);
    watchRef.current = null;
    setMode(null);
  };

  // Stop GPS and the simulator when the card unmounts (e.g. after delivery)
  useEffect(
    () => () => {
      if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
      clearInterval(timerRef.current);
    },
    []
  );

  const send = async (point) => {
    setSpot(point);
    const result = await updateLocation(order.id, point);
    if (result.error) {
      toast.error(result.error);
      stopSharing();
    }
  };

  const shareGps = () => {
    if (!navigator.geolocation) return toast.error("This device can't share its location.");
    stopSharing();
    setMode("gps");
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        // Throttle to one update every 4 seconds
        if (Date.now() - lastSentRef.current < 4000) return;
        lastSentRef.current = Date.now();
        send({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        toast.error("Location permission was denied. Try the route simulator instead.");
        stopSharing();
      },
      { enableHighAccuracy: true }
    );
  };

  // Demo mode: glide from the store (or current spot) to the customer over ~45 seconds
  const simulate = () => {
    stopSharing();
    const from = spot || store || home;
    let step = 0;
    setMode("sim");
    timerRef.current = setInterval(() => {
      step += 1;
      send(lerp(from, home, Math.min(1, step / SIM_STEPS)));
      if (step >= SIM_STEPS) {
        clearInterval(timerRef.current);
        setMode(null);
        toast.success("You've arrived. Ask for the delivery code.");
      }
    }, SIM_EVERY_MS);
  };

  const pickUp = () => {
    setBusy("pickup");
    const done = async (location) => {
      const result = await markPickedUp(order.id, location || store);
      setBusy(null);
      if (result.error) return toast.error(result.error);
      if (location || store) setSpot(location || store);
      toast.success("Picked up. The customer can now follow you live.");
      router.refresh();
    };
    if (!navigator.geolocation) return done(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => done({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => done(null),
      { timeout: 4000 }
    );
  };

  const deliver = async (e) => {
    e.preventDefault();
    setBusy("deliver");
    const result = await completeDelivery(order.id, otp);
    setBusy(null);
    if (result.error) return toast.error(result.error);
    stopSharing();
    toast.success(`Order ${order.number} delivered. Nice work!`);
    router.refresh();
  };

  const onTheWay = order.status === "OUT_FOR_DELIVERY";
  const remaining = formatKm(distanceKm(onTheWay ? spot || store : store, home));

  return (
    <article className="card overflow-hidden">
      <div className="grid lg:grid-cols-[1.1fr_1fr]">
        <div className="relative h-64 lg:h-auto lg:min-h-[340px]">
          <LazyDeliveryMap
            store={store && { ...store, label: order.store.name }}
            home={{ ...home, label: order.shippingAddress.name }}
            rider={onTheWay && spot ? { ...spot, label: "You" } : null}
            className="absolute inset-0"
          />
          {mode && (
            <span className="absolute top-3 right-3 z-[500] badge !bg-panel-solid !text-accent-text !h-7 !px-3 shadow-md">
              <Radio className="pulse-dot" />
              {mode === "gps" ? "Sharing GPS" : "Simulating route"}
            </span>
          )}
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm">{order.number}</span>
            <StatusBadge status={order.status} />
            <span className="text-sm text-text-3 ml-auto">{remaining && `${remaining} to go`}</span>
          </div>

          <ol className="space-y-4 text-sm">
            <li className="flex gap-3">
              <Store className="w-4 h-4 text-accent-2 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Pick up at {order.store.name}</p>
                <p className="text-text-3">{order.store.address}</p>
              </div>
              {order.store.phone && (
                <a href={`tel:${order.store.phone.replace(/\s/g, "")}`} className="btn btn-ghost btn-icon btn-sm" aria-label={`Call ${order.store.name}`}>
                  <Phone />
                </a>
              )}
            </li>
            <li className="flex gap-3">
              <MapPin className="w-4 h-4 text-accent-text shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Deliver to {order.shippingAddress.name}</p>
                <p className="text-text-3">
                  {order.shippingAddress.street}, {order.shippingAddress.city} {order.shippingAddress.zip}
                </p>
              </div>
              <a href={`tel:${order.shippingAddress.phone.replace(/\s/g, "")}`} className="btn btn-ghost btn-icon btn-sm" aria-label={`Call ${order.shippingAddress.name}`}>
                <Phone />
              </a>
            </li>
            <li className="flex gap-3">
              <Banknote className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <p className="font-medium">
                {order.paymentMethod === "COD" && !order.isPaid ? `Collect ${money(order.total)} in cash` : "Prepaid. Nothing to collect."}
              </p>
            </li>
          </ol>

          {order.status === "PACKED" ? (
            <button className="btn btn-primary btn-lg btn-block" onClick={pickUp} disabled={busy === "pickup"}>
              {busy === "pickup" ? <span className="spinner" /> : <CheckCircle2 />}
              I&apos;ve picked it up
            </button>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {mode ? (
                  <button className="btn btn-secondary flex-1" onClick={stopSharing}>
                    <Square />
                    Stop sharing
                  </button>
                ) : (
                  <>
                    <button className="btn btn-secondary flex-1" onClick={shareGps}>
                      <Navigation />
                      Share live GPS
                    </button>
                    <button className="btn btn-secondary flex-1" onClick={simulate}>
                      <Play />
                      Simulate ride
                    </button>
                  </>
                )}
              </div>
              <form onSubmit={deliver} className="rounded-[10px] border border-border bg-surface p-4">
                <label className="label" htmlFor={`otp-${order.id}`}>
                  Delivery code from the customer
                </label>
                <div className="flex gap-2">
                  <input
                    id={`otp-${order.id}`}
                    className="input font-mono text-lg tracking-[0.5em] text-center"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="••••"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                  <button className="btn btn-primary shrink-0" disabled={otp.length !== 4 || busy === "deliver"}>
                    {busy === "deliver" && <span className="spinner" />}
                    Deliver
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
