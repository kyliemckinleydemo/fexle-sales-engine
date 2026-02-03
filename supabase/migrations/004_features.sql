-- ============================================================
-- Competitive Features Migration
-- Version: 1.1.0
-- Description: Adds analytics, email reports, sequences, Twilio,
--              SMS, and webhook/Zapier integration
-- ============================================================

-- ==================== ANALYTICS SNAPSHOTS ====================
-- Pre-computed daily/weekly metrics for fast dashboard loading
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,

  -- Snapshot type and period
  snapshot_type TEXT NOT NULL CHECK (snapshot_type IN ('daily', 'weekly', 'monthly')),
  snapshot_date DATE NOT NULL,

  -- Call metrics
  calls_total INTEGER DEFAULT 0,
  calls_connected INTEGER DEFAULT 0,
  calls_voicemail INTEGER DEFAULT 0,
  calls_no_answer INTEGER DEFAULT 0,
  calls_meeting_requested INTEGER DEFAULT 0,
  calls_duration_seconds INTEGER DEFAULT 0,

  -- Conversion funnel
  leads_new INTEGER DEFAULT 0,
  leads_contacted INTEGER DEFAULT 0,
  leads_qualified INTEGER DEFAULT 0,
  leads_meeting_booked INTEGER DEFAULT 0,
  leads_proposal_sent INTEGER DEFAULT 0,
  leads_closed_won INTEGER DEFAULT 0,
  leads_closed_lost INTEGER DEFAULT 0,

  -- Meeting stats
  meetings_booked INTEGER DEFAULT 0,
  meetings_completed INTEGER DEFAULT 0,
  meetings_no_show INTEGER DEFAULT 0,
  meetings_cancelled INTEGER DEFAULT 0,

  -- Rep-level breakdowns (JSONB for flexibility)
  rep_stats JSONB DEFAULT '{}',

  -- Lead source breakdown
  source_stats JSONB DEFAULT '{}',

  -- Additional metrics
  avg_lead_score NUMERIC(5,2),
  response_rate NUMERIC(5,2),
  conversion_rate NUMERIC(5,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, snapshot_type, snapshot_date)
);

CREATE INDEX idx_analytics_org_date ON analytics_snapshots(organization_id, snapshot_date DESC);
CREATE INDEX idx_analytics_type ON analytics_snapshots(organization_id, snapshot_type, snapshot_date DESC);

-- ==================== EMAIL REPORT SUBSCRIPTIONS ====================
-- User preferences for automated daily/weekly reports
CREATE TABLE IF NOT EXISTS email_report_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Report types
  daily_report BOOLEAN DEFAULT FALSE,
  weekly_report BOOLEAN DEFAULT FALSE,

  -- Delivery preferences
  send_time TIME DEFAULT '08:00:00', -- Local time based on org timezone
  send_day_of_week INTEGER DEFAULT 1 CHECK (send_day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 1=Monday

  -- Scope: 'own' = only own stats, 'team' = full team (requires admin)
  report_scope TEXT DEFAULT 'own' CHECK (report_scope IN ('own', 'team')),

  -- Email address (defaults to profile email)
  email_override TEXT,

  -- Tracking
  last_daily_sent_at TIMESTAMPTZ,
  last_weekly_sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_report_subs_user ON email_report_subscriptions(user_id);
CREATE INDEX idx_report_subs_daily ON email_report_subscriptions(daily_report, send_time) WHERE daily_report = TRUE;
CREATE INDEX idx_report_subs_weekly ON email_report_subscriptions(weekly_report, send_day_of_week) WHERE weekly_report = TRUE;

-- ==================== EMAIL SEQUENCES ====================
-- Automated multi-step email campaigns
CREATE TABLE IF NOT EXISTS email_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,

  name TEXT NOT NULL,
  description TEXT,

  -- Trigger configuration
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('status_change', 'manual', 'milestone')),
  trigger_value TEXT, -- e.g., 'Qualified' for status_change, 'deckSent' for milestone

  -- Email settings
  from_name TEXT,
  reply_to TEXT,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Stats
  enrollments_count INTEGER DEFAULT 0,
  completions_count INTEGER DEFAULT 0,

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sequences_org ON email_sequences(organization_id);
CREATE INDEX idx_sequences_trigger ON email_sequences(organization_id, trigger_type, trigger_value) WHERE is_active = TRUE;

