/**
 * @module functions/twilio-voice
 * @description Edge Function to generate TwiML for Twilio voice calls
 *
 * PURPOSE:
 * - Generate TwiML instructions for outbound calls
 * - Handle call routing and recording settings
 * - Create call_logs entries for tracking
 *
 * TRIGGERS:
 * - Webhook from Twilio when call is initiated
 *
 * PARAMETERS (from Twilio webhook):
 * - To: Destination phone number
 * - From: Caller ID
 * - CallSid: Twilio call identifier
 * - userId: User who initiated the call (custom param)
 * - leadId: Lead being called (custom param)
 * - organizationId: Organization (custom param)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
      To: toNumber,
      From: fromNumber,
      CallSid: callSid,
      userId,
      leadId,
      organizationId,
    } = params;

    // Validate required parameters
    if (!toNumber) {
      return new Response(
        generateTwiML("error", "No destination number provided"),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/xml",
          },
        }
      );
    }

    // Get organization's Twilio settings for recording preferences
    let recordingEnabled = true;
    let callerId = fromNumber;

    if (organizationId) {
      const { data: credentials } = await supabase
        .from("twilio_credentials")
        .select("caller_id, recording_enabled")
        .eq("organization_id", organizationId)
        .eq("is_active", true)
        .single();

      if (credentials) {
        recordingEnabled = credentials.recording_enabled !== false;
        callerId = credentials.caller_id || fromNumber;
      }
    }

    // Create call log entry
    if (organizationId && userId && leadId) {
      const { data: callLog, error: logError } = await supabase
        .from("call_logs")
        .insert({
          organization_id: organizationId,
          user_id: userId,
          lead_id: leadId,
          twilio_call_sid: callSid,
          direction: "outbound",
          from_number: callerId,
          to_number: toNumber,
          status: "initiated",
          started_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (logError) {
        console.error("Failed to create call log:", logError);
      }
    }

    // Generate TwiML for outbound call
    const twiml = generateOutboundTwiML(toNumber, callerId, recordingEnabled);

    return new Response(twiml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml",
      },
    });
  } catch (error) {
    console.error("TwiML generation error:", error);
    return new Response(
      generateTwiML("error", "An error occurred processing your call"),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/xml",
        },
      }
    );
  }
});

function generateOutboundTwiML(
  toNumber: string,
  callerId: string,
  recordingEnabled: boolean
): string {
  const recordAttr = recordingEnabled
    ? 'record="record-from-answer-dual" recordingStatusCallback="/twilio-status-callback"'
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${escapeXml(callerId)}" ${recordAttr} timeout="30" answerOnBridge="true">
    <Number>${escapeXml(toNumber)}</Number>
  </Dial>
</Response>`;
}

function generateTwiML(type: "error" | "hangup", message?: string): string {
  if (type === "error") {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${escapeXml(message || "An error occurred")}</Say>
  <Hangup/>
</Response>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Hangup/>
</Response>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
