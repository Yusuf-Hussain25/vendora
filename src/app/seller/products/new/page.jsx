import { PageHeader } from "@/components/dashboard/Widgets";
import ProductForm from "@/components/seller/ProductForm";

export const metadata = { title: "Add product" };

export default function NewProductPage() {
  return (
    <>
      <PageHeader title="Add a product" subtitle="It goes live in your store as soon as you publish." />
      <ProductForm aiEnabled={Boolean(process.env.AI_API_KEY)} />
    </>
  );
}