-- ==================== EMAIL SEQUENCE STEPS ====================
-- Individual steps within a sequence
CREATE TABLE IF NOT EXISTS email_sequence_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sequence_id UUID REFERENCES email_sequences(id) ON DELETE CASCADE NOT NULL,

  step_number INTEGER NOT NULL,

  -- Delay from previous step (or enrollment for step 1)
  delay_days INTEGER DEFAULT 1,
  delay_hours INTEGER DEFAULT 0,

  -- Email content
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT, -- Plain text fallback

  -- Skip conditions (JSONB for flexibility)
  skip_conditions JSONB DEFAULT '{}',
  -- Example: { "if_replied": true, "if_status_changed": true }

  -- Stats
  sent_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(sequence_id, step_number)
);

CREATE INDEX idx_seq_steps_sequence ON email_sequence_steps(sequence_id, step_number);

-- ==================== LEAD SEQUENCE ENROLLMENTS ====================
-- Active sequence enrollments per lead
CREATE TABLE IF NOT EXISTS lead_sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  sequence_id UUID REFERENCES email_sequences(id) ON DELETE CASCADE NOT NULL,

  -- Current progress
  current_step INTEGER DEFAULT 1,
  next_step_due_at TIMESTAMPTZ,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled', 'failed')),

  -- Tracking
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  enrolled_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT,

  -- Stats
  emails_sent INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  emails_clicked INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only one active enrollment per lead
CREATE UNIQUE INDEX idx_enrollments_active_lead ON lead_sequence_enrollments(lead_id)
  WHERE status = 'active';
CREATE INDEX idx_enrollments_org ON lead_sequence_enrollments(organization_id);
CREATE INDEX idx_enrollments_due ON lead_sequence_enrollments(next_step_due_at)
  WHERE status = 'active';
CREATE INDEX idx_enrollments_sequence ON lead_sequence_enrollments(sequence_id);

-- ==================== SEQUENCE EMAIL LOG ====================
-- History of sent sequence emails
CREATE TABLE IF NOT EXISTS sequence_email_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  enrollment_id UUID REFERENCES lead_sequence_enrollments(id) ON DELETE CASCADE NOT NULL,
  step_id UUID REFERENCES email_sequence_steps(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

  -- Email details
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,

  -- Status
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),

  -- Tracking
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,

  -- Error info
  error_message TEXT,

  -- External IDs
  email_provider_id TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_seq_email_log_enrollment ON sequence_email_log(enrollment_id);
CREATE INDEX idx_seq_email_log_lead ON sequence_email_log(lead_id);
CREATE INDEX idx_seq_email_log_status ON sequence_email_log(status, sent_at DESC);

-- ==================== TWILIO CREDENTIALS ====================
-- Encrypted Twilio account credentials per organization
CREATE TABLE IF NOT EXISTS twilio_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Credentials (should be encrypted at application level)
  account_sid TEXT NOT NULL,
  auth_token_encrypted TEXT NOT NULL, -- Encrypted

  -- Phone numbers
  phone_number TEXT NOT NULL, -- Primary outbound number in E.164 format
  phone_numbers JSONB DEFAULT '[]', -- Additional numbers with labels

  -- Settings
  recording_enabled BOOLEAN DEFAULT TRUE,
  voicemail_enabled BOOLEAN DEFAULT FALSE,
  voicemail_url TEXT,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_verified_at TIMESTAMPTZ,

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== CALL LOGS ====================
-- Twilio call records with recordings
CREATE TABLE IF NOT EXISTS call_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

  -- Call details
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  direction TEXT DEFAULT 'outbound' CHECK (direction IN ('outbound', 'inbound')),

  -- Twilio identifiers
  twilio_call_sid TEXT UNIQUE,
  twilio_parent_call_sid TEXT,

  -- Status and duration
  status TEXT DEFAULT 'initiated' CHECK (status IN (
    'initiated', 'ringing', 'in-progress', 'completed', 'busy',
    'no-answer', 'failed', 'cancelled'
  )),
  duration_seconds INTEGER,

  -- Recording
  recording_url TEXT,
  recording_sid TEXT,
  recording_duration_seconds INTEGER,

  -- Disposition (user-entered outcome)
  disposition TEXT,
  disposition_notes TEXT,

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  answered_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,

  -- Who made/received the call
  user_id UUID REFERENCES auth.users(id),

  -- Call quality metrics
  quality_metrics JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_call_logs_org ON call_logs(organization_id);
CREATE INDEX idx_call_logs_lead ON call_logs(lead_id);
CREATE INDEX idx_call_logs_user ON call_logs(user_id, started_at DESC);
CREATE INDEX idx_call_logs_twilio ON call_logs(twilio_call_sid);
CREATE INDEX idx_call_logs_date ON call_logs(organization_id, started_at DESC);

