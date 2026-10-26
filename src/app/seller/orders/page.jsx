import prisma from "@/lib/prisma";
import { requireSeller } from "@/lib/session";
import { placedOrder } from "@/lib/orders";
import { PageHeader } from "@/components/dashboard/Widgets";
import SellerOrders from "@/components/seller/SellerOrders";

export const metadata = { title: "Orders" };

export default async function SellerOrdersPage() {
  const user = await requireSeller();
  const orders = await prisma.order.findMany({
    where: { storeId: user.store.id, ...placedOrder },
    include: {
      items: true,
      user: { select: { name: true } },
      rider: { select: { name: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <>
      <PageHeader title="Orders" subtitle="Confirm new orders, then pack them so a nearby rider can pick them up." />
      <SellerOrders orders={orders} />
    </>
  );
}
