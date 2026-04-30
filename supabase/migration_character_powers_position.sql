-- ============================================================
-- MIGRATION — Ajout du champ position à character_powers
-- Position du pouvoir : de 1 à 6
-- À exécuter dans Supabase SQL Editor
-- ============================================================

ALTER TABLE character_powers
  ADD COLUMN IF NOT EXISTS position INTEGER CHECK (position BETWEEN 1 AND 6);