-- ==================== SMS MESSAGES ====================
-- SMS conversation history
CREATE TABLE IF NOT EXISTS sms_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

  -- Message details
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  direction TEXT DEFAULT 'outbound' CHECK (direction IN ('outbound', 'inbound')),

  -- Content
  body TEXT NOT NULL,
  media_urls JSONB DEFAULT '[]', -- MMS attachments

  -- Twilio identifiers
  twilio_message_sid TEXT UNIQUE,

  -- Status
  status TEXT DEFAULT 'sent' CHECK (status IN (
    'queued', 'sent', 'delivered', 'undelivered', 'failed', 'received'
  )),
  error_code TEXT,
  error_message TEXT,

  -- Segment info (SMS length)
  num_segments INTEGER DEFAULT 1,

  -- Template used (if any)
  template_id UUID,

  -- Who sent it
  user_id UUID REFERENCES auth.users(id),

  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sms_org ON sms_messages(organization_id);
CREATE INDEX idx_sms_lead ON sms_messages(lead_id, sent_at DESC);
CREATE INDEX idx_sms_number ON sms_messages(to_number, sent_at DESC);
CREATE INDEX idx_sms_twilio ON sms_messages(twilio_message_sid);

-- ==================== SMS TEMPLATES ====================
-- Reusable SMS templates
CREATE TABLE IF NOT EXISTS sms_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,

  name TEXT NOT NULL,
  body TEXT NOT NULL,

  -- Template variables available: {{contact}}, {{company}}, {{callerName}}, etc.

  -- Categorization
  category TEXT DEFAULT 'general',

  -- Usage stats
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  is_active BOOLEAN DEFAULT TRUE,

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sms_templates_org ON sms_templates(organization_id, is_active);

-- ==================== SMS OPT-OUTS ====================
-- STOP word compliance tracking
CREATE TABLE IF NOT EXISTS sms_opt_outs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,

  -- Phone number in E.164 format
  phone_number TEXT NOT NULL,

  -- Opt-out status
  opted_out_at TIMESTAMPTZ DEFAULT NOW(),
  opted_in_at TIMESTAMPTZ, -- If they opt back in
  is_opted_out BOOLEAN DEFAULT TRUE,

  -- Source of opt-out
  opt_out_keyword TEXT, -- STOP, UNSUBSCRIBE, etc.
  opt_out_message_id UUID REFERENCES sms_messages(id),

  -- Linked lead if known
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, phone_number)
);

CREATE INDEX idx_sms_optouts_phone ON sms_opt_outs(phone_number) WHERE is_opted_out = TRUE;
CREATE INDEX idx_sms_optouts_org ON sms_opt_outs(organization_id);

-- ==================== WEBHOOKS (OUTBOUND) ====================
-- Webhook configurations for external integrations
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,

  name TEXT NOT NULL,
  description TEXT,

  -- Endpoint
  url TEXT NOT NULL,

  -- Security
  secret TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),

  -- Events to send (array of event types)
  events TEXT[] NOT NULL DEFAULT '{}',
  -- Supported events:
  -- lead.created, lead.updated, lead.deleted, lead.status_changed, lead.milestone_reached
  -- meeting.booked, meeting.completed, meeting.cancelled, meeting.no_show
  -- call.completed, call.recording_ready
  -- sms.received

  -- Settings
  is_active BOOLEAN DEFAULT TRUE,
  retry_enabled BOOLEAN DEFAULT TRUE,

  -- Stats
  total_deliveries INTEGER DEFAULT 0,
  successful_deliveries INTEGER DEFAULT 0,
  failed_deliveries INTEGER DEFAULT 0,
  last_delivery_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhooks_org ON webhooks(organization_id);
CREATE INDEX idx_webhooks_active ON webhooks(organization_id, is_active) WHERE is_active = TRUE;

-- ==================== WEBHOOK DELIVERIES ====================
-- Delivery log with retry queue
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE NOT NULL,

  -- Event details
  event_type TEXT NOT NULL,
  event_id TEXT NOT NULL, -- Idempotency key
  payload JSONB NOT NULL,

  -- Delivery status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'retrying')),

  -- Response info
  response_status INTEGER,
  response_body TEXT,
  response_headers JSONB,

  -- Retry tracking
  attempt_count INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 5,
  next_retry_at TIMESTAMPTZ,

  -- Timing
  first_attempt_at TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ,
  succeeded_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_del_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_del_retry ON webhook_deliveries(next_retry_at)
  WHERE status IN ('pending', 'retrying') AND attempt_count < max_attempts;
