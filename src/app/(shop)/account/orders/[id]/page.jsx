import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Store } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { BUYER_CAN_CANCEL } from "@/lib/orders";
import { dateTime, money } from "@/lib/format";
import StatusBadge from "@/components/ui/StatusBadge";
import StatusTimeline from "@/components/orders/StatusTimeline";
import LiveTracking from "@/components/orders/LiveTracking";
import { CancelOrderButton, RateButton } from "@/components/orders/OrderActions";

export const metadata = { title: "Order details" };

export default async function OrderPage({ params }) {
  const { id } = await params;
  const user = await requireUser(`/account/orders/${id}`);
  const order = await prisma.order.findFirst({
    where: { id, userId: user.id },
    include: {
      items: true,
      store: { select: { name: true, username: true, logo: true, phone: true, lat: true, lng: true, address: true } },
      rider: { select: { name: true, image: true, vehicle: true, phone: true, isOnline: true } },
    },
  });
  if (!order) notFound();

  const ratings = await prisma.rating.findMany({ where: { orderId: order.id, userId: user.id } });
  const ratingFor = Object.fromEntries(ratings.map((r) => [r.productId, { rating: r.rating, review: r.review }]));
  const address = order.shippingAddress;

  return (
    <div>
      <Link href="/account/orders" className="btn btn-ghost btn-sm -ml-3 mb-4">
        <ArrowLeft />
        All orders
      </Link>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Order {order.number}</h2>
        <StatusBadge status={order.status} />
        <span className="text-sm text-text-3">Placed {dateTime(order.createdAt)}</span>
      </div>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6 items-start">
        <div className="space-y-6">
          <LiveTracking
            orderId={order.id}
            status={order.status}
            store={{ name: order.store.name, lat: order.store.lat, lng: order.store.lng }}
            home={{ lat: address.lat, lng: address.lng }}
            rider={order.rider}
            initialRiderSpot={order.riderLat != null ? { lat: order.riderLat, lng: order.riderLng, seenAt: order.riderSeenAt } : null}
            otp={order.deliveryOtp}
          />

          <section className="card p-5 sm:p-6">
            <h3 className="font-semibold mb-4">Items</h3>
            <ul className="divide-y divide-border">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <Link href={`/product/${item.productId}`} className="relative w-16 h-16 rounded-[14px] bg-surface-2 shrink-0">
                    <Image src={item.image} alt={item.name} fill sizes="64px" className="object-contain p-1.5" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/product/${item.productId}`} className="text-sm font-medium hover:text-accent-text transition line-clamp-2">
                      {item.name}
                    </Link>
                    <p className="text-xs text-text-3 mt-0.5">
                      {[item.size && `Size ${item.size}`, item.unit, `${item.quantity} × ${money(item.price)}`].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  {order.status === "DELIVERED" ? (
                    <RateButton orderId={order.id} productId={item.productId} productName={item.name} existing={ratingFor[item.productId]} />
                  ) : (
                    <span className="text-sm font-medium">{money(item.price * item.quantity)}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-5 sm:p-6">
            <h3 className="font-semibold mb-5">Progress</h3>
            <StatusTimeline status={order.status} history={order.statusHistory} />
          </section>

          <section className="card p-5 sm:p-6 space-y-5">
            <div>
              <h3 className="font-semibold mb-3">Payment</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-text-2">Items</dt>
                  <dd>{money(order.subtotal)}</dd>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-accent-text">
                    <dt>Coupon {order.couponCode}</dt>
                    <dd>-{money(order.discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-text-2">Delivery</dt>
                  <dd>{order.deliveryFee ? money(order.deliveryFee) : "Free"}</dd>
                </div>
                <div className="pt-2.5 border-t border-border flex justify-between font-semibold">
                  <dt>Total</dt>
                  <dd>{money(order.total)}</dd>
                </div>
              </dl>
              <p className="mt-2 text-xs text-text-3">
                {order.paymentMethod === "STRIPE" ? "Paid by card" : order.isPaid ? "Paid in cash on delivery" : "Pay in cash when it arrives"}
              </p>
            </div>
            <div className="pt-5 border-t border-border">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-text-3" />
                Delivering to
              </h3>
              <p className="text-sm">{address.name}</p>
              <p className="text-sm text-text-2">{address.street}</p>
              <p className="text-sm text-text-2">
                {address.city}, {address.state} {address.zip}
              </p>
              <p className="text-xs text-text-3 mt-1">{address.phone}</p>
            </div>
            <div className="pt-5 border-t border-border">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Store className="w-4 h-4 text-text-3" />
                Sold by
              </h3>
              <Link href={`/store/${order.store.username}`} className="flex items-center gap-3 hover:text-accent-text transition">
                <Image src={order.store.logo} alt="" width={36} height={36} className="w-9 h-9 rounded-[10px] bg-surface-2" />
                <span className="text-sm font-medium">{order.store.name}</span>
              </Link>
            </div>
            {BUYER_CAN_CANCEL.includes(order.status) && <CancelOrderButton orderId={order.id} />}
          </section>
        </div>
      </div>
    </div>
  );
}
