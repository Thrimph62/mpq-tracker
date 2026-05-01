-- ============================================================
-- MPQ TRACKER — Schéma Supabase
-- ============================================================

-- Enable UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ────────────────────────────────────────────────
-- CHARACTERS
-- ────────────────────────────────────────────────
-- name      = nom complet avec version, ex: "Spider-Man (Classic)"
-- base_name = nom de base sans version, ex: "Spider-Man"
-- version   = ce qui est entre parenthèses, ex: "Classic"
-- ascended  = booléen indépendant du statut (un perso peut être ascended ET max_champ)
--             l'ascension peut être n'importe quel tier → tier supérieur (2★→3★, 3★→4★, etc.)
CREATE TABLE mpq_tracker_characters (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  base_name   TEXT NOT NULL,
  version     TEXT,
  stars       INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 6),
  level       INTEGER,
  status      TEXT CHECK (status IN ('max_champ','champ','rostered','not_owned')),
  ascended    BOOLEAN NOT NULL DEFAULT FALSE,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_characters_stars     ON mpq_tracker_characters(stars);
CREATE INDEX idx_characters_status    ON mpq_tracker_characters(status);
CREATE INDEX idx_characters_ascended  ON mpq_tracker_characters(ascended);
CREATE INDEX idx_characters_name      ON mpq_tracker_characters(name);
CREATE INDEX idx_characters_base_name ON mpq_tracker_characters(base_name);

-- ────────────────────────────────────────────────
-- CHARACTER POWERS
-- ────────────────────────────────────────────────
-- Un personnage peut avoir N pouvoirs
-- Par couleur, plusieurs pouvoirs avec coûts différents (traités séparément)
CREATE TABLE mpq_tracker_character_powers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id    UUID REFERENCES mpq_tracker_characters(id) ON DELETE CASCADE,
  power_name      TEXT,
  couleur         TEXT,   -- Bleu, Rouge, Vert, Noir, Jaune, Violet
  cout            INTEGER,
  -- Effets (même structure que supports)
  effect_1_cout INTEGER, effect_1_category TEXT, effect_1_detail TEXT, effect_1_trigger TEXT,
  effect_2_cout INTEGER, effect_2_category TEXT, effect_2_detail TEXT, effect_2_trigger TEXT,
  effect_3_cout INTEGER, effect_3_category TEXT, effect_3_detail TEXT, effect_3_trigger TEXT,
  effect_4_cout INTEGER, effect_4_category TEXT, effect_4_detail TEXT, effect_4_trigger TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_powers_character ON mpq_tracker_character_powers(character_id);
CREATE INDEX idx_powers_couleur   ON mpq_tracker_character_powers(couleur);

