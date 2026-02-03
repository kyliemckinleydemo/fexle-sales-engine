-- ============================================================
-- Sales Engine Database Schema
-- Version: 1.0.0
-- Description: Multi-tenant sales platform with white-label support
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== PROFILES ====================
-- Extends Supabase auth.users with additional profile data
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'Australia/Sydney',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ==================== ORGANIZATIONS ====================
-- Multi-tenant organizations (companies using the platform)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,

  -- White-label configuration stored as JSONB
  config JSONB DEFAULT '{
    "company": {
      "name": "",
      "tagline": "",
      "size": "",
      "locations": [],
      "model": "",
      "costAdvantage": "",
      "status": "",
      "keyProducts": [],
      "proofPoints": [],
      "website": "",
      "ceoName": "",
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
    "targetAction": {
      "type": "meeting",
      "label": "CEO Meeting",
      "shortLabel": "CEO Meeting",
      "statusLabel": "CEO Meeting Booked",
      "milestoneLabel": "CEO Meeting Held",
      "milestoneKey": "ceoMeetingHeld",
      "buttonText": "Schedule CEO Meeting",
      "description": "20-minute conversation with our CEO",
      "duration": 20,
      "priority": 1,
      "followUpDays": 1,
      "icon": "📅",
      "color": {
        "bg": "bg-green-200",
        "text": "text-green-900",
        "border": "border-green-400"
      }
    },
    "scripts": {},
    "verticals": {},
    "scoring": {},
    "collateralRules": []
  }'::jsonb,

  -- Subscription/billing info (for future use)
  plan TEXT DEFAULT 'free',
  plan_expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generate slug from name
CREATE OR REPLACE FUNCTION generate_org_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := LOWER(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
    -- Ensure uniqueness by appending random suffix if needed
    WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = NEW.slug AND id != NEW.id) LOOP
      NEW.slug := NEW.slug || '-' || SUBSTRING(uuid_generate_v4()::text, 1, 4);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER before_org_insert
  BEFORE INSERT ON organizations
  FOR EACH ROW EXECUTE FUNCTION generate_org_slug();

-- ==================== ORGANIZATION MEMBERS ====================
-- Links users to organizations with roles
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Index for fast lookups
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_org ON organization_members(organization_id);

-- ==================== LEADS ====================
-- Sales leads/prospects
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,

  -- Company info
  company TEXT NOT NULL,
  website TEXT,
  industry TEXT,
  vertical TEXT DEFAULT 'general',
  company_size TEXT,
  revenue TEXT,
  employee_count INTEGER,
  company_linkedin TEXT,

  -- Contact info
  contact TEXT,
  title TEXT,
  phone TEXT,
  email TEXT,
  linkedin_url TEXT,

  -- Location
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'AU',

  -- Source tracking
  source TEXT DEFAULT 'manual',
  source_id TEXT,
  imported_at TIMESTAMPTZ,

  -- Status & scoring
  status TEXT DEFAULT 'New Lead',
  score INTEGER DEFAULT 50,
  score_breakdown JSONB DEFAULT '{}',

  -- Activity tracking
  last_contact TEXT,
  last_contact_date TIMESTAMPTZ,
  last_call_outcome TEXT,

  -- Research & notes
  notes TEXT,
  research JSONB,

  -- Intent signals & tech stack
  intent_signals JSONB DEFAULT '{}',
  intent_topics TEXT[],
  technologies TEXT[],

  -- Milestones (discovery call, deck sent, meeting held, etc.)
  milestones JSONB DEFAULT '{
    "discoveryCall": false,
    "deckSent": false,
    "ceoMeetingHeld": false,
    "proposalSent": false,
    "closedWon": false,
    "closedLost": false
  }'::jsonb,

  -- Assignment
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_leads_org ON leads(organization_id);
CREATE INDEX idx_leads_status ON leads(organization_id, status);
CREATE INDEX idx_leads_score ON leads(organization_id, score DESC);
CREATE INDEX idx_leads_assigned ON leads(assigned_to);
CREATE INDEX idx_leads_vertical ON leads(organization_id, vertical);
CREATE INDEX idx_leads_email ON leads(email);

-- ==================== TASKS ====================
-- Follow-up tasks, calls, meetings prep
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,

  type TEXT NOT NULL CHECK (type IN (
    'call', 'follow-up-call', 'follow-up-deck', 'email',
    'meeting', 'meeting-prep', 'research', 'other'
  )),
  description TEXT,

  due_date DATE,
  due_time TIME,

  priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),

  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),

  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tasks_org ON tasks(organization_id);
