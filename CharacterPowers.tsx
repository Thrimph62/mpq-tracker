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
  ascended: boolean   // indépendant du statut — un perso peut être ascended ET max_champ
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CharacterPower {
  id: string
  character_id: string
  power_name: string | null
  couleur: string | null   // Bleu, Rouge, Vert, Noir, Jaune, Violet
  cout: number | null
  effect_1_category: string | null; effect_1_detail: string | null
  effect_2_category: string | null; effect_2_detail: string | null
  effect_3_category: string | null; effect_3_detail: string | null
  effect_4_category: string | null; effect_4_detail: string | null
  effect_5_category: string | null; effect_5_detail: string | null
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
  effect_1_category: string | null
  effect_1_detail: string | null
  effect_2_category: string | null
  effect_2_detail: string | null
  effect_3_category: string | null
  effect_3_detail: string | null
  effect_4_category: string | null
  effect_4_detail: string | null
  effect_5_category: string | null
  effect_5_detail: string | null
  // Synergy
  synergy_restriction: string | null
  synergy_category: string | null
  synergy_detail: string | null
  created_at: string
  updated_at: string
}

export interface Team {
  id: string
  name: string
  left_character: string | null
  left_build: string | null
  left_support: string | null
  left_boost: string | null
  mid_character: string | null
  mid_build: string | null
  mid_support: string | null
  mid_boost: string | null
  right_character: string | null
  right_build: string | null
  right_support: string | null
  right_boost: string | null
  strategie: string | null
  ok_hard_nodes: string | null
  ok_cn_node: string | null
  all_3_non_boosted: string | null
  note_additionnelle: string | null
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
