import { getInventory } from "@/lib/inventory";
import { PageHeader } from "@/components/dashboard/Widgets";
import InventoryView from "@/components/inventory/InventoryView";

export const metadata = { title: "Inventory" };

// The admin layout already restricts this area to admins
export default async function AdminInventory() {
  const { rows, summary } = await getInventory();
  return (
    <>
      <PageHeader title="Inventory" subtitle="Stock across every live store. Sellers restock and count their own shelves; this view is read-only." />
      <InventoryView rows={rows} summary={summary} readOnly showStore />
    </>
  );
}
