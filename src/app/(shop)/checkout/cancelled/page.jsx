import { requireUser } from "@/lib/session";
import CancelledCheckout from "@/components/cart/CancelledCheckout";

export const metadata = { title: "Payment cancelled" };

export default async function CheckoutCancelledPage({ searchParams }) {
  await requireUser("/cart");
  const { checkout } = await searchParams;
  return <CancelledCheckout checkoutId={checkout || null} />;
}
