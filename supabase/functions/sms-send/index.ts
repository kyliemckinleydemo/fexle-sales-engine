/**
 * @module functions/sms-send
 * @description Edge Function to send SMS messages via Twilio
 *
 * PURPOSE:
 * - Send SMS messages to leads
 * - Check opt-out status before sending
 * - Log messages to sms_messages table
 * - Support template-based messaging
 *
 * TRIGGERS:
 * - POST request from frontend
 *
 * PARAMETERS:
 * - leadId: Lead to send SMS to
 * - message: Message body (max 1600 chars for long SMS)
 * - templateId: Optional template to use
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface SendSMSRequest {
  leadId: string;
  message: string;
  templateId?: string;
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

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return new Response(
        JSON.stringify({ error: "User not associated with an organization" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: SendSMSRequest = await req.json();
    const { leadId, message, templateId } = body;

    if (!leadId || !message) {
      return new Response(
        JSON.stringify({ error: "leadId and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get lead details
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, phone, contact, company")
      .eq("id", leadId)
      .eq("organization_id", profile.organization_id)
      .single();

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ error: "Lead not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!lead.phone) {
      return new Response(
        JSON.stringify({ error: "Lead has no phone number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format phone number to E.164
    const toNumber = formatE164(lead.phone);
    if (!toNumber) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check opt-out status
    const { data: optOut } = await supabase
      .from("sms_opt_outs")
      .select("id")
      .eq("organization_id", profile.organization_id)
      .eq("phone_number", toNumber)
      .single();

    if (optOut) {
      return new Response(
        JSON.stringify({ error: "This number has opted out of SMS messages" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Twilio credentials
    const { data: credentials, error: credError } = await supabase
      .from("twilio_credentials")
      .select("account_sid, api_key_sid, api_key_secret, caller_id")
      .eq("organization_id", profile.organization_id)
      .eq("is_active", true)
      .single();

    if (credError || !credentials) {
      return new Response(
        JSON.stringify({ error: "Twilio not configured for this organization" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${credentials.account_sid}/Messages.json`;
    const twilioAuth = btoa(`${credentials.api_key_sid}:${credentials.api_key_secret}`);

    const formData = new URLSearchParams();
    formData.append("To", toNumber);
    formData.append("From", credentials.caller_id);
    formData.append("Body", message);

    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${twilioAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const twilioResult = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error("Twilio SMS error:", twilioResult);

      // Log failed attempt
      await supabase.from("sms_messages").insert({
        organization_id: profile.organization_id,
        lead_id: leadId,
        user_id: user.id,
        direction: "outbound",
        from_number: credentials.caller_id,
        to_number: toNumber,
        body: message,
        status: "failed",
        error_message: twilioResult.message || "Unknown error",
        template_id: templateId || null,
      });

      return new Response(
        JSON.stringify({ error: twilioResult.message || "Failed to send SMS" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log successful message
    const { data: smsLog, error: logError } = await supabase
      .from("sms_messages")
      .insert({
        organization_id: profile.organization_id,
        lead_id: leadId,
        user_id: user.id,
        direction: "outbound",
        from_number: credentials.caller_id,
        to_number: toNumber,
        body: message,
        status: "sent",
        twilio_message_sid: twilioResult.sid,
        segments: Math.ceil(message.length / 160),
        template_id: templateId || null,
      })
      .select("id")
      .single();

    // Log activity
    await supabase.from("activity_log").insert({
      organization_id: profile.organization_id,
      entity_type: "lead",
      entity_id: leadId,
      action: "sms_sent",
      actor_id: user.id,
      description: `SMS sent: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`,
      metadata: {
        sms_message_id: smsLog?.id,
        twilio_sid: twilioResult.sid,
        segments: Math.ceil(message.length / 160),
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        messageId: smsLog?.id,
        twilioSid: twilioResult.sid,
        segments: Math.ceil(message.length / 160),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("SMS send error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function formatE164(phone: string): string | null {
  if (!phone) return null;

  const digits = phone.replace(/\D/g, "");

  // Already has + prefix
  if (phone.startsWith("+")) {
    return "+" + digits;
  }

  // Australian numbers
  if (digits.startsWith("61") && digits.length >= 11) {
    return "+" + digits;
  }
  if (digits.startsWith("0") && digits.length === 10) {
    return "+61" + digits.substring(1);
  }

  // US/Canada numbers
  if (digits.startsWith("1") && digits.length === 11) {
    return "+" + digits;
  }
  if (digits.length === 10) {
    return "+1" + digits;
  }

  // UK numbers
  if (digits.startsWith("44")) {
    return "+" + digits;
  }

  // If we can't determine the format, return null
  return null;
}
