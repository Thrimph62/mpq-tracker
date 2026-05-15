-- ============================================================
-- MIGRATION — Teams: per-slot strategy + CSS only
-- ============================================================

ALTER TABLE mpq_tracker_teams
  ADD COLUMN IF NOT EXISTS left_strategy  TEXT,
  ADD COLUMN IF NOT EXISTS left_css       BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS mid_strategy   TEXT,
  ADD COLUMN IF NOT EXISTS mid_css        BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS right_strategy TEXT,
  ADD COLUMN IF NOT EXISTS right_css      BOOLEAN NOT NULL DEFAULT FALSE;
