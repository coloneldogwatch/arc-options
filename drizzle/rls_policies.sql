-- ─────────────────────────────────────────────────────────────────────────────
-- Row-Level Security for Arc Options
-- Run this AFTER the schema migration (0000_early_fixer.sql)
-- ─────────────────────────────────────────────────────────────────────────────

-- Helper: returns the workspace IDs that belong to the current user.
-- Defined once so every policy can reference it cheaply.
CREATE OR REPLACE FUNCTION public.user_workspace_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
$$;

-- ─── workspaces ──────────────────────────────────────────────────────────────
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_select" ON workspaces
  FOR SELECT USING (id IN (SELECT user_workspace_ids()));

CREATE POLICY "workspace_update" ON workspaces
  FOR UPDATE USING (
    id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ─── workspace_members ───────────────────────────────────────────────────────
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "member_select" ON workspace_members
  FOR SELECT USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "member_insert_owner" ON workspace_members
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Own row — needed for the signup flow before the workspace member exists yet.
-- The server action runs as service_role, so RLS is bypassed server-side.
-- This policy allows the user to read their own row for client-side checks.
CREATE POLICY "member_own_row" ON workspace_members
  FOR ALL USING (user_id = auth.uid());

-- ─── broker_accounts ─────────────────────────────────────────────────────────
ALTER TABLE broker_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "broker_accounts_all" ON broker_accounts
  FOR ALL USING (workspace_id IN (SELECT user_workspace_ids()));

-- ─── positions ───────────────────────────────────────────────────────────────
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "positions_all" ON positions
  FOR ALL USING (workspace_id IN (SELECT user_workspace_ids()));

-- ─── position_legs ───────────────────────────────────────────────────────────
ALTER TABLE position_legs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "position_legs_all" ON position_legs
  FOR ALL USING (
    position_id IN (
      SELECT id FROM positions WHERE workspace_id IN (SELECT user_workspace_ids())
    )
  );

-- ─── position_adjustments ────────────────────────────────────────────────────
ALTER TABLE position_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "position_adjustments_all" ON position_adjustments
  FOR ALL USING (
    position_id IN (
      SELECT id FROM positions WHERE workspace_id IN (SELECT user_workspace_ids())
    )
  );

-- ─── tags ────────────────────────────────────────────────────────────────────
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tags_all" ON tags
  FOR ALL USING (workspace_id IN (SELECT user_workspace_ids()));

-- ─── position_tags ───────────────────────────────────────────────────────────
ALTER TABLE position_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "position_tags_all" ON position_tags
  FOR ALL USING (
    position_id IN (
      SELECT id FROM positions WHERE workspace_id IN (SELECT user_workspace_ids())
    )
  );

-- ─── checklist_templates ─────────────────────────────────────────────────────
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checklist_templates_all" ON checklist_templates
  FOR ALL USING (workspace_id IN (SELECT user_workspace_ids()));

-- ─── checklist_items ─────────────────────────────────────────────────────────
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checklist_items_all" ON checklist_items
  FOR ALL USING (
    template_id IN (
      SELECT id FROM checklist_templates WHERE workspace_id IN (SELECT user_workspace_ids())
    )
  );

-- ─── checklist_responses ─────────────────────────────────────────────────────
ALTER TABLE checklist_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checklist_responses_all" ON checklist_responses
  FOR ALL USING (
    position_id IN (
      SELECT id FROM positions WHERE workspace_id IN (SELECT user_workspace_ids())
    )
  );

-- ─── mistakes ────────────────────────────────────────────────────────────────
ALTER TABLE mistakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mistakes_all" ON mistakes
  FOR ALL USING (workspace_id IN (SELECT user_workspace_ids()));

-- ─── trade_reviews ───────────────────────────────────────────────────────────
ALTER TABLE trade_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trade_reviews_all" ON trade_reviews
  FOR ALL USING (workspace_id IN (SELECT user_workspace_ids()));

-- ─── review_mistakes ─────────────────────────────────────────────────────────
ALTER TABLE review_mistakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "review_mistakes_all" ON review_mistakes
  FOR ALL USING (
    review_id IN (
      SELECT id FROM trade_reviews WHERE workspace_id IN (SELECT user_workspace_ids())
    )
  );

-- ─── weekly_reviews ──────────────────────────────────────────────────────────
ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weekly_reviews_all" ON weekly_reviews
  FOR ALL USING (workspace_id IN (SELECT user_workspace_ids()));

-- ─── flow_signals (global market data — all authenticated users can read) ────
ALTER TABLE flow_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "flow_signals_read" ON flow_signals
  FOR SELECT USING (auth.role() = 'authenticated');

-- ─── flow_filters ────────────────────────────────────────────────────────────
ALTER TABLE flow_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "flow_filters_all" ON flow_filters
  FOR ALL USING (workspace_id IN (SELECT user_workspace_ids()));

-- ─── ai_artifacts ────────────────────────────────────────────────────────────
ALTER TABLE ai_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_artifacts_all" ON ai_artifacts
  FOR ALL USING (workspace_id IN (SELECT user_workspace_ids()));

-- ─── import_batches ──────────────────────────────────────────────────────────
ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "import_batches_all" ON import_batches
  FOR ALL USING (workspace_id IN (SELECT user_workspace_ids()));
