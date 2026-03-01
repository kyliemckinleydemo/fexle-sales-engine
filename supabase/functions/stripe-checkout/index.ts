/**
 * @module functions/stripe-checkout
 * @description Edge Function to create Stripe Checkout sessions for Pro plan
 *
 * PURPOSE:
 * - Create Stripe Checkout session for subscription upgrade
 * - Look up or create Stripe customer for the organization
 * - Return checkout URL for redirect
 *
 * TRIGGERS:
 * - POST request from frontend (admin/owner only)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_PRO_PRICE_ID = Deno.env.get("STRIPE_PRO_PRICE_ID")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function stripeRequest(endpoint: string, method: string, body?: Record<string, string>) {
  const url = `https://api.stripe.com/v1${endpoint}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
  };

  const options: RequestInit = { method, headers };

  if (body) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    options.body = new URLSearchParams(body).toString();
  }

  const response = await fetch(url, options);
  return response.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's organization and verify admin/owner role
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, email, full_name, role")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return new Response(
        JSON.stringify({ error: "User not associated with an organization" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (profile.role !== 'owner' && profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: "Only admins and owners can manage billing" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get organization
    const { data: org } = await supabase
      .from("organizations")
      .select("id, name, stripe_customer_id, plan")
      .eq("id", profile.organization_id)
      .single();

    if (!org) {
      return new Response(
        JSON.stringify({ error: "Organization not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (org.plan === 'pro') {
      return new Response(
        JSON.stringify({ error: "Already on Pro plan. Use billing portal to manage subscription." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request for success/cancel URLs
    const body = await req.json().catch(() => ({}));
    const successUrl = body.successUrl || body.success_url || `${req.headers.get("origin") || ""}?billing=success`;
    const cancelUrl = body.cancelUrl || body.cancel_url || `${req.headers.get("origin") || ""}?billing=cancelled`;

    // Look up or create Stripe customer
    let customerId = org.stripe_customer_id;

    if (!customerId) {
      const customer = await stripeRequest("/customers", "POST", {
        email: profile.email || user.email || "",
        name: org.name,
        "metadata[organization_id]": org.id,
        "metadata[supabase_user_id]": user.id,
      });

      if (customer.error) {
        throw new Error(customer.error.message);
      }

      customerId = customer.id;

      // Save customer ID to org
      await supabase
        .from("organizations")
        .update({ stripe_customer_id: customerId })
        .eq("id", org.id);
    }

    // Create Checkout Session
    const session = await stripeRequest("/checkout/sessions", "POST", {
      customer: customerId,
      mode: "subscription",
      "line_items[0][price]": STRIPE_PRO_PRICE_ID,
      "line_items[0][quantity]": "1",
      success_url: successUrl,
      cancel_url: cancelUrl,
      "metadata[organization_id]": org.id,
      "subscription_data[metadata][organization_id]": org.id,
    });

    if (session.error) {
      throw new Error(session.error.message);
    }

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
