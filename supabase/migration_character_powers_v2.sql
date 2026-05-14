-- ============================================================
-- MIGRATION — Powers: description + sub_category_3
-- À exécuter dans Supabase SQL Editor
-- ============================================================

ALTER TABLE mpq_tracker_character_powers
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS effect_1_sous_category_3 TEXT,
  ADD COLUMN IF NOT EXISTS effect_2_sous_category_3 TEXT,
  ADD COLUMN IF NOT EXISTS effect_3_sous_category_3 TEXT,
  ADD COLUMN IF NOT EXISTS effect_4_sous_category_3 TEXT;
