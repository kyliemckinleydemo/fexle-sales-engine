/**
 * @module functions/send-weekly-report
 * @description Edge Function to send weekly analytics reports with trends
 *
 * PURPOSE:
 * - Query email_report_subscriptions for users wanting weekly reports
 * - Generate HTML email with week-over-week comparison
 * - Send via Resend email service
 * - Update last_weekly_sent_at timestamp
 *
 * TRIGGERS:
 * - Cron job: Every hour, checks for subscriptions due on their send_day_of_week
 * - Manual: POST request with force_send=true
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
  send_day_of_week: number;
  report_scope: "own" | "team";
  email_override: string | null;
  last_weekly_sent_at: string | null;
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
    avgDuration: number;
  };
  conversionFunnel: {
    new: number;
    contacted: number;
    qualified: number;
    meetingBooked: number;
    proposalSent: number;
    closedWon: number;
    closedLost: number;
  };
  meetingStats: {
    booked: number;
    completed: number;
    noShow: number;
    cancelled: number;
  };
  repLeaderboard?: Array<{
    name: string;
    calls: number;
    meetings: number;
    conversionRate: number;
  }>;
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
    const currentDayOfWeek = now.getUTCDay(); // 0 = Sunday, 1 = Monday
    const currentHour = now.getUTCHours();

    // Get week number for tracking
    const getWeekNumber = (d: Date) => {
      const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
      const pastDaysOfYear = (d.getTime() - firstDayOfYear.getTime()) / 86400000;
      return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    };
    const currentWeek = getWeekNumber(now);

    const url = new URL(req.url);
    const forceSend = url.searchParams.get("force_send") === "true";
    const targetUserId = url.searchParams.get("user_id");

    // Query subscriptions that need weekly reports
    let query = supabase
      .from("email_report_subscriptions")
      .select(`
        id,
        organization_id,
        user_id,
        send_time,
        send_day_of_week,
        report_scope,
        email_override,
        last_weekly_sent_at
      `)
      .eq("weekly_report", true);

    if (targetUserId) {
      query = query.eq("user_id", targetUserId);
    }

    const { data: subscriptions, error: subError } = await query;

    if (subError) {
      throw new Error(`Failed to fetch subscriptions: ${subError.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No weekly report subscriptions found", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let sentCount = 0;
    const errors: string[] = [];

    for (const sub of subscriptions as ReportSubscription[]) {
      try {
        // Check if it's the right day and hour, or force send
        const sendHour = parseInt(sub.send_time.split(":")[0]);
        const lastSentWeek = sub.last_weekly_sent_at
          ? getWeekNumber(new Date(sub.last_weekly_sent_at))
          : 0;
        const alreadySentThisWeek = lastSentWeek === currentWeek;

        if (!forceSend && (
          sub.send_day_of_week !== currentDayOfWeek ||
          sendHour !== currentHour ||
          alreadySentThisWeek
        )) {
          continue;
        }

        // Get user profile
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

        // Calculate date ranges for this week and last week
        const thisWeekEnd = new Date(now);
        thisWeekEnd.setDate(thisWeekEnd.getDate() - 1); // Yesterday
        const thisWeekStart = new Date(thisWeekEnd);
        thisWeekStart.setDate(thisWeekStart.getDate() - 6); // 7 days ago

        const lastWeekEnd = new Date(thisWeekStart);
        lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
        const lastWeekStart = new Date(lastWeekEnd);
        lastWeekStart.setDate(lastWeekStart.getDate() - 6);

        // Get this week's analytics
        const { data: thisWeekData } = await supabase.rpc("get_analytics_data", {
          p_org_id: sub.organization_id,
          p_start_date: thisWeekStart.toISOString().split("T")[0],
          p_end_date: thisWeekEnd.toISOString().split("T")[0],
          p_user_id: sub.report_scope === "own" ? sub.user_id : null,
        });

        // Get last week's analytics for comparison
        const { data: lastWeekData } = await supabase.rpc("get_analytics_data", {
          p_org_id: sub.organization_id,
          p_start_date: lastWeekStart.toISOString().split("T")[0],
          p_end_date: lastWeekEnd.toISOString().split("T")[0],
          p_user_id: sub.report_scope === "own" ? sub.user_id : null,
        });

        // Generate and send email
        const emailHtml = generateWeeklyReportEmail(
          profile as Profile,
          org?.name || "Your Organization",
          thisWeekData as AnalyticsData,
          lastWeekData as AnalyticsData,
          thisWeekStart,
          thisWeekEnd,
          sub.report_scope === "team"
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
              subject: `Weekly Sales Report - Week of ${thisWeekStart.toLocaleDateString("en-AU", { month: "short", day: "numeric" })}`,
              html: emailHtml,
            }),
          });

          if (!emailResponse.ok) {
            const errorText = await emailResponse.text();
            errors.push(`Email send failed for ${recipientEmail}: ${errorText}`);
            continue;
          }
        }

        // Update last_weekly_sent_at
        await supabase
          .from("email_report_subscriptions")
          .update({ last_weekly_sent_at: now.toISOString() })
          .eq("id", sub.id);

        sentCount++;
      } catch (err) {
        errors.push(`Error processing ${sub.user_id}: ${err.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        message: `Weekly reports processed`,
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

function calculateTrend(current: number, previous: number): { value: number; direction: "up" | "down" | "flat" } {
  if (previous === 0) {
    return { value: current > 0 ? 100 : 0, direction: current > 0 ? "up" : "flat" };
  }
  const change = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(Math.round(change)),
    direction: change > 0 ? "up" : change < 0 ? "down" : "flat",
  };
}

function getTrendIcon(direction: "up" | "down" | "flat"): string {
  return direction === "up" ? "↑" : direction === "down" ? "↓" : "→";
}

function getTrendColor(direction: "up" | "down" | "flat", isPositiveGood = true): string {
  if (direction === "flat") return "#6b7280";
  const isGood = direction === "up" ? isPositiveGood : !isPositiveGood;
  return isGood ? "#059669" : "#dc2626";
}

function generateWeeklyReportEmail(
  profile: Profile,
  orgName: string,
  thisWeek: AnalyticsData,
  lastWeek: AnalyticsData,
  startDate: Date,
  endDate: Date,
  includeTeamStats: boolean
): string {
  const dateRange = `${startDate.toLocaleDateString("en-AU", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-AU", { month: "short", day: "numeric", year: "numeric" })}`;

  const tw = thisWeek || { callMetrics: {}, conversionFunnel: {}, meetingStats: {} };
  const lw = lastWeek || { callMetrics: {}, conversionFunnel: {}, meetingStats: {} };

  const callsTrend = calculateTrend(tw.callMetrics?.total || 0, lw.callMetrics?.total || 0);
  const connectedTrend = calculateTrend(tw.callMetrics?.connected || 0, lw.callMetrics?.connected || 0);
  const meetingsTrend = calculateTrend(tw.meetingStats?.booked || 0, lw.meetingStats?.booked || 0);
  const wonTrend = calculateTrend(tw.conversionFunnel?.closedWon || 0, lw.conversionFunnel?.closedWon || 0);

  const connectRate = (tw.callMetrics?.total || 0) > 0
    ? Math.round(((tw.callMetrics?.connected || 0) / tw.callMetrics.total) * 100)
    : 0;

  const leaderboardHtml = includeTeamStats && tw.repLeaderboard?.length
    ? `
    <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 16px; font-weight: 600;">
        🏆 Team Leaderboard
      </h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <th style="padding: 8px 0; text-align: left; color: #6b7280; font-size: 12px; font-weight: 500;">#</th>
          <th style="padding: 8px 0; text-align: left; color: #6b7280; font-size: 12px; font-weight: 500;">Rep</th>
          <th style="padding: 8px 0; text-align: right; color: #6b7280; font-size: 12px; font-weight: 500;">Calls</th>
          <th style="padding: 8px 0; text-align: right; color: #6b7280; font-size: 12px; font-weight: 500;">Meetings</th>
        </tr>
        ${tw.repLeaderboard.slice(0, 5).map((rep, i) => `
        <tr>
          <td style="padding: 8px 0; font-size: 14px;">${i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</td>
          <td style="padding: 8px 0; font-weight: 500; color: #111827; font-size: 14px;">${rep.name}</td>
          <td style="padding: 8px 0; text-align: right; color: #6b7280; font-size: 14px;">${rep.calls}</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #8b5cf6; font-size: 14px;">${rep.meetings}</td>
        </tr>
        `).join("")}
      </table>
    </div>
    `
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Sales Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px;">
      <h1 style="color: white; margin: 0 0 8px 0; font-size: 24px;">Weekly Sales Report</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 14px;">${dateRange}</p>
      <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0 0; font-size: 12px;">${orgName}</p>
    </div>

    <!-- Greeting -->
    <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <p style="margin: 0; color: #374151; font-size: 16px;">
        Hi ${profile.full_name || "there"},
      </p>
      <p style="margin: 12px 0 0 0; color: #6b7280; font-size: 14px;">
        Here's your weekly performance summary with week-over-week trends.
      </p>
    </div>

    <!-- Key Metrics with Trends -->
    <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 16px; font-weight: 600;">
        📈 This Week vs Last Week
      </h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
            <div style="color: #6b7280; font-size: 12px;">Total Calls</div>
            <div style="font-size: 24px; font-weight: 700; color: #111827;">${tw.callMetrics?.total || 0}</div>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">
            <span style="color: ${getTrendColor(callsTrend.direction)}; font-weight: 600;">
              ${getTrendIcon(callsTrend.direction)} ${callsTrend.value}%
            </span>
            <div style="color: #9ca3af; font-size: 11px;">vs ${lw.callMetrics?.total || 0}</div>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
            <div style="color: #6b7280; font-size: 12px;">Connected</div>
            <div style="font-size: 24px; font-weight: 700; color: #059669;">${tw.callMetrics?.connected || 0}</div>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">
            <span style="color: ${getTrendColor(connectedTrend.direction)}; font-weight: 600;">
              ${getTrendIcon(connectedTrend.direction)} ${connectedTrend.value}%
            </span>
            <div style="color: #9ca3af; font-size: 11px;">vs ${lw.callMetrics?.connected || 0}</div>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
            <div style="color: #6b7280; font-size: 12px;">Meetings Booked</div>
            <div style="font-size: 24px; font-weight: 700; color: #8b5cf6;">${tw.meetingStats?.booked || 0}</div>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">
            <span style="color: ${getTrendColor(meetingsTrend.direction)}; font-weight: 600;">
              ${getTrendIcon(meetingsTrend.direction)} ${meetingsTrend.value}%
            </span>
            <div style="color: #9ca3af; font-size: 11px;">vs ${lw.meetingStats?.booked || 0}</div>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0;">
            <div style="color: #6b7280; font-size: 12px;">Closed Won</div>
            <div style="font-size: 24px; font-weight: 700; color: #059669;">${tw.conversionFunnel?.closedWon || 0}</div>
          </td>
          <td style="padding: 12px 0; text-align: right;">
            <span style="color: ${getTrendColor(wonTrend.direction)}; font-weight: 600;">
              ${getTrendIcon(wonTrend.direction)} ${wonTrend.value}%
            </span>
            <div style="color: #9ca3af; font-size: 11px;">vs ${lw.conversionFunnel?.closedWon || 0}</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Connect Rate -->
    <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 16px; font-weight: 600;">
        📊 Connect Rate
      </h2>
      <div style="background: #f3f4f6; border-radius: 8px; height: 24px; overflow: hidden;">
        <div style="background: linear-gradient(90deg, #3b82f6, #8b5cf6); height: 100%; width: ${connectRate}%; transition: width 0.3s;"></div>
      </div>
      <div style="display: flex; justify-content: space-between; margin-top: 8px;">
        <span style="font-size: 12px; color: #6b7280;">0%</span>
        <span style="font-size: 16px; font-weight: 700; color: #111827;">${connectRate}%</span>
        <span style="font-size: 12px; color: #6b7280;">100%</span>
      </div>
    </div>

    <!-- Pipeline Snapshot -->
    <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 16px; font-weight: 600;">
        🔄 Pipeline Snapshot
      </h2>
      <div style="display: flex; gap: 8px;">
        <div style="flex: 1; text-align: center; padding: 12px 8px; background: #f3f4f6; border-radius: 8px;">
          <div style="font-size: 18px; font-weight: 700; color: #6b7280;">${tw.conversionFunnel?.new || 0}</div>
          <div style="font-size: 10px; color: #9ca3af;">New</div>
        </div>
        <div style="flex: 1; text-align: center; padding: 12px 8px; background: #dbeafe; border-radius: 8px;">
          <div style="font-size: 18px; font-weight: 700; color: #2563eb;">${tw.conversionFunnel?.contacted || 0}</div>
          <div style="font-size: 10px; color: #3b82f6;">Contacted</div>
        </div>
        <div style="flex: 1; text-align: center; padding: 12px 8px; background: #e0e7ff; border-radius: 8px;">
          <div style="font-size: 18px; font-weight: 700; color: #4f46e5;">${tw.conversionFunnel?.qualified || 0}</div>
          <div style="font-size: 10px; color: #6366f1;">Qualified</div>
        </div>
        <div style="flex: 1; text-align: center; padding: 12px 8px; background: #f3e8ff; border-radius: 8px;">
          <div style="font-size: 18px; font-weight: 700; color: #9333ea;">${tw.conversionFunnel?.meetingBooked || 0}</div>
          <div style="font-size: 10px; color: #a855f7;">Meeting</div>
        </div>
        <div style="flex: 1; text-align: center; padding: 12px 8px; background: #dcfce7; border-radius: 8px;">
          <div style="font-size: 18px; font-weight: 700; color: #16a34a;">${tw.conversionFunnel?.closedWon || 0}</div>
          <div style="font-size: 10px; color: #22c55e;">Won</div>
        </div>
      </div>
    </div>

    ${leaderboardHtml}

    <!-- Footer -->
    <div style="text-align: center; padding: 24px; color: #9ca3af; font-size: 12px;">
      <p style="margin: 0;">Sent by Sales Engine</p>
      <p style="margin: 8px 0 0 0;">
        <a href="#" style="color: #7c3aed; text-decoration: none;">Manage report preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
