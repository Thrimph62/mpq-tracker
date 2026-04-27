-- ============================================================
-- MIGRATION — Ajout des champs Trigger pour les effets supports
-- À exécuter dans Supabase SQL Editor
-- ============================================================

ALTER TABLE supports
  ADD COLUMN IF NOT EXISTS effect_1_trigger TEXT,
  ADD COLUMN IF NOT EXISTS effect_2_trigger TEXT,
  ADD COLUMN IF NOT EXISTS effect_3_trigger TEXT,
  ADD COLUMN IF NOT EXISTS effect_4_trigger TEXT,
  ADD COLUMN IF NOT EXISTS effect_5_trigger TEXT,
  ADD COLUMN IF NOT EXISTS synergy_trigger  TEXT;