CREATE INDEX idx_webhook_del_event ON webhook_deliveries(event_id);

-- ==================== INBOUND WEBHOOK API KEYS ====================
-- API keys for inbound integrations (Zapier, etc.)
CREATE TABLE IF NOT EXISTS inbound_webhook_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,

  name TEXT NOT NULL,
  description TEXT,

  -- Key (hashed for security, raw key shown only once on creation)
  key_prefix TEXT NOT NULL, -- First 8 chars for identification
  key_hash TEXT NOT NULL,

  -- Permissions
  permissions TEXT[] DEFAULT '{}',
  -- Supported: lead.create, lead.update, meeting.create, etc.

  -- Rate limiting
  rate_limit_per_minute INTEGER DEFAULT 60,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Usage tracking
  last_used_at TIMESTAMPTZ,
  total_requests INTEGER DEFAULT 0,

  -- Expiration (optional)
  expires_at TIMESTAMPTZ,

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inbound_keys_org ON inbound_webhook_keys(organization_id);
CREATE INDEX idx_inbound_keys_prefix ON inbound_webhook_keys(key_prefix) WHERE is_active = TRUE;

-- ==================== EMAIL TEMPLATES ====================
-- Dynamic email templates for sequences and manual sends
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,

  name TEXT NOT NULL,
  description TEXT,

  -- Template content
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,

  -- Categorization
  category TEXT DEFAULT 'general',
  tags TEXT[],

  -- Variable placeholders available:
  -- {{contact}}, {{company}}, {{title}}, {{callerName}}, {{ceoName}}, {{meetingDate}}, etc.

  -- Usage tracking
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  is_active BOOLEAN DEFAULT TRUE,

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_templates_org ON email_templates(organization_id, is_active);
CREATE INDEX idx_email_templates_category ON email_templates(organization_id, category) WHERE is_active = TRUE;

-- ==================== UPDATED_AT TRIGGERS ====================

CREATE TRIGGER update_analytics_snapshots_updated_at BEFORE UPDATE ON analytics_snapshots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_email_report_subs_updated_at BEFORE UPDATE ON email_report_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_email_sequences_updated_at BEFORE UPDATE ON email_sequences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_email_seq_steps_updated_at BEFORE UPDATE ON email_sequence_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_lead_seq_enrollments_updated_at BEFORE UPDATE ON lead_sequence_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_twilio_credentials_updated_at BEFORE UPDATE ON twilio_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_call_logs_updated_at BEFORE UPDATE ON call_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_sms_templates_updated_at BEFORE UPDATE ON sms_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_sms_opt_outs_updated_at BEFORE UPDATE ON sms_opt_outs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON webhooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_inbound_keys_updated_at BEFORE UPDATE ON inbound_webhook_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==================== RLS POLICIES ====================

-- Enable RLS on all new tables
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_report_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_email_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE twilio_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_opt_outs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbound_webhook_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Helper function for org membership check
CREATE OR REPLACE FUNCTION is_org_member(p_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = p_org_id
    AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function for admin check
CREATE OR REPLACE FUNCTION is_org_admin(p_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = p_org_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Analytics Snapshots - Read by any org member
CREATE POLICY analytics_snapshots_select ON analytics_snapshots
  FOR SELECT USING (is_org_member(organization_id));

CREATE POLICY analytics_snapshots_insert ON analytics_snapshots
  FOR INSERT WITH CHECK (is_org_admin(organization_id));

CREATE POLICY analytics_snapshots_update ON analytics_snapshots
  FOR UPDATE USING (is_org_admin(organization_id));

-- Email Report Subscriptions - Users manage own subscriptions
CREATE POLICY email_report_subs_select ON email_report_subscriptions
  FOR SELECT USING (user_id = auth.uid() OR is_org_admin(organization_id));

CREATE POLICY email_report_subs_insert ON email_report_subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid() AND is_org_member(organization_id));

CREATE POLICY email_report_subs_update ON email_report_subscriptions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY email_report_subs_delete ON email_report_subscriptions
  FOR DELETE USING (user_id = auth.uid());

-- Email Sequences - Admins manage, members read
CREATE POLICY email_sequences_select ON email_sequences
  FOR SELECT USING (is_org_member(organization_id));

CREATE POLICY email_sequences_insert ON email_sequences
  FOR INSERT WITH CHECK (is_org_admin(organization_id));

CREATE POLICY email_sequences_update ON email_sequences
  FOR UPDATE USING (is_org_admin(organization_id));

CREATE POLICY email_sequences_delete ON email_sequences
  FOR DELETE USING (is_org_admin(organization_id));

-- Email Sequence Steps - Follow parent sequence permissions
CREATE POLICY email_seq_steps_select ON email_sequence_steps
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM email_sequences s WHERE s.id = sequence_id AND is_org_member(s.organization_id))
  );

