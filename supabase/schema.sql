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
CREATE TABLE characters (
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
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (name, stars)
);

CREATE INDEX idx_characters_stars     ON characters(stars);
CREATE INDEX idx_characters_status    ON characters(status);
CREATE INDEX idx_characters_ascended  ON characters(ascended);
CREATE INDEX idx_characters_name      ON characters(name);
CREATE INDEX idx_characters_base_name ON characters(base_name);

-- ────────────────────────────────────────────────
-- CHARACTER POWERS
-- ────────────────────────────────────────────────
CREATE TABLE character_powers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id        UUID REFERENCES characters(id) ON DELETE CASCADE,
  couleur             TEXT,   -- Bleu, Rouge, Vert, Noir, Jaune, Violet
  cout                INTEGER,
  mp                  TEXT,
  degats              TEXT,
  creation            TEXT,
  destruction         TEXT,
  conversion_gemmes   TEXT,
  paralysie           TEXT,
  sante               TEXT,
  fortification       TEXT,
  autre               TEXT,
  special_tile_icon   TEXT,
  special_tile_name   TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_powers_character ON character_powers(character_id);

-- ────────────────────────────────────────────────
-- SUPPORTS
-- ────────────────────────────────────────────────
CREATE TABLE supports (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  rang                INTEGER,
  niveau              INTEGER,
  restriction         TEXT,   -- Héros, Vilains, /
  mp_bonus            TEXT,
  degats_up           TEXT,
  degats_ennemis      TEXT,
  creation            TEXT,
  destruction_ennemi  TEXT,
  fortification       TEXT,
  sante               TEXT,
  autre               TEXT,
  synergie            TEXT,
  for_filter          TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_supports_name ON supports(name);

-- ────────────────────────────────────────────────
-- TEAMS
-- ────────────────────────────────────────────────
CREATE TABLE teams (
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

CREATE INDEX idx_teams_status ON teams(status);

-- ────────────────────────────────────────────────
-- QUÊTES
-- ────────────────────────────────────────────────
CREATE TABLE quetes (
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
CREATE TABLE puzzle_gauntlet (
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

CREATE INDEX idx_gauntlet_categorie ON puzzle_gauntlet(categorie);

-- ────────────────────────────────────────────────
-- ROW LEVEL SECURITY — Solo user (auth.uid check)
-- ────────────────────────────────────────────────
ALTER TABLE characters       ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_powers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supports         ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams            ENABLE ROW LEVEL SECURITY;
ALTER TABLE quetes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE puzzle_gauntlet  ENABLE ROW LEVEL SECURITY;

-- Allow full access only to authenticated users
CREATE POLICY "auth_only" ON characters       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_only" ON character_powers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_only" ON supports         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_only" ON teams            FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_only" ON quetes           FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_only" ON puzzle_gauntlet  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ────────────────────────────────────────────────
-- AUTO-UPDATE updated_at
-- ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_characters       BEFORE UPDATE ON characters       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_supports         BEFORE UPDATE ON supports         FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_teams            BEFORE UPDATE ON teams            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_quetes           BEFORE UPDATE ON quetes           FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_puzzle_gauntlet  BEFORE UPDATE ON puzzle_gauntlet  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
