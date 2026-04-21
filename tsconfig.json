-- ============================================================
-- MIGRATION — Refonte table character_powers
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- 1. Supprimer l'ancienne table (vide de toute façon)
DROP TABLE IF EXISTS character_powers;

-- 2. Recréer avec la nouvelle structure
CREATE TABLE character_powers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id    UUID REFERENCES characters(id) ON DELETE CASCADE,
  power_name      TEXT,
  couleur         TEXT,
  cout            INTEGER,
  effect_1_category TEXT, effect_1_detail TEXT,
  effect_2_category TEXT, effect_2_detail TEXT,
  effect_3_category TEXT, effect_3_detail TEXT,
  effect_4_category TEXT, effect_4_detail TEXT,
  effect_5_category TEXT, effect_5_detail TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_powers_character ON character_powers(character_id);
CREATE INDEX idx_powers_couleur   ON character_powers(couleur);

-- 3. RLS
ALTER TABLE character_powers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_only" ON character_powers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Auto-update trigger
CREATE TRIGGER trg_character_powers
  BEFORE UPDATE ON character_powers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
