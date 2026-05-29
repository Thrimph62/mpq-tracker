export type Stars = 1 | 2 | 3 | 4 | 5 | 6

export type CharacterStatus =
  | 'max_champ'
  | 'champ'
  | 'rostered'
  | 'not_owned'

export type TeamStatus = 'active' | 'to_test' | 'archived'

export type PowerColor = 'Bleu' | 'Rouge' | 'Vert' | 'Noir' | 'Jaune' | 'Violet'

export interface Character {
  id: string
  name: string
  base_name: string
  version: string | null
  stars: Stars
  level: number | null
  status: CharacterStatus | null
  ascended: boolean
  is_duplicate: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CharacterPower {
  id: string
  character_id: string
  power_name: string | null
  couleur: string | null
  position: number | null
  description: string | null
  // Up to 4 effects — each with its own MP cost + category/sub chain
  effect_1_cout: number | null; effect_1_category: string | null; effect_1_sous_category: string | null; effect_1_sous_category_2: string | null; effect_1_sous_category_3: string | null
  effect_2_cout: number | null; effect_2_category: string | null; effect_2_sous_category: string | null; effect_2_sous_category_2: string | null; effect_2_sous_category_3: string | null
  effect_3_cout: number | null; effect_3_category: string | null; effect_3_sous_category: string | null; effect_3_sous_category_2: string | null; effect_3_sous_category_3: string | null
  effect_4_cout: number | null; effect_4_category: string | null; effect_4_sous_category: string | null; effect_4_sous_category_2: string | null; effect_4_sous_category_3: string | null
  created_at: string
  updated_at: string
}

export interface Support {
  id: string
  name: string
  rang: number | null
  niveau: number | null
  restriction: string | null
  // Effects 1–5
  effect_1_description: string | null; effect_1_category: string | null; effect_1_sous_category: string | null; effect_1_sous_category_2: string | null; effect_1_sous_category_3: string | null; effect_1_degats: string | null; effect_1_quantite: string | null; effect_1_force: string | null; effect_1_choix: string | null; effect_1_autre: string | null; effect_1_trigger: string | null
  effect_2_description: string | null; effect_2_category: string | null; effect_2_sous_category: string | null; effect_2_sous_category_2: string | null; effect_2_sous_category_3: string | null; effect_2_degats: string | null; effect_2_quantite: string | null; effect_2_force: string | null; effect_2_choix: string | null; effect_2_autre: string | null; effect_2_trigger: string | null
  effect_3_description: string | null; effect_3_category: string | null; effect_3_sous_category: string | null; effect_3_sous_category_2: string | null; effect_3_sous_category_3: string | null; effect_3_degats: string | null; effect_3_quantite: string | null; effect_3_force: string | null; effect_3_choix: string | null; effect_3_autre: string | null; effect_3_trigger: string | null
  effect_4_description: string | null; effect_4_category: string | null; effect_4_sous_category: string | null; effect_4_sous_category_2: string | null; effect_4_sous_category_3: string | null; effect_4_degats: string | null; effect_4_quantite: string | null; effect_4_force: string | null; effect_4_choix: string | null; effect_4_autre: string | null; effect_4_trigger: string | null
  effect_5_description: string | null; effect_5_category: string | null; effect_5_sous_category: string | null; effect_5_sous_category_2: string | null; effect_5_sous_category_3: string | null; effect_5_degats: string | null; effect_5_quantite: string | null; effect_5_force: string | null; effect_5_choix: string | null; effect_5_autre: string | null; effect_5_trigger: string | null
  // Synergy
  synergy_restriction: string | null
  synergy_description: string | null; synergy_category: string | null; synergy_sous_category: string | null; synergy_sous_category_2: string | null; synergy_sous_category_3: string | null; synergy_degats: string | null; synergy_quantite: string | null; synergy_force: string | null; synergy_choix: string | null; synergy_autre: string | null; synergy_trigger: string | null
  created_at: string
  updated_at: string
}

export interface Team {
  id: string
  name: string
  is_template: boolean
  template_name: string | null
  left_character: string | null;  left_build: string | null;  left_support: string | null;  left_boost: string | null;  left_css: boolean;  left_strategy: string | null
  mid_character: string | null;   mid_build: string | null;   mid_support: string | null;   mid_boost: string | null;   mid_css: boolean;   mid_strategy: string | null
  right_character: string | null; right_build: string | null; right_support: string | null; right_boost: string | null; right_css: boolean; right_strategy: string | null
  strategie: string | null
  winfinite: string | null
  hn1: string | null
  hn2: string | null
  hn3: string | null
  cn: string | null
  all_3_non_boosted: string | null
  note_additionnelle: string | null
  favorite: boolean
  status: TeamStatus
  created_at: string
  updated_at: string
}

export interface Quete {
  id: string
  nom: string
  gauche_personnage: string | null
  gauche_build: string | null
  gauche_support: string | null
  milieu_personnage: string | null
  milieu_build: string | null
  milieu_support: string | null
  droite_personnage: string | null
  droite_build: string | null
  droite_support: string | null
  note: string | null
  created_at: string
  updated_at: string
}

export interface PuzzleGauntlet {
  id: string
  categorie: string | null
  node: string | null
  condition_victoire: string | null
  gauche_personnage: string | null
  gauche_build: string | null
  gauche_support: string | null
  milieu_personnage: string | null
  milieu_build: string | null
  milieu_support: string | null
  droite_personnage: string | null
  droite_build: string | null
  droite_support: string | null
  equipe_utilisee: string | null
  note: string | null
  created_at: string
  updated_at: string
}

export interface RosterSummary {
  stars:     Stars
  max_champ: number
  champ:     number
  rostered:  number
  not_owned: number
  ascended:  number   // indépendant du statut — cumul par tier
}
