/**
 * @module functions/twilio-status-callback
 * @description Edge Function to handle Twilio call status and recording callbacks
 *
 * PURPOSE:
 * - Update call_logs with status changes (ringing, in-progress, completed, etc.)
 * - Store recording URLs when calls are recorded
 * - Calculate and store call duration
 *
 * TRIGGERS:
 * - Twilio status callback webhook during/after calls
 * - Twilio recording status callback when recording is ready
 *
 * CALLBACK TYPES:
 * - call-progress: Status updates during call
 * - recording-status: Recording availability notification
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Map Twilio status to our status values
const STATUS_MAP: Record<string, string> = {
  "queued": "queued",
  "ringing": "ringing",
  "in-progress": "in-progress",
  "completed": "completed",
  "busy": "busy",
  "no-answer": "no-answer",
  "canceled": "cancelled",
  "failed": "failed",
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

    const callSid = params.CallSid || params.ParentCallSid;

    if (!callSid) {
      console.error("No CallSid in callback");
      return new Response("OK", { headers: corsHeaders });
    }

    // Determine callback type
    const isRecordingCallback = params.RecordingSid || params.RecordingUrl;

    if (isRecordingCallback) {
      // Handle recording callback
      await handleRecordingCallback(supabase, callSid, params);
    } else {
      // Handle status callback
      await handleStatusCallback(supabase, callSid, params);
    }

    return new Response("OK", { headers: corsHeaders });
  } catch (error) {
    console.error("Status callback error:", error);
    // Return 200 to prevent Twilio from retrying
    return new Response("OK", { headers: corsHeaders });
  }
});

async function handleStatusCallback(
  supabase: any,
  callSid: string,
  params: Record<string, string>
) {
  const status = params.CallStatus;
  const mappedStatus = STATUS_MAP[status] || status;

  const updateData: Record<string, any> = {
    status: mappedStatus,
    updated_at: new Date().toISOString(),
  };

  // Add duration if call completed
  if (params.CallDuration) {
    updateData.duration_seconds = parseInt(params.CallDuration);
    updateData.ended_at = new Date().toISOString();
  }

  // Add answered time for in-progress
  if (status === "in-progress" && !params.CallDuration) {
    updateData.answered_at = new Date().toISOString();
  }

  // Store additional Twilio data
  if (params.AnsweredBy) {
    updateData.answered_by = params.AnsweredBy; // human, machine, fax
  }

  // Update call log
  const { error } = await supabase
    .from("call_logs")
    .update(updateData)
    .eq("twilio_call_sid", callSid);

  if (error) {
    console.error("Failed to update call log:", error);
  }

  // If call completed, log activity
  if (mappedStatus === "completed" || mappedStatus === "no-answer" || mappedStatus === "busy") {
    await logCallActivity(supabase, callSid, mappedStatus, params);
  }
}

async function handleRecordingCallback(
  supabase: any,
  callSid: string,
  params: Record<string, string>
) {
  const recordingUrl = params.RecordingUrl;
  const recordingSid = params.RecordingSid;
  const recordingDuration = params.RecordingDuration;
  const recordingStatus = params.RecordingStatus;

  if (recordingStatus !== "completed") {
    // Recording not ready yet
    return;
  }

  // Append .mp3 for direct playback URL
  const playbackUrl = recordingUrl ? `${recordingUrl}.mp3` : null;

  const { error } = await supabase
    .from("call_logs")
    .update({
      recording_url: playbackUrl,
      recording_sid: recordingSid,
      recording_duration: recordingDuration ? parseInt(recordingDuration) : null,
      updated_at: new Date().toISOString(),
    })
    .eq("twilio_call_sid", callSid);

  if (error) {
    console.error("Failed to update recording URL:", error);
  }
}

async function logCallActivity(
  supabase: any,
  callSid: string,
  status: string,
  params: Record<string, string>
) {
  // Get the call log to find lead_id and user_id
  const { data: callLog } = await supabase
    .from("call_logs")
    .select("id, organization_id, user_id, lead_id, duration_seconds")
    .eq("twilio_call_sid", callSid)
    .single();

  if (!callLog) return;

  const duration = callLog.duration_seconds || parseInt(params.CallDuration || "0");
  const durationStr = formatDuration(duration);

  let description = "";
  switch (status) {
    case "completed":
      description = `Call completed (${durationStr})`;
      break;
    case "no-answer":
      description = "Call - no answer";
      break;
    case "busy":
      description = "Call - busy signal";
      break;
    default:
      description = `Call ended: ${status}`;
  }

  // Log activity
  await supabase.from("activity_log").insert({
    organization_id: callLog.organization_id,
    entity_type: "lead",
    entity_id: callLog.lead_id,
    action: "call_completed",
    actor_id: callLog.user_id,
    description: description,
    metadata: {
      call_log_id: callLog.id,
      status: status,
      duration_seconds: duration,
      twilio_call_sid: callSid,
    },
  });
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
