import { NextResponse } from "next/server";
import { markCheckoutPaid, stripe } from "@/lib/orders";

// Stripe → Developers → Webhooks → endpoint <APP_URL>/api/stripe/webhook, event checkout.session.completed
export async function POST(request) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe webhooks aren't configured" }, { status: 501 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), request.headers.get("stripe-signature"), process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    if (session.payment_status === "paid" && session.metadata?.checkoutId) {
      await markCheckoutPaid(session.metadata.checkoutId, session.metadata.userId);
    }
  }
  return NextResponse.json({ received: true });
}
