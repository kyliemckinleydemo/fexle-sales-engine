-- ==================== MARKETABLE FEATURES ====================
-- Adds email sending log table and Stripe billing columns

-- ==================== EMAIL SENDS ====================
-- Log of all emails sent through the platform via Resend
CREATE TABLE IF NOT EXISTS email_sends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  to_email TEXT NOT NULL,
  from_email TEXT NOT NULL,
  reply_to TEXT,
  subject TEXT NOT NULL,
  body_text TEXT,
  template_key TEXT,
  status TEXT DEFAULT 'sent',
  resend_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_sends_org ON email_sends(organization_id);
CREATE INDEX idx_email_sends_lead ON email_sends(lead_id);
CREATE INDEX idx_email_sends_user ON email_sends(user_id);
CREATE INDEX idx_email_sends_status ON email_sends(status, sent_at DESC);

-- RLS policies for email_sends
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;

-- Org members can view their org's email sends
CREATE POLICY "email_sends_select" ON email_sends
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Org members can insert email sends for their org
CREATE POLICY "email_sends_insert" ON email_sends
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ==================== STRIPE BILLING COLUMNS ====================
-- organizations.plan and plan_expires_at already exist from 001_initial_schema.sql
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_subscription_status TEXT;

CREATE INDEX IF NOT EXISTS idx_org_stripe_customer ON organizations(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_org_stripe_subscription ON organizations(stripe_subscription_id);
