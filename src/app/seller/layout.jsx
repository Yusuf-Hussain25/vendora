import prisma from "@/lib/prisma";
import { requireSeller } from "@/lib/session";
import { placedOrder } from "@/lib/orders";
import DashboardShell from "@/components/dashboard/DashboardShell";

export const metadata = { title: { default: "Seller hub", template: "%s · Seller hub · Vendora" } };

export default async function SellerLayout({ children }) {
  const user = await requireSeller();
  const [newOrders, [{ low }]] = await Promise.all([
    prisma.order.count({ where: { storeId: user.store.id, status: "PLACED", ...placedOrder } }),
    // Live products at or below their low-stock alert level
    prisma.$queryRaw`SELECT COUNT(*)::int AS low FROM "Product" WHERE "storeId" = ${user.store.id} AND "isActive" AND stock <= "reorderLevel"`,
  ]);

  return (
    <DashboardShell
      area="seller"
      user={{ name: user.name, email: user.email, image: user.image }}
      subtitle={user.store.name}
      badges={{ orders: newOrders, inventory: low }}
    >
      {children}
    </DashboardShell>
  );
}
