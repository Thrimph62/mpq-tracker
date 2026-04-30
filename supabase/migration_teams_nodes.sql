-- ============================================================
-- MIGRATION — Remplacement ok_hard_nodes / ok_cn_node
-- par hn1, hn2, hn3, cn
-- À exécuter dans Supabase SQL Editor
-- ============================================================

ALTER TABLE teams
  DROP COLUMN IF EXISTS ok_hard_nodes,
  DROP COLUMN IF EXISTS ok_cn_node;

ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS hn1 TEXT CHECK (hn1 IN ('Oui','Non','Partiellement')),
  ADD COLUMN IF NOT EXISTS hn2 TEXT CHECK (hn2 IN ('Oui','Non','Partiellement')),
  ADD COLUMN IF NOT EXISTS hn3 TEXT CHECK (hn3 IN ('Oui','Non','Partiellement')),
  ADD COLUMN IF NOT EXISTS cn  TEXT CHECK (cn  IN ('Oui','Non','Partiellement'));