CREATE INDEX idx_tasks_lead ON tasks(lead_id);
CREATE INDEX idx_tasks_due ON tasks(organization_id, due_date, completed);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to, completed);

-- ==================== CEO AVAILABILITY ====================
-- Available time slots for CEO meetings
CREATE TABLE IF NOT EXISTS availability_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,

  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  duration INTEGER DEFAULT 20, -- minutes

  is_booked BOOLEAN DEFAULT FALSE,
  recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT, -- iCal RRULE format

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, slot_date, slot_time)
);

CREATE INDEX idx_slots_org_date ON availability_slots(organization_id, slot_date);

-- ==================== MEETINGS ====================
-- Booked meetings
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  slot_id UUID REFERENCES availability_slots(id) ON DELETE SET NULL,

  title TEXT NOT NULL,
  description TEXT,

  meeting_date DATE NOT NULL,
  meeting_time TIME NOT NULL,
  duration INTEGER DEFAULT 20,

  location TEXT,
  meeting_link TEXT,

  status TEXT DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled', 'no-show'
  )),

  attendee_name TEXT,
  attendee_email TEXT,
  attendee_company TEXT,
  attendee_phone TEXT,

  reminder_sent BOOLEAN DEFAULT FALSE,
  confirmation_sent BOOLEAN DEFAULT FALSE,

  notes TEXT,
  outcome TEXT,

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meetings_org ON meetings(organization_id);
CREATE INDEX idx_meetings_lead ON meetings(lead_id);
CREATE INDEX idx_meetings_date ON meetings(organization_id, meeting_date);

-- ==================== COLLATERAL ====================
-- Marketing materials, decks, case studies
CREATE TABLE IF NOT EXISTS collateral (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,

  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('pdf', 'ppt', 'doc', 'image', 'video', 'link', 'other')),

  file_url TEXT,
  file_size INTEGER,
  thumbnail_url TEXT,

  tags TEXT[],

  -- Usage tracking
  send_count INTEGER DEFAULT 0,
  last_sent_at TIMESTAMPTZ,

  active BOOLEAN DEFAULT TRUE,

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_collateral_org ON collateral(organization_id);
CREATE INDEX idx_collateral_active ON collateral(organization_id, active);

-- ==================== COLLATERAL SENDS ====================
-- Track when collateral is sent to leads
CREATE TABLE IF NOT EXISTS collateral_sends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  collateral_id UUID REFERENCES collateral(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,

  sent_by UUID REFERENCES auth.users(id),
  sent_at TIMESTAMPTZ DEFAULT NOW(),

  delivery_method TEXT CHECK (delivery_method IN ('email', 'manual', 'link')),
  notes TEXT
);

CREATE INDEX idx_coll_sends_lead ON collateral_sends(lead_id);

-- ==================== ACTIVITY LOG ====================
-- Audit trail of all actions
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- What was affected
  entity_type TEXT NOT NULL, -- 'lead', 'task', 'meeting', etc.
  entity_id UUID,

  -- What happened
  action TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'called', 'emailed', etc.

  -- Details
  details JSONB,

  -- Context
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_org ON activity_log(organization_id);
CREATE INDEX idx_activity_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_user ON activity_log(user_id);
CREATE INDEX idx_activity_time ON activity_log(organization_id, created_at DESC);

-- ==================== INVITATIONS ====================
-- Pending team invitations
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,

  email TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),

  invited_by UUID REFERENCES auth.users(id),

  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),

  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);

-- ==================== TODAY'S CALL LIST ====================
-- Daily call queue per user
CREATE TABLE IF NOT EXISTS call_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  list_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Array of lead IDs in call order
  lead_ids UUID[] DEFAULT '{}',

  -- Track completion
  completed_ids UUID[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, user_id, list_date)
);

CREATE INDEX idx_call_lists_user_date ON call_lists(user_id, list_date);

-- ==================== HELPER FUNCTIONS ====================

-- Function to get user's current organization
CREATE OR REPLACE FUNCTION get_user_organization(p_user_id UUID)
RETURNS UUID AS $$
  SELECT organization_id
  FROM organization_members
  WHERE user_id = p_user_id
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to check if user has role in org
CREATE OR REPLACE FUNCTION user_has_role(p_user_id UUID, p_org_id UUID, p_roles TEXT[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = p_user_id
    AND organization_id = p_org_id
    AND role = ANY(p_roles)
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with that column
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_collateral_updated_at BEFORE UPDATE ON collateral
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_call_lists_updated_at BEFORE UPDATE ON call_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
