"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShoppingCart, Star, Timer } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/components/providers/CartProvider";
import { useWishlist } from "@/components/providers/WishlistProvider";
import { effectivePrice, isDealLive } from "@/lib/pricing";
import { categoryBySlug } from "@/lib/catalog";
import { money, numberCompact, percentOff } from "@/lib/format";
import DealCountdown from "./DealCountdown";

export default function ProductCard({ product, priority = false, showStore = false }) {
  const { add } = useCart();
  const wishlist = useWishlist();
  const router = useRouter();

  const deal = isDealLive(product);
  const price = effectivePrice(product);
  const off = percentOff(product.mrp, price);
  const saved = wishlist.has(product.id);
  const soldOut = product.stock <= 0;
  const needsSize = product.sizes?.length > 0;

  const quickAdd = () => {
    // Sized items need a size choice, so send the shopper to the product page
    if (needsSize) {
      router.push(`/product/${product.id}`);
      return;
    }
    add(product.id);
    toast.success(`Added ${product.name} to your cart`, {
      action: { label: "View cart", onClick: () => router.push("/cart") },
    });
  };

  return (
    <article className="group relative flex flex-col bg-panel border border-border rounded-lg overflow-hidden transition-colors duration-200 hover:border-border-strong">
      <div className="relative aspect-square bg-media overflow-hidden">
        <Link href={`/product/${product.id}`} aria-label={product.name} className="relative block w-full h-full">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 20vw"
            priority={priority}
            className="object-contain p-5 blend-media transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        </Link>
        <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1">
          {off >= 5 && <span className="badge badge-sale">{off}% OFF</span>}
          {soldOut ? (
            <span className="badge">Sold out</span>
          ) : (
            product.stock <= 5 && <span className="badge bg-panel text-warning">Only {product.stock} left</span>
          )}
        </div>
        <button
          onClick={() => wishlist.toggle(product.id)}
          className={`absolute top-2 right-2 grid place-items-center w-9 h-9 rounded-full bg-panel/90 border border-border transition-colors ${
            saved ? "text-sale" : "text-text-2 hover:text-text"
          }`}
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={saved}
        >
          <Heart className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />
        </button>
        {deal && (
          <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 h-6 px-2 rounded-sm bg-forest text-ivory text-[11px] font-medium">
            <Timer className="w-3 h-3" />
            Ends in <DealCountdown endsAt={product.dealEndsAt} />
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 p-3.5 pt-3">
        <Link href={`/product/${product.id}`} className="text-[14px] font-medium leading-snug line-clamp-2 hover:underline underline-offset-4 decoration-1">
          {product.name}
        </Link>
        <Link
          href={showStore ? `/store/${product.store.username}` : `/shop?category=${product.category}`}
          className="mt-0.5 text-[12.5px] text-text-3 hover:text-text-2 truncate"
        >
          {showStore ? product.store.name : product.subCategory || categoryBySlug(product.category)?.name}
          {product.unit && ` · ${product.unit}`}
        </Link>

        <div className="mt-auto pt-3 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="flex items-baseline flex-wrap gap-x-1.5">
              <span className={`text-[17px] font-semibold tracking-tight ${off > 0 ? "text-sale" : ""}`}>{money(price)}</span>
              {off > 0 && <span className="text-[12.5px] text-text-3 line-through">{money(product.mrp)}</span>}
            </p>
            <p className="mt-1 h-4 flex items-center gap-1 text-[12px] text-text-3">
              {product.ratingCount > 0 ? (
                <>
                  <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                  <span className="text-text-2 font-medium">{product.ratingAvg.toFixed(1)}</span>({numberCompact(product.ratingCount)})
                </>
              ) : (
                <span>New</span>
              )}
            </p>
          </div>
          <button
            onClick={quickAdd}
            disabled={soldOut}
            className="grid place-items-center w-9 h-9 shrink-0 rounded-md bg-accent text-on-accent transition-colors hover:bg-accent-strong disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={soldOut ? `${product.name} is sold out` : needsSize ? `Choose a size for ${product.name}` : `Add ${product.name} to cart`}
            title={soldOut ? "Sold out" : needsSize ? "Choose size" : "Add to cart"}
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
