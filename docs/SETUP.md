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
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_rls_policies.sql
supabase/migrations/003_functions.sql
```

**To run a migration:**
1. Open SQL Editor in Supabase
2. Click "New Query"
3. Copy/paste the entire contents of the migration file
4. Click "Run"
5. Repeat for each file in order

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

### 5. Connect the App

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
