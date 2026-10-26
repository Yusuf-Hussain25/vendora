import ProductCard from "./ProductCard";

const COLS = {
  4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
};

export default function ProductGrid({ products, priorityCount = 0, columns = 4, showStore = false, className = "" }) {
  return (
    <div className={`grid ${COLS[columns]} gap-3 sm:gap-4 ${className}`}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} showStore={showStore} />
      ))}
    </div>
  );
}

export function ProductRail({ products, showStore = false }) {
  return (
    <div className="-mx-4 sm:mx-0 px-4 sm:px-0 flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1">
      {products.map((p) => (
        <div key={p.id} className="snap-start shrink-0 w-[46%] sm:w-[31%] lg:w-[23.5%] xl:w-[19%] flex">
          <ProductCard product={p} showStore={showStore} />
        </div>
      ))}
    </div>
  );
}
