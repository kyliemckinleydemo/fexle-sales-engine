/**
 * @module config/supabase
 * @description Supabase configuration for multi-user deployments
 *
 * PURPOSE:
 * - Store Supabase project URL and anon key for deployments
 * - Allow customization without modifying index.html
 *
 * EXPORTS:
 * - window.SUPABASE_CONFIG - Global config object with url and anonKey
 *
 * PATTERNS:
 * - Edit this file directly for deployments
 * - Leave empty for localStorage-only mode
 * - Anon key is safe to expose (Supabase designed it this way)
 *
 * CLAUDE NOTES:
 * - This file is loaded via script tag before index.html app code
 * - RLS policies protect data, not the anon key
 * - Never put service_role key in this file
 *
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Create a Supabase project at https://supabase.com
 * 2. Run the migrations in supabase/migrations/ folder
 * 3. Copy your project URL and anon key from Project Settings > API
 * 4. Replace the empty strings below with your credentials
 *
 * SECURITY NOTE:
 * - The anon key is safe to expose in client-side code (it's public by design)
 * - Never expose your service_role key in client-side code
 * - Row Level Security (RLS) policies protect your data
 *
 * For local development without Supabase, leave these empty
 * and the app will run in localStorage-only mode.
 */
window.SUPABASE_CONFIG = {
  // Your Supabase project URL (e.g., 'https://your-project.supabase.co')
  url: 'https://mswvvtufnrxrxxelrjnq.supabase.co',

  // Your Supabase anon/public key (safe to expose in client code)
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zd3Z2dHVmbnJ4cnh4ZWxyam5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMTY0NDAsImV4cCI6MjA4NTc5MjQ0MH0.DOSxqSWBIA8PvlYDq3HROrUrYI8suAY83jnGAjWY9QE'
};
