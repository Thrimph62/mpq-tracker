-- ============================================================
-- MIGRATION — Add is_duplicate column to mpq_tracker_characters
-- À exécuter dans Supabase SQL Editor
-- ============================================================

ALTER TABLE mpq_tracker_characters
  ADD COLUMN IF NOT EXISTS is_duplicate BOOLEAN NOT NULL DEFAULT FALSE;
