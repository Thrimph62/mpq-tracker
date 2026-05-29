-- ============================================================
-- MIGRATION — Teams: add is_template field
-- ============================================================

ALTER TABLE mpq_tracker_teams
  ADD COLUMN IF NOT EXISTS is_template BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS template_name TEXT;
