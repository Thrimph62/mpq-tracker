-- ============================================================
-- MIGRATION — character_powers : jusqu'à 4 effets par pouvoir
-- Chaque effet a son propre coût MP
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- Supprimer les anciens champs
ALTER TABLE character_powers
  DROP COLUMN IF EXISTS cout,
  DROP COLUMN IF EXISTS effect_category,
  DROP COLUMN IF EXISTS effect_detail,
  DROP COLUMN IF EXISTS effect_trigger;

-- Ajouter les 4 effets avec coût MP individuel
ALTER TABLE character_powers
  ADD COLUMN IF NOT EXISTS effect_1_cout     INTEGER,
  ADD COLUMN IF NOT EXISTS effect_1_category TEXT,
  ADD COLUMN IF NOT EXISTS effect_1_detail   TEXT,
  ADD COLUMN IF NOT EXISTS effect_1_trigger  TEXT,
  ADD COLUMN IF NOT EXISTS effect_2_cout     INTEGER,
  ADD COLUMN IF NOT EXISTS effect_2_category TEXT,
  ADD COLUMN IF NOT EXISTS effect_2_detail   TEXT,
  ADD COLUMN IF NOT EXISTS effect_2_trigger  TEXT,
  ADD COLUMN IF NOT EXISTS effect_3_cout     INTEGER,
  ADD COLUMN IF NOT EXISTS effect_3_category TEXT,
  ADD COLUMN IF NOT EXISTS effect_3_detail   TEXT,
  ADD COLUMN IF NOT EXISTS effect_3_trigger  TEXT,
  ADD COLUMN IF NOT EXISTS effect_4_cout     INTEGER,
  ADD COLUMN IF NOT EXISTS effect_4_category TEXT,
  ADD COLUMN IF NOT EXISTS effect_4_detail   TEXT,
  ADD COLUMN IF NOT EXISTS effect_4_trigger  TEXT;
