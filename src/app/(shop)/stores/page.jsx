import Link from "next/link";
import { Store } from "lucide-react";
import { getStoresWithStats } from "@/lib/queries";
import StoreCard from "@/components/store/StoreCard";
import EmptyState from "@/components/ui/EmptyState";

export const metadata = { title: "Stores" };

export default async function StoresPage() {
  const stores = await getStoresWithStats();

  return (
    <div className="container-x pt-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Independent sellers</p>
          <h1 className="font-display mt-3 text-[44px] sm:text-[56px]">Stores on Vendora</h1>
          <p className="mt-1.5 text-text-2">{stores.length} independent sellers, each reviewed before going live.</p>
        </div>
        <Link href="/sell" className="btn btn-secondary">
          <Store />
          Open your store
        </Link>
      </header>
      {stores.length ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map((s) => (
            <StoreCard key={s.id} store={s} />
          ))}
        </div>
      ) : (
        <EmptyState icon={Store} title="No stores yet">
          The first sellers are getting set up. Check back soon.
        </EmptyState>
      )}
    </div>
  );
}
