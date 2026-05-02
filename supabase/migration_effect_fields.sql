-- ============================================================
-- MIGRATION — Refonte des champs d'effet
-- Remplace "detail" par sous_category, quantite, force, autre
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- ── mpq_tracker_supports ─────────────────────────────────────
ALTER TABLE mpq_tracker_supports
  DROP COLUMN IF EXISTS effect_1_detail,
  DROP COLUMN IF EXISTS effect_2_detail,
  DROP COLUMN IF EXISTS effect_3_detail,
  DROP COLUMN IF EXISTS effect_4_detail,
  DROP COLUMN IF EXISTS effect_5_detail,
  DROP COLUMN IF EXISTS synergy_detail;

ALTER TABLE mpq_tracker_supports
  ADD COLUMN IF NOT EXISTS effect_1_sous_category TEXT,
  ADD COLUMN IF NOT EXISTS effect_1_quantite       TEXT,
  ADD COLUMN IF NOT EXISTS effect_1_force          TEXT,
  ADD COLUMN IF NOT EXISTS effect_1_autre          TEXT,
  ADD COLUMN IF NOT EXISTS effect_2_sous_category TEXT,
  ADD COLUMN IF NOT EXISTS effect_2_quantite       TEXT,
  ADD COLUMN IF NOT EXISTS effect_2_force          TEXT,
  ADD COLUMN IF NOT EXISTS effect_2_autre          TEXT,
  ADD COLUMN IF NOT EXISTS effect_3_sous_category TEXT,
  ADD COLUMN IF NOT EXISTS effect_3_quantite       TEXT,
  ADD COLUMN IF NOT EXISTS effect_3_force          TEXT,
  ADD COLUMN IF NOT EXISTS effect_3_autre          TEXT,
  ADD COLUMN IF NOT EXISTS effect_4_sous_category TEXT,
  ADD COLUMN IF NOT EXISTS effect_4_quantite       TEXT,
  ADD COLUMN IF NOT EXISTS effect_4_force          TEXT,
  ADD COLUMN IF NOT EXISTS effect_4_autre          TEXT,
  ADD COLUMN IF NOT EXISTS effect_5_sous_category TEXT,
  ADD COLUMN IF NOT EXISTS effect_5_quantite       TEXT,
  ADD COLUMN IF NOT EXISTS effect_5_force          TEXT,
  ADD COLUMN IF NOT EXISTS effect_5_autre          TEXT,
  ADD COLUMN IF NOT EXISTS synergy_sous_category  TEXT,
  ADD COLUMN IF NOT EXISTS synergy_quantite        TEXT,
  ADD COLUMN IF NOT EXISTS synergy_force           TEXT,
  ADD COLUMN IF NOT EXISTS synergy_autre           TEXT;

-- ── mpq_tracker_character_powers ─────────────────────────────
ALTER TABLE mpq_tracker_character_powers
  DROP COLUMN IF EXISTS effect_1_detail,
  DROP COLUMN IF EXISTS effect_2_detail,
  DROP COLUMN IF EXISTS effect_3_detail,
  DROP COLUMN IF EXISTS effect_4_detail;

ALTER TABLE mpq_tracker_character_powers
  ADD COLUMN IF NOT EXISTS effect_1_sous_category TEXT,
  ADD COLUMN IF NOT EXISTS effect_1_quantite       TEXT,
  ADD COLUMN IF NOT EXISTS effect_1_force          TEXT,
  ADD COLUMN IF NOT EXISTS effect_1_autre          TEXT,
  ADD COLUMN IF NOT EXISTS effect_2_sous_category TEXT,
  ADD COLUMN IF NOT EXISTS effect_2_quantite       TEXT,
  ADD COLUMN IF NOT EXISTS effect_2_force          TEXT,
  ADD COLUMN IF NOT EXISTS effect_2_autre          TEXT,
  ADD COLUMN IF NOT EXISTS effect_3_sous_category TEXT,
  ADD COLUMN IF NOT EXISTS effect_3_quantite       TEXT,
  ADD COLUMN IF NOT EXISTS effect_3_force          TEXT,
  ADD COLUMN IF NOT EXISTS effect_3_autre          TEXT,
  ADD COLUMN IF NOT EXISTS effect_4_sous_category TEXT,
  ADD COLUMN IF NOT EXISTS effect_4_quantite       TEXT,
  ADD COLUMN IF NOT EXISTS effect_4_force          TEXT,
  ADD COLUMN IF NOT EXISTS effect_4_autre          TEXT;
