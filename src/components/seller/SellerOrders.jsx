"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Bike, Check, ChevronDown, MapPin, Package, Phone, X } from "lucide-react";
import { toast } from "sonner";
import { sellerUpdateOrder } from "@/actions/seller";
import { dateTime, money, timeAgo } from "@/lib/format";
import StatusBadge from "@/components/ui/StatusBadge";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import StatusTimeline from "@/components/orders/StatusTimeline";

const TABS = [
  { value: "todo", label: "To do", match: (s) => ["PLACED", "CONFIRMED"].includes(s) },
  { value: "shipping", label: "With riders", match: (s) => ["PACKED", "OUT_FOR_DELIVERY"].includes(s) },
  { value: "done", label: "Delivered", match: (s) => s === "DELIVERED" },
  { value: "cancelled", label: "Cancelled", match: (s) => s === "CANCELLED" },
  { value: "all", label: "All", match: () => true },
];

const NEXT_STEP = {
  PLACED: { status: "CONFIRMED", label: "Confirm order", icon: Check },
  CONFIRMED: { status: "PACKED", label: "Mark as packed", icon: Package },
};

function OrderCard({ order }) {
  const router = useRouter();
  const [open, setOpen] = useState(order.status === "PLACED");
  const [busy, setBusy] = useState(null);
  const next = NEXT_STEP[order.status];
  const address = order.shippingAddress;

  const update = async (status) => {
    setBusy(status);
    const result = await sellerUpdateOrder(order.id, status);
    setBusy(null);
    if (result.error) toast.error(result.error);
    else {
      toast.success(status === "CANCELLED" ? `Order ${order.number} cancelled` : status === "PACKED" ? "Packed. Nearby riders can now pick it up." : `Order ${order.number} confirmed`);
      router.refresh();
    }
  };

  return (
    <article className="card overflow-hidden">
      <button className="w-full flex flex-wrap items-center gap-x-4 gap-y-2 p-4 sm:px-5 text-left hover:bg-surface transition" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="font-mono text-sm font-medium">{order.number}</span>
        <StatusBadge status={order.status} />
        {order.paymentMethod === "STRIPE" && <span className="badge badge-info">Paid by card</span>}
        <span className="flex-1 min-w-[120px] text-sm text-text-2 truncate">
          {order.user.name} · {order.items.reduce((s, i) => s + i.quantity, 0)} items
        </span>
        <span className="text-sm text-text-3">{timeAgo(order.createdAt)}</span>
        <span className="font-semibold">{money(order.total)}</span>
        <ChevronDown className={`w-4 h-4 text-text-3 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-border p-4 sm:p-5 grid lg:grid-cols-[1.4fr_1fr] gap-6">
          <div>
            <ul className="space-y-3">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3">
                  <span className="relative w-12 h-12 rounded-[12px] bg-surface-2 shrink-0">
                    <Image src={item.image} alt="" fill sizes="48px" className="object-contain p-1" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm truncate">{item.name}</span>
                    <span className="block text-xs text-text-3">{[item.size && `Size ${item.size}`, item.unit, `${item.quantity} × ${money(item.price)}`].filter(Boolean).join(" · ")}</span>
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-y-1.5 text-sm max-w-xs">
              <dt className="text-text-3">Items</dt>
              <dd className="text-right">{money(order.subtotal)}</dd>
              {order.discount > 0 && (
                <>
                  <dt className="text-text-3">Coupon {order.couponCode}</dt>
                  <dd className="text-right">-{money(order.discount)}</dd>
                </>
              )}
              <dt className="text-text-3">Delivery</dt>
              <dd className="text-right">{order.deliveryFee ? money(order.deliveryFee) : "Free"}</dd>
              <dt className="font-semibold">Total</dt>
              <dd className="text-right font-semibold">{money(order.total)}</dd>
            </dl>
          </div>
          <div className="space-y-5">
            <div className="text-sm">
              <p className="font-semibold flex items-center gap-2 mb-1.5">
                <MapPin className="w-4 h-4 text-text-3" />
                Deliver to
              </p>
              <p>{address.name}</p>
              <p className="text-text-2">
                {address.street}, {address.city} {address.zip}
              </p>
              <p className="text-text-3 flex items-center gap-1.5 mt-1">
                <Phone className="w-3.5 h-3.5" />
                {address.phone}
              </p>
            </div>
            {order.rider && (
              <div className="flex items-center gap-3 text-sm">
                <Avatar src={order.rider.image} name={order.rider.name} size={34} />
                <div>
                  <p className="font-medium">{order.rider.name}</p>
                  <p className="text-text-3 flex items-center gap-1">
                    <Bike className="w-3.5 h-3.5" />
                    {order.status === "PACKED" ? "Heading to you for pickup" : order.status === "DELIVERED" ? "Delivered it" : "Delivering"}
                  </p>
                </div>
              </div>
            )}
            <details className="text-sm">
              <summary className="cursor-pointer text-text-2 hover:text-text">Timeline · placed {dateTime(order.createdAt)}</summary>
              <div className="mt-4">
                <StatusTimeline status={order.status} history={order.statusHistory} />
              </div>
            </details>
            {next && (
              <div className="flex flex-wrap gap-2">
                <button className="btn btn-primary flex-1" onClick={() => update(next.status)} disabled={Boolean(busy)}>
                  {busy === next.status ? <span className="spinner" /> : <next.icon />}
                  {next.label}
                </button>
                <button className="btn btn-danger" onClick={() => update("CANCELLED")} disabled={Boolean(busy)}>
                  {busy === "CANCELLED" ? <span className="spinner" /> : <X />}
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

export default function SellerOrders({ orders }) {
  const [tab, setTab] = useState(orders.some((o) => ["PLACED", "CONFIRMED"].includes(o.status)) ? "todo" : "all");
  const current = TABS.find((t) => t.value === tab);
  const shown = orders.filter((o) => current.match(o.status));

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-5">
        {TABS.map((t) => {
          const count = orders.filter((o) => t.match(o.status)).length;
          return (
            <button key={t.value} className="chip" data-active={tab === t.value} onClick={() => setTab(t.value)}>
              {t.label}
              <span className="text-text-3">{count}</span>
            </button>
          );
        })}
      </div>
      {shown.length ? (
        <div className="space-y-3">
          {shown.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </div>
      ) : (
        <EmptyState icon={Package} title={tab === "todo" ? "You're all caught up" : "No orders here"}>
          {tab === "todo" ? "New orders appear here as soon as shoppers check out." : "Orders will show up in this tab as they move along."}
        </EmptyState>
      )}
    </>
  );
}
