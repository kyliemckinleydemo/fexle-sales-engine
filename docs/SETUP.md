# Sales Engine - Setup Guide

## Quick Start

### Option 1: Local Mode (No Database)

The app works out of the box with localStorage - just open `index.html` in a browser. Data persists in your browser but is not shared between users or devices.

### Option 2: Multi-User Mode (Supabase)

For team usage with shared data, user authentication, and real-time sync, you'll need to set up Supabase.

---

## Supabase Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose a name and strong database password
4. Select a region close to your users
5. Wait for the project to be created (~2 minutes)

### 2. Run Database Migrations

Go to **SQL Editor** in your Supabase dashboard and run these files in order:

```
supabase/migrations/001_initial_schema.sql    # Core tables (profiles, orgs, leads, etc.)
supabase/migrations/002_rls_policies.sql      # Row-level security policies
supabase/migrations/003_functions.sql         # Helper functions and triggers
supabase/migrations/004_features.sql          # Additional feature tables
supabase/migrations/005_twilio_schema_fix.sql # Twilio credential columns
supabase/migrations/006_marketable.sql        # Email sends + Stripe columns
supabase/migrations/007_twilio_nullable.sql   # Make Twilio fields nullable
supabase/migrations/008_ai_usage.sql          # AI usage tracking for soft caps
```

**To run a migration:**
1. Open SQL Editor in Supabase
2. Click "New Query"
3. Copy/paste the entire contents of the migration file
4. Click "Run"
5. Repeat for each file in order (001 through 008)

### 3. Configure Authentication

1. Go to **Authentication** → **Providers**
2. Email is enabled by default
3. (Optional) Enable Google, Microsoft, or other OAuth providers
4. Go to **Authentication** → **URL Configuration**
5. Add your app's URL to "Site URL" and "Redirect URLs"

### 4. Get Your API Keys

1. Go to **Project Settings** → **API**
2. Copy the **Project URL** (looks like `https://xxxxx.supabase.co`)
3. Copy the **anon/public** key (starts with `eyJ...`)

### 5. Deploy Edge Functions

Edge Functions power server-side features (billing, AI, email, etc.). Deploy using Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
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

### 6. Add Edge Function Secrets

Go to **Project Settings** → **Edge Functions** → **Secrets** and add:

