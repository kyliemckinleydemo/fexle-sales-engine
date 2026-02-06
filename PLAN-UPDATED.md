# Updated Plan: White-Label Platform with Multi-User Database Support

## Architecture Change: Google Sheets → Supabase

### Why Supabase?
- **PostgreSQL database** - Production-ready, scalable
- **Built-in authentication** - Email/password, OAuth (Google, Microsoft)
- **Auto-generated REST API** - No backend code needed
- **Row-level security (RLS)** - Multi-tenant data isolation built-in
- **Real-time subscriptions** - Live updates across users
- **Free tier** - Generous for getting started
- **Self-hostable** - Can run your own instance if needed

### Database Schema

```sql
-- Users (handled by Supabase Auth, extended with profiles)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organizations (multi-tenant)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  config JSONB DEFAULT '{}',  -- Company config, scripts, verticals, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization members
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Leads (organization-scoped)
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  contact TEXT,
  title TEXT,
  phone TEXT,
  email TEXT,
  vertical TEXT DEFAULT 'general',
  company_size TEXT,
  revenue TEXT,
  employee_count INTEGER,
  website TEXT,
  linkedin_url TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'AU',
  industry TEXT,
  source TEXT DEFAULT 'manual',
  source_id TEXT,
  status TEXT DEFAULT 'New Lead',
  score INTEGER DEFAULT 50,
  last_contact TEXT,
  last_contact_date TIMESTAMPTZ,
  notes TEXT,
  research JSONB,
  intent_signals JSONB DEFAULT '{}',
  technologies TEXT[],
  milestones JSONB DEFAULT '{}',
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  due_time TIME,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  priority INTEGER DEFAULT 3,
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CEO Availability slots
CREATE TABLE availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration INTEGER DEFAULT 20,
  is_booked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, date, time)
);

-- Booked Meetings
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  slot_id UUID REFERENCES availability_slots(id),
  title TEXT,
  description TEXT,
  meeting_date DATE NOT NULL,
  meeting_time TIME NOT NULL,
  duration INTEGER DEFAULT 20,
  location TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collateral/Marketing Materials
CREATE TABLE collateral (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT,
  file_url TEXT,
  thumbnail_url TEXT,
  tags TEXT[],
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Log (audit trail)
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE collateral ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Users can only see their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Organization members can see their organization
CREATE POLICY "Members can view organization" ON organizations
  FOR SELECT USING (
    id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

-- Organization data policies (leads, tasks, etc.)
CREATE POLICY "Members can view org leads" ON leads
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can insert org leads" ON leads
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can update org leads" ON leads
  FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can delete org leads" ON leads
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Similar policies for tasks, meetings, etc.
CREATE POLICY "Members can manage org tasks" ON tasks
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can manage org meetings" ON meetings
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can view org collateral" ON collateral
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage org collateral" ON collateral
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
```

---

## Updated Implementation Plan

### Phase 1: Database Setup (NEW)

| Task | Description |
|------|-------------|
| 1.1 | Create Supabase project |
| 1.2 | Run database schema migrations |
| 1.3 | Configure Row Level Security policies |
| 1.4 | Set up authentication providers |

### Phase 2: Frontend Auth Integration

| Task | Description |
|------|-------------|
| 2.1 | Add Supabase JS client |
| 2.2 | Create AuthProvider context |
| 2.3 | Build Login/Register components |
| 2.4 | Add password reset flow |
| 2.5 | Protect routes requiring auth |

### Phase 3: Organization Management

| Task | Description |
|------|-------------|
| 3.1 | Organization creation flow (first-time setup) |
| 3.2 | Organization settings/config storage |
| 3.3 | Invite team members |
| 3.4 | Role-based permissions UI |

### Phase 4: Data Migration

| Task | Description |
|------|-------------|
| 4.1 | Replace localStorage with Supabase queries |
| 4.2 | Add real-time subscriptions for live updates |
| 4.3 | Migrate lead CRUD operations |
| 4.4 | Migrate task CRUD operations |
| 4.5 | Migrate meeting/calendar operations |

### Phase 5: White-Label Config (Updated)

| Task | Description |
|------|-------------|
| 5.1 | Store org config in `organizations.config` JSONB |
| 5.2 | Build Config Editor UI |
| 5.3 | Script/Vertical/Scoring editors save to DB |
| 5.4 | Collateral storage with file uploads |

### Phase 6: Multi-Country & Localization

| Task | Description |
|------|-------------|
| 6.1 | Add multi-country phone formatting |
| 6.2 | Localization settings per org |
| 6.3 | Currency/date format handling |

---

## File Structure Update

```
fexle-sales-engine/
├── index.html                    # Main app (updated with Supabase)
├── config/                       # Default config templates
├── examples/fexle-config/        # Fexle example config
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   └── 003_functions.sql
│   └── seed.sql                  # Sample data for testing
├── docs/
│   ├── SETUP.md                  # Supabase setup guide
│   ├── CUSTOMIZATION.md          # White-label guide
│   └── DEPLOYMENT.md             # Deployment guide
└── scripts/
    └── google-apps-script.js     # Keep for optional GSheets sync
```

---

## Environment Variables

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

These will be embedded in the HTML or loaded from a config file.

---

## Execution Order

1. **Create Supabase migrations** (SQL files)
2. **Add Supabase client to index.html**
3. **Build Auth UI** (Login, Register, Logout)
4. **Build Organization setup flow**
5. **Migrate data operations to Supabase**
6. **Add real-time sync**
7. **Build white-label config editors**
8. **Test multi-user scenarios**
9. **Documentation**
