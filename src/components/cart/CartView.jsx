"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, Lock, Minus, Plus, ShoppingBag, Store, Trash2, Truck } from "lucide-react";
import { useCart } from "@/components/providers/CartProvider";
import { useUser } from "@/components/providers/UserProvider";
import { FREE_DELIVERY_OVER, round2 } from "@/lib/pricing";
import { money } from "@/lib/format";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import useCartItems from "./useCartItems";
import CouponField from "./CouponField";

export function QtyStepper({ value, onChange, max = 10, size = "sm" }) {
  const h = size === "sm" ? "!h-9 !w-9" : "!h-11 !w-11";
  return (
    <div className="inline-flex items-center rounded-full border border-border bg-surface">
      <button className={`btn btn-ghost btn-icon ${h}`} onClick={() => onChange(value - 1)} aria-label="Decrease quantity">
        {value <= 1 ? <Trash2 /> : <Minus />}
      </button>
      <span className="w-7 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button className={`btn btn-ghost btn-icon ${h}`} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        <Plus />
      </button>
    </div>
  );
}

export default function CartView() {
  const cart = useCart();
  const user = useUser();
  const router = useRouter();
  const { loading, groups, items, subtotal, deliveryTotal, unavailable, count } = useCartItems();
  const [coupon, setCoupon] = useState(null);

  const discount = coupon ? round2((subtotal * coupon.discount) / 100) : 0;
  const total = round2(subtotal - discount + deliveryTotal);

  if (!cart.ready || (loading && Object.keys(cart.lines).length)) {
    return (
      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-56 w-full !rounded-[22px]" />
          ))}
        </div>
        <Skeleton className="h-80 w-full !rounded-[22px]" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Your cart is empty"
        action={
          <Link href="/shop" className="btn btn-primary">
            Start shopping
            <ArrowRight />
          </Link>
        }
      >
        Add something from any store. Items from different sellers check out together.
      </EmptyState>
    );
  }

  const checkout = () => {
    const params = coupon ? `?coupon=${encodeURIComponent(coupon.code)}` : "";
    router.push(user ? `/checkout${params}` : `/login?next=${encodeURIComponent(`/checkout${params}`)}`);
  };

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
      <div className="space-y-4">
        {unavailable.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-[16px] px-4 py-3 bg-[rgba(245,158,11,.1)] border border-[rgba(245,158,11,.3)] text-sm">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
            <span className="flex-1">
              {unavailable.length === 1 ? "One item is" : `${unavailable.length} items are`} no longer available and won&apos;t be ordered.
            </span>
            <button className="btn btn-secondary btn-sm" onClick={() => unavailable.forEach((key) => cart.remove(key))}>
              Remove {unavailable.length === 1 ? "it" : "them"}
            </button>
          </div>
        )}
        {groups.map((group) => {
          const toFree = round2(FREE_DELIVERY_OVER - group.subtotal);
          return (
            <section key={group.store.id} className="card overflow-hidden">
              <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border">
                <Link href={`/store/${group.store.username}`} className="flex items-center gap-3 font-semibold hover:text-accent-text transition">
                  <Image src={group.store.logo} alt="" width={32} height={32} className="w-8 h-8 rounded-[10px] bg-surface-2" />
                  {group.store.name}
                </Link>
                <span className={`badge ${group.deliveryFee === 0 ? "badge-success" : ""}`}>
                  <Truck />
                  {group.deliveryFee === 0 ? "Free delivery" : `${money(toFree)} more for free delivery`}
                </span>
              </header>
              <ul className="divide-y divide-border">
                {group.items.map((item) => (
                  <li key={item.key} className={`flex gap-4 p-4 sm:p-5 ${item.available ? "" : "opacity-55"}`}>
                    <Link href={`/product/${item.product.id}`} className="relative shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-[16px] bg-surface-2">
                      <Image src={item.product.images[0]} alt={item.product.name} fill sizes="96px" className="object-contain p-2" />
                    </Link>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex justify-between gap-3">
                        <Link href={`/product/${item.product.id}`} className="font-medium leading-snug hover:text-accent-text transition line-clamp-2">
                          {item.product.name}
                        </Link>
                        <p className="font-semibold shrink-0">{money(item.lineTotal)}</p>
                      </div>
                      <p className="mt-1 text-sm text-text-3">
                        {[item.size && `Size ${item.size}`, item.product.unit, `${money(item.price)} each`].filter(Boolean).join(" · ")}
                      </p>
                      {!item.available && <p className="mt-1 text-sm text-danger">Unavailable</p>}
                      {item.available && item.lowStock && <p className="mt-1 text-sm text-warning">Only {item.product.stock} left in stock</p>}
                      <div className="mt-auto pt-3 flex items-center justify-between">
                        <QtyStepper value={item.quantity} max={Math.min(10, item.product.stock)} onChange={(q) => cart.setQty(item.key, q)} />
                        <button className="btn btn-ghost btn-sm" onClick={() => cart.remove(item.key)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <aside className="card p-5 sm:p-6 lg:sticky lg:top-24 space-y-5">
        <h2 className="text-lg font-semibold">Order summary</h2>
        <CouponField subtotal={subtotal} coupon={coupon} onChange={setCoupon} />
        <dl className="space-y-2.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-text-2">
              Items ({count}) from {groups.length} {groups.length === 1 ? "store" : "stores"}
            </dt>
            <dd>{money(subtotal)}</dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-accent-text">
              <dt>Coupon {coupon.code}</dt>
              <dd>-{money(discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-text-2">Delivery</dt>
            <dd>{deliveryTotal ? money(deliveryTotal) : "Free"}</dd>
          </div>
          <div className="pt-3 border-t border-border flex justify-between text-base font-semibold">
            <dt>Total</dt>
            <dd>{money(total)}</dd>
          </div>
        </dl>
        <button className="btn btn-primary btn-lg btn-block" onClick={checkout} disabled={count === 0}>
          <Lock />
          {user ? "Checkout" : "Log in to checkout"}
        </button>
        <p className="flex items-start gap-2 text-xs text-text-3">
          <Store className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          Each store ships its part separately. Delivery is free on any store&apos;s items over {money(FREE_DELIVERY_OVER)}.
        </p>
      </aside>
    </div>
  );
}
