-- ==================== AI USAGE TRACKING ====================
-- Track AI research and script generation usage per organization per month
-- Enables soft caps and usage-based billing visibility

CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  month TEXT NOT NULL, -- Format: YYYY-MM (e.g., '2025-02')
  research_count INTEGER DEFAULT 0,
  script_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One record per org per month
  UNIQUE(organization_id, month)
);

CREATE INDEX idx_ai_usage_org_month ON ai_usage(organization_id, month);

-- RLS policies
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Org members can view their org's usage
CREATE POLICY "ai_usage_select" ON ai_usage
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Only service role can insert/update (edge functions)
-- No INSERT/UPDATE policies for regular users

-- Add usage limits to organizations config (optional override)
-- Default limits are in edge function code
COMMENT ON TABLE ai_usage IS 'Tracks AI feature usage per organization per month. Default limit: 500 researches/month for Pro plan.';
