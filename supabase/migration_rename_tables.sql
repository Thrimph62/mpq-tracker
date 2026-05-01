-- ============================================================
-- MIGRATION — Renommer toutes les tables avec préfixe mpq_tracker_
-- À exécuter dans Supabase SQL Editor
-- ============================================================

ALTER TABLE characters       RENAME TO mpq_tracker_characters;
ALTER TABLE character_powers RENAME TO mpq_tracker_character_powers;
ALTER TABLE supports         RENAME TO mpq_tracker_supports;
ALTER TABLE teams            RENAME TO mpq_tracker_teams;
ALTER TABLE quetes           RENAME TO mpq_tracker_quetes;
ALTER TABLE puzzle_gauntlet  RENAME TO mpq_tracker_puzzle_gauntlet;
