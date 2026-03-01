# Migration Guide: localStorage to Supabase

This guide helps you migrate from Single User mode (localStorage) to Multi-User mode (Supabase) without losing your data.

## Overview

In Single User mode, all your data is stored in your browser's localStorage:
- **Leads** - Your prospect database
- **Tasks** - Follow-up items and to-dos
- **Meetings** - Scheduled appointments
- **Custom Playbooks** - Your custom sales scripts
- **Settings** - App preferences and configuration

When migrating to Multi-User mode, this data needs to be exported and imported into Supabase.

---

## Before You Start

### Requirements
1. A Supabase project set up (see [SETUP.md](./SETUP.md))
2. Database migrations applied (001, 002, 003)
3. Your Supabase project URL and anon key

### What Gets Migrated
| Data | localStorage Key | Supabase Table |
|------|------------------|----------------|
| Leads | `outboundSalesEngine.leads` | `leads` |
| Tasks | `outboundSalesEngine.tasks` | `tasks` |
| Meetings | `outboundSalesEngine.meetings` | `meetings` |
| Custom Playbooks | `customScripts` | `organizations.config` |
| Call Logs | `outboundSalesEngine.calls` | `call_logs` |

### What Won't Migrate
- Browser-specific settings (collapsed panels, tour status)
- API keys (you'll enter these fresh in Supabase mode)

---

## Step 1: Export Your Data

### Option A: Browser Console (Quick)

1. Open the app in Single User mode
2. Open browser DevTools (F12 or Cmd+Option+I)
3. Go to the Console tab
4. Paste and run this script:

```javascript
// Export all localStorage data
const exportData = {
  timestamp: new Date().toISOString(),
  version: '2.1.0',
  data: {
    main: JSON.parse(localStorage.getItem('outboundSalesEngine') || '{}'),
    customScripts: JSON.parse(localStorage.getItem('customScripts') || '{}'),
    settings: {
      mode: localStorage.getItem('outboundSalesEngineMode'),
      onboardingComplete: localStorage.getItem('onboardingComplete'),
      milestonesExpanded: localStorage.getItem('milestonesExpanded')
    }
  }
};

// Download as JSON file
const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `sales-engine-backup-${new Date().toISOString().split('T')[0]}.json`;
a.click();
URL.revokeObjectURL(url);

console.log('Export complete! Check your downloads folder.');
console.log('Leads:', exportData.data.main.leads?.length || 0);
console.log('Tasks:', exportData.data.main.tasks?.length || 0);
console.log('Custom Scripts:', Object.keys(exportData.data.customScripts || {}).length);
```

### Option B: Backup Button (Easier)

1. Open the app in Single User mode
2. Click **Settings** in the dashboard
3. Click **Backup Data**
4. Save the downloaded JSON file

---

## Step 2: Set Up Supabase

If you haven't already:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the database migrations (see [SETUP.md](./SETUP.md))
3. Configure `config/supabase.js` with your credentials:

```javascript
window.SUPABASE_CONFIG = {
  url: 'https://your-project.supabase.co',
  anonKey: 'your-anon-key'
};
```

---

## Step 3: Create Your Account

1. Reload the app (it should now show Login/Register)
2. Click **Register** and create your account
3. Verify your email if required
4. Log in to your new account

---

## Step 4: Import Your Data

### Option A: SQL Import (Recommended for Large Datasets)

1. Open your Supabase dashboard
2. Go to **SQL Editor**
3. For each data type, run an INSERT statement:

**Import Leads:**
```sql
-- Replace the JSON array with your exported leads
INSERT INTO leads (company, contact, title, phone, email, score, vertical, status, notes, organization_id, created_by)
SELECT
  lead->>'company',
  lead->>'contact',
  lead->>'title',
  lead->>'phone',
  lead->>'email',
  COALESCE((lead->>'score')::int, 0),
  lead->>'vertical',
  COALESCE(lead->>'status', 'new'),
  lead->>'notes',
  'YOUR_ORG_ID',  -- Replace with your organization ID
  'YOUR_USER_ID'  -- Replace with your user ID
FROM jsonb_array_elements('[
  -- Paste your leads array here from the export
]'::jsonb) AS lead;
```

**Import Tasks:**
```sql
INSERT INTO tasks (title, description, due_date, completed, priority, organization_id, created_by)
SELECT
  task->>'title',
  task->>'description',
  (task->>'dueDate')::timestamp,
  COALESCE((task->>'completed')::boolean, false),
  COALESCE(task->>'priority', 'medium'),
  'YOUR_ORG_ID',
  'YOUR_USER_ID'
FROM jsonb_array_elements('[
  -- Paste your tasks array here
]'::jsonb) AS task;
```

### Option B: Manual Entry (Small Datasets)

If you have fewer than 20 leads:
1. Open the app in Multi-User mode
2. Click **Add Lead** for each lead
3. Copy details from your export file

### Option C: CSV Import

1. Convert your JSON export to CSV format
2. Use the app's **Import Leads** feature
3. Map columns to fields

---

## Step 5: Import Custom Playbooks

Custom playbooks are stored in your organization's config:

1. Open Supabase dashboard
2. Go to **Table Editor** → **organizations**
3. Find your organization row
4. Edit the `config` JSONB column
5. Add your custom scripts:

```json
{
  "customScripts": {
    "your_vertical_key": {
      "name": "Your Vertical Name",
      "icon": "🎯",
      "isCustom": true,
      "productService": "...",
      "targetTitles": ["CEO", "CTO"],
      "painPoints": ["..."],
      "valueProps": ["..."],
      "openingScripts": [{"name": "...", "script": "..."}],
      "discoveryQuestions": ["..."],
      "objectionHandlers": {"objection": "response"},
      "closingScripts": [{"name": "...", "script": "..."}]
    }
  }
}
```

---

## Step 6: Verify Migration

After importing:

1. **Check Leads**: Go to Call Center, verify your leads appear
2. **Check Tasks**: Go to Today tab, verify tasks show up
3. **Check Playbooks**: Go to Playbooks, verify custom scripts appear
4. **Test Functionality**: Make a test call, add a note, verify it saves

---

## Troubleshooting

### "No leads showing after import"
- Check that `organization_id` matches your org
- Verify RLS policies are in place (run 002_rls_policies.sql)
- Ensure you're logged in as the user who owns the data

### "Custom playbooks not appearing"
- Check the `config` column format in organizations table
- Ensure JSON is valid (use a JSON validator)
- The key must be `customScripts` (case-sensitive)

### "Import SQL failing"
- Check for special characters in text fields (escape single quotes)
- Verify all required fields have values
- Check foreign key constraints (org_id and user_id must exist)

---

## Rollback Plan

If you need to go back to Single User mode:

1. Your localStorage data is still there (until you clear browser data)
2. Go to **Settings** → Clear the Supabase configuration
3. Or simply open the app with `?e2e=true` to bypass Supabase
4. The app will fall back to localStorage mode

---

## Data Backup Best Practices

After migrating to Supabase:

1. **Enable Supabase backups** in your project settings
2. **Export regularly** using the Backup button
3. **Keep your original export** file as a safety net

---

## Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Review Supabase logs in your dashboard
3. Open an issue at the project repository
