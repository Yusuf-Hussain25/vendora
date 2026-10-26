"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Banknote, Check, CreditCard, Lock, MapPin, Plus, ShieldCheck, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { placeOrder, previewCoupon } from "@/actions/orders";
import { useCart } from "@/components/providers/CartProvider";
import { round2 } from "@/lib/pricing";
import { money } from "@/lib/format";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import AddressForm from "@/components/account/AddressForm";
import useCartItems from "./useCartItems";
import CouponField from "./CouponField";

export default function CheckoutView({ addresses: initialAddresses, userName, stripeEnabled, couponCode }) {
  const cart = useCart();
  const router = useRouter();
  const { loading, groups, subtotal, deliveryTotal, count } = useCartItems();
  const [addresses, setAddresses] = useState(initialAddresses);
  const [addressId, setAddressId] = useState(initialAddresses.find((a) => a.isDefault)?.id || initialAddresses[0]?.id);
  const [adding, setAdding] = useState(false);
  const [payment, setPayment] = useState("COD");
  const [coupon, setCoupon] = useState(null);
  const [placing, setPlacing] = useState(false);

  // Carry a coupon applied in the cart over to checkout, once the subtotal is known
  useEffect(() => {
    if (!couponCode || loading || !subtotal) return;
    let cancelled = false;
    previewCoupon(couponCode, subtotal).then((r) => !cancelled && r.coupon && setCoupon(r.coupon));
    return () => {
      cancelled = true;
    };
  }, [couponCode, loading, subtotal]);

  const discount = coupon ? round2((subtotal * coupon.discount) / 100) : 0;
  const total = round2(subtotal - discount + deliveryTotal);

  if (!cart.ready || loading) {
    return (
      <div className="grid lg:grid-cols-[1fr_400px] gap-6">
        <div className="space-y-4">
          <Skeleton className="h-48 w-full !rounded-[12px]" />
          <Skeleton className="h-40 w-full !rounded-[12px]" />
        </div>
        <Skeleton className="h-96 w-full !rounded-[12px]" />
      </div>
    );
  }

  if (!count) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Nothing to check out"
        action={
          <Link href="/shop" className="btn btn-primary">
            Browse the shop
          </Link>
        }
      >
        Your cart is empty, or everything in it is unavailable.
      </EmptyState>
    );
  }

  const submit = async () => {
    if (!addressId) {
      toast.error("Add a delivery address first.");
      return;
    }
    setPlacing(true);
    const result = await placeOrder({ lines: cart.lines, addressId, couponCode: coupon?.code, paymentMethod: payment });
    if (result.error) {
      toast.error(result.error);
      setPlacing(false);
      return;
    }
    if (payment === "COD") {
      cart.clear();
      toast.success(groups.length > 1 ? `Order placed with ${groups.length} stores` : "Order placed");
      router.push(result.redirect);
      router.refresh();
    } else {
      window.location.assign(result.redirect);
    }
  };

  const paymentOptions = [
    { value: "COD", icon: Banknote, title: "Cash on delivery", text: "Pay the rider when your order arrives." },
    ...(stripeEnabled ? [{ value: "STRIPE", icon: CreditCard, title: "Card", text: "Secure checkout with Stripe (test mode)." }] : []),
  ];

  return (
    <div className="grid lg:grid-cols-[1fr_400px] gap-6 items-start">
      <div className="space-y-5">
        <section className="card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="grid place-items-center w-7 h-7 rounded-full bg-accent-soft text-accent-text text-sm">1</span>
              Delivery address
            </h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setAdding(true)}>
              <Plus />
              Add new
            </button>
          </div>
          {addresses.length ? (
            <div className="grid sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Delivery address">
              {addresses.map((a) => (
                <button
                  key={a.id}
                  role="radio"
                  aria-checked={addressId === a.id}
                  onClick={() => setAddressId(a.id)}
                  className={`text-left rounded-[10px] border p-4 transition ${
                    addressId === a.id ? "border-accent bg-accent-soft ring-2 ring-accent-soft" : "border-border bg-surface hover:border-border-strong"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="badge">
                      <MapPin />
                      {a.label}
                    </span>
                    {addressId === a.id && <Check className="w-4 h-4 text-accent-text" />}
                  </div>
                  <p className="mt-3 text-sm font-semibold">{a.name}</p>
                  <p className="text-sm text-text-2">{a.street}</p>
                  <p className="text-sm text-text-2">
                    {a.city}, {a.state} {a.zip}
                  </p>
                  <p className="text-xs text-text-3 mt-1">{a.phone}</p>
                </button>
              ))}
            </div>
          ) : (
            <button onClick={() => setAdding(true)} className="w-full rounded-[10px] border border-dashed border-border-strong p-6 text-sm text-text-2 hover:text-text hover:border-accent transition">
              <Plus className="w-5 h-5 mx-auto mb-2" />
              Add your delivery address
            </button>
          )}
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <span className="grid place-items-center w-7 h-7 rounded-full bg-accent-soft text-accent-text text-sm">2</span>
            Payment
          </h2>
          <div className="grid sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Payment method">
            {paymentOptions.map(({ value, icon: Icon, title, text }) => (
              <button
                key={value}
                role="radio"
                aria-checked={payment === value}
                onClick={() => setPayment(value)}
                className={`text-left rounded-[10px] border p-4 flex gap-3 transition ${
                  payment === value ? "border-accent bg-accent-soft ring-2 ring-accent-soft" : "border-border bg-surface hover:border-border-strong"
                }`}
              >
                <Icon className="w-5 h-5 text-accent-text shrink-0 mt-0.5" />
                <span>
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="block text-xs text-text-3 mt-0.5">{text}</span>
                </span>
              </button>
            ))}
          </div>
          {!stripeEnabled && <p className="mt-3 text-xs text-text-3">Card payments appear here once a Stripe key is configured.</p>}
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <span className="grid place-items-center w-7 h-7 rounded-full bg-accent-soft text-accent-text text-sm">3</span>
            Review items
          </h2>
          <div className="space-y-5">
            {groups.map((g) => (
              <div key={g.store.id}>
                <div className="flex items-center justify-between text-sm mb-2.5">
                  <span className="font-semibold">{g.store.name}</span>
                  <span className="text-text-3">Delivery {g.deliveryFee ? money(g.deliveryFee) : "free"}</span>
                </div>
                <ul className="space-y-2.5">
                  {g.items
                    .filter((i) => i.available)
                    .map((i) => (
                      <li key={i.key} className="flex items-center gap-3">
                        <span className="relative w-12 h-12 rounded-[12px] bg-surface-2 shrink-0">
                          <Image src={i.product.images[0]} alt="" fill sizes="48px" className="object-contain p-1" />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm truncate">{i.product.name}</span>
                          <span className="block text-xs text-text-3">
                            {[i.size && `Size ${i.size}`, i.product.unit, `Qty ${i.quantity}`].filter(Boolean).join(" · ")}
                          </span>
                        </span>
                        <span className="text-sm font-medium">{money(i.lineTotal)}</span>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>

      <aside className="card p-5 sm:p-6 lg:sticky lg:top-24 space-y-5">
        <h2 className="text-lg font-semibold">Order total</h2>
        <CouponField subtotal={subtotal} coupon={coupon} onChange={setCoupon} />
        <dl className="space-y-2.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-text-2">Items ({count})</dt>
            <dd>{money(subtotal)}</dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-accent-text">
              <dt>Coupon {coupon.code}</dt>
              <dd>-{money(discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-text-2">
              Delivery ({groups.length} {groups.length === 1 ? "store" : "stores"})
            </dt>
            <dd>{deliveryTotal ? money(deliveryTotal) : "Free"}</dd>
          </div>
          <div className="pt-3 border-t border-border flex justify-between text-base font-semibold">
            <dt>Total</dt>
            <dd>{money(total)}</dd>
          </div>
        </dl>
        <button className="btn btn-primary btn-lg btn-block" onClick={submit} disabled={placing || !addressId}>
          {placing ? <span className="spinner" /> : <Lock />}
          {payment === "STRIPE" ? `Pay ${money(total)}` : `Place order · ${money(total)}`}
        </button>
        <p className="flex items-start gap-2 text-xs text-text-3">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          You&apos;ll get a 4-digit delivery code. Your order is only marked delivered when you share it with the rider.
        </p>
      </aside>

      <Modal open={adding} onClose={() => setAdding(false)} title="New delivery address" size="lg">
        <AddressForm
          defaultName={userName}
          onCancel={() => setAdding(false)}
          onSaved={(address) => {
            setAddresses((list) => [...list.map((a) => (address.isDefault ? { ...a, isDefault: false } : a)), address]);
            setAddressId(address.id);
            setAdding(false);
          }}
        />
      </Modal>
    </div>
  );
}
