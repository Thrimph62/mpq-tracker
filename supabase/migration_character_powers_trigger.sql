-- ============================================================
-- MIGRATION — Ajout des champs Trigger pour character_powers
-- À exécuter dans Supabase SQL Editor
-- ============================================================

ALTER TABLE character_powers
  ADD COLUMN IF NOT EXISTS effect_1_trigger TEXT,
  ADD COLUMN IF NOT EXISTS effect_2_trigger TEXT,
  ADD COLUMN IF NOT EXISTS effect_3_trigger TEXT,
  ADD COLUMN IF NOT EXISTS effect_4_trigger TEXT,
  ADD COLUMN IF NOT EXISTS effect_5_trigger TEXT;
