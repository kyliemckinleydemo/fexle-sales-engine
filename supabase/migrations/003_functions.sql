-- ============================================================
-- Database Functions and Stored Procedures
-- Version: 1.0.0
-- ============================================================

-- ==================== ORGANIZATION FUNCTIONS ====================

-- Create organization and add creator as owner
CREATE OR REPLACE FUNCTION create_organization(
  p_name TEXT,
  p_config JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- Create the organization
  INSERT INTO organizations (name, config)
  VALUES (p_name, p_config)
  RETURNING id INTO v_org_id;

  -- Add the creator as owner
  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (v_org_id, auth.uid(), 'owner');

  RETURN v_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get organization config with defaults merged
CREATE OR REPLACE FUNCTION get_org_config(p_org_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_config JSONB;
  v_defaults JSONB := '{
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
    "scripts": {},
    "verticals": {},
    "scoring": {},
    "collateralRules": []
  }'::jsonb;
BEGIN
  SELECT config INTO v_config FROM organizations WHERE id = p_org_id;
  RETURN v_defaults || COALESCE(v_config, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update organization config (deep merge)
CREATE OR REPLACE FUNCTION update_org_config(
  p_org_id UUID,
  p_config JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_current JSONB;
  v_updated JSONB;
BEGIN
  -- Check permission
  IF NOT user_has_role(auth.uid(), p_org_id, ARRAY['owner', 'admin']) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  SELECT config INTO v_current FROM organizations WHERE id = p_org_id;
  v_updated := COALESCE(v_current, '{}'::jsonb) || p_config;

  UPDATE organizations SET config = v_updated WHERE id = p_org_id;

  RETURN v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== INVITATION FUNCTIONS ====================

-- Accept invitation
CREATE OR REPLACE FUNCTION accept_invitation(p_token TEXT)
RETURNS JSONB AS $$
DECLARE
  v_invitation RECORD;
  v_result JSONB;
BEGIN
  -- Find valid invitation
  SELECT * INTO v_invitation
  FROM invitations
  WHERE token = p_token
  AND accepted_at IS NULL
  AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;

  -- Add user to organization
  INSERT INTO organization_members (organization_id, user_id, role, invited_by, invited_at)
  VALUES (
    v_invitation.organization_id,
    auth.uid(),
    v_invitation.role,
    v_invitation.invited_by,
    v_invitation.created_at
  )
  ON CONFLICT (organization_id, user_id) DO NOTHING;

  -- Mark invitation as accepted
  UPDATE invitations
  SET accepted_at = NOW(), accepted_by = auth.uid()
  WHERE id = v_invitation.id;

  RETURN jsonb_build_object(
    'success', true,
    'organization_id', v_invitation.organization_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== LEAD FUNCTIONS ====================

-- Calculate lead score based on org's scoring config
CREATE OR REPLACE FUNCTION calculate_lead_score(
  p_lead_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_lead RECORD;
  v_config JSONB;
  v_scoring JSONB;
  v_score INTEGER := 0;
BEGIN
  SELECT * INTO v_lead FROM leads WHERE id = p_lead_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  SELECT get_org_config(v_lead.organization_id) INTO v_config;
  v_scoring := v_config->'scoring'->'weights';

  -- Company size score
  v_score := v_score + COALESCE(
    (v_scoring->'companySize'->'brackets'->>v_lead.company_size)::int,
    10
  );

  -- Revenue score
  v_score := v_score + COALESCE(
    (v_scoring->'revenue'->'brackets'->>v_lead.revenue)::int,
    10
  );

  -- Title score (simplified - would need more logic in real impl)
  IF v_lead.title ILIKE '%ceo%' OR v_lead.title ILIKE '%chief executive%' THEN
    v_score := v_score + 25;
  ELSIF v_lead.title ILIKE '%coo%' OR v_lead.title ILIKE '%cio%' OR v_lead.title ILIKE '%cto%' THEN
    v_score := v_score + 22;
  ELSIF v_lead.title ILIKE '%director%' OR v_lead.title ILIKE '%head of%' THEN
    v_score := v_score + 15;
  ELSIF v_lead.title ILIKE '%manager%' THEN
    v_score := v_score + 10;
  ELSE
    v_score := v_score + 5;
  END IF;

  -- Vertical score
  v_score := v_score + COALESCE(
    (v_scoring->'vertical'->'scores'->>v_lead.vertical)::int,
    8
  );

  -- Normalize to 0-100
  RETURN LEAST(GREATEST(v_score, 0), 100);
END;
$$ LANGUAGE plpgsql;

-- Bulk import leads
CREATE OR REPLACE FUNCTION import_leads(
  p_org_id UUID,
  p_leads JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_lead JSONB;
  v_inserted INTEGER := 0;
  v_skipped INTEGER := 0;
  v_errors JSONB := '[]'::jsonb;
BEGIN
  -- Check permission
  IF NOT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = p_org_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  FOR v_lead IN SELECT * FROM jsonb_array_elements(p_leads)
  LOOP
    BEGIN
      INSERT INTO leads (
        organization_id,
        company,
        contact,
        title,
        phone,
        email,
        vertical,
        company_size,
        revenue,
        website,
        linkedin_url,
        city,
        state,
        country,
        industry,
        source,
        notes,
        created_by
      ) VALUES (
        p_org_id,
        v_lead->>'company',
        v_lead->>'contact',
        v_lead->>'title',
        v_lead->>'phone',
        v_lead->>'email',
        COALESCE(v_lead->>'vertical', 'general'),
        v_lead->>'companySize',
        v_lead->>'revenue',
        v_lead->>'website',
        v_lead->>'linkedinUrl',
        v_lead->>'city',
        v_lead->>'state',
        COALESCE(v_lead->>'country', 'AU'),
        v_lead->>'industry',
        COALESCE(v_lead->>'source', 'import'),
        v_lead->>'notes',
        auth.uid()
      );
      v_inserted := v_inserted + 1;
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || jsonb_build_object(
        'company', v_lead->>'company',
        'error', SQLERRM
      );
      v_skipped := v_skipped + 1;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'inserted', v_inserted,
    'skipped', v_skipped,
    'errors', v_errors
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== ACTIVITY LOGGING ====================

-- Log activity
CREATE OR REPLACE FUNCTION log_activity(
  p_org_id UUID,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_action TEXT,
  p_details JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO activity_log (organization_id, user_id, entity_type, entity_id, action, details)
  VALUES (p_org_id, auth.uid(), p_entity_type, p_entity_id, p_action, p_details)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-log lead changes
CREATE OR REPLACE FUNCTION log_lead_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity(NEW.organization_id, 'lead', NEW.id, 'created', to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log significant changes
    IF OLD.status != NEW.status THEN
      PERFORM log_activity(NEW.organization_id, 'lead', NEW.id, 'status_changed',
        jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status));
    END IF;
    IF OLD.milestones IS DISTINCT FROM NEW.milestones THEN
      PERFORM log_activity(NEW.organization_id, 'lead', NEW.id, 'milestone_updated',
        jsonb_build_object('old', OLD.milestones, 'new', NEW.milestones));
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_activity(OLD.organization_id, 'lead', OLD.id, 'deleted',
      jsonb_build_object('company', OLD.company, 'contact', OLD.contact));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER log_lead_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON leads
  FOR EACH ROW EXECUTE FUNCTION log_lead_changes();

-- ==================== DASHBOARD STATS ====================

-- Get dashboard statistics for an organization
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_org_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'totalLeads', (SELECT COUNT(*) FROM leads WHERE organization_id = p_org_id),
    'newLeads', (SELECT COUNT(*) FROM leads WHERE organization_id = p_org_id AND status = 'New Lead'),
    'qualified', (SELECT COUNT(*) FROM leads WHERE organization_id = p_org_id AND status = 'Qualified'),
    'meetingsBooked', (SELECT COUNT(*) FROM meetings WHERE organization_id = p_org_id AND status = 'scheduled'),
    'closedWon', (SELECT COUNT(*) FROM leads WHERE organization_id = p_org_id AND (milestones->>'closedWon')::boolean = true),
    'tasksToday', (SELECT COUNT(*) FROM tasks WHERE organization_id = p_org_id AND due_date = CURRENT_DATE AND NOT completed),
    'tasksPending', (SELECT COUNT(*) FROM tasks WHERE organization_id = p_org_id AND NOT completed),
    'avgScore', (SELECT ROUND(AVG(score)) FROM leads WHERE organization_id = p_org_id),
    'leadsByStatus', (
      SELECT jsonb_object_agg(status, cnt)
      FROM (SELECT status, COUNT(*) as cnt FROM leads WHERE organization_id = p_org_id GROUP BY status) s
    ),
    'leadsByVertical', (
      SELECT jsonb_object_agg(vertical, cnt)
      FROM (SELECT vertical, COUNT(*) as cnt FROM leads WHERE organization_id = p_org_id GROUP BY vertical) v
    ),
    'recentActivity', (
      SELECT jsonb_agg(row_to_json(a))
      FROM (
        SELECT action, entity_type, details, created_at
        FROM activity_log
        WHERE organization_id = p_org_id
        ORDER BY created_at DESC
        LIMIT 10
      ) a
    )
  ) INTO v_stats;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== REALTIME SUBSCRIPTIONS ====================

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE meetings;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;
