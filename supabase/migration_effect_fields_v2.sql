-- ============================================================
-- MIGRATION — Nouveaux champs d'effet
-- sous_category_2, degats, choix
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- ── mpq_tracker_supports ─────────────────────────────────────
ALTER TABLE mpq_tracker_supports
  ADD COLUMN IF NOT EXISTS effect_1_sous_category_2 TEXT,
  ADD COLUMN IF NOT EXISTS effect_1_degats          TEXT,
  ADD COLUMN IF NOT EXISTS effect_1_choix           TEXT,
  ADD COLUMN IF NOT EXISTS effect_2_sous_category_2 TEXT,
  ADD COLUMN IF NOT EXISTS effect_2_degats          TEXT,
  ADD COLUMN IF NOT EXISTS effect_2_choix           TEXT,
  ADD COLUMN IF NOT EXISTS effect_3_sous_category_2 TEXT,
  ADD COLUMN IF NOT EXISTS effect_3_degats          TEXT,
  ADD COLUMN IF NOT EXISTS effect_3_choix           TEXT,
  ADD COLUMN IF NOT EXISTS effect_4_sous_category_2 TEXT,
  ADD COLUMN IF NOT EXISTS effect_4_degats          TEXT,
  ADD COLUMN IF NOT EXISTS effect_4_choix           TEXT,
  ADD COLUMN IF NOT EXISTS effect_5_sous_category_2 TEXT,
  ADD COLUMN IF NOT EXISTS effect_5_degats          TEXT,
  ADD COLUMN IF NOT EXISTS effect_5_choix           TEXT,
  ADD COLUMN IF NOT EXISTS synergy_sous_category_2  TEXT,
  ADD COLUMN IF NOT EXISTS synergy_degats           TEXT,
  ADD COLUMN IF NOT EXISTS synergy_choix            TEXT;

-- ── mpq_tracker_character_powers ─────────────────────────────
ALTER TABLE mpq_tracker_character_powers
  ADD COLUMN IF NOT EXISTS effect_1_sous_category_2 TEXT,
  ADD COLUMN IF NOT EXISTS effect_1_degats          TEXT,
  ADD COLUMN IF NOT EXISTS effect_1_choix           TEXT,
  ADD COLUMN IF NOT EXISTS effect_2_sous_category_2 TEXT,
  ADD COLUMN IF NOT EXISTS effect_2_degats          TEXT,
  ADD COLUMN IF NOT EXISTS effect_2_choix           TEXT,
  ADD COLUMN IF NOT EXISTS effect_3_sous_category_2 TEXT,
  ADD COLUMN IF NOT EXISTS effect_3_degats          TEXT,
  ADD COLUMN IF NOT EXISTS effect_3_choix           TEXT,
  ADD COLUMN IF NOT EXISTS effect_4_sous_category_2 TEXT,
  ADD COLUMN IF NOT EXISTS effect_4_degats          TEXT,
  ADD COLUMN IF NOT EXISTS effect_4_choix           TEXT;