| Secret | Required | Source |
|--------|----------|--------|
| `STRIPE_SECRET_KEY` | Yes | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) |
| `STRIPE_PRO_PRICE_ID` | Yes | Stripe Products → Your price ID |
| `STRIPE_WEBHOOK_SECRET` | Yes | [Stripe Webhooks](https://dashboard.stripe.com/webhooks) |
| `ANTHROPIC_API_KEY` | Yes | [Anthropic Console](https://console.anthropic.com) |
| `APOLLO_API_KEY` | Yes | [Apollo Settings](https://app.apollo.io/#/settings/integrations/api) |
| `RESEND_API_KEY` | Yes | [Resend API Keys](https://resend.com/api-keys) |

See `.env.example` for detailed instructions on getting each key.

### 7. Configure External Services

#### Stripe (Billing)
1. Create a product in Stripe Dashboard → Products
2. Add a $49/month recurring price
3. Copy the price ID to `STRIPE_PRO_PRICE_ID`
4. Create webhook endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
5. Select events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed`

#### Resend (Email)
1. Sign up at [resend.com](https://resend.com)
2. (Optional) Verify your domain for branded emails
3. Create API key and add to Supabase secrets
4. Configure org email settings in app Settings

#### Twilio (Voice/SMS) - Optional
Twilio is configured per-organization in the app:
1. Create TwiML App with Voice URL: `https://your-project.supabase.co/functions/v1/twilio-voice`
2. Create API Key (more secure than Auth Token)
3. In app Settings → Twilio, enter Account SID, API Key, and TwiML App SID

For detailed setup instructions, see `docs/DEPLOYMENT_CHECKLIST.md`.

---

### 8. Connect the App

**Option A: Config File (recommended for deployments)**

Edit `config/supabase.js` with your credentials:
```javascript
window.SUPABASE_CONFIG = {
  url: 'https://your-project.supabase.co',
  anonKey: 'eyJ...'
};
```

This is the recommended method for production deployments. The anon key is safe to include in client-side code (Supabase designed it this way), and RLS policies protect your data.

**Option B: URL Parameters**
```
index.html?supabase_url=https://xxxxx.supabase.co&supabase_key=eyJ...
```

**Option C: In-App Setup**
1. Open the app
2. Click "Configure Database Connection"
3. Paste your Project URL and Anon Key
4. Click "Connect & Save"

**Option D: localStorage (developers)**
```javascript
localStorage.setItem('supabase_url', 'https://xxxxx.supabase.co');
localStorage.setItem('supabase_key', 'eyJ...');
```

---

## Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profile data (extends Supabase auth) |
| `organizations` | Companies/teams using the platform |
| `organization_members` | User-org relationships with roles |
| `leads` | Sales leads/prospects |
| `tasks` | Follow-up tasks and to-dos |
| `availability_slots` | CEO/meeting availability |
| `meetings` | Booked meetings |
| `collateral` | Marketing materials |
| `activity_log` | Audit trail |
| `invitations` | Pending team invites |
| `call_lists` | Daily call queues |
| `twilio_credentials` | Per-org Twilio configuration |
| `call_recordings` | Voice call recordings |
| `email_sends` | Email sending log |
| `ai_usage` | AI feature usage tracking per org/month |

### User Roles

| Role | Permissions |
|------|-------------|
| `owner` | Full access, can delete org |
| `admin` | Manage config, users, collateral |
| `member` | Full CRUD on leads, tasks, meetings |
| `viewer` | Read-only access |

### Team Management

Owners can manage their team from **Settings → Team Management**:

**Inviting Members:**
1. Go to Settings (gear icon)
2. Open "Team Management" section
3. Enter email address and select role
4. Click "Invite"
5. The invitee receives an invite link (copy it for them)

**Invite Flow:**
1. New member receives/clicks invite link (e.g., `?invite=TOKEN`)
2. They sign up or log in
3. Invitation is automatically accepted
4. They're added to the organization with the specified role

**Managing Members:**
- Change roles using the dropdown next to each member
- Remove members with the ✕ button (requires confirmation)
- View pending invitations and resend/cancel as needed

**Notes:**
- Only owners can manage team members
- Owners cannot be removed (transfer ownership via Supabase dashboard)
- Invitations expire after 7 days
- Each email can only have one active invitation per organization

---

## White-Label Configuration

Organization config is stored in `organizations.config` (JSONB). Structure:

```json
{
  "company": {
    "name": "Your Company",
    "tagline": "Your value proposition",
    "size": "50+ employees",
    "locations": ["City 1", "City 2"],
    "keyProducts": ["Product A", "Service B"],
    "proofPoints": ["Achievement 1", "Achievement 2"],
    "website": "https://yourcompany.com",
    "ceoName": "CEO Name",
    "meetingDuration": 20
  },
  "branding": {
    "logo": null,
    "primaryColor": "#3b82f6",
    "secondaryColor": "#8b5cf6"
  },
  "localization": {
    "country": "AU",
    "currency": "AUD",
    "timezone": "Australia/Sydney",
    "dateFormat": "en-AU"
  },
  "scripts": {},
  "verticals": {},
  "scoring": {},
  "collateralRules": []
}
```

---

## Troubleshooting

### "Permission denied" errors

Make sure you've run the RLS policies migration (`002_rls_policies.sql`).

### Can't sign up / sign in

1. Check that email auth is enabled in Supabase Authentication settings
2. Verify your Site URL is configured correctly
3. Check browser console for specific error messages

### Data not showing

1. Verify you're a member of an organization
2. Check that RLS policies allow access
3. Try refreshing the page

### Real-time updates not working

Real-time is enabled by the functions migration. Ensure:
1. You've run `003_functions.sql`
2. The tables are added to `supabase_realtime` publication

---

## Security Notes

- The `anon` key is safe to expose in the frontend
- Row Level Security (RLS) protects all data
- Users can only access data in their organization
- API keys should still be treated carefully
- For production, consider enabling additional auth security features

---

## Self-Hosting Supabase

For full data control, you can self-host Supabase:

1. Follow the [self-hosting guide](https://supabase.com/docs/guides/self-hosting)
2. Run the same migrations against your self-hosted instance
3. Update the Project URL to your self-hosted URL

---

## Support

For issues:
1. Check browser console for errors
2. Verify Supabase dashboard shows the tables and data
3. Test queries directly in Supabase SQL Editor
