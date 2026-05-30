-- ============================================================
-- MIGRATION — Characters: add affiliations array
-- ============================================================

ALTER TABLE mpq_tracker_characters
  ADD COLUMN IF NOT EXISTS affiliations TEXT[] DEFAULT '{}';
