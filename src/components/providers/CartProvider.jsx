"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { saveCart } from "@/actions/cart";
import { lineKey } from "@/lib/pricing";

const STORAGE_KEY = "vendora-cart";
const MAX_QTY = 10;

const CartContext = createContext(null);

export const useCart = () => useContext(CartContext);

const readGuestCart = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {};
  } catch {
    return {};
  }
};

const writeGuestCart = (lines) => {
  try {
    if (Object.keys(lines).length) localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage unavailable: the cart still works for this visit
  }
};

// Guests keep their cart in localStorage; signed-in shoppers keep it on their account.
// A guest cart is merged into the account cart the first time they sign in.
export default function CartProvider({ signedIn, initialCart, children }) {
  const [lines, setLines] = useState(() => (signedIn ? initialCart || {} : {}));
  const [ready, setReady] = useState(signedIn);
  const saveTimer = useRef(null);
  const skipNextSave = useRef(true);

  useEffect(() => {
    const guest = readGuestCart();
    if (!signedIn) {
      // Restore the guest cart from this browser after hydration
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser storage can only happen after mount
      setLines(guest);
      setReady(true);
      return;
    }
    if (Object.keys(guest).length) {
      setLines((current) => {
        const merged = { ...current };
        for (const [key, qty] of Object.entries(guest)) merged[key] = Math.min((merged[key] || 0) + qty, MAX_QTY);
        return merged;
      });
      writeGuestCart({});
      skipNextSave.current = false;
    }
  }, [signedIn]);

  useEffect(() => {
    if (!ready) return;
    if (!signedIn) {
      writeGuestCart(lines);
      return;
    }
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveCart(lines), 350);
    return () => clearTimeout(saveTimer.current);
  }, [lines, ready, signedIn]);

  const add = useCallback((productId, { size = null, qty = 1 } = {}) => {
    const key = lineKey(productId, size);
    setLines((current) => ({ ...current, [key]: Math.min((current[key] || 0) + qty, MAX_QTY) }));
  }, []);

  const setQty = useCallback((key, qty) => {
    setLines((current) => {
      const next = { ...current };
      if (qty <= 0) delete next[key];
      else next[key] = Math.min(qty, MAX_QTY);
      return next;
    });
  }, []);

  const remove = useCallback((key) => setQty(key, 0), [setQty]);

  const clear = useCallback(() => setLines({}), []);

  const value = useMemo(() => {
    const count = Object.values(lines).reduce((sum, qty) => sum + qty, 0);
    return { lines, count, ready, add, setQty, remove, clear };
  }, [lines, ready, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
