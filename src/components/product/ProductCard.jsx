"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Plus, Star, Timer } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/components/providers/CartProvider";
import { useWishlist } from "@/components/providers/WishlistProvider";
import { effectivePrice, isDealLive } from "@/lib/pricing";
import { money, percentOff } from "@/lib/format";
import DealCountdown from "./DealCountdown";

export default function ProductCard({ product, priority = false }) {
  const { add } = useCart();
  const wishlist = useWishlist();
  const router = useRouter();

  const deal = isDealLive(product);
  const price = effectivePrice(product);
  const off = percentOff(product.mrp, price);
  const saved = wishlist.has(product.id);
  const soldOut = product.stock <= 0;

  const quickAdd = () => {
    // Sized items need a size choice, so send the shopper to the product page
    if (product.sizes?.length) {
      router.push(`/product/${product.id}`);
      return;
    }
    add(product.id);
    toast.success(`Added ${product.name} to your cart`, {
      action: { label: "View cart", onClick: () => router.push("/cart") },
    });
  };

  return (
    <article className="group card p-2.5 flex flex-col transition duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-border-strong">
      <div className="relative aspect-square overflow-hidden rounded-[16px] bg-surface-2">
        <Link href={`/product/${product.id}`} aria-label={product.name} className="relative block w-full h-full">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            priority={priority}
            className="object-contain p-3 transition duration-500 group-hover:scale-[1.06]"
          />
        </Link>
        <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
          {deal ? (
            <span className="badge badge-deal shadow-sm">
              <Timer />
              <DealCountdown endsAt={product.dealEndsAt} />
            </span>
          ) : (
            off >= 10 && <span className="badge bg-panel-solid/90 text-text shadow-sm">-{off}%</span>
          )}
          {!soldOut && product.stock <= 5 && <span className="badge badge-warning">Only {product.stock} left</span>}
        </div>
        <button
          onClick={() => wishlist.toggle(product.id)}
          className={`absolute top-2 right-2 grid place-items-center w-9 h-9 rounded-full bg-panel-solid/85 backdrop-blur border border-border transition hover:scale-110 ${
            saved ? "text-deal" : "text-text-2 hover:text-text"
          }`}
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={saved}
        >
          <Heart className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />
        </button>
      </div>

      <div className="flex flex-col flex-1 px-1.5 pt-3 pb-1">
        <Link href={`/store/${product.store.username}`} className="text-xs text-text-3 hover:text-accent-text truncate transition">
          {product.store.name}
        </Link>
        <Link href={`/product/${product.id}`} className="mt-1 text-[14.5px] font-medium leading-snug line-clamp-2 hover:text-accent-text transition">
          {product.name}
        </Link>
        <div className="mt-1.5 flex items-center gap-2 text-xs text-text-3">
          {product.ratingCount > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-text-2 font-medium">{product.ratingAvg.toFixed(1)}</span>({product.ratingCount})
            </span>
          ) : (
            <span>New</span>
          )}
          {product.unit && <span>· {product.unit}</span>}
        </div>
        <div className="mt-auto pt-3 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className={`text-[17px] font-semibold tracking-tight ${deal ? "text-deal" : ""}`}>{money(price)}</p>
            {off > 0 && <p className="text-xs text-text-3 line-through">{money(product.mrp)}</p>}
          </div>
          <button
            onClick={quickAdd}
            disabled={soldOut}
            className="btn btn-secondary btn-icon btn-sm shrink-0 hover:!bg-accent hover:!text-white hover:!border-transparent"
            aria-label={soldOut ? `${product.name} is sold out` : product.sizes?.length ? `Choose a size for ${product.name}` : `Add ${product.name} to cart`}
            title={soldOut ? "Sold out" : product.sizes?.length ? "Choose size" : "Add to cart"}
          >
            <Plus />
          </button>
        </div>
      </div>
    </article>
  );
}
