-- ============================================================
-- MIGRATION — Teams + Core Duos: allow multiple custom names
-- Converts custom_name from a single TEXT value into a TEXT[]
-- array, preserving any existing value as the first entry.
-- ============================================================

ALTER TABLE mpq_tracker_teams
  ALTER COLUMN custom_name TYPE TEXT[]
  USING CASE WHEN custom_name IS NULL THEN NULL ELSE ARRAY[custom_name] END;

ALTER TABLE mpq_tracker_core_duos
  ALTER COLUMN custom_name TYPE TEXT[]
  USING CASE WHEN custom_name IS NULL THEN NULL ELSE ARRAY[custom_name] END;
