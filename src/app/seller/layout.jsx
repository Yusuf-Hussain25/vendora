import prisma from "@/lib/prisma";
import { requireSeller } from "@/lib/session";
import { placedOrder } from "@/lib/orders";
import DashboardShell from "@/components/dashboard/DashboardShell";

export const metadata = { title: { default: "Seller hub", template: "%s · Seller hub · Vendora" } };

export default async function SellerLayout({ children }) {
  const user = await requireSeller();
  const newOrders = await prisma.order.count({ where: { storeId: user.store.id, status: "PLACED", ...placedOrder } });

  return (
    <DashboardShell
      area="seller"
      user={{ name: user.name, email: user.email, image: user.image }}
      subtitle={user.store.name}
      badges={{ orders: newOrders }}
    >
      {children}
    </DashboardShell>
  );
}
