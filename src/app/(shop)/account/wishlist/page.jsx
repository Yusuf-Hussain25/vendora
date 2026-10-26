import Link from "next/link";
import { Heart } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { productCardSelect, visibleProduct } from "@/lib/queries";
import ProductGrid from "@/components/product/ProductGrid";
import EmptyState from "@/components/ui/EmptyState";

export const metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const user = await requireUser("/account/wishlist");
  const saved = await prisma.wishlistItem.findMany({
    where: { userId: user.id, product: visibleProduct },
    include: { product: { select: productCardSelect } },
    orderBy: { createdAt: "desc" },
  });

  if (!saved.length) {
    return (
      <EmptyState
        icon={Heart}
        title="Nothing saved yet"
        action={
          <Link href="/shop" className="btn btn-primary">
            Find something you love
          </Link>
        }
      >
        Tap the heart on any product to keep it here for later.
      </EmptyState>
    );
  }

  return (
    <>
      <p className="text-sm text-text-2 mb-4">
        {saved.length} saved {saved.length === 1 ? "item" : "items"}
      </p>
      <ProductGrid products={saved.map((s) => s.product)} />
    </>
  );
}
