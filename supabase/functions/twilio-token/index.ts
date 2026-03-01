/**
 * @module functions/twilio-token
 * @description Edge Function to generate Twilio access tokens for browser calling
 *
 * PURPOSE:
 * - Generate JWT access tokens for Twilio Client SDK
 * - Validate user authentication and organization membership
 * - Retrieve Twilio credentials from organization settings
 *
 * TRIGGERS:
 * - POST request from frontend when initiating a call
 *
 * SECURITY:
 * - Requires valid Supabase auth token
 * - Validates organization membership
 * - Tokens expire after 1 hour
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface TwilioCredentials {
  account_sid: string;
  api_key_sid: string;
  api_key_secret: string;
  twiml_app_sid: string;
  caller_id: string;
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
    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create authenticated client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify user token
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

    // Get Twilio credentials for organization
    const { data: credentials, error: credError } = await supabase
      .from("twilio_credentials")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .eq("is_active", true)
      .single();

    if (credError || !credentials) {
      return new Response(
        JSON.stringify({ error: "Twilio not configured for this organization" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const creds = credentials as TwilioCredentials;

    // Generate Twilio access token
    const identity = user.id;
    const ttl = 3600; // 1 hour
    const now = Math.floor(Date.now() / 1000);

    // Build JWT header
    const header = {
      typ: "JWT",
      alg: "HS256",
      cty: "twilio-fpa;v=1"
    };

    // Build JWT payload with Voice grant
    const payload = {
      jti: `${creds.api_key_sid}-${now}`,
      iss: creds.api_key_sid,
      sub: creds.account_sid,
      exp: now + ttl,
      grants: {
        identity: identity,
        voice: {
          incoming: {
            allow: true
          },
          outgoing: {
            application_sid: creds.twiml_app_sid
          }
        }
      }
    };

    // Encode and sign JWT
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signatureInput = `${encodedHeader}.${encodedPayload}`;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(creds.api_key_secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(signatureInput)
    );

    const encodedSignature = base64UrlEncode(
      String.fromCharCode(...new Uint8Array(signature))
    );

    const accessToken = `${encodedHeader}.${encodedPayload}.${encodedSignature}`;

    return new Response(
      JSON.stringify({
        token: accessToken,
        identity: identity,
        callerId: creds.caller_id,
        expiresIn: ttl
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Token generation error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function base64UrlEncode(str: string): string {
  const base64 = btoa(str);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
