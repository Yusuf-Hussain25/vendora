import Link from "next/link";
import { Plus } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireSeller } from "@/lib/session";
import { PageHeader } from "@/components/dashboard/Widgets";
import ProductsTable from "@/components/seller/ProductsTable";

export const metadata = { title: "Products" };

export default async function SellerProducts() {
  const user = await requireSeller();
  const products = await prisma.product.findMany({
    where: { storeId: user.store.id },
    select: {
      id: true,
      name: true,
      images: true,
      category: true,
      subCategory: true,
      price: true,
      mrp: true,
      dealPrice: true,
      dealEndsAt: true,
      stock: true,
      isActive: true,
      soldCount: true,
      ratingAvg: true,
      ratingCount: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader title="Products" subtitle={`${products.length} listed in ${user.store.name}`}>
        <Link href="/seller/products/new" className="btn btn-primary">
          <Plus />
          Add product
        </Link>
      </PageHeader>
      <ProductsTable products={products} />
    </>
  );
}