-- ────────────────────────────────────────────────
-- SUPPORTS
-- ────────────────────────────────────────────────
-- Each support has up to 5 effects, each with a category + free text detail.
-- Synergy has: a restriction (who it synergises with) + same category+detail structure.
-- Effect categories are stored as free text — no enum constraint so new ones can be added anytime.
CREATE TABLE mpq_tracker_supports (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT NOT NULL,
  rang                 INTEGER,
  niveau               INTEGER,
  restriction          TEXT,          -- Héros, Vilains, / or custom
  -- Effects 1–5
  effect_1_category    TEXT,
  effect_1_trigger     TEXT,
  effect_1_detail      TEXT,
  effect_2_category    TEXT,
  effect_2_trigger     TEXT,
  effect_2_detail      TEXT,
  effect_3_category    TEXT,
  effect_3_trigger     TEXT,
  effect_3_detail      TEXT,
  effect_4_category    TEXT,
  effect_4_trigger     TEXT,
  effect_4_detail      TEXT,
  effect_5_category    TEXT,
  effect_5_trigger     TEXT,
  effect_5_detail      TEXT,
  -- Synergy
  synergy_restriction  TEXT,
  synergy_category     TEXT,
  synergy_trigger      TEXT,
  synergy_detail       TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_supports_name ON mpq_tracker_supports(name);

-- ────────────────────────────────────────────────
-- TEAMS
-- ────────────────────────────────────────────────
CREATE TABLE mpq_tracker_teams (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  -- Personnage Gauche
  left_character        TEXT,
  left_build            TEXT,
  left_support          TEXT,
  left_boost            TEXT,
  -- Personnage Milieu
  mid_character         TEXT,
  mid_build             TEXT,
  mid_support           TEXT,
  mid_boost             TEXT,
  -- Personnage Droite
  right_character       TEXT,
  right_build           TEXT,
  right_support         TEXT,
  right_boost           TEXT,
  -- Résultats & Stratégie
  strategie             TEXT,
  ok_hard_nodes         TEXT,
  ok_cn_node            TEXT,
  all_3_non_boosted     TEXT,
  note_additionnelle    TEXT,
  status                TEXT DEFAULT 'active' CHECK (status IN ('active','to_test','archived')),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_teams_status ON mpq_tracker_teams(status);

-- ────────────────────────────────────────────────
-- QUÊTES
-- ────────────────────────────────────────────────
CREATE TABLE mpq_tracker_quetes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom                 TEXT NOT NULL,
  gauche_personnage   TEXT,
  gauche_build        TEXT,
  gauche_support      TEXT,
  milieu_personnage   TEXT,
  milieu_build        TEXT,
  milieu_support      TEXT,
  droite_personnage   TEXT,
  droite_build        TEXT,
  droite_support      TEXT,
  note                TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────
-- PUZZLE GAUNTLET
-- ────────────────────────────────────────────────
CREATE TABLE mpq_tracker_puzzle_gauntlet (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categorie           TEXT,
  node                TEXT,
  condition_victoire  TEXT,
  gauche_personnage   TEXT,
  gauche_build        TEXT,
  gauche_support      TEXT,
  milieu_personnage   TEXT,
  milieu_build        TEXT,
  milieu_support      TEXT,
  droite_personnage   TEXT,
  droite_build        TEXT,
  droite_support      TEXT,
  equipe_utilisee     TEXT,
  note                TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gauntlet_categorie ON mpq_tracker_puzzle_gauntlet(categorie);

-- ────────────────────────────────────────────────
-- ROW LEVEL SECURITY — Solo user (auth.uid check)
-- ────────────────────────────────────────────────
ALTER TABLE mpq_tracker_characters       ENABLE ROW LEVEL SECURITY;
ALTER TABLE mpq_tracker_character_powers ENABLE ROW LEVEL SECURITY;
ALTER TABLE mpq_tracker_supports         ENABLE ROW LEVEL SECURITY;
ALTER TABLE mpq_tracker_teams            ENABLE ROW LEVEL SECURITY;
ALTER TABLE mpq_tracker_quetes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE mpq_tracker_puzzle_gauntlet  ENABLE ROW LEVEL SECURITY;

-- Allow full access only to authenticated users
CREATE POLICY "auth_only" ON mpq_tracker_characters       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_only" ON mpq_tracker_character_powers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_only" ON mpq_tracker_supports         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_only" ON mpq_tracker_teams            FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_only" ON mpq_tracker_quetes           FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_only" ON mpq_tracker_puzzle_gauntlet  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ────────────────────────────────────────────────
-- AUTO-UPDATE updated_at
-- ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_mpq_tracker_characters       BEFORE UPDATE ON mpq_tracker_characters       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_mpq_tracker_supports         BEFORE UPDATE ON mpq_tracker_supports         FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_mpq_tracker_teams            BEFORE UPDATE ON mpq_tracker_teams            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_mpq_tracker_quetes           BEFORE UPDATE ON mpq_tracker_quetes           FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_mpq_tracker_puzzle_gauntlet  BEFORE UPDATE ON mpq_tracker_puzzle_gauntlet  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
