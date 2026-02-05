/**
 * @module functions/ai-research
 * @description Edge Function to proxy Anthropic Claude API calls server-side
 *
 * PURPOSE:
 * - Proxy AI research requests so API keys never reach the browser
 * - Look up org-level Anthropic key first, fall back to platform secret
 * - Forward prompt to Claude API and return response
 *
 * TRIGGERS:
 * - POST request from frontend (Supabase mode only)
 *
 * PARAMETERS:
 * - prompt: The prompt to send to Claude
 * - maxTokens: Max tokens for response (default 1500)
 * - model: Claude model to use (default claude-sonnet-4-20250514)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PLATFORM_ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY");

interface AIResearchRequest {
  prompt: string;
  maxTokens?: number;
  model?: string;
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

    // Check org plan - AI research is a Pro feature
    const { data: org } = await supabase
      .from("organizations")
      .select("plan, config")
      .eq("id", profile.organization_id)
      .single();

    if (org?.plan !== 'pro' && org?.plan !== 'trial') {
      return new Response(
        JSON.stringify({ error: "AI Research requires a Pro plan. Please upgrade." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: AIResearchRequest = await req.json();
    const { prompt, maxTokens = 1500, model = "claude-sonnet-4-20250514" } = body;

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Resolve API key: org config → platform secret
    const orgAnthropicKey = org?.config?.apiKeys?.anthropic;
    const apiKey = orgAnthropicKey || PLATFORM_ANTHROPIC_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "No Anthropic API key configured. Ask your admin to add one in Settings, or contact support." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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

    // Log activity
    await supabase.from("activity_log").insert({
      organization_id: profile.organization_id,
      entity_type: "system",
      entity_id: profile.organization_id,
      action: "ai_research",
      actor_id: user.id,
      description: `AI research request (${model}, ${maxTokens} max tokens)`,
      metadata: {
        model,
        maxTokens,
        inputLength: prompt.length,
        outputLength: anthropicResult.content?.[0]?.text?.length || 0,
      },
    });

    return new Response(
      JSON.stringify(anthropicResult),
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
