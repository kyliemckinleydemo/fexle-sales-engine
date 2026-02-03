/**
 * @module functions/process-sequence-emails
 * @description Edge Function to process email sequence steps
 *
 * PURPOSE:
 * - Query active enrollments where next_step_due_at has passed
 * - Get the appropriate sequence step
 * - Replace tokens in email template
 * - Send email via Resend
 * - Update enrollment progress
 * - Mark sequence as complete after final step
 *
 * TRIGGERS:
 * - Cron job: Every 5 minutes
 * - Manual: POST request for testing
 *
 * SKIP CONDITIONS:
 * - Lead replied (detected via email tracking)
 * - Lead status changed since enrollment
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface Enrollment {
  id: string;
  organization_id: string;
  lead_id: string;
  sequence_id: string;
  current_step: number;
  next_step_due_at: string;
  status: string;
  emails_sent: number;
}

interface SequenceStep {
  id: string;
  sequence_id: string;
  step_number: number;
  delay_days: number;
  delay_hours: number;
  subject: string;
  body_html: string;
  body_text: string | null;
  skip_conditions: {
    if_replied?: boolean;
    if_status_changed?: boolean;
  };
}

interface Lead {
  id: string;
  company: string;
  contact: string;
  title: string;
  email: string;
  phone: string;
  status: string;
  vertical: string;
}

interface Sequence {
  id: string;
  name: string;
  from_name: string | null;
  reply_to: string | null;
  organization_id: string;
}

interface OrgConfig {
  company?: {
    name?: string;
    ceoName?: string;
    website?: string;
  };
  targetAction?: {
    label?: string;
    duration?: number;
  };
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

    const url = new URL(req.url);
    const testMode = url.searchParams.get("test") === "true";
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam) : 100;

    // Query active enrollments where step is due
    const { data: enrollments, error: enrollError } = await supabase
      .from("lead_sequence_enrollments")
      .select("*")
      .eq("status", "active")
      .lte("next_step_due_at", now.toISOString())
      .limit(limit);

    if (enrollError) {
      throw new Error(`Failed to fetch enrollments: ${enrollError.message}`);
    }

    if (!enrollments || enrollments.length === 0) {
      return new Response(
        JSON.stringify({ message: "No enrollments due", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let processedCount = 0;
    let skippedCount = 0;
    let completedCount = 0;
    const errors: string[] = [];

    for (const enrollment of enrollments as Enrollment[]) {
      try {
        // Get the sequence
        const { data: sequence } = await supabase
          .from("email_sequences")
          .select("*")
          .eq("id", enrollment.sequence_id)
          .single();

        if (!sequence || !sequence.is_active) {
          // Sequence deactivated, cancel enrollment
          await supabase
            .from("lead_sequence_enrollments")
            .update({
              status: "cancelled",
              cancelled_at: now.toISOString(),
              cancelled_reason: "Sequence deactivated",
            })
            .eq("id", enrollment.id);
          skippedCount++;
          continue;
        }

        // Get the current step
        const { data: step } = await supabase
          .from("email_sequence_steps")
          .select("*")
          .eq("sequence_id", enrollment.sequence_id)
          .eq("step_number", enrollment.current_step)
          .single();

        if (!step) {
          // No more steps, mark as completed
          await supabase
            .from("lead_sequence_enrollments")
            .update({
              status: "completed",
              completed_at: now.toISOString(),
            })
            .eq("id", enrollment.id);

          // Update sequence stats
          await supabase
            .from("email_sequences")
            .update({
              completions_count: (sequence as Sequence).completions_count || 0 + 1,
            })
            .eq("id", enrollment.sequence_id);

          completedCount++;
          continue;
        }

        // Get the lead
        const { data: lead } = await supabase
          .from("leads")
          .select("*")
          .eq("id", enrollment.lead_id)
          .single();

        if (!lead) {
          errors.push(`Lead not found for enrollment ${enrollment.id}`);
          continue;
        }

        // Check skip conditions
        const skipConditions = (step as SequenceStep).skip_conditions || {};

        // Check if lead replied (simplified - would need email tracking integration)
        if (skipConditions.if_replied) {
          const { data: replies } = await supabase
            .from("sequence_email_log")
            .select("id")
            .eq("enrollment_id", enrollment.id)
            .eq("status", "replied")
            .limit(1);

          if (replies && replies.length > 0) {
            await supabase
              .from("lead_sequence_enrollments")
              .update({
                status: "completed",
                completed_at: now.toISOString(),
                cancelled_reason: "Lead replied",
              })
              .eq("id", enrollment.id);
            skippedCount++;
            continue;
          }
        }

        // Check if status changed
        if (skipConditions.if_status_changed) {
          // Get enrollment's initial status from first email log or activity
          const { data: firstEmail } = await supabase
            .from("sequence_email_log")
            .select("created_at")
            .eq("enrollment_id", enrollment.id)
            .order("created_at", { ascending: true })
            .limit(1)
            .single();

          if (firstEmail) {
            const { data: statusChanges } = await supabase
              .from("activity_log")
              .select("id")
              .eq("entity_id", enrollment.lead_id)
              .eq("action", "status_changed")
              .gt("created_at", firstEmail.created_at)
              .limit(1);

            if (statusChanges && statusChanges.length > 0) {
              await supabase
                .from("lead_sequence_enrollments")
                .update({
                  status: "completed",
                  completed_at: now.toISOString(),
                  cancelled_reason: "Lead status changed",
                })
                .eq("id", enrollment.id);
              skippedCount++;
              continue;
            }
          }
        }

        // Get organization config for token replacement
        const { data: org } = await supabase
          .from("organizations")
          .select("name, config")
          .eq("id", enrollment.organization_id)
          .single();

        const orgConfig = (org?.config || {}) as OrgConfig;

        // Replace tokens in subject and body
        const tokens = buildTokens(lead as Lead, orgConfig, org?.name || "");
        const subject = replaceTokens((step as SequenceStep).subject, tokens);
        const bodyHtml = replaceTokens((step as SequenceStep).body_html, tokens);
        const bodyText = (step as SequenceStep).body_text
          ? replaceTokens((step as SequenceStep).body_text!, tokens)
          : undefined;

        // Send email (skip in test mode)
        let emailProviderId: string | null = null;

        if (RESEND_API_KEY && !testMode) {
          const fromName = (sequence as Sequence).from_name || orgConfig.company?.name || "Sales Team";
          const fromEmail = "sequences@yourdomain.com"; // Configure per org in production

          const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: `${fromName} <${fromEmail}>`,
              to: (lead as Lead).email,
              reply_to: (sequence as Sequence).reply_to || undefined,
              subject,
              html: bodyHtml,
              text: bodyText,
            }),
          });

          if (!emailResponse.ok) {
            const errorText = await emailResponse.text();
            errors.push(`Email send failed for ${(lead as Lead).email}: ${errorText}`);

            // Log failed attempt
            await supabase.from("sequence_email_log").insert({
              organization_id: enrollment.organization_id,
              enrollment_id: enrollment.id,
              step_id: (step as SequenceStep).id,
              lead_id: enrollment.lead_id,
              to_email: (lead as Lead).email,
              subject,
              status: "failed",
              error_message: errorText,
            });
            continue;
          }

          const emailResult = await emailResponse.json();
          emailProviderId = emailResult.id;
        }

        // Log the sent email
        await supabase.from("sequence_email_log").insert({
          organization_id: enrollment.organization_id,
          enrollment_id: enrollment.id,
          step_id: (step as SequenceStep).id,
          lead_id: enrollment.lead_id,
          to_email: (lead as Lead).email,
          subject,
          status: testMode ? "test" : "sent",
          email_provider_id: emailProviderId,
        });

        // Update step stats
        await supabase
          .from("email_sequence_steps")
          .update({ sent_count: ((step as SequenceStep).sent_count || 0) + 1 })
          .eq("id", (step as SequenceStep).id);

        // Get next step
        const { data: nextStep } = await supabase
          .from("email_sequence_steps")
          .select("step_number, delay_days, delay_hours")
          .eq("sequence_id", enrollment.sequence_id)
          .eq("step_number", enrollment.current_step + 1)
          .single();

        if (nextStep) {
          // Calculate next step due time
          const nextDueAt = new Date(now);
          nextDueAt.setDate(nextDueAt.getDate() + (nextStep.delay_days || 0));
          nextDueAt.setHours(nextDueAt.getHours() + (nextStep.delay_hours || 0));

          await supabase
            .from("lead_sequence_enrollments")
            .update({
              current_step: enrollment.current_step + 1,
              next_step_due_at: nextDueAt.toISOString(),
              emails_sent: (enrollment.emails_sent || 0) + 1,
            })
            .eq("id", enrollment.id);
        } else {
          // No more steps, mark completed
          await supabase
            .from("lead_sequence_enrollments")
            .update({
              status: "completed",
              completed_at: now.toISOString(),
              emails_sent: (enrollment.emails_sent || 0) + 1,
            })
            .eq("id", enrollment.id);

          // Update sequence stats
          await supabase
            .from("email_sequences")
            .update({
              completions_count: ((sequence as any).completions_count || 0) + 1,
            })
            .eq("id", enrollment.sequence_id);

          completedCount++;
        }

        processedCount++;
      } catch (err) {
        errors.push(`Error processing enrollment ${enrollment.id}: ${err.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        message: "Sequence emails processed",
        total: enrollments.length,
        processed: processedCount,
        skipped: skippedCount,
        completed: completedCount,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildTokens(lead: Lead, orgConfig: OrgConfig, orgName: string): Record<string, string> {
  const now = new Date();

  return {
    "{{contact}}": lead.contact || "",
    "{{firstName}}": lead.contact?.split(" ")[0] || "",
    "{{lastName}}": lead.contact?.split(" ").slice(1).join(" ") || "",
    "{{company}}": lead.company || "",
    "{{title}}": lead.title || "",
    "{{email}}": lead.email || "",
    "{{phone}}": lead.phone || "",
    "{{vertical}}": lead.vertical || "",
    "{{companyName}}": orgConfig.company?.name || orgName || "",
    "{{ceoName}}": orgConfig.company?.ceoName || "",
    "{{website}}": orgConfig.company?.website || "",
    "{{targetAction}}": orgConfig.targetAction?.label || "meeting",
    "{{targetDuration}}": String(orgConfig.targetAction?.duration || 20),
    "{{currentDate}}": now.toLocaleDateString("en-AU"),
    "{{currentYear}}": String(now.getFullYear()),
  };
}

function replaceTokens(text: string, tokens: Record<string, string>): string {
  let result = text;
  for (const [token, value] of Object.entries(tokens)) {
    result = result.replace(new RegExp(token.replace(/[{}]/g, "\\$&"), "g"), value);
  }
  return result;
}
