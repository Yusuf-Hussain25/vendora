import Link from "next/link";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { requireUser } from "@/lib/session";
import { markCheckoutPaid, stripe } from "@/lib/orders";

export const metadata = { title: "Payment received" };

export default async function CheckoutSuccessPage({ searchParams }) {
  const user = await requireUser("/account/orders");
  const { session_id: sessionId } = await searchParams;

  // Confirm with Stripe directly rather than trusting the redirect URL
  let paid = false;
  let checkoutId = null;
  if (stripe && sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === "paid" && session.metadata?.userId === user.id) {
        checkoutId = session.metadata.checkoutId;
        paid = (await markCheckoutPaid(checkoutId, user.id)) > 0;
      }
    } catch (error) {
      console.error("Stripe session lookup failed", error);
    }
  }

  return (
    <div className="container-x pt-16 max-w-lg text-center">
      <span className={`mx-auto grid place-items-center w-16 h-16 rounded-[22px] ${paid ? "bg-accent-soft text-accent-text" : "bg-[rgba(245,158,11,.14)] text-warning"}`}>
        {paid ? <CheckCircle2 className="w-8 h-8" /> : <CircleAlert className="w-8 h-8" />}
      </span>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">{paid ? "Payment received" : "We're confirming your payment"}</h1>
      <p className="mt-3 text-text-2">
        {paid
          ? "Thanks! The stores have your order and will start packing shortly."
          : "This can take a moment. Your orders will show as paid as soon as Stripe confirms."}
      </p>
      <Link href={checkoutId ? `/account/orders?placed=${checkoutId}` : "/account/orders"} className="btn btn-primary mt-8">
        View my orders
      </Link>
    </div>
  );
}
