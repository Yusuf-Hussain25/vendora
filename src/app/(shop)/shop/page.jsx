import Image from "next/image";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { categoryBySlug } from "@/lib/catalog";
import { getSubCategories, searchProducts } from "@/lib/queries";
import ProductGrid from "@/components/product/ProductGrid";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/shop/Pagination";
import { ShopSidebar, ShopToolbar } from "@/components/shop/ShopFilters";

export async function generateMetadata({ searchParams }) {
  const { q, category } = await searchParams;
  if (q) return { title: `Results for “${q}”` };
  return { title: categoryBySlug(category)?.name || "Shop everything" };
}

export default async function ShopPage({ searchParams }) {
  const sp = await searchParams;
  const filters = {
    q: sp.q,
    category: categoryBySlug(sp.category) ? sp.category : undefined,
    sub: sp.sub,
    min: sp.min,
    max: sp.max,
    rating: sp.rating,
    deals: sp.deals === "1",
    inStock: sp.instock === "1",
    sort: sp.sort,
    page: sp.page,
  };
  const [{ items, total, page, pages }, subCategories] = await Promise.all([
    searchProducts(filters),
    getSubCategories(filters.category),
  ]);
  const category = categoryBySlug(filters.category);

  return (
    <div className="container-x pt-8">
      <header className="mb-8 grid md:grid-cols-[1fr_auto] gap-6 items-end border-b border-border pb-8">
        <div>
          <p className="eyebrow">{filters.q ? "Search" : category ? "Department" : "The marketplace"}</p>
          <h1 className="font-display mt-3 text-[44px] sm:text-[56px]">
            {filters.q ? <>Results for “{filters.q}”</> : category ? category.name : "Shop everything"}
          </h1>
          <p className="mt-2 text-text-2 text-[16px]">
            {category ? category.blurb : "Every product from every verified store, in one place."}
          </p>
        </div>
        {category && (
          <div className="relative hidden md:block w-[340px] aspect-[16/9] rounded-lg overflow-hidden bg-media">
            <Image src={`/images/categories/${category.slug}.jpg`} alt="" fill sizes="340px" className="object-cover" priority />
          </div>
        )}
      </header>

      <div className="flex gap-8">
        <ShopSidebar subCategories={subCategories} />
        <div className="flex-1 min-w-0">
          <ShopToolbar total={total} subCategories={subCategories} />
          {items.length ? (
            <>
              <ProductGrid products={items} priorityCount={4} />
              <Pagination page={page} pages={pages} searchParams={sp} />
            </>
          ) : (
            <EmptyState
              icon={SearchX}
              title="Nothing matches those filters"
              action={
                <Link href="/shop" className="btn btn-secondary">
                  Clear filters
                </Link>
              }
            >
              Try a different search term, widen the price range or remove a filter.
            </EmptyState>
          )}
        </div>
      </div>
    </div>
  );
}
