/**
 * @module functions/ai-research
 * @description Edge Function to proxy Anthropic Claude API calls server-side
 *
 * PURPOSE:
 * - Proxy AI research requests so API keys never reach the browser
 * - Look up org-level Anthropic key first, fall back to platform secret
 * - Track usage per org per month with soft caps (500/month on platform key)
 * - Forward prompt to Claude API and return response
 *
 * TRIGGERS:
 * - POST request from frontend (Supabase mode only)
 *
 * PARAMETERS:
 * - prompt: The prompt to send to Claude
 * - maxTokens: Max tokens for response (default 1500)
 * - model: Claude model to use (default claude-sonnet-4-20250514)
 * - type: 'research' | 'script' (for usage tracking, default 'research')
 *
 * USAGE LIMITS:
 * - 500 researches/month included with Pro plan (using platform key)
 * - Unlimited if org provides their own Anthropic API key
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PLATFORM_ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY");

// Default monthly limits (can be overridden in org config)
const DEFAULT_MONTHLY_RESEARCH_LIMIT = 500;
const DEFAULT_MONTHLY_SCRIPT_LIMIT = 50;

interface AIResearchRequest {
  prompt: string;
  maxTokens?: number;
  model?: string;
  type?: 'research' | 'script';
}

interface UsageInfo {
  research_count: number;
  script_count: number;
  research_limit: number;
  script_limit: number;
  using_platform_key: boolean;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

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

    const orgId = profile.organization_id;

    // Check org plan - AI research is a Pro feature
    const { data: org } = await supabase
      .from("organizations")
      .select("plan, config")
      .eq("id", orgId)
      .single();

    if (org?.plan !== 'pro' && org?.plan !== 'trial') {
      return new Response(
        JSON.stringify({ error: "AI Research requires a Pro plan. Please upgrade." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: AIResearchRequest = await req.json();
    const { prompt, maxTokens = 1500, model = "claude-sonnet-4-20250514", type = "research" } = body;

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Resolve API key: org config → platform secret
    const orgAnthropicKey = org?.config?.apiKeys?.anthropic;
    const usingPlatformKey = !orgAnthropicKey;
    const apiKey = orgAnthropicKey || PLATFORM_ANTHROPIC_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "No Anthropic API key configured. Ask your admin to add one in Settings, or contact support." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get current month and usage
    const currentMonth = getCurrentMonth();
    const { data: usageRecord } = await supabase
      .from("ai_usage")
      .select("*")
      .eq("organization_id", orgId)
      .eq("month", currentMonth)
      .single();

    const currentResearchCount = usageRecord?.research_count || 0;
    const currentScriptCount = usageRecord?.script_count || 0;

    // Get limits (from org config or defaults)
    const researchLimit = org?.config?.aiLimits?.research || DEFAULT_MONTHLY_RESEARCH_LIMIT;
    const scriptLimit = org?.config?.aiLimits?.script || DEFAULT_MONTHLY_SCRIPT_LIMIT;

    // Check limits (only enforced when using platform key)
    if (usingPlatformKey) {
      if (type === 'research' && currentResearchCount >= researchLimit) {
        return new Response(
          JSON.stringify({
            error: `Monthly AI research limit reached (${researchLimit}/month). Add your own Anthropic API key in Settings to continue.`,
            code: "USAGE_LIMIT_REACHED",
            usage: {
              research_count: currentResearchCount,
              script_count: currentScriptCount,
              research_limit: researchLimit,
              script_limit: scriptLimit,
              using_platform_key: true,
            }
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (type === 'script' && currentScriptCount >= scriptLimit) {
        return new Response(
          JSON.stringify({
            error: `Monthly AI script generation limit reached (${scriptLimit}/month). Add your own Anthropic API key in Settings to continue.`,
            code: "USAGE_LIMIT_REACHED",
            usage: {
              research_count: currentResearchCount,
              script_count: currentScriptCount,
              research_limit: researchLimit,
              script_limit: scriptLimit,
              using_platform_key: true,
            }
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Forward to Anthropic API
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const anthropicResult = await anthropicResponse.json();

    if (!anthropicResponse.ok) {
      console.error("Anthropic API error:", anthropicResult);
      return new Response(
        JSON.stringify({ error: anthropicResult.error?.message || "Anthropic API error" }),
        { status: anthropicResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Increment usage counter (only when using platform key)
    let newUsage: UsageInfo;
    if (usingPlatformKey) {
      const incrementField = type === 'script' ? 'script_count' : 'research_count';
      const newCount = type === 'script' ? currentScriptCount + 1 : currentResearchCount + 1;

      if (usageRecord) {
        // Update existing record
        await supabase
          .from("ai_usage")
          .update({
            [incrementField]: newCount,
            updated_at: new Date().toISOString(),
          })
          .eq("id", usageRecord.id);
      } else {
        // Create new record for this month
        await supabase
          .from("ai_usage")
          .insert({
            organization_id: orgId,
            month: currentMonth,
            research_count: type === 'research' ? 1 : 0,
            script_count: type === 'script' ? 1 : 0,
          });
      }

      newUsage = {
        research_count: type === 'research' ? currentResearchCount + 1 : currentResearchCount,
        script_count: type === 'script' ? currentScriptCount + 1 : currentScriptCount,
        research_limit: researchLimit,
        script_limit: scriptLimit,
        using_platform_key: true,
      };
    } else {
      newUsage = {
        research_count: currentResearchCount,
        script_count: currentScriptCount,
        research_limit: researchLimit,
        script_limit: scriptLimit,
        using_platform_key: false,
      };
    }

    // Log activity
    await supabase.from("activity_log").insert({
      organization_id: orgId,
      entity_type: "system",
      entity_id: orgId,
      action: type === 'script' ? "ai_script_generation" : "ai_research",
      actor_id: user.id,
      description: `AI ${type} request (${model}, ${maxTokens} max tokens)`,
      metadata: {
        model,
        maxTokens,
        inputLength: prompt.length,
        outputLength: anthropicResult.content?.[0]?.text?.length || 0,
        usingPlatformKey,
      },
    });

    // Return response with usage info
    return new Response(
      JSON.stringify({
        ...anthropicResult,
        usage: newUsage,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI research error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
