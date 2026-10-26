import { requireSeller } from "@/lib/session";
import { PageHeader } from "@/components/dashboard/Widgets";
import StoreForm from "@/components/seller/StoreForm";

export const metadata = { title: "Store settings" };

export default async function SellerSettings() {
  const user = await requireSeller();
  return (
    <>
      <PageHeader title="Store settings" subtitle="This is what shoppers see on your store page." />
      <div className="max-w-3xl">
        <StoreForm store={user.store} mode="edit" />
      </div>
    </>
  );
}
