import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { stripeEnabled } from "@/lib/orders";
import CheckoutView from "@/components/cart/CheckoutView";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage({ searchParams }) {
  const user = await requireUser("/checkout");
  const { coupon } = await searchParams;
  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="container-x pt-8">
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-8">Checkout</h1>
      <CheckoutView addresses={addresses} userName={user.name} stripeEnabled={stripeEnabled} couponCode={coupon || null} />
    </div>
  );
}