CREATE POLICY email_seq_steps_insert ON email_sequence_steps
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM email_sequences s WHERE s.id = sequence_id AND is_org_admin(s.organization_id))
  );

CREATE POLICY email_seq_steps_update ON email_sequence_steps
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM email_sequences s WHERE s.id = sequence_id AND is_org_admin(s.organization_id))
  );

CREATE POLICY email_seq_steps_delete ON email_sequence_steps
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM email_sequences s WHERE s.id = sequence_id AND is_org_admin(s.organization_id))
  );

-- Lead Sequence Enrollments - Members can manage
CREATE POLICY lead_seq_enrollments_select ON lead_sequence_enrollments
  FOR SELECT USING (is_org_member(organization_id));

CREATE POLICY lead_seq_enrollments_insert ON lead_sequence_enrollments
  FOR INSERT WITH CHECK (is_org_member(organization_id));

CREATE POLICY lead_seq_enrollments_update ON lead_sequence_enrollments
  FOR UPDATE USING (is_org_member(organization_id));

-- Sequence Email Log - Read only for members
CREATE POLICY seq_email_log_select ON sequence_email_log
  FOR SELECT USING (is_org_member(organization_id));

-- Twilio Credentials - Admin only
CREATE POLICY twilio_creds_select ON twilio_credentials
  FOR SELECT USING (is_org_admin(organization_id));

CREATE POLICY twilio_creds_insert ON twilio_credentials
  FOR INSERT WITH CHECK (is_org_admin(organization_id));

CREATE POLICY twilio_creds_update ON twilio_credentials
  FOR UPDATE USING (is_org_admin(organization_id));

CREATE POLICY twilio_creds_delete ON twilio_credentials
  FOR DELETE USING (is_org_admin(organization_id));

-- Call Logs - Members can read and create
CREATE POLICY call_logs_select ON call_logs
  FOR SELECT USING (is_org_member(organization_id));

CREATE POLICY call_logs_insert ON call_logs
  FOR INSERT WITH CHECK (is_org_member(organization_id));

CREATE POLICY call_logs_update ON call_logs
  FOR UPDATE USING (is_org_member(organization_id));

-- SMS Messages - Members can read and send
CREATE POLICY sms_messages_select ON sms_messages
  FOR SELECT USING (is_org_member(organization_id));

CREATE POLICY sms_messages_insert ON sms_messages
  FOR INSERT WITH CHECK (is_org_member(organization_id));

-- SMS Templates - Members read, admins manage
CREATE POLICY sms_templates_select ON sms_templates
  FOR SELECT USING (is_org_member(organization_id));

CREATE POLICY sms_templates_insert ON sms_templates
  FOR INSERT WITH CHECK (is_org_admin(organization_id));

CREATE POLICY sms_templates_update ON sms_templates
  FOR UPDATE USING (is_org_admin(organization_id));

CREATE POLICY sms_templates_delete ON sms_templates
  FOR DELETE USING (is_org_admin(organization_id));

-- SMS Opt-outs - Members can read, system manages
CREATE POLICY sms_opt_outs_select ON sms_opt_outs
  FOR SELECT USING (is_org_member(organization_id));

-- Webhooks - Admin only
CREATE POLICY webhooks_select ON webhooks
  FOR SELECT USING (is_org_admin(organization_id));

CREATE POLICY webhooks_insert ON webhooks
  FOR INSERT WITH CHECK (is_org_admin(organization_id));

CREATE POLICY webhooks_update ON webhooks
  FOR UPDATE USING (is_org_admin(organization_id));

CREATE POLICY webhooks_delete ON webhooks
  FOR DELETE USING (is_org_admin(organization_id));

-- Webhook Deliveries - Admin only
CREATE POLICY webhook_deliveries_select ON webhook_deliveries
  FOR SELECT USING (is_org_admin(organization_id));

-- Inbound Webhook Keys - Admin only
CREATE POLICY inbound_keys_select ON inbound_webhook_keys
  FOR SELECT USING (is_org_admin(organization_id));

