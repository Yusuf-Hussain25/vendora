"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bike, Heart, Minus, Plus, RotateCcw, ShieldCheck, ShoppingBag, Timer, Zap } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/components/providers/CartProvider";
import { useWishlist } from "@/components/providers/WishlistProvider";
import { effectivePrice, FREE_DELIVERY_OVER, isDealLive } from "@/lib/pricing";
import { money } from "@/lib/format";
import Price from "@/components/ui/Price";
import DealCountdown from "./DealCountdown";

export default function BuyBox({ product }) {
  const { add } = useCart();
  const wishlist = useWishlist();
  const router = useRouter();
  const [size, setSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [sizeError, setSizeError] = useState(false);

  const deal = isDealLive(product);
  const price = effectivePrice(product);
  const needsSize = product.sizes.length > 0;
  const soldOut = product.stock <= 0;
  const saved = wishlist.has(product.id);
  const maxQty = Math.min(10, product.stock);

  const addToCart = (goToCart = false) => {
    if (needsSize && !size) {
      setSizeError(true);
      toast.error("Please choose a size first.");
      return;
    }
    add(product.id, { size, qty });
    if (goToCart) {
      router.push("/cart");
      return;
    }
    toast.success(`Added ${qty} × ${product.name}${size ? ` (${size})` : ""}`, {
      action: { label: "View cart", onClick: () => router.push("/cart") },
    });
  };

  return (
    <div className="space-y-6">
      {deal && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] px-4 py-3 bg-sale-soft border border-sale/30">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-deal">
            <Zap className="w-4 h-4 fill-current" />
            Flash deal
          </span>
          <span className="inline-flex items-center gap-2 text-sm text-text-2">
            <Timer className="w-4 h-4" />
            Ends in <DealCountdown endsAt={product.dealEndsAt} className="font-semibold text-text" />
          </span>
        </div>
      )}

      <div>
        <Price price={price} mrp={product.mrp} size="lg" />
        <p className="mt-1 text-sm text-text-3">
          {product.unit ? `Per ${product.unit} · ` : ""}Inclusive of all taxes
        </p>
      </div>

      {needsSize && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-sm font-semibold">
              Size{size && <span className="text-text-2 font-normal">: {size}</span>}
            </p>
            {sizeError && !size && <p className="text-xs text-danger">Choose a size</p>}
          </div>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Size">
            {product.sizes.map((s) => (
              <button
                key={s}
                role="radio"
                aria-checked={size === s}
                onClick={() => setSize(s)}
                className={`min-w-[52px] h-11 px-3 rounded-[8px] border text-sm font-medium transition ${
                  size === s
                    ? "border-accent bg-accent-soft text-accent-text ring-2 ring-accent-soft"
                    : `border-border bg-surface hover:border-border-strong ${sizeError && !size ? "border-danger/60" : ""}`
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="inline-flex items-center h-12 rounded-full border border-border bg-surface">
          <button className="btn btn-ghost btn-icon !h-12 !w-12" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1 || soldOut} aria-label="Decrease quantity">
            <Minus />
          </button>
          <span className="w-8 text-center font-semibold tabular-nums" aria-live="polite">
            {qty}
          </span>
          <button className="btn btn-ghost btn-icon !h-12 !w-12" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={qty >= maxQty || soldOut} aria-label="Increase quantity">
            <Plus />
          </button>
        </div>
        <p className={`text-sm ${product.stock <= 5 ? "text-warning" : "text-text-2"}`}>
          {soldOut ? "Sold out" : product.stock <= 5 ? `Only ${product.stock} left` : "In stock"}
        </p>
      </div>

      <div className="flex gap-3">
        <button className="btn btn-primary btn-lg flex-1" onClick={() => addToCart(false)} disabled={soldOut}>
          <ShoppingBag />
          Add to cart
        </button>
        <button className="btn btn-secondary btn-lg flex-1" onClick={() => addToCart(true)} disabled={soldOut}>
          Buy now
        </button>
        <button
          className={`btn btn-secondary btn-lg btn-icon shrink-0 ${saved ? "!text-deal" : ""}`}
          onClick={() => wishlist.toggle(product.id)}
          aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
          aria-pressed={saved}
        >
          <Heart className={saved ? "fill-current" : ""} />
        </button>
      </div>

      <ul className="grid sm:grid-cols-3 gap-2.5">
        {[
          [Bike, "Same-day delivery", `Free over ${money(FREE_DELIVERY_OVER)} per store`],
          [ShieldCheck, "Code-protected", "Handed over with your code"],
          [RotateCcw, "Easy returns", "Within 7 days of delivery"],
        ].map(([Icon, title, text]) => (
          <li key={title} className="rounded-[10px] border border-border bg-surface p-3.5">
            <Icon className="w-[18px] h-[18px] text-accent-text" />
            <p className="mt-2 text-sm font-medium">{title}</p>
            <p className="text-xs text-text-3 mt-0.5">{text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
