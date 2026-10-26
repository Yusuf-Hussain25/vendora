"use client";

import { useEffect, useMemo, useState } from "react";
import { getCartProducts } from "@/actions/cart";
import { useCart } from "@/components/providers/CartProvider";
import { deliveryFeeFor, effectivePrice, parseLineKey, round2 } from "@/lib/pricing";

// Joins cart lines with live product data and works out per-store totals.
export default function useCartItems() {
  const cart = useCart();
  const [products, setProducts] = useState(null);
  const keys = Object.keys(cart.lines);
  const idsKey = [...new Set(keys.map((k) => parseLineKey(k).productId))].sort().join(",");

  useEffect(() => {
    if (!cart.ready) return;
    let cancelled = false;
    const ids = idsKey ? idsKey.split(",") : [];
    // Only refetch when the set of products changes, not on quantity changes
    getCartProducts(ids).then((rows) => !cancelled && setProducts(rows));
    return () => {
      cancelled = true;
    };
  }, [idsKey, cart.ready]);

  return useMemo(() => {
    if (!products) return { loading: true, groups: [], items: [], subtotal: 0, deliveryTotal: 0, unavailable: [], count: 0 };
    const byId = Object.fromEntries(products.map((p) => [p.id, p]));

    const items = Object.entries(cart.lines)
      .map(([key, quantity]) => {
        const { productId, size } = parseLineKey(key);
        const product = byId[productId];
        if (!product) return { key, quantity, missing: true };
        const available = product.isActive && product.store.status === "APPROVED" && product.store.isActive && product.stock > 0;
        const price = effectivePrice(product);
        return { key, size, quantity, product, price, available, lowStock: product.stock < quantity, lineTotal: round2(price * quantity) };
      })
      .filter(Boolean);

    const groups = [];
    for (const item of items.filter((i) => !i.missing)) {
      let group = groups.find((g) => g.store.id === item.product.store.id);
      if (!group) groups.push((group = { store: item.product.store, items: [], subtotal: 0 }));
      group.items.push(item);
      if (item.available) group.subtotal = round2(group.subtotal + item.lineTotal);
    }
    for (const g of groups) g.deliveryFee = g.subtotal > 0 ? deliveryFeeFor(g.subtotal) : 0;

    const subtotal = round2(groups.reduce((s, g) => s + g.subtotal, 0));
    const deliveryTotal = round2(groups.reduce((s, g) => s + g.deliveryFee, 0));
    // Keys of lines that can't be ordered (deleted, disabled or sold-out products)
    const unavailable = items.filter((i) => i.missing || !i.available).map((i) => i.key);
    const count = items.filter((i) => i.available).reduce((s, i) => s + i.quantity, 0);
    return { loading: false, groups, items, subtotal, deliveryTotal, unavailable, count };
  }, [products, cart.lines]);
}
