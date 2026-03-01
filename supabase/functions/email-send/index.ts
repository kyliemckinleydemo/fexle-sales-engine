/**
 * @module functions/email-send
 * @description Edge Function to send emails via Resend API
 *
 * PURPOSE:
 * - Send emails to leads through Resend
 * - Use org-configured sender address or platform default
 * - Log all sends to email_sends table
 * - Set reply-to as the sending user's email
 *
 * TRIGGERS:
 * - POST request from frontend
 *
 * PARAMETERS:
 * - leadId: Lead to email (optional, for logging)
 * - to: Recipient email address
 * - subject: Email subject line
 * - body: Email body (plain text)
 * - templateKey: Optional template identifier for tracking
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface SendEmailRequest {
  leadId?: string;
  to: string;
  subject: string;
  body: string;
  templateKey?: string;
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

    // Get user's organization and profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, email, full_name")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return new Response(
        JSON.stringify({ error: "User not associated with an organization" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check org plan - email sending is a Pro feature
    const { data: org } = await supabase
      .from("organizations")
      .select("name, plan, config")
      .eq("id", profile.organization_id)
      .single();

    if (org?.plan !== 'pro' && org?.plan !== 'trial') {
      return new Response(
        JSON.stringify({ error: "Email sending requires a Pro plan. Please upgrade." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Email service not configured. Contact support." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: SendEmailRequest = await req.json();
    const { leadId, to, subject, body: emailBody, templateKey } = body;

    if (!to || !subject || !emailBody) {
      return new Response(
        JSON.stringify({ error: "to, subject, and body are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get sender config from org settings
    const emailConfig = org?.config?.email || {};
    const fromEmail = emailConfig.fromAddress || "noreply@yourdomain.com";
    const fromName = emailConfig.fromName || org?.name || "Sales Engine";
    const replyTo = profile.email || undefined;

    // Send via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to,
        subject,
        text: emailBody,
        reply_to: replyTo,
      }),
    });

    const resendResult = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend error:", resendResult);

      // Log failed send
      await supabase.from("email_sends").insert({
        organization_id: profile.organization_id,
        user_id: user.id,
        lead_id: leadId || null,
        to_email: to,
        from_email: fromEmail,
        reply_to: replyTo,
        subject,
        body_text: emailBody,
        template_key: templateKey || null,
        status: "failed",
        error_message: resendResult.message || "Resend API error",
      });

      return new Response(
        JSON.stringify({ error: resendResult.message || "Failed to send email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log successful send
    const { data: emailLog } = await supabase
      .from("email_sends")
      .insert({
        organization_id: profile.organization_id,
        user_id: user.id,
        lead_id: leadId || null,
        to_email: to,
        from_email: fromEmail,
        reply_to: replyTo,
        subject,
        body_text: emailBody,
        template_key: templateKey || null,
        status: "sent",
        resend_id: resendResult.id,
      })
      .select("id")
      .single();

    // Log activity
    if (leadId) {
      await supabase.from("activity_log").insert({
        organization_id: profile.organization_id,
        entity_type: "lead",
        entity_id: leadId,
        action: "email_sent",
        actor_id: user.id,
        description: `Email sent: "${subject.substring(0, 50)}${subject.length > 50 ? '...' : ''}"`,
        metadata: {
          email_send_id: emailLog?.id,
          resend_id: resendResult.id,
          to_email: to,
          template_key: templateKey,
        },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailId: emailLog?.id,
        resendId: resendResult.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Email send error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
