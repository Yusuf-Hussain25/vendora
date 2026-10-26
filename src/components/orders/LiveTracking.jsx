"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bike, Phone, Radio, ShieldCheck } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import LazyDeliveryMap from "@/components/map/LazyDeliveryMap";
import { timeAgo } from "@/lib/format";

const FINAL = ["DELIVERED", "CANCELLED"];

export default function LiveTracking({ orderId, status: initialStatus, store, home, rider, initialRiderSpot, otp, showOtp = true }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [spot, setSpot] = useState(initialRiderSpot);
  const statusRef = useRef(initialStatus);

  useEffect(() => {
    if (FINAL.includes(statusRef.current)) return;
    let stopped = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/live`, { cache: "no-store" });
        if (!res.ok || stopped) return;
        const data = await res.json();
        setSpot(data.rider);
        if (data.status !== statusRef.current) {
          statusRef.current = data.status;
          setStatus(data.status);
          // Pull the fresh timeline, rider and items from the server
          router.refresh();
        }
      } catch {
        // offline for a moment: try again on the next tick
      }
    };
    const id = setInterval(poll, 5000);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [orderId, router]);

  const onTheWay = status === "OUT_FOR_DELIVERY";
  const storePoint = store.lat != null ? { lat: store.lat, lng: store.lng, label: store.name } : null;
  const homePoint = home.lat != null ? { lat: home.lat, lng: home.lng, label: "You" } : null;
  const riderPoint = onTheWay && spot ? { lat: spot.lat, lng: spot.lng, label: rider ? rider.name.split(" ")[0] : "Rider" } : null;

  const headline = {
    PLACED: "Waiting for the store to confirm",
    CONFIRMED: "The store is preparing your order",
    PACKED: rider ? `${rider.name.split(" ")[0]} is heading to the store` : "Packed and waiting for a rider",
    OUT_FOR_DELIVERY: "Your rider is on the way",
    DELIVERED: "Delivered. Enjoy!",
    CANCELLED: "This order was cancelled",
  }[status];

  return (
    <section className="card overflow-hidden">
      <div className="relative h-[280px] sm:h-[360px]">
        <LazyDeliveryMap store={storePoint} home={homePoint} rider={riderPoint} className="absolute inset-0" />
        {onTheWay && (
          <span className="absolute top-3 right-3 z-[500] badge !bg-panel-solid !text-accent-text !h-7 !px-3 shadow-md">
            <Radio className="pulse-dot" />
            Live
            {spot?.seenAt && <span className="font-normal opacity-80">· updated {timeAgo(spot.seenAt)}</span>}
          </span>
        )}
      </div>
      <div className="p-5 sm:p-6 grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <p className="text-lg font-semibold">{headline}</p>
          {rider && !FINAL.includes(status) && (
            <div className="mt-3 flex items-center gap-3">
              <Avatar src={rider.image} name={rider.name} size={40} online={rider.isOnline} />
              <div className="text-sm">
                <p className="font-medium">{rider.name}</p>
                <p className="text-text-3 flex items-center gap-1.5">
                  <Bike className="w-3.5 h-3.5" />
                  {rider.vehicle || "Rider"}
                </p>
              </div>
              {rider.phone && (
                <a href={`tel:${rider.phone.replace(/\s/g, "")}`} className="btn btn-secondary btn-icon btn-sm ml-2" aria-label={`Call ${rider.name}`}>
                  <Phone />
                </a>
              )}
            </div>
          )}
        </div>
        {showOtp && otp && !FINAL.includes(status) && (
          <div className="rounded-[10px] border border-dashed border-accent/50 bg-accent-soft px-4 py-3">
            <p className="text-xs text-text-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-accent-text" />
              Delivery code
            </p>
            <p className="mt-1 flex gap-1.5" aria-label={`Delivery code ${otp.split("").join(" ")}`}>
              {otp.split("").map((d, i) => (
                <span key={i} className="grid place-items-center w-9 h-11 rounded-[10px] bg-panel-solid text-xl font-semibold font-mono">
                  {d}
                </span>
              ))}
            </p>
            <p className="mt-1.5 text-[11px] text-text-3">Share it only when your order is in your hands.</p>
          </div>
        )}
      </div>
    </section>
  );
}
