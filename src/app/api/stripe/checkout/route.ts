/**
 * Stripe Checkout — POST /api/stripe/checkout
 *
 * Creates a Stripe Checkout Session for Pro plan subscription.
 * On success, Stripe redirects the user back to /?session_id=xxx
 *
 * Setup:
 *   1. Add STRIPE_SECRET_KEY and STRIPE_PRO_PRICE_ID to .env
 *   2. Run: npm install stripe
 *   3. Set up webhook: stripe listen --forward-to localhost:3000/api/stripe/webhook
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/supabase/require-auth";

export async function POST(request: NextRequest): Promise<NextResponse> {
  let user: Awaited<ReturnType<typeof requireAuth>>["user"];
  try {
    ({ user } = await requireAuth(request));
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRO_PRICE_ID;

  if (!stripeKey || !priceId) {
    return NextResponse.json(
      { error: "Stripe is not configured. Add STRIPE_SECRET_KEY and STRIPE_PRO_PRICE_ID to your environment." },
      { status: 503 },
    );
  }

  // TODO: uncomment once `npm install stripe` is run
  // const Stripe = (await import("stripe")).default;
  // const stripe = new Stripe(stripeKey, { apiVersion: "2024-11-20.acacia" });
  //
  // const session = await stripe.checkout.sessions.create({
  //   payment_method_types: ["card"],
  //   mode: "subscription",
  //   line_items: [{ price: priceId, quantity: 1 }],
  //   success_url: `${process.env.NEXT_PUBLIC_APP_URL}/?session_id={CHECKOUT_SESSION_ID}`,
  //   cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/`,
  //   client_reference_id: user.id,
  //   customer_email: user.email,
  // });
  //
  // return NextResponse.json({ url: session.url });

  return NextResponse.json({ error: "Stripe not yet installed. Run: npm install stripe" }, { status: 503 });
}
