/**
 * @module functions/apollo-search
 * @description Edge Function to proxy Apollo.io search API calls server-side
 *
 * PURPOSE:
 * - Proxy Apollo search requests so API keys never reach the browser
 * - Look up org-level Apollo key first, fall back to platform secret
 * - Forward search params to Apollo API and return results
 *
 * TRIGGERS:
 * - POST request from frontend (Supabase mode only)
 *
 * PARAMETERS:
 * - searchParams: Apollo search payload (same structure as direct API call)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PLATFORM_APOLLO_KEY = Deno.env.get("APOLLO_API_KEY");

interface ApolloSearchRequest {
  searchParams: Record<string, unknown>;
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

    // Check org plan - Apollo search is a Pro feature
    const { data: org } = await supabase
      .from("organizations")
      .select("plan, config")
      .eq("id", profile.organization_id)
      .single();

    if (org?.plan !== 'pro' && org?.plan !== 'trial') {
      return new Response(
        JSON.stringify({ error: "Apollo Search requires a Pro plan. Please upgrade." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: ApolloSearchRequest = await req.json();
    const { searchParams } = body;

    if (!searchParams) {
      return new Response(
        JSON.stringify({ error: "searchParams is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Resolve API key: org config → platform secret
    const orgApolloKey = org?.config?.apiKeys?.apollo;
    const apiKey = orgApolloKey || PLATFORM_APOLLO_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "No Apollo API key configured. Ask your admin to add one in Settings, or contact support." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Forward to Apollo API
    const apolloResponse = await fetch("https://api.apollo.io/v1/mixed_people/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify(searchParams),
    });

    const apolloResult = await apolloResponse.json();

    if (!apolloResponse.ok) {
      console.error("Apollo API error:", apolloResult);
      return new Response(
        JSON.stringify({ error: apolloResult.error || apolloResult.message || "Apollo API error" }),
        { status: apolloResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log activity
    await supabase.from("activity_log").insert({
      organization_id: profile.organization_id,
      entity_type: "system",
      entity_id: profile.organization_id,
      action: "apollo_search",
      actor_id: user.id,
      description: `Apollo search (${apolloResult.people?.length || 0} results)`,
      metadata: {
        resultCount: apolloResult.people?.length || 0,
        searchParams: {
          page: searchParams.page,
          per_page: searchParams.per_page,
          person_titles: searchParams.person_titles,
        },
      },
    });

    return new Response(
      JSON.stringify(apolloResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Apollo search error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
