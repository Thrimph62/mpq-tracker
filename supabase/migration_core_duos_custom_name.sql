-- ============================================================
-- MIGRATION — Core Duos: add custom_name field
-- ============================================================

ALTER TABLE mpq_tracker_core_duos ADD COLUMN IF NOT EXISTS custom_name TEXT;
