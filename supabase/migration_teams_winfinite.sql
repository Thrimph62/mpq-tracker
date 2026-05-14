-- ============================================================
-- MIGRATION — Teams: add winfinite field
-- ============================================================

ALTER TABLE mpq_tracker_teams
  ADD COLUMN IF NOT EXISTS winfinite TEXT CHECK (winfinite IN ('Yes', 'No'));