CREATE POLICY inbound_keys_insert ON inbound_webhook_keys
  FOR INSERT WITH CHECK (is_org_admin(organization_id));

CREATE POLICY inbound_keys_update ON inbound_webhook_keys
  FOR UPDATE USING (is_org_admin(organization_id));

CREATE POLICY inbound_keys_delete ON inbound_webhook_keys
  FOR DELETE USING (is_org_admin(organization_id));

-- Email Templates - Members read, admins manage
CREATE POLICY email_templates_select ON email_templates
  FOR SELECT USING (is_org_member(organization_id));

CREATE POLICY email_templates_insert ON email_templates
  FOR INSERT WITH CHECK (is_org_admin(organization_id));

CREATE POLICY email_templates_update ON email_templates
  FOR UPDATE USING (is_org_admin(organization_id));

CREATE POLICY email_templates_delete ON email_templates
  FOR DELETE USING (is_org_admin(organization_id));

-- ==================== ANALYTICS FUNCTIONS ====================

-- Function to get analytics data for a date range
CREATE OR REPLACE FUNCTION get_analytics_data(
  p_org_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_user_id UUID DEFAULT NULL -- Optional: filter by user for member-level view
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_is_admin BOOLEAN;
BEGIN
  -- Check permissions
  IF NOT is_org_member(p_org_id) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  v_is_admin := is_org_admin(p_org_id);

  -- If not admin and no user filter, default to own data
  IF NOT v_is_admin AND p_user_id IS NULL THEN
    p_user_id := auth.uid();
  END IF;

  SELECT jsonb_build_object(
    'period', jsonb_build_object(
      'start', p_start_date,
      'end', p_end_date
    ),
    'callMetrics', (
      SELECT jsonb_build_object(
        'total', COUNT(*)::int,
        'connected', COUNT(*) FILTER (WHERE status = 'completed')::int,
        'noAnswer', COUNT(*) FILTER (WHERE status = 'no-answer')::int,
        'voicemail', COUNT(*) FILTER (WHERE disposition = 'voicemail')::int,
        'meetingRequested', COUNT(*) FILTER (WHERE disposition = 'meeting-requested')::int,
        'totalDuration', COALESCE(SUM(duration_seconds), 0)::int,
        'avgDuration', ROUND(COALESCE(AVG(duration_seconds) FILTER (WHERE status = 'completed'), 0))::int
      )
      FROM call_logs
      WHERE organization_id = p_org_id
        AND started_at::date BETWEEN p_start_date AND p_end_date
        AND (p_user_id IS NULL OR user_id = p_user_id)
    ),
    'conversionFunnel', (
      SELECT jsonb_build_object(
        'new', COUNT(*) FILTER (WHERE status = 'New Lead')::int,
        'contacted', COUNT(*) FILTER (WHERE status IN ('Contacted', 'Call Back', 'Voicemail'))::int,
        'qualified', COUNT(*) FILTER (WHERE status = 'Qualified')::int,
        'meetingBooked', COUNT(*) FILTER (WHERE status LIKE '%Meeting%' OR status LIKE '%Booked%')::int,
        'proposalSent', COUNT(*) FILTER (WHERE (milestones->>'proposalSent')::boolean = true)::int,
        'closedWon', COUNT(*) FILTER (WHERE (milestones->>'closedWon')::boolean = true)::int,
        'closedLost', COUNT(*) FILTER (WHERE (milestones->>'closedLost')::boolean = true)::int
      )
      FROM leads
      WHERE organization_id = p_org_id
        AND (p_user_id IS NULL OR assigned_to = p_user_id)
    ),
    'meetingStats', (
      SELECT jsonb_build_object(
        'booked', COUNT(*)::int,
        'completed', COUNT(*) FILTER (WHERE status = 'completed')::int,
        'noShow', COUNT(*) FILTER (WHERE status = 'no-show')::int,
        'cancelled', COUNT(*) FILTER (WHERE status = 'cancelled')::int
      )
      FROM meetings
      WHERE organization_id = p_org_id
        AND meeting_date BETWEEN p_start_date AND p_end_date
        AND (p_user_id IS NULL OR created_by = p_user_id)
    ),
    'leadSources', (
      SELECT COALESCE(jsonb_object_agg(source, cnt), '{}'::jsonb)
      FROM (
        SELECT COALESCE(source, 'unknown') as source, COUNT(*)::int as cnt
        FROM leads
        WHERE organization_id = p_org_id
          AND (p_user_id IS NULL OR assigned_to = p_user_id)
        GROUP BY source
      ) s
    ),
    'callsByDay', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'date', call_date,
          'total', total,
          'connected', connected
        ) ORDER BY call_date
      ), '[]'::jsonb)
      FROM (
        SELECT
          started_at::date as call_date,
          COUNT(*)::int as total,
          COUNT(*) FILTER (WHERE status = 'completed')::int as connected
        FROM call_logs
        WHERE organization_id = p_org_id
          AND started_at::date BETWEEN p_start_date AND p_end_date
          AND (p_user_id IS NULL OR user_id = p_user_id)
        GROUP BY started_at::date
      ) d
    ),
    'repLeaderboard', CASE WHEN v_is_admin AND p_user_id IS NULL THEN (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'userId', user_id,
          'name', COALESCE(p.full_name, p.email),
          'calls', calls,
          'connected', connected,
          'meetings', meetings,
          'conversionRate', CASE WHEN calls > 0 THEN ROUND((meetings::numeric / calls::numeric) * 100, 1) ELSE 0 END
        ) ORDER BY meetings DESC, connected DESC
      ), '[]'::jsonb)
      FROM (
        SELECT
          cl.user_id,
          COUNT(*)::int as calls,
          COUNT(*) FILTER (WHERE cl.status = 'completed')::int as connected,
          (SELECT COUNT(*)::int FROM meetings m WHERE m.created_by = cl.user_id
           AND m.meeting_date BETWEEN p_start_date AND p_end_date) as meetings
        FROM call_logs cl
        WHERE cl.organization_id = p_org_id
          AND cl.started_at::date BETWEEN p_start_date AND p_end_date
        GROUP BY cl.user_id
      ) stats
      LEFT JOIN profiles p ON p.id = stats.user_id
    ) ELSE '[]'::jsonb END
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== SEQUENCE AUTO-ENROLLMENT TRIGGER ====================

