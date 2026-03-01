/**
 * @module functions/webhook-dispatch
 * @description Edge Function to dispatch webhook events and handle retries
 *
 * PURPOSE:
 * - Process pending webhook deliveries from webhook_deliveries table
 * - Send webhooks with HMAC-SHA256 signature
 * - Handle retries with exponential backoff (1m, 5m, 30m, 2h)
 * - Mark deliveries as successful or failed after max retries
 *
 * TRIGGERS:
 * - Cron job: Every minute
 * - Manual: POST request for testing
 *
 * RETRY SCHEDULE:
 * - Attempt 1: Immediate
 * - Attempt 2: After 1 minute
 * - Attempt 3: After 5 minutes
 * - Attempt 4: After 30 minutes
 * - Attempt 5: After 2 hours
 * - After 5 attempts: Mark as failed
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Retry delays in seconds
const RETRY_DELAYS = [0, 60, 300, 1800, 7200]; // 0, 1m, 5m, 30m, 2h
const MAX_ATTEMPTS = 5;

interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: Record<string, any>;
  attempt_count: number;
  next_retry_at: string | null;
  status: string;
}

interface Webhook {
  id: string;
  url: string;
  secret: string;
  is_active: boolean;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const now = new Date();

    // Get pending deliveries that are due
    const { data: deliveries, error: fetchError } = await supabase
      .from("webhook_deliveries")
      .select(`
        id,
        webhook_id,
        event_type,
        payload,
        attempt_count,
        next_retry_at,
        status
      `)
      .eq("status", "pending")
      .or(`next_retry_at.is.null,next_retry_at.lte.${now.toISOString()}`)
      .limit(50);

    if (fetchError) {
      throw new Error(`Failed to fetch deliveries: ${fetchError.message}`);
    }

    if (!deliveries || deliveries.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending deliveries", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let successCount = 0;
    let failCount = 0;
    let retryCount = 0;
    const errors: string[] = [];

    for (const delivery of deliveries as WebhookDelivery[]) {
      try {
        // Get webhook config
        const { data: webhook, error: webhookError } = await supabase
          .from("webhooks")
          .select("id, url, secret, is_active")
          .eq("id", delivery.webhook_id)
          .single();

        if (webhookError || !webhook || !(webhook as Webhook).is_active) {
          // Webhook deleted or deactivated, cancel delivery
          await supabase
            .from("webhook_deliveries")
            .update({
              status: "cancelled",
              completed_at: now.toISOString(),
              error_message: "Webhook not found or deactivated",
            })
            .eq("id", delivery.id);
          continue;
        }

        const webhookConfig = webhook as Webhook;

        // Prepare payload with metadata
        const payloadWithMeta = {
          event: delivery.event_type,
          timestamp: now.toISOString(),
          idempotency_key: `evt_${delivery.id}`,
          data: delivery.payload,
        };

        const payloadJson = JSON.stringify(payloadWithMeta);

        // Generate HMAC-SHA256 signature
        const signature = await generateSignature(payloadJson, webhookConfig.secret);

        // Send webhook
        const startTime = Date.now();
        const response = await fetch(webhookConfig.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": signature,
            "X-Webhook-Event": delivery.event_type,
            "X-Webhook-Delivery-Id": delivery.id,
          },
          body: payloadJson,
        });

        const responseTime = Date.now() - startTime;
        const responseBody = await response.text().catch(() => "");

        if (response.ok) {
          // Success
          await supabase
            .from("webhook_deliveries")
            .update({
              status: "delivered",
              completed_at: now.toISOString(),
              response_status: response.status,
              response_body: responseBody.substring(0, 1000),
              response_time_ms: responseTime,
              attempt_count: delivery.attempt_count + 1,
            })
            .eq("id", delivery.id);
          successCount++;
        } else {
          // Failed, schedule retry or mark failed
          const newAttemptCount = delivery.attempt_count + 1;

          if (newAttemptCount >= MAX_ATTEMPTS) {
            // Max retries exceeded
            await supabase
              .from("webhook_deliveries")
              .update({
                status: "failed",
                completed_at: now.toISOString(),
                response_status: response.status,
                response_body: responseBody.substring(0, 1000),
                response_time_ms: responseTime,
                attempt_count: newAttemptCount,
                error_message: `Failed after ${MAX_ATTEMPTS} attempts. Last status: ${response.status}`,
              })
              .eq("id", delivery.id);
            failCount++;
          } else {
            // Schedule retry
            const retryDelay = RETRY_DELAYS[newAttemptCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
            const nextRetry = new Date(now.getTime() + retryDelay * 1000);

            await supabase
              .from("webhook_deliveries")
              .update({
                attempt_count: newAttemptCount,
                next_retry_at: nextRetry.toISOString(),
                response_status: response.status,
                response_body: responseBody.substring(0, 1000),
                response_time_ms: responseTime,
                error_message: `Attempt ${newAttemptCount} failed: ${response.status}`,
              })
              .eq("id", delivery.id);
            retryCount++;
          }
        }
      } catch (err) {
        // Network error or other exception
        const newAttemptCount = delivery.attempt_count + 1;

        if (newAttemptCount >= MAX_ATTEMPTS) {
          await supabase
            .from("webhook_deliveries")
            .update({
              status: "failed",
              completed_at: now.toISOString(),
              attempt_count: newAttemptCount,
              error_message: `Failed after ${MAX_ATTEMPTS} attempts. Last error: ${err.message}`,
            })
            .eq("id", delivery.id);
          failCount++;
        } else {
          const retryDelay = RETRY_DELAYS[newAttemptCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
          const nextRetry = new Date(now.getTime() + retryDelay * 1000);

          await supabase
            .from("webhook_deliveries")
            .update({
              attempt_count: newAttemptCount,
              next_retry_at: nextRetry.toISOString(),
              error_message: `Attempt ${newAttemptCount} failed: ${err.message}`,
            })
            .eq("id", delivery.id);
          retryCount++;
        }

        errors.push(`Delivery ${delivery.id}: ${err.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        message: "Webhook dispatch completed",
        processed: deliveries.length,
        success: successCount,
        failed: failCount,
        scheduled_retry: retryCount,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook dispatch error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function generateSignature(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );

  // Convert to hex string
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}
