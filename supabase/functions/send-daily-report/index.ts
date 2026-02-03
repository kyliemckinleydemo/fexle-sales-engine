/**
 * @module functions/send-daily-report
 * @description Edge Function to send daily analytics reports to subscribers
 *
 * PURPOSE:
 * - Query email_report_subscriptions for users wanting daily reports
 * - Generate HTML email with daily metrics
 * - Send via Resend email service
 * - Update last_daily_sent_at timestamp
 *
 * TRIGGERS:
 * - Cron job: Every hour, checks for subscriptions due for delivery
 * - Manual: POST request with force_send=true
 *
 * DEPENDENCIES:
 * - Supabase client for database access
 * - Resend API for email delivery
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface ReportSubscription {
  id: string;
  organization_id: string;
  user_id: string;
  send_time: string;
  report_scope: "own" | "team";
  email_override: string | null;
  last_daily_sent_at: string | null;
}

interface Profile {
  email: string;
  full_name: string;
  timezone: string;
}

interface AnalyticsData {
  callMetrics: {
    total: number;
    connected: number;
    noAnswer: number;
    meetingRequested: number;
  };
  conversionFunnel: {
    new: number;
    qualified: number;
    meetingBooked: number;
    closedWon: number;
  };
  meetingStats: {
    booked: number;
    completed: number;
  };
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get current hour in UTC
    const now = new Date();
    const currentHour = now.getUTCHours();
    const today = now.toISOString().split("T")[0];

    // Check for force_send parameter
    const url = new URL(req.url);
    const forceSend = url.searchParams.get("force_send") === "true";
    const targetUserId = url.searchParams.get("user_id");

    // Query subscriptions that need daily reports
    let query = supabase
      .from("email_report_subscriptions")
      .select(`
        id,
        organization_id,
        user_id,
        send_time,
        report_scope,
        email_override,
        last_daily_sent_at
      `)
      .eq("daily_report", true);

    if (targetUserId) {
      query = query.eq("user_id", targetUserId);
    }

    const { data: subscriptions, error: subError } = await query;

    if (subError) {
      throw new Error(`Failed to fetch subscriptions: ${subError.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No daily report subscriptions found", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let sentCount = 0;
    const errors: string[] = [];

    for (const sub of subscriptions as ReportSubscription[]) {
      try {
        // Check if it's time to send (match hour) or force send
        const sendHour = parseInt(sub.send_time.split(":")[0]);
        const alreadySentToday = sub.last_daily_sent_at?.startsWith(today);

        if (!forceSend && (sendHour !== currentHour || alreadySentToday)) {
          continue;
        }

        // Get user profile for email
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name, timezone")
          .eq("id", sub.user_id)
          .single();

        if (!profile) {
          errors.push(`No profile found for user ${sub.user_id}`);
          continue;
        }

        const recipientEmail = sub.email_override || profile.email;
        if (!recipientEmail) {
          errors.push(`No email for user ${sub.user_id}`);
          continue;
        }

        // Get organization name
        const { data: org } = await supabase
          .from("organizations")
          .select("name")
          .eq("id", sub.organization_id)
          .single();

        // Get yesterday's date range for the report
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const startDate = yesterday.toISOString().split("T")[0];
        const endDate = startDate;

        // Call the analytics RPC function
        const { data: analytics, error: analyticsError } = await supabase.rpc(
          "get_analytics_data",
          {
            p_org_id: sub.organization_id,
            p_start_date: startDate,
            p_end_date: endDate,
            p_user_id: sub.report_scope === "own" ? sub.user_id : null,
          }
        );

        if (analyticsError) {
          errors.push(`Analytics error for ${sub.user_id}: ${analyticsError.message}`);
          continue;
        }

        // Generate and send email
        const emailHtml = generateDailyReportEmail(
          profile as Profile,
          org?.name || "Your Organization",
          analytics as AnalyticsData,
          yesterday
        );

        if (RESEND_API_KEY) {
          const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Sales Engine <reports@yourdomain.com>",
              to: recipientEmail,
              subject: `Daily Sales Report - ${yesterday.toLocaleDateString("en-AU", { weekday: "long", month: "short", day: "numeric" })}`,
              html: emailHtml,
            }),
          });

          if (!emailResponse.ok) {
            const errorText = await emailResponse.text();
            errors.push(`Email send failed for ${recipientEmail}: ${errorText}`);
            continue;
          }
        }

        // Update last_daily_sent_at
        await supabase
          .from("email_report_subscriptions")
          .update({ last_daily_sent_at: now.toISOString() })
          .eq("id", sub.id);

        sentCount++;
      } catch (err) {
        errors.push(`Error processing ${sub.user_id}: ${err.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        message: `Daily reports processed`,
        sent: sentCount,
        total: subscriptions.length,
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

function generateDailyReportEmail(
  profile: Profile,
  orgName: string,
  analytics: AnalyticsData,
  reportDate: Date
): string {
  const dateStr = reportDate.toLocaleDateString("en-AU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const callMetrics = analytics?.callMetrics || { total: 0, connected: 0, noAnswer: 0, meetingRequested: 0 };
  const funnel = analytics?.conversionFunnel || { new: 0, qualified: 0, meetingBooked: 0, closedWon: 0 };
  const meetings = analytics?.meetingStats || { booked: 0, completed: 0 };

  const connectRate = callMetrics.total > 0
    ? Math.round((callMetrics.connected / callMetrics.total) * 100)
    : 0;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Sales Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px;">
      <h1 style="color: white; margin: 0 0 8px 0; font-size: 24px;">Daily Sales Report</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 14px;">${dateStr}</p>
      <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0 0; font-size: 12px;">${orgName}</p>
    </div>

    <!-- Greeting -->
    <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <p style="margin: 0; color: #374151; font-size: 16px;">
        Hi ${profile.full_name || "there"},
      </p>
      <p style="margin: 12px 0 0 0; color: #6b7280; font-size: 14px;">
        Here's your sales activity summary for yesterday.
      </p>
    </div>

    <!-- Call Metrics -->
    <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 16px; font-weight: 600;">
        📞 Call Activity
      </h2>
      <div style="display: flex; gap: 12px;">
        <div style="flex: 1; background: #eff6ff; border-radius: 8px; padding: 16px; text-align: center;">
          <div style="font-size: 28px; font-weight: 700; color: #2563eb;">${callMetrics.total}</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Total Calls</div>
        </div>
        <div style="flex: 1; background: #ecfdf5; border-radius: 8px; padding: 16px; text-align: center;">
          <div style="font-size: 28px; font-weight: 700; color: #059669;">${callMetrics.connected}</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Connected</div>
        </div>
        <div style="flex: 1; background: #fef3c7; border-radius: 8px; padding: 16px; text-align: center;">
          <div style="font-size: 28px; font-weight: 700; color: #d97706;">${connectRate}%</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Connect Rate</div>
        </div>
      </div>
      ${callMetrics.meetingRequested > 0 ? `
      <div style="margin-top: 12px; padding: 12px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #22c55e;">
        <span style="color: #166534; font-weight: 600;">🎉 ${callMetrics.meetingRequested} meeting${callMetrics.meetingRequested > 1 ? "s" : ""} requested!</span>
      </div>
      ` : ""}
    </div>

    <!-- Pipeline -->
    <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 16px; font-weight: 600;">
        📊 Pipeline Summary
      </h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">New Leads</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #111827;">${funnel.new}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Qualified</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #111827;">${funnel.qualified}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Meetings Booked</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #8b5cf6;">${funnel.meetingBooked}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Closed Won</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #059669;">${funnel.closedWon}</td>
        </tr>
      </table>
    </div>

    <!-- Meetings -->
    <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 16px; font-weight: 600;">
        📅 Meetings
      </h2>
      <div style="display: flex; gap: 12px;">
        <div style="flex: 1; background: #f5f3ff; border-radius: 8px; padding: 16px; text-align: center;">
          <div style="font-size: 28px; font-weight: 700; color: #7c3aed;">${meetings.booked}</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Booked</div>
        </div>
        <div style="flex: 1; background: #ecfdf5; border-radius: 8px; padding: 16px; text-align: center;">
          <div style="font-size: 28px; font-weight: 700; color: #059669;">${meetings.completed}</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Completed</div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 24px; color: #9ca3af; font-size: 12px;">
      <p style="margin: 0;">Sent by Sales Engine</p>
      <p style="margin: 8px 0 0 0;">
        <a href="#" style="color: #6366f1; text-decoration: none;">Manage report preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
