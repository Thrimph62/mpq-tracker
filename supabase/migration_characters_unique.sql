-- ============================================================
-- MIGRATION — Supprimer la contrainte UNIQUE sur characters
-- Permet d'avoir plusieurs copies du même personnage (ex: 2x Juggernaut Classic 5★)
-- À exécuter dans Supabase SQL Editor
-- ============================================================

ALTER TABLE characters DROP CONSTRAINT IF EXISTS characters_name_stars_key;