-- Trigger function to auto-enroll leads in sequences based on status change
CREATE OR REPLACE FUNCTION auto_enroll_sequence()
RETURNS TRIGGER AS $$
DECLARE
  v_sequence RECORD;
  v_first_step RECORD;
BEGIN
  -- Check for status change sequences
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    FOR v_sequence IN
      SELECT * FROM email_sequences
      WHERE organization_id = NEW.organization_id
        AND is_active = TRUE
        AND trigger_type = 'status_change'
        AND trigger_value = NEW.status
    LOOP
      -- Check if lead is not already enrolled in an active sequence
      IF NOT EXISTS (
        SELECT 1 FROM lead_sequence_enrollments
        WHERE lead_id = NEW.id AND status = 'active'
      ) THEN
        -- Get the first step
        SELECT * INTO v_first_step FROM email_sequence_steps
        WHERE sequence_id = v_sequence.id AND step_number = 1;

        IF v_first_step IS NOT NULL THEN
          INSERT INTO lead_sequence_enrollments (
            organization_id, lead_id, sequence_id, current_step, next_step_due_at, status
          ) VALUES (
            NEW.organization_id,
            NEW.id,
            v_sequence.id,
            1,
            NOW() + (v_first_step.delay_days || ' days')::interval + (v_first_step.delay_hours || ' hours')::interval,
            'active'
          );

          -- Update sequence stats
          UPDATE email_sequences SET enrollments_count = enrollments_count + 1
          WHERE id = v_sequence.id;
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- Check for milestone sequences
  IF TG_OP = 'UPDATE' AND OLD.milestones IS DISTINCT FROM NEW.milestones THEN
    FOR v_sequence IN
      SELECT * FROM email_sequences
      WHERE organization_id = NEW.organization_id
        AND is_active = TRUE
        AND trigger_type = 'milestone'
    LOOP
      -- Check if the trigger milestone just became true
      IF (NEW.milestones->>v_sequence.trigger_value)::boolean = TRUE
         AND COALESCE((OLD.milestones->>v_sequence.trigger_value)::boolean, FALSE) = FALSE THEN
        -- Check if not already enrolled
        IF NOT EXISTS (
          SELECT 1 FROM lead_sequence_enrollments
          WHERE lead_id = NEW.id AND status = 'active'
        ) THEN
          SELECT * INTO v_first_step FROM email_sequence_steps
          WHERE sequence_id = v_sequence.id AND step_number = 1;

          IF v_first_step IS NOT NULL THEN
            INSERT INTO lead_sequence_enrollments (
              organization_id, lead_id, sequence_id, current_step, next_step_due_at, status
            ) VALUES (
              NEW.organization_id,
              NEW.id,
              v_sequence.id,
              1,
              NOW() + (v_first_step.delay_days || ' days')::interval + (v_first_step.delay_hours || ' hours')::interval,
              'active'
            );

            UPDATE email_sequences SET enrollments_count = enrollments_count + 1
            WHERE id = v_sequence.id;
          END IF;
        END IF;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER lead_sequence_auto_enroll
  AFTER UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION auto_enroll_sequence();

