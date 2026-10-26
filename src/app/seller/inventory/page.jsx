import { requireSeller } from "@/lib/session";
import { getInventory } from "@/lib/inventory";
import { PageHeader } from "@/components/dashboard/Widgets";
import InventoryView from "@/components/inventory/InventoryView";

export const metadata = { title: "Inventory" };

export default async function SellerInventory() {
  const user = await requireSeller();
  const { rows, summary } = await getInventory({ storeId: user.store.id });

  return (
    <>
      <PageHeader
        title="Inventory"
        subtitle={
          summary.toRestock
            ? `${summary.toRestock} ${summary.toRestock === 1 ? "product needs" : "products need"} restocking. Everything else is listed below with what to do next.`
            : "Every product, its stock and what to do next."
        }
      />
      <InventoryView rows={rows} summary={summary} />
    </>
  );
}
