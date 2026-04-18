-- ============================================================
-- MIGRATION — Refonte table supports
-- À exécuter dans Supabase SQL Editor si la table existe déjà
-- ============================================================

-- 1. Supprimer les anciennes colonnes d'effets
ALTER TABLE supports
  DROP COLUMN IF EXISTS mp_bonus,
  DROP COLUMN IF EXISTS degats_up,
  DROP COLUMN IF EXISTS degats_ennemis,
  DROP COLUMN IF EXISTS creation,
  DROP COLUMN IF EXISTS destruction_ennemi,
  DROP COLUMN IF EXISTS fortification,
  DROP COLUMN IF EXISTS sante,
  DROP COLUMN IF EXISTS autre,
  DROP COLUMN IF EXISTS synergie,
  DROP COLUMN IF EXISTS for_filter;

-- 2. Ajouter les nouvelles colonnes effets 1–5
ALTER TABLE supports
  ADD COLUMN IF NOT EXISTS effect_1_category   TEXT,
  ADD COLUMN IF NOT EXISTS effect_1_detail     TEXT,
  ADD COLUMN IF NOT EXISTS effect_2_category   TEXT,
  ADD COLUMN IF NOT EXISTS effect_2_detail     TEXT,
  ADD COLUMN IF NOT EXISTS effect_3_category   TEXT,
  ADD COLUMN IF NOT EXISTS effect_3_detail     TEXT,
  ADD COLUMN IF NOT EXISTS effect_4_category   TEXT,
  ADD COLUMN IF NOT EXISTS effect_4_detail     TEXT,
  ADD COLUMN IF NOT EXISTS effect_5_category   TEXT,
  ADD COLUMN IF NOT EXISTS effect_5_detail     TEXT,
  ADD COLUMN IF NOT EXISTS synergy_restriction TEXT,
  ADD COLUMN IF NOT EXISTS synergy_category    TEXT,
  ADD COLUMN IF NOT EXISTS synergy_detail      TEXT;
