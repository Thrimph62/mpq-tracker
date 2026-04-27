-- ============================================================
-- MIGRATION — Simplification character_powers
-- Un seul effet par pouvoir (catégorie + détail + trigger)
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- Supprimer les colonnes effet 1-5
ALTER TABLE character_powers
  DROP COLUMN IF EXISTS effect_1_category,
  DROP COLUMN IF EXISTS effect_1_trigger,
  DROP COLUMN IF EXISTS effect_1_detail,
  DROP COLUMN IF EXISTS effect_2_category,
  DROP COLUMN IF EXISTS effect_2_trigger,
  DROP COLUMN IF EXISTS effect_2_detail,
  DROP COLUMN IF EXISTS effect_3_category,
  DROP COLUMN IF EXISTS effect_3_trigger,
  DROP COLUMN IF EXISTS effect_3_detail,
  DROP COLUMN IF EXISTS effect_4_category,
  DROP COLUMN IF EXISTS effect_4_trigger,
  DROP COLUMN IF EXISTS effect_4_detail,
  DROP COLUMN IF EXISTS effect_5_category,
  DROP COLUMN IF EXISTS effect_5_trigger,
  DROP COLUMN IF EXISTS effect_5_detail;

-- Ajouter un seul effet
ALTER TABLE character_powers
  ADD COLUMN IF NOT EXISTS effect_category TEXT,
  ADD COLUMN IF NOT EXISTS effect_detail   TEXT,
  ADD COLUMN IF NOT EXISTS effect_trigger  TEXT;
