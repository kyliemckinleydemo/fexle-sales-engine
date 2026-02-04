-- Sales Engine Data Import Template
-- ===================================
--
-- Instructions:
-- 1. Replace YOUR_ORG_ID with your organization UUID
-- 2. Replace YOUR_USER_ID with your user UUID
-- 3. Paste your exported data into the JSON arrays
-- 4. Run in Supabase SQL Editor
--
-- To find your IDs:
-- SELECT id FROM organizations WHERE name = 'Your Org Name';
-- SELECT id FROM auth.users WHERE email = 'your@email.com';

-- Set your IDs here (replace with actual UUIDs)
DO $$
DECLARE
  org_id UUID := 'YOUR_ORG_ID';  -- Replace this
  user_id UUID := 'YOUR_USER_ID'; -- Replace this
BEGIN

-- ============================================
-- IMPORT LEADS
-- ============================================
-- Paste your leads array from the export file below

INSERT INTO leads (
  company, contact, title, phone, email,
  score, vertical, company_size, revenue,
  status, notes, research, source,
  discovery_done, deck_sent, meeting_held, proposal_sent, won, lost,
  organization_id, created_by
)
SELECT
  (lead->>'company')::text,
  (lead->>'contact')::text,
  (lead->>'title')::text,
  (lead->>'phone')::text,
  (lead->>'email')::text,
  COALESCE((lead->>'score')::int, 0),
  COALESCE(lead->>'vertical', 'general'),
  (lead->>'company_size')::text,
  (lead->>'revenue')::text,
  COALESCE(lead->>'status', 'new'),
  (lead->>'notes')::text,
  (lead->>'research')::text,
  COALESCE(lead->>'source', 'manual'),
  COALESCE((lead->>'discovery_done')::boolean, false),
  COALESCE((lead->>'deck_sent')::boolean, false),
  COALESCE((lead->>'meeting_held')::boolean, false),
  COALESCE((lead->>'proposal_sent')::boolean, false),
  COALESCE((lead->>'won')::boolean, false),
  COALESCE((lead->>'lost')::boolean, false),
  org_id,
  user_id
FROM jsonb_array_elements('[]'::jsonb) AS lead;
-- ↑ Paste your leads JSON array above (replace the empty [])

RAISE NOTICE 'Leads imported';


-- ============================================
-- IMPORT TASKS
-- ============================================
-- Paste your tasks array from the export file below

INSERT INTO tasks (
  title, description, due_date, completed, priority,
  organization_id, created_by
)
SELECT
  (task->>'title')::text,
  (task->>'description')::text,
  CASE
    WHEN task->>'dueDate' IS NOT NULL THEN (task->>'dueDate')::timestamp
    WHEN task->>'due_date' IS NOT NULL THEN (task->>'due_date')::timestamp
    ELSE NULL
  END,
  COALESCE((task->>'completed')::boolean, false),
  COALESCE(task->>'priority', 'medium'),
  org_id,
  user_id
FROM jsonb_array_elements('[]'::jsonb) AS task;
-- ↑ Paste your tasks JSON array above (replace the empty [])

RAISE NOTICE 'Tasks imported';


-- ============================================
-- IMPORT MEETINGS
-- ============================================
-- Paste your meetings array from the export file below

INSERT INTO meetings (
  lead_id, title, meeting_time, duration, notes, status,
  organization_id, created_by
)
SELECT
  NULL, -- Lead ID needs to be looked up separately
  (meeting->>'title')::text,
  CASE
    WHEN meeting->>'meeting_time' IS NOT NULL THEN (meeting->>'meeting_time')::timestamp
    WHEN meeting->>'meetingTime' IS NOT NULL THEN (meeting->>'meetingTime')::timestamp
    ELSE NOW()
  END,
  COALESCE((meeting->>'duration')::int, 30),
  (meeting->>'notes')::text,
  COALESCE(meeting->>'status', 'scheduled'),
  org_id,
  user_id
FROM jsonb_array_elements('[]'::jsonb) AS meeting;
-- ↑ Paste your meetings JSON array above (replace the empty [])

RAISE NOTICE 'Meetings imported';


-- ============================================
-- IMPORT CALL LOGS (if available)
-- ============================================
-- Call logs may not be available in localStorage exports

INSERT INTO call_logs (
  lead_id, duration, outcome, notes,
  organization_id, created_by
)
SELECT
  NULL, -- Lead ID needs to be looked up separately
  COALESCE((call_log->>'duration')::int, 0),
  (call_log->>'outcome')::text,
  (call_log->>'notes')::text,
  org_id,
  user_id
FROM jsonb_array_elements('[]'::jsonb) AS call_log;
-- ↑ Paste your calls JSON array above (replace the empty [])

RAISE NOTICE 'Call logs imported';


-- ============================================
-- IMPORT CUSTOM SCRIPTS (into organization config)
-- ============================================
-- This updates your organization's config with custom playbooks

/*
-- Uncomment and modify this if you have custom scripts to import:

UPDATE organizations
SET config = jsonb_set(
  COALESCE(config, '{}'::jsonb),
  '{customScripts}',
  '
    -- Paste your customScripts object here
  '::jsonb
)
WHERE id = org_id;

RAISE NOTICE 'Custom scripts imported';
*/

END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify your import worked

-- Count imported leads
SELECT 'Leads' as type, COUNT(*) as count FROM leads;

-- Count imported tasks
SELECT 'Tasks' as type, COUNT(*) as count FROM tasks;

-- Count imported meetings
SELECT 'Meetings' as type, COUNT(*) as count FROM meetings;

-- Check organization config for custom scripts
SELECT id, name, config->'customScripts' as custom_scripts
FROM organizations
LIMIT 1;
