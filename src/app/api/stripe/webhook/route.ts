/**
 * Stripe Webhook — POST /api/stripe/webhook
 *
 * Receives Stripe events and updates the subscriptions table.
 * Called by Stripe, not by the browser — no auth guard needed here.
 * Instead, we verify the Stripe webhook signature.
 *
 * Setup:
 *   1. Add STRIPE_WEBHOOK_SECRET to .env
 *      Get it from: stripe listen --forward-to localhost:3000/api/stripe/webhook
 *   2. Run: npm install stripe
 *   3. Deploy and add the production webhook URL in Stripe Dashboard
 *
 * Events handled:
 *   - checkout.session.completed  → activate subscription
 *   - customer.subscription.deleted → downgrade to byok
 *   - invoice.payment_failed → mark subscription past_due
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  // TODO: uncomment once `npm install stripe` is run
  // const Stripe = (await import("stripe")).default;
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-11-20.acacia" });
  //
  // const sig = request.headers.get("stripe-signature")!;
  // const body = await request.text();
  //
  // let event: Stripe.Event;
  // try {
  //   event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  // } catch (err) {
  //   console.error("[stripe/webhook] Signature verification failed:", err);
  //   return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  // }
  //
  // const supabase = await createClient();
  //
  // if (event.type === "checkout.session.completed") {
  //   const session = event.data.object as Stripe.Checkout.Session;
  //   const userId = session.client_reference_id;
  //   if (userId) {
  //     await supabase.from("subscriptions").upsert({
  //       user_id: userId,
  //       plan: "pro",
  //       status: "active",
  //       stripe_customer_id: session.customer as string,
  //       stripe_subscription_id: session.subscription as string,
  //     }, { onConflict: "user_id" });
  //   }
  // }
  //
  // if (event.type === "customer.subscription.deleted") {
  //   const sub = event.data.object as Stripe.Subscription;
  //   await supabase.from("subscriptions")
  //     .update({ plan: "byok", status: "canceled" })
  //     .eq("stripe_subscription_id", sub.id);
  // }
  //
  // if (event.type === "invoice.payment_failed") {
  //   const invoice = event.data.object as Stripe.Invoice;
  //   await supabase.from("subscriptions")
  //     .update({ status: "past_due" })
  //     .eq("stripe_subscription_id", invoice.subscription as string);
  // }
  //
  // return NextResponse.json({ received: true });

  return NextResponse.json({ error: "Stripe not yet installed. Run: npm install stripe" }, { status: 503 });
}
