import Skeleton from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="container-x pt-6">
      <Skeleton className="h-4 w-56 mb-6" />
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-14">
        <Skeleton className="aspect-square w-full !rounded-[14px]" />
        <div className="space-y-4 pt-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-4/5" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-48 mt-8" />
          <Skeleton className="h-11 w-72" />
          <div className="flex gap-3 pt-4">
            <Skeleton className="h-[50px] flex-1 !rounded-full" />
            <Skeleton className="h-[50px] flex-1 !rounded-full" />
          </div>
          <Skeleton className="h-24 w-full !rounded-[12px]" />
        </div>
      </div>
    </div>
  );
}
