import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireSeller } from "@/lib/session";
import { PageHeader } from "@/components/dashboard/Widgets";
import ProductForm from "@/components/seller/ProductForm";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params }) {
  const { id } = await params;
  const user = await requireSeller();
  const product = await prisma.product.findFirst({
    where: { id, storeId: user.store.id },
    select: {
      id: true,
      name: true,
      description: true,
      brand: true,
      category: true,
      subCategory: true,
      unit: true,
      price: true,
      mrp: true,
      stock: true,
      tags: true,
      images: true,
      sizes: true,
    },
  });
  if (!product) notFound();

  return (
    <>
      <PageHeader title="Edit product" subtitle={product.name} />
      <ProductForm product={product} aiEnabled={Boolean(process.env.AI_API_KEY)} />
    </>
  );
}
