-- ============================================================
-- MIGRATION — Pick a 3rd: core duos + 3rd characters
-- ============================================================

CREATE TABLE mpq_tracker_core_duos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT,
  left_character    TEXT, left_build    TEXT, left_support    TEXT, left_boost    TEXT, left_css    BOOLEAN NOT NULL DEFAULT FALSE, left_strategy  TEXT,
  right_character   TEXT, right_build   TEXT, right_support   TEXT, right_boost   TEXT, right_css   BOOLEAN NOT NULL DEFAULT FALSE, right_strategy TEXT,
  note_additionnelle TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mpq_tracker_core_duo_thirds (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  core_duo_id UUID REFERENCES mpq_tracker_core_duos(id) ON DELETE CASCADE,
  character   TEXT,
  build       TEXT,
  support     TEXT,
  boost       TEXT,
  css         BOOLEAN NOT NULL DEFAULT FALSE,
  strategy    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mpq_tracker_core_duos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE mpq_tracker_core_duo_thirds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_only" ON mpq_tracker_core_duos        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_only" ON mpq_tracker_core_duo_thirds  FOR ALL TO authenticated USING (true) WITH CHECK (true);
