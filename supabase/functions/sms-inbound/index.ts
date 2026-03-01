/**
 * @module functions/sms-inbound
 * @description Edge Function to receive inbound SMS via Twilio webhook
 *
 * PURPOSE:
 * - Receive inbound SMS messages from Twilio
 * - Handle opt-out keywords (STOP, UNSUBSCRIBE, etc.)
 * - Handle opt-in keywords (START, UNSTOP)
 * - Log messages to sms_messages table
 * - Associate with lead if phone number matches
 *
 * TRIGGERS:
 * - POST webhook from Twilio when SMS is received
 *
 * COMPLIANCE:
 * - STOP, UNSUBSCRIBE, CANCEL, END, QUIT = opt out
 * - START, UNSTOP, YES = opt back in
 * - Auto-reply on opt-out/opt-in
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Opt-out keywords (case insensitive)
const OPT_OUT_KEYWORDS = ["STOP", "UNSUBSCRIBE", "CANCEL", "END", "QUIT", "STOPALL", "STOP ALL"];
const OPT_IN_KEYWORDS = ["START", "UNSTOP", "YES", "SUBSCRIBE"];

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

    // Parse form data from Twilio webhook
    const formData = await req.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    const {
      From: fromNumber,
      To: toNumber,
      Body: messageBody,
      MessageSid: messageSid,
      NumMedia: numMedia,
    } = params;

    if (!fromNumber || !toNumber || !messageBody) {
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { ...corsHeaders, "Content-Type": "application/xml" } }
      );
    }

    // Find organization by Twilio number (caller_id)
    const { data: credentials } = await supabase
      .from("twilio_credentials")
      .select("organization_id, account_sid, api_key_sid, api_key_secret")
      .eq("caller_id", toNumber)
      .eq("is_active", true)
      .single();

    if (!credentials) {
      console.error("No organization found for number:", toNumber);
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { ...corsHeaders, "Content-Type": "application/xml" } }
      );
    }

    const orgId = credentials.organization_id;
    const normalizedBody = messageBody.trim().toUpperCase();

    // Check for opt-out keyword
    if (OPT_OUT_KEYWORDS.includes(normalizedBody)) {
      // Add to opt-out list
      await supabase.from("sms_opt_outs").upsert({
        organization_id: orgId,
        phone_number: fromNumber,
        opted_out_at: new Date().toISOString(),
        keyword_used: normalizedBody,
      }, { onConflict: "organization_id,phone_number" });

      // Log the opt-out message
      await supabase.from("sms_messages").insert({
        organization_id: orgId,
        direction: "inbound",
        from_number: fromNumber,
        to_number: toNumber,
        body: messageBody,
        status: "received",
        twilio_message_sid: messageSid,
        is_opt_out: true,
      });

      // Reply with confirmation
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Message>You have been unsubscribed and will no longer receive messages. Reply START to opt back in.</Message></Response>',
        { headers: { ...corsHeaders, "Content-Type": "application/xml" } }
      );
    }

    // Check for opt-in keyword
    if (OPT_IN_KEYWORDS.includes(normalizedBody)) {
      // Remove from opt-out list
      await supabase
        .from("sms_opt_outs")
        .delete()
        .eq("organization_id", orgId)
        .eq("phone_number", fromNumber);

      // Log the opt-in message
      await supabase.from("sms_messages").insert({
        organization_id: orgId,
        direction: "inbound",
        from_number: fromNumber,
        to_number: toNumber,
        body: messageBody,
        status: "received",
        twilio_message_sid: messageSid,
        is_opt_in: true,
      });

      // Reply with confirmation
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Message>You have been resubscribed and will now receive messages. Reply STOP at any time to unsubscribe.</Message></Response>',
        { headers: { ...corsHeaders, "Content-Type": "application/xml" } }
      );
    }

    // Try to find a matching lead by phone number
    const { data: leads } = await supabase
      .from("leads")
      .select("id, contact, company")
      .eq("organization_id", orgId)
      .or(`phone.ilike.%${fromNumber.replace('+', '')}%,phone.ilike.%${fromNumber.slice(-10)}%`)
      .limit(1);

    const lead = leads?.[0];

    // Log the inbound message
    const { data: smsLog } = await supabase
      .from("sms_messages")
      .insert({
        organization_id: orgId,
        lead_id: lead?.id || null,
        direction: "inbound",
        from_number: fromNumber,
        to_number: toNumber,
        body: messageBody,
        status: "received",
        twilio_message_sid: messageSid,
        media_count: parseInt(numMedia || "0"),
      })
      .select("id")
      .single();

    // Log activity if we found a lead
    if (lead) {
      await supabase.from("activity_log").insert({
        organization_id: orgId,
        entity_type: "lead",
        entity_id: lead.id,
        action: "sms_received",
        description: `SMS received from ${lead.contact || fromNumber}: "${messageBody.substring(0, 50)}${messageBody.length > 50 ? '...' : ''}"`,
        metadata: {
          sms_message_id: smsLog?.id,
          twilio_sid: messageSid,
          from_number: fromNumber,
        },
      });

      // Dispatch webhook event for inbound SMS
      await supabase.rpc("dispatch_webhook_event", {
        p_org_id: orgId,
        p_event_type: "sms.received",
        p_payload: {
          lead_id: lead.id,
          lead_name: lead.contact,
          lead_company: lead.company,
          from_number: fromNumber,
          message: messageBody,
          message_id: smsLog?.id,
        },
      });
    }

    // Return empty TwiML (no auto-reply for regular messages)
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { headers: { ...corsHeaders, "Content-Type": "application/xml" } }
    );
  } catch (error) {
    console.error("Inbound SMS error:", error);
    // Return empty response to prevent Twilio retries
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { headers: { ...corsHeaders, "Content-Type": "application/xml" } }
    );
  }
});
