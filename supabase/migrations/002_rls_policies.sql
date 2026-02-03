-- ============================================================
-- Row Level Security Policies
-- Version: 1.0.0
-- Description: Multi-tenant data isolation
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE collateral ENABLE ROW LEVEL SECURITY;
ALTER TABLE collateral_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_lists ENABLE ROW LEVEL SECURITY;

-- ==================== PROFILES ====================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can view profiles of org members (for @mentions, assignments)
CREATE POLICY "Users can view org member profiles"
  ON profiles FOR SELECT
  USING (
    id IN (
      SELECT om2.user_id
      FROM organization_members om1
      JOIN organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
    )
  );

-- ==================== ORGANIZATIONS ====================

-- Users can view orgs they belong to
CREATE POLICY "Members can view organization"
  ON organizations FOR SELECT
  USING (
    id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

-- Any authenticated user can create an org (they become owner)
CREATE POLICY "Authenticated users can create organization"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Only owners/admins can update org
CREATE POLICY "Admins can update organization"
  ON organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Only owners can delete org
CREATE POLICY "Owners can delete organization"
  ON organizations FOR DELETE
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- ==================== ORGANIZATION MEMBERS ====================

-- Members can view other members in their org
CREATE POLICY "Members can view org members"
  ON organization_members FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Admins can add members
CREATE POLICY "Admins can add members"
  ON organization_members FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
    OR
    -- Allow self-insert when accepting invitation
    user_id = auth.uid()
  );

-- Admins can update member roles (but not owner role)
CREATE POLICY "Admins can update members"
  ON organization_members FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    -- Can't change owner role unless you're the owner
    (role != 'owner' OR (
      SELECT role FROM organization_members
      WHERE organization_id = organization_members.organization_id
      AND user_id = auth.uid()
    ) = 'owner')
  );

-- Admins can remove members (but not owner)
CREATE POLICY "Admins can remove members"
  ON organization_members FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
    AND role != 'owner'
  );

-- Members can leave (delete their own membership, except owner)
CREATE POLICY "Members can leave org"
  ON organization_members FOR DELETE
  USING (user_id = auth.uid() AND role != 'owner');

-- ==================== LEADS ====================

-- Members can view leads in their org
CREATE POLICY "Members can view org leads"
  ON leads FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

-- Members can create leads in their org
CREATE POLICY "Members can create leads"
  ON leads FOR INSERT
  WITH CHECK (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

-- Members can update leads in their org
CREATE POLICY "Members can update leads"
  ON leads FOR UPDATE
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

-- Admins can delete leads
CREATE POLICY "Admins can delete leads"
  ON leads FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ==================== TASKS ====================

-- Members can view tasks in their org
CREATE POLICY "Members can view org tasks"
  ON tasks FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

-- Members can create tasks
CREATE POLICY "Members can create tasks"
  ON tasks FOR INSERT
  WITH CHECK (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

-- Members can update tasks (complete, reassign, etc.)
CREATE POLICY "Members can update tasks"
  ON tasks FOR UPDATE
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

-- Members can delete their own tasks, admins can delete any
CREATE POLICY "Members can delete tasks"
  ON tasks FOR DELETE
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    AND (
      created_by = auth.uid()
      OR organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      )
    )
  );

-- ==================== AVAILABILITY SLOTS ====================

-- Members can view slots
CREATE POLICY "Members can view slots"
  ON availability_slots FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

-- Admins can manage slots
CREATE POLICY "Admins can create slots"
  ON availability_slots FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can update slots"
  ON availability_slots FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can delete slots"
  ON availability_slots FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ==================== MEETINGS ====================

-- Members can view meetings
CREATE POLICY "Members can view meetings"
  ON meetings FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

-- Members can create meetings (book CEO time)
CREATE POLICY "Members can create meetings"
  ON meetings FOR INSERT
  WITH CHECK (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

-- Members can update meetings they created, admins can update any
CREATE POLICY "Members can update meetings"
  ON meetings FOR UPDATE
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    AND (
      created_by = auth.uid()
      OR organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      )
    )
  );

-- Admins can delete meetings
CREATE POLICY "Admins can delete meetings"
  ON meetings FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ==================== COLLATERAL ====================

-- Members can view collateral
CREATE POLICY "Members can view collateral"
  ON collateral FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

-- Admins can manage collateral
CREATE POLICY "Admins can create collateral"
  ON collateral FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can update collateral"
  ON collateral FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can delete collateral"
  ON collateral FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ==================== COLLATERAL SENDS ====================

-- Members can view sends in their org
CREATE POLICY "Members can view collateral sends"
  ON collateral_sends FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

-- Members can log sends
CREATE POLICY "Members can create collateral sends"
  ON collateral_sends FOR INSERT
  WITH CHECK (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

-- ==================== ACTIVITY LOG ====================

-- Members can view activity in their org
CREATE POLICY "Members can view activity log"
  ON activity_log FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

-- System/triggers can insert (via service role), members can log activities
CREATE POLICY "Members can create activity log"
  ON activity_log FOR INSERT
  WITH CHECK (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

-- ==================== INVITATIONS ====================

-- Admins can view invitations
CREATE POLICY "Admins can view invitations"
  ON invitations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
    -- Also allow viewing by token (for invitation acceptance)
    OR token IS NOT NULL
  );

-- Admins can create invitations
CREATE POLICY "Admins can create invitations"
  ON invitations FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Allow updating invitation when accepting (by token lookup via RPC)
CREATE POLICY "Can update invitations"
  ON invitations FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Admins can revoke invitations
CREATE POLICY "Admins can delete invitations"
  ON invitations FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ==================== CALL LISTS ====================

-- Users can view their own call lists
CREATE POLICY "Users can view own call lists"
  ON call_lists FOR SELECT
  USING (
    user_id = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Users can manage their own call lists
CREATE POLICY "Users can manage own call lists"
  ON call_lists FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
