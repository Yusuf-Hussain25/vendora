"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CircleX } from "lucide-react";
import { cancelUnpaidCheckout } from "@/actions/orders";

export default function CancelledCheckout({ checkoutId }) {
  const [released, setReleased] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    // Release the reserved stock once (the effect can run twice in development)
    if (!checkoutId || ran.current) return;
    ran.current = true;
    cancelUnpaidCheckout(checkoutId).then((r) => r.ok && setReleased(true));
  }, [checkoutId]);

  return (
    <div className="container-x pt-16 max-w-lg text-center">
      <span className="mx-auto grid place-items-center w-16 h-16 rounded-[12px] bg-surface-2 text-text-2">
        <CircleX className="w-8 h-8" />
      </span>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Payment cancelled</h1>
      <p className="mt-3 text-text-2">
        No money was taken. Your cart is just as you left it{released ? " and the items are back in stock" : ""}.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/cart" className="btn btn-primary">
          Back to cart
        </Link>
        <Link href="/shop" className="btn btn-secondary">
          Keep shopping
        </Link>
      </div>
    </div>
  );
}
