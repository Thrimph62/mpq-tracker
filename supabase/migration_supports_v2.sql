-- ============================================================
-- MIGRATION — Supports: description + sous_category_3
-- ============================================================

ALTER TABLE mpq_tracker_supports
  ADD COLUMN IF NOT EXISTS effect_1_description    TEXT,
  ADD COLUMN IF NOT EXISTS effect_1_sous_category_3 TEXT,
  ADD COLUMN IF NOT EXISTS effect_2_description    TEXT,
  ADD COLUMN IF NOT EXISTS effect_2_sous_category_3 TEXT,
  ADD COLUMN IF NOT EXISTS effect_3_description    TEXT,
  ADD COLUMN IF NOT EXISTS effect_3_sous_category_3 TEXT,
  ADD COLUMN IF NOT EXISTS effect_4_description    TEXT,
  ADD COLUMN IF NOT EXISTS effect_4_sous_category_3 TEXT,
  ADD COLUMN IF NOT EXISTS effect_5_description    TEXT,
  ADD COLUMN IF NOT EXISTS effect_5_sous_category_3 TEXT,
  ADD COLUMN IF NOT EXISTS synergy_description     TEXT,
  ADD COLUMN IF NOT EXISTS synergy_sous_category_3  TEXT;
