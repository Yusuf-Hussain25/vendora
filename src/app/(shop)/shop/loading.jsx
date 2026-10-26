import Skeleton, { ProductGridSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="container-x pt-8">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-4 w-96 max-w-full mt-3" />
      <div className="flex gap-8 mt-8">
        <Skeleton className="hidden lg:block w-64 h-[560px] shrink-0 !rounded-[22px]" />
        <div className="flex-1">
          <Skeleton className="h-8 w-40 mb-5" />
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    </div>
  );
}
