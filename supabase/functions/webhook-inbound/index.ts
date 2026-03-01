/**
 * @module functions/webhook-inbound
 * @description Edge Function to receive inbound webhooks (e.g., from Zapier)
 *
 * PURPOSE:
 * - Receive inbound webhooks to create/update leads
 * - Validate API keys for authentication
 * - Rate limiting (100 requests/minute per key)
 * - Support multiple actions: create_lead, update_lead, add_note
 *
 * TRIGGERS:
 * - POST request with API key in header
 *
 * AUTHENTICATION:
 * - X-API-Key header required
 * - Key must match active inbound_webhook_keys entry
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface CreateLeadPayload {
  action: "create_lead";
  company: string;
  contact?: string;
  email?: string;
  phone?: string;
  title?: string;
  vertical?: string;
  source?: string;
  notes?: string;
}

interface UpdateLeadPayload {
  action: "update_lead";
  lead_id?: string;
  email?: string; // Alternative lookup
  status?: string;
  notes?: string;
  milestones?: Record<string, boolean>;
}

interface AddNotePayload {
  action: "add_note";
  lead_id?: string;
  email?: string; // Alternative lookup
  note: string;
}

type WebhookPayload = CreateLeadPayload | UpdateLeadPayload | AddNotePayload;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get API key from header
    const apiKey = req.headers.get("X-API-Key") || req.headers.get("x-api-key");

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing X-API-Key header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate API key
    const { data: keyData, error: keyError } = await supabase
      .from("inbound_webhook_keys")
      .select("id, organization_id, name, is_active, request_count, last_used_at")
      .eq("api_key", apiKey)
      .single();

    if (keyError || !keyData) {
      return new Response(
        JSON.stringify({ error: "Invalid API key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!keyData.is_active) {
      return new Response(
        JSON.stringify({ error: "API key is deactivated" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Simple rate limiting: check if too many requests in last minute
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    if (keyData.last_used_at && keyData.last_used_at > oneMinuteAgo && keyData.request_count > 100) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Max 100 requests per minute." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update usage stats
    const now = new Date();
    await supabase
      .from("inbound_webhook_keys")
      .update({
        last_used_at: now.toISOString(),
        request_count: keyData.last_used_at && keyData.last_used_at > oneMinuteAgo
          ? keyData.request_count + 1
          : 1,
      })
      .eq("id", keyData.id);

    // Parse payload
    const payload: WebhookPayload = await req.json();

    if (!payload.action) {
      return new Response(
        JSON.stringify({ error: "Missing 'action' field in payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orgId = keyData.organization_id;

    // Handle different actions
    switch (payload.action) {
      case "create_lead": {
        const createPayload = payload as CreateLeadPayload;

        if (!createPayload.company) {
          return new Response(
            JSON.stringify({ error: "Missing required field: company" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check for duplicate by email if provided
        if (createPayload.email) {
          const { data: existing } = await supabase
            .from("leads")
            .select("id")
            .eq("organization_id", orgId)
            .eq("email", createPayload.email)
            .single();

          if (existing) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Lead with this email already exists",
                lead_id: existing.id,
              }),
              { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }

        // Create lead
        const { data: lead, error: createError } = await supabase
          .from("leads")
          .insert({
            organization_id: orgId,
            company: createPayload.company,
            contact: createPayload.contact || "",
            email: createPayload.email || "",
            phone: createPayload.phone || "",
            title: createPayload.title || "",
            vertical: createPayload.vertical || "Technology",
            source: createPayload.source || "webhook",
            status: "New Lead",
            notes: createPayload.notes || "",
          })
          .select("id")
          .single();

        if (createError) {
          throw new Error(`Failed to create lead: ${createError.message}`);
        }

        // Log activity
        await supabase.from("activity_log").insert({
          organization_id: orgId,
          entity_type: "lead",
          entity_id: lead.id,
          action: "created",
          description: `Lead created via webhook (${keyData.name})`,
          metadata: { source: "webhook", api_key_name: keyData.name },
        });

        return new Response(
          JSON.stringify({
            success: true,
            action: "create_lead",
            lead_id: lead.id,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update_lead": {
        const updatePayload = payload as UpdateLeadPayload;

        // Find lead by ID or email
        let leadId = updatePayload.lead_id;

        if (!leadId && updatePayload.email) {
          const { data: foundLead } = await supabase
            .from("leads")
            .select("id")
            .eq("organization_id", orgId)
            .eq("email", updatePayload.email)
            .single();

          leadId = foundLead?.id;
        }

        if (!leadId) {
          return new Response(
            JSON.stringify({ error: "Lead not found. Provide lead_id or email." }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Build update object
        const updates: Record<string, any> = {};
        if (updatePayload.status) updates.status = updatePayload.status;
        if (updatePayload.notes) updates.notes = updatePayload.notes;
        if (updatePayload.milestones) updates.milestones = updatePayload.milestones;

        if (Object.keys(updates).length === 0) {
          return new Response(
            JSON.stringify({ error: "No fields to update" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error: updateError } = await supabase
          .from("leads")
          .update(updates)
          .eq("id", leadId)
          .eq("organization_id", orgId);

        if (updateError) {
          throw new Error(`Failed to update lead: ${updateError.message}`);
        }

        return new Response(
          JSON.stringify({
            success: true,
            action: "update_lead",
            lead_id: leadId,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "add_note": {
        const notePayload = payload as AddNotePayload;

        if (!notePayload.note) {
          return new Response(
            JSON.stringify({ error: "Missing required field: note" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Find lead
        let leadId = notePayload.lead_id;

        if (!leadId && notePayload.email) {
          const { data: foundLead } = await supabase
            .from("leads")
            .select("id, notes")
            .eq("organization_id", orgId)
            .eq("email", notePayload.email)
            .single();

          if (foundLead) {
            leadId = foundLead.id;
          }
        }

        if (!leadId) {
          return new Response(
            JSON.stringify({ error: "Lead not found. Provide lead_id or email." }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get current notes
        const { data: lead } = await supabase
          .from("leads")
          .select("notes")
          .eq("id", leadId)
          .single();

        const timestamp = now.toLocaleString("en-AU", { dateStyle: "short", timeStyle: "short" });
        const newNote = `[${timestamp}] 📥 Webhook: ${notePayload.note}`;
        const updatedNotes = lead?.notes
          ? `${newNote}\n\n${lead.notes}`
          : newNote;

        const { error: updateError } = await supabase
          .from("leads")
          .update({ notes: updatedNotes })
          .eq("id", leadId);

        if (updateError) {
          throw new Error(`Failed to add note: ${updateError.message}`);
        }

        return new Response(
          JSON.stringify({
            success: true,
            action: "add_note",
            lead_id: leadId,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({
            error: `Unknown action: ${payload.action}. Supported: create_lead, update_lead, add_note`,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Inbound webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
