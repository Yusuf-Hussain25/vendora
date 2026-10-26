"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { toggleWishlist } from "@/actions/wishlist";

const WishlistContext = createContext(null);

export const useWishlist = () => useContext(WishlistContext);

export default function WishlistProvider({ signedIn, initialIds = [], children }) {
  const [ids, setIds] = useState(() => new Set(initialIds));
  const router = useRouter();

  const toggle = useCallback(
    async (productId) => {
      if (!signedIn) {
        toast("Log in to save items to your wishlist.", {
          action: { label: "Log in", onClick: () => router.push("/login") },
        });
        return;
      }
      const wasSaved = ids.has(productId);
      const flip = (saved) =>
        setIds((current) => {
          const next = new Set(current);
          if (saved) next.add(productId);
          else next.delete(productId);
          return next;
        });

      flip(!wasSaved);
      const result = await toggleWishlist(productId);
      if (result.error) {
        flip(wasSaved);
        toast.error(result.error);
      } else {
        toast.success(result.saved ? "Saved to your wishlist" : "Removed from your wishlist");
      }
    },
    [ids, signedIn, router]
  );

  const value = useMemo(() => ({ ids, has: (id) => ids.has(id), toggle }), [ids, toggle]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}
