/**
 * @module functions/stripe-webhook
 * @description Edge Function to handle Stripe subscription webhook events
 *
 * PURPOSE:
 * - Verify Stripe webhook signatures for security
 * - Handle checkout.session.completed → activate Pro plan
 * - Handle customer.subscription.updated → sync status
 * - Handle customer.subscription.deleted → revert to Free plan
 * - Handle invoice.payment_failed → mark as past_due
 *
 * TRIGGERS:
 * - POST from Stripe webhook (no auth header - uses webhook signature)
 *
 * IMPORTANT:
 * - This function does NOT use Bearer auth (Stripe sends webhooks directly)
 * - Security is via STRIPE_WEBHOOK_SECRET signature verification
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Stripe webhook signature verification using Web Crypto API
async function verifyStripeSignature(payload: string, sigHeader: string, secret: string): Promise<boolean> {
  const parts = sigHeader.split(",").reduce((acc: Record<string, string>, part: string) => {
    const [key, value] = part.split("=");
    acc[key.trim()] = value;
    return acc;
  }, {});

  const timestamp = parts["t"];
  const signature = parts["v1"];

  if (!timestamp || !signature) return false;

  // Check timestamp is within 5 minutes
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) return false;

  // Compute expected signature
  const signedPayload = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
  const expectedSignature = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return expectedSignature === signature;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const sigHeader = req.headers.get("stripe-signature");

    if (!sigHeader) {
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify webhook signature
    const isValid = await verifyStripeSignature(body, sigHeader, STRIPE_WEBHOOK_SECRET);
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: "Invalid webhook signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const event = JSON.parse(body);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log(`Stripe webhook: ${event.type}`, event.data.object.id);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const orgId = session.metadata?.organization_id;

        if (orgId && session.subscription) {
          await supabase
            .from("organizations")
            .update({
              plan: "pro",
              stripe_subscription_id: session.subscription,
              stripe_subscription_status: "active",
              stripe_customer_id: session.customer,
            })
            .eq("id", orgId);

          console.log(`Org ${orgId} upgraded to Pro`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const orgId = subscription.metadata?.organization_id;

        if (orgId) {
          const status = subscription.status;
          const plan = status === "active" || status === "trialing" ? "pro" : "free";

          await supabase
            .from("organizations")
            .update({
              plan,
              stripe_subscription_status: status,
            })
            .eq("id", orgId);

          console.log(`Org ${orgId} subscription updated: ${status} → plan=${plan}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const orgId = subscription.metadata?.organization_id;

        if (orgId) {
          await supabase
            .from("organizations")
            .update({
              plan: "free",
              stripe_subscription_status: "canceled",
            })
            .eq("id", orgId);

          console.log(`Org ${orgId} subscription canceled → free`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        if (subscriptionId) {
          // Find org by subscription ID
          const { data: org } = await supabase
            .from("organizations")
            .select("id")
            .eq("stripe_subscription_id", subscriptionId)
            .single();

          if (org) {
            await supabase
              .from("organizations")
              .update({
                plan: "past_due",
                stripe_subscription_status: "past_due",
              })
              .eq("id", org.id);

            console.log(`Org ${org.id} payment failed → past_due`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
