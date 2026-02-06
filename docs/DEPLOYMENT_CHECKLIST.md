# Deployment Checklist

Complete guide to deploying Sales Engine for production/beta use.

## Prerequisites

- [ ] Supabase account (free tier works for beta)
- [ ] Stripe account (test mode for beta)
- [ ] Resend account (free tier: 3,000 emails/month)
- [ ] Anthropic API key (for AI features)
- [ ] Apollo.io API key (for lead search)
- [ ] (Optional) Twilio account (for voice/SMS)

---

## Step 1: Supabase Project Setup

### 1.1 Create Project
- [ ] Go to [supabase.com](https://supabase.com) → New Project
- [ ] Note your **Project URL**: `https://xxxxx.supabase.co`
- [ ] Note your **anon key**: `eyJ...`
- [ ] Note your **service_role key**: `eyJ...` (keep secret!)

### 1.2 Run All Database Migrations

Go to **SQL Editor** → New Query and run each file in order:

```
supabase/migrations/001_initial_schema.sql    # Core tables
supabase/migrations/002_rls_policies.sql      # Row-level security
supabase/migrations/003_functions.sql         # Helper functions
supabase/migrations/004_features.sql          # Additional features
supabase/migrations/005_twilio_schema_fix.sql # Twilio columns
supabase/migrations/006_marketable.sql        # Email + Stripe columns
supabase/migrations/007_twilio_nullable.sql   # Twilio nullable fix
supabase/migrations/008_ai_usage.sql          # AI usage tracking
```

- [ ] Run 001_initial_schema.sql
- [ ] Run 002_rls_policies.sql
- [ ] Run 003_functions.sql
- [ ] Run 004_features.sql
- [ ] Run 005_twilio_schema_fix.sql
- [ ] Run 006_marketable.sql
- [ ] Run 007_twilio_nullable.sql
- [ ] Run 008_ai_usage.sql

### 1.3 Deploy Edge Functions

Using Supabase CLI:

```bash
# Install CLI if needed
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy all functions
supabase functions deploy ai-research
supabase functions deploy apollo-search
supabase functions deploy email-send
supabase functions deploy sms-send
supabase functions deploy stripe-checkout
supabase functions deploy stripe-portal
supabase functions deploy stripe-webhook
supabase functions deploy twilio-token
supabase functions deploy twilio-voice
supabase functions deploy twilio-status
supabase functions deploy webhook-dispatch
supabase functions deploy send-daily-report
```

- [ ] All 12 Edge Functions deployed

### 1.4 Configure Authentication

- [ ] Go to Authentication → Providers → Verify Email is enabled
- [ ] Go to Authentication → URL Configuration
- [ ] Set Site URL to your app's URL
- [ ] Add app URL to Redirect URLs

---

## Step 2: Stripe Setup (Billing)

### 2.1 Create Stripe Account
- [ ] Sign up at [stripe.com](https://stripe.com)
- [ ] Complete account verification (can use test mode for beta)

### 2.2 Create Pro Plan Product
- [ ] Go to Products → Add Product
- [ ] Name: "Pro Plan" (or your product name)
- [ ] Add a recurring price: $49/month
- [ ] Copy the **Price ID**: `price_xxxxx`

### 2.3 Configure Webhook
- [ ] Go to Developers → Webhooks → Add endpoint
- [ ] URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
- [ ] Events to listen for:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
- [ ] Copy the **Webhook Signing Secret**: `whsec_xxxxx`

### 2.4 Get API Keys
- [ ] Go to Developers → API Keys
- [ ] Copy **Secret key**: `sk_test_xxxxx` (use test key for beta)

### 2.5 Add Stripe Secrets to Supabase
Go to Project Settings → Edge Functions → Secrets:

- [ ] `STRIPE_SECRET_KEY` = `sk_test_xxxxx`
- [ ] `STRIPE_PRO_PRICE_ID` = `price_xxxxx`
- [ ] `STRIPE_WEBHOOK_SECRET` = `whsec_xxxxx`

---

## Step 3: Resend Setup (Email)

### 3.1 Create Resend Account
- [ ] Sign up at [resend.com](https://resend.com)
- [ ] Free tier: 3,000 emails/month, 100/day

### 3.2 Verify Domain (Recommended)
- [ ] Go to Domains → Add Domain
- [ ] Add DNS records as instructed
- [ ] Wait for verification (can take up to 24 hours)

Without domain verification, emails will be sent from `onboarding@resend.dev` (fine for testing).

### 3.3 Get API Key
- [ ] Go to API Keys → Create API Key
- [ ] Copy the key: `re_xxxxx`

### 3.4 Add Resend Secret to Supabase
- [ ] `RESEND_API_KEY` = `re_xxxxx`

### 3.5 Configure Org Email Settings
In the app, go to Settings → Email Configuration:
- [ ] Set "From Email" to your verified domain email
- [ ] Set "From Name" to your company name

---

## Step 4: Anthropic Setup (AI Features)

### 4.1 Get API Key
- [ ] Go to [console.anthropic.com](https://console.anthropic.com)
- [ ] Settings → API Keys → Create Key
- [ ] Copy the key: `sk-ant-xxxxx`

### 4.2 Add Anthropic Secret to Supabase
- [ ] `ANTHROPIC_API_KEY` = `sk-ant-xxxxx`

**Note:** This is the platform fallback key. Organizations can also add their own key in Settings for unlimited usage.

**Usage Limits (Platform Key):**
- 500 AI researches/month per org
- 50 script generations/month per org

---

## Step 5: Apollo.io Setup (Lead Search)

### 5.1 Get API Key
- [ ] Go to [app.apollo.io](https://app.apollo.io)
- [ ] Settings → Integrations → API → Create Key
- [ ] Copy the key

### 5.2 Add Apollo Secret to Supabase
- [ ] `APOLLO_API_KEY` = your key

**Note:** This is the platform fallback key. Organizations can also add their own key in Settings.

---

## Step 6: Twilio Setup (Optional - Voice/SMS)

Twilio is configured per-organization, not as platform secrets.

### 6.1 Create Twilio Account
- [ ] Sign up at [twilio.com](https://twilio.com)
- [ ] Get a phone number with Voice capability

### 6.2 Create TwiML App
- [ ] Go to Console → Voice → TwiML Apps → Create
- [ ] Name: "Sales Engine"
- [ ] Voice Request URL: `https://your-project.supabase.co/functions/v1/twilio-voice`
- [ ] Voice Status Callback: `https://your-project.supabase.co/functions/v1/twilio-status`
- [ ] Copy the **TwiML App SID**: `APxxxxx`

### 6.3 Create API Key (More Secure than Auth Token)
- [ ] Go to Console → Account → API Keys → Create API Key
- [ ] Copy **API Key SID**: `SKxxxxx`
- [ ] Copy **API Key Secret** (shown only once!)

### 6.4 Configure in App
Each organization configures Twilio in Settings → Twilio Configuration:
- Account SID
- API Key SID
- API Key Secret
- TwiML App SID
- Caller ID (phone number)

---

## Step 7: Connect the App

### 7.1 Configure Supabase Connection
Edit `config/supabase.js`:

```javascript
window.SUPABASE_CONFIG = {
  url: 'https://your-project.supabase.co',
  anonKey: 'eyJ...'
};
```

### 7.2 (Optional) Configure White-Label
Edit `config/app-config.js` to customize branding.

### 7.3 Deploy Frontend
- [ ] Upload `index.html`, `config/`, and `src/` to your hosting
- [ ] Or serve from any static hosting (Vercel, Netlify, S3, etc.)

---

## Step 8: Verification Checklist

### Test Authentication
- [ ] Can sign up with email
- [ ] Can sign in
- [ ] Profile is created automatically
- [ ] Organization is created for new users

### Test Billing (Stripe)
- [ ] "Upgrade to Pro" button appears for free users
- [ ] Clicking opens Stripe Checkout
- [ ] Use test card: `4242 4242 4242 4242`
- [ ] After checkout, plan updates to Pro
- [ ] "Manage Subscription" button works for Pro users

### Test AI Features (Pro Required)
- [ ] AI Research button works on a lead
- [ ] Script Builder generates custom scripts
- [ ] Usage counter increments in Settings

### Test Email (Pro Required)
- [ ] Can send email to a lead
- [ ] Email arrives at recipient
- [ ] Activity log shows email sent

### Test Apollo Search (Pro Required)
- [ ] Can search for leads
- [ ] Results display correctly
- [ ] Can import leads from results

### Test Twilio (If Configured)
- [ ] Can make outbound call
- [ ] Call connects to recipient
- [ ] Call recording saves (if enabled)
- [ ] SMS sends successfully

---

## Troubleshooting

### Edge Function Errors
Check function logs: Project → Edge Functions → Select function → Logs

### "Missing authorization header"
- Ensure user is logged in
- Check that auth token is being passed

### "No Anthropic API key configured"
- Add `ANTHROPIC_API_KEY` secret to Supabase
- Or add org-level key in Settings

### Stripe webhook not receiving events
- Verify webhook URL is correct
- Check webhook signing secret matches
- Ensure events are selected in Stripe dashboard

### Emails not sending
- Check Resend dashboard for errors
- Verify domain is verified (or use resend.dev for testing)
- Check `RESEND_API_KEY` is set

---

## Production Checklist

Before going live:

- [ ] Switch Stripe to live mode (change `sk_test_` to `sk_live_`)
- [ ] Update Stripe webhook to use live endpoint
- [ ] Verify Resend domain for branded emails
- [ ] Set up monitoring/alerting for Edge Functions
- [ ] Configure backup strategy for Supabase
- [ ] Review RLS policies for security
- [ ] Enable Supabase Auth rate limiting
- [ ] Set up error tracking (optional)
