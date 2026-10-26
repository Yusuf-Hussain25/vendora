import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, ChevronRight, MessageSquareText, Store } from "lucide-react";
import { categoryBySlug } from "@/lib/catalog";
import { getProduct } from "@/lib/queries";
import { shortDate, timeAgo } from "@/lib/format";
import Gallery from "@/components/product/Gallery";
import BuyBox from "@/components/product/BuyBox";
import ProductGrid from "@/components/product/ProductGrid";
import Stars from "@/components/ui/Stars";
import Avatar from "@/components/ui/Avatar";
import SectionHeader from "@/components/ui/SectionHeader";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const data = await getProduct(id);
  if (!data) return { title: "Product not found" };
  return { title: data.product.name, description: data.product.description.slice(0, 155) };
}

export default async function ProductPage({ params }) {
  const { id } = await params;
  const data = await getProduct(id);
  if (!data) notFound();
  const { product, related, storeProducts, breakdown } = data;
  const category = categoryBySlug(product.category);
  // The buy box only needs the purchasable fields, not the reviews
  const { ratings: _ratings, store: _store, ...buyable } = product;

  const details = [
    ["Brand", product.brand],
    ["Department", category?.name],
    ["Type", product.subCategory],
    ["Pack size", product.unit],
    ["Sizes", product.sizes.join(", ")],
    ["Sold", product.soldCount ? `${product.soldCount} so far` : null],
  ].filter(([, v]) => v);

  return (
    <div className="container-x pt-6">
      <nav className="flex items-center gap-1.5 text-sm text-text-3 mb-6 overflow-x-auto no-scrollbar whitespace-nowrap" aria-label="Breadcrumb">
        <Link href="/shop" className="hover:text-text transition">
          Shop
        </Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <Link href={`/shop?category=${product.category}`} className="hover:text-text transition">
          {category?.name}
        </Link>
        {product.subCategory && (
          <>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <Link href={`/shop?category=${product.category}&sub=${encodeURIComponent(product.subCategory)}`} className="hover:text-text transition">
              {product.subCategory}
            </Link>
          </>
        )}
      </nav>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-14">
        <Gallery images={product.images} name={product.name} />

        <div className="lg:pt-2">
          <Link href={`/store/${product.store.username}`} className="inline-flex items-center gap-1.5 text-sm text-accent-text hover:underline">
            {product.store.name}
            <BadgeCheck className="w-4 h-4" />
          </Link>
          <h1 className="mt-2 text-3xl sm:text-[40px] leading-tight font-semibold tracking-tight">{product.name}</h1>
          <div className="mt-3 flex items-center gap-3 text-sm">
            {product.ratingCount > 0 ? (
              <a href="#reviews" className="inline-flex items-center gap-2 hover:underline">
                <Stars value={product.ratingAvg} />
                <span className="text-text-2">
                  {product.ratingAvg.toFixed(1)} · {product.ratingCount} {product.ratingCount === 1 ? "review" : "reviews"}
                </span>
              </a>
            ) : (
              <span className="badge badge-accent">New arrival</span>
            )}
          </div>

          <div className="mt-7">
            <BuyBox product={buyable} />
          </div>

          <Link href={`/store/${product.store.username}`} className="mt-6 card !rounded-[20px] p-4 flex items-center gap-4 hover:border-border-strong transition">
            <Image src={product.store.logo} alt="" width={52} height={52} className="w-[52px] h-[52px] rounded-[16px] object-cover bg-surface-2" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold flex items-center gap-1.5">
                {product.store.name}
                <BadgeCheck className="w-4 h-4 text-accent-text" />
              </p>
              <p className="text-sm text-text-2 truncate">{product.store.tagline}</p>
              <p className="text-xs text-text-3 mt-0.5">
                {storeProducts} products · {product.store.city} · selling since {shortDate(product.store.createdAt)}
              </p>
            </div>
            <span className="btn btn-secondary btn-sm shrink-0 hidden sm:inline-flex">
              <Store />
              Visit
            </span>
          </Link>
        </div>
      </div>

      <div className="mt-16 grid lg:grid-cols-[1.3fr_1fr] gap-8">
        <section className="card p-6 sm:p-8">
          <h2 className="text-xl font-semibold tracking-tight">About this item</h2>
          <p className="mt-4 text-text-2 leading-relaxed whitespace-pre-line">{product.description}</p>
          {product.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {product.tags.map((t) => (
                <Link key={t} href={`/shop?q=${encodeURIComponent(t)}`} className="chip !h-8">
                  #{t}
                </Link>
              ))}
            </div>
          )}
        </section>
        <section className="card p-6 sm:p-8">
          <h2 className="text-xl font-semibold tracking-tight">Details</h2>
          <dl className="mt-4 divide-y divide-border">
            {details.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 py-3 text-sm">
                <dt className="text-text-3">{label}</dt>
                <dd className="text-right font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <section id="reviews" className="mt-8 card p-6 sm:p-8 scroll-mt-24">
        <h2 className="text-xl font-semibold tracking-tight">Customer reviews</h2>
        {product.ratingCount > 0 ? (
          <div className="mt-6 grid md:grid-cols-[260px_1fr] gap-8">
            <div>
              <p className="text-5xl font-semibold tracking-tight">{product.ratingAvg.toFixed(1)}</p>
              <Stars value={product.ratingAvg} size={18} className="mt-2" />
              <p className="mt-1.5 text-sm text-text-3">Based on {product.ratingCount} verified purchases</p>
              <div className="mt-5 space-y-2">
                {breakdown.map(({ stars, count }) => (
                  <div key={stars} className="flex items-center gap-3 text-sm">
                    <span className="w-3 text-text-2">{stars}</span>
                    <div className="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden">
                      <div className="h-full rounded-full bg-amber-400" style={{ width: `${(count / product.ratingCount) * 100}%` }} />
                    </div>
                    <span className="w-6 text-right text-text-3">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            <ul className="space-y-5">
              {product.ratings.map((r) => (
                <li key={r.id} className="pb-5 border-b border-border last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <Avatar src={r.user.image} name={r.user.name} size={38} />
                    <div>
                      <p className="text-sm font-semibold">{r.user.name}</p>
                      <p className="text-xs text-text-3 flex items-center gap-2">
                        <Stars value={r.rating} size={12} />
                        {timeAgo(r.createdAt)} · Verified purchase
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-[15px] text-text-2 leading-relaxed">{r.review}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt-6 flex items-center gap-4 text-text-2">
            <MessageSquareText className="w-6 h-6 text-text-3" />
            No reviews yet. Shoppers can review this item once their order is delivered.
          </div>
        )}
      </section>

      {related.length > 0 && (
        <section className="mt-16">
          <SectionHeader title="You might also like" href={`/shop?category=${product.category}`} />
          <ProductGrid products={related.slice(0, 4)} />
        </section>
      )}
    </div>
  );
}
