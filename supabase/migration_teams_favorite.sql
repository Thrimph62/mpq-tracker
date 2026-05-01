-- ============================================================
-- MIGRATION — Ajout du champ favori aux équipes
-- À exécuter dans Supabase SQL Editor
-- ============================================================

ALTER TABLE mpq_tracker_teams
  ADD COLUMN IF NOT EXISTS favorite BOOLEAN NOT NULL DEFAULT FALSE;
