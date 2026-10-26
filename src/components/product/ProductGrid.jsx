import ProductCard from "./ProductCard";

export default function ProductGrid({ products, priorityCount = 0, className = "" }) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 ${className}`}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}

export function ProductRail({ products }) {
  return (
    <div className="-mx-4 sm:mx-0 px-4 sm:px-0 flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2">
      {products.map((p) => (
        <div key={p.id} className="snap-start shrink-0 w-[46%] sm:w-[31%] lg:w-[23.5%]">
          <ProductCard product={p} />
        </div>
      ))}
    </div>
  );
}
