-- ============================================================
-- MIGRATION — Teams: add custom_name field
-- ============================================================

ALTER TABLE mpq_tracker_teams
  ADD COLUMN IF NOT EXISTS custom_name TEXT;