-- ==================== WEBHOOK EVENT TRIGGERS ====================

-- Function to dispatch webhook events
CREATE OR REPLACE FUNCTION dispatch_webhook_event(
  p_org_id UUID,
  p_event_type TEXT,
  p_payload JSONB
)
RETURNS VOID AS $$
DECLARE
  v_webhook RECORD;
  v_event_id TEXT;
BEGIN
  v_event_id := 'evt_' || encode(gen_random_bytes(16), 'hex');

  FOR v_webhook IN
    SELECT * FROM webhooks
    WHERE organization_id = p_org_id
      AND is_active = TRUE
      AND p_event_type = ANY(events)
  LOOP
    INSERT INTO webhook_deliveries (
      organization_id, webhook_id, event_type, event_id, payload, status, next_retry_at
    ) VALUES (
      p_org_id,
      v_webhook.id,
      p_event_type,
      v_event_id,
      jsonb_build_object(
        'event', p_event_type,
        'timestamp', NOW(),
        'idempotency_key', v_event_id,
        'data', p_payload
      ),
      'pending',
      NOW()
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for lead events
CREATE OR REPLACE FUNCTION webhook_lead_events()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM dispatch_webhook_event(NEW.organization_id, 'lead.created', to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    -- Status change event
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      PERFORM dispatch_webhook_event(NEW.organization_id, 'lead.status_changed',
        jsonb_build_object('lead', to_jsonb(NEW), 'old_status', OLD.status, 'new_status', NEW.status));
    END IF;
    -- Milestone event
    IF OLD.milestones IS DISTINCT FROM NEW.milestones THEN
      PERFORM dispatch_webhook_event(NEW.organization_id, 'lead.milestone_reached',
        jsonb_build_object('lead', to_jsonb(NEW), 'milestones', NEW.milestones));
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM dispatch_webhook_event(OLD.organization_id, 'lead.deleted',
      jsonb_build_object('lead_id', OLD.id, 'company', OLD.company));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER webhook_lead_trigger
  AFTER INSERT OR UPDATE OR DELETE ON leads
  FOR EACH ROW EXECUTE FUNCTION webhook_lead_events();

-- Trigger for meeting events
CREATE OR REPLACE FUNCTION webhook_meeting_events()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM dispatch_webhook_event(NEW.organization_id, 'meeting.booked', to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
      PERFORM dispatch_webhook_event(NEW.organization_id, 'meeting.completed', to_jsonb(NEW));
    ELSIF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
      PERFORM dispatch_webhook_event(NEW.organization_id, 'meeting.cancelled', to_jsonb(NEW));
    ELSIF NEW.status = 'no-show' AND OLD.status != 'no-show' THEN
      PERFORM dispatch_webhook_event(NEW.organization_id, 'meeting.no_show', to_jsonb(NEW));
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER webhook_meeting_trigger
  AFTER INSERT OR UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION webhook_meeting_events();

-- Trigger for call events
CREATE OR REPLACE FUNCTION webhook_call_events()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IN ('completed', 'no-answer', 'busy', 'failed')
     AND OLD.status NOT IN ('completed', 'no-answer', 'busy', 'failed') THEN
    PERFORM dispatch_webhook_event(NEW.organization_id, 'call.completed', to_jsonb(NEW));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER webhook_call_trigger
  AFTER UPDATE ON call_logs
  FOR EACH ROW EXECUTE FUNCTION webhook_call_events();

-- Trigger for inbound SMS
CREATE OR REPLACE FUNCTION webhook_sms_events()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.direction = 'inbound' THEN
    PERFORM dispatch_webhook_event(NEW.organization_id, 'sms.received', to_jsonb(NEW));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER webhook_sms_trigger
  AFTER INSERT ON sms_messages
  FOR EACH ROW EXECUTE FUNCTION webhook_sms_events();

-- ==================== REALTIME SUBSCRIPTIONS ====================

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE call_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE sms_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE lead_sequence_enrollments;
