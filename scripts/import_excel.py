"""
MPQ Tracker — Import Excel → Supabase
Usage:
  pip install pandas openpyxl supabase python-dotenv
  python scripts/import_excel.py MPQ.xlsx
"""

import sys
import os
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.environ["VITE_SUPABASE_URL"]
SUPABASE_KEY = os.environ["VITE_SUPABASE_ANON_KEY"]

def get_client() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def clean(val):
    if pd.isna(val): return None
    return str(val).strip() or None

import re

def parse_character_name(full_name: str) -> tuple[str, str | None]:
    """'Spider-Man (Classic)' → base='Spider-Man', version='Classic'"""
    m = re.match(r'^(.+?)\s*\((.+)\)$', full_name.strip())
    if m:
        return m.group(1).strip(), m.group(2).strip()
    return full_name.strip(), None

def import_characters(supabase: Client, df: pd.DataFrame):
    print("→ Import personnages...")
    records = []
    for _, row in df.iterrows():
        name = clean(row.iloc[0])
        if not name or name == "Character": continue
        stars = int(row.iloc[1]) if pd.notna(row.iloc[1]) else None
        level = int(row.iloc[2]) if pd.notna(row.iloc[2]) else None
        if not stars: continue
        base_name, version = parse_character_name(name)
        records.append({
            "name":      name,       # "Spider-Man (Classic)"
            "base_name": base_name,  # "Spider-Man"
            "version":   version,    # "Classic"
            "stars":     stars,
            "level":     level,
            "status":    "rostered",
        })
    if records:
        # Unique key is (name, stars) — upsert updates level/status if re-imported
        supabase.table("characters").upsert(records, on_conflict="name,stars").execute()
    print(f"  ✓ {len(records)} personnages importés")

def import_supports(supabase: Client, df: pd.DataFrame):
    print("→ Import supports...")
    records = []
    for _, row in df.iterrows():
        name = clean(row.iloc[0])
        if not name or name == "Support": continue
        records.append({
            "name":               name,
            "rang":               int(row.iloc[1]) if pd.notna(row.iloc[1]) else None,
            "niveau":             int(row.iloc[2]) if pd.notna(row.iloc[2]) else None,
            "restriction":        clean(row.iloc[3]),
            "mp_bonus":           clean(row.iloc[4]),
            "degats_up":          clean(row.iloc[5]),
            "degats_ennemis":     clean(row.iloc[6]),
            "creation":           clean(row.iloc[7]),
            "destruction_ennemi": clean(row.iloc[8]),
            "fortification":      clean(row.iloc[9]),
            "sante":              clean(row.iloc[10]),
            "autre":              clean(row.iloc[11]),
            "synergie":           clean(row.iloc[12]),
            "for_filter":         clean(row.iloc[13]),
        })
    if records:
        supabase.table("supports").upsert(records, on_conflict="name").execute()
    print(f"  ✓ {len(records)} supports importés")

def import_teams(supabase: Client, df: pd.DataFrame):
    print("→ Import équipes (Teams Database)...")
    records = []
    for _, row in df.iterrows():
        name = clean(row.iloc[0])
        if not name or name == "Team Name": continue
        records.append({
            "name":                name,
            "left_character":      clean(row.iloc[1]),
            "left_build":          clean(row.iloc[2]),
            "left_support":        clean(row.iloc[3]),
            "left_boost":          clean(row.iloc[4]),
            "mid_character":       clean(row.iloc[5]),
            "mid_build":           clean(row.iloc[6]),
            "mid_support":         clean(row.iloc[7]),
            "mid_boost":           clean(row.iloc[8]),
            "right_character":     clean(row.iloc[9]),
            "right_build":         clean(row.iloc[10]),
            "right_support":       clean(row.iloc[11]),
            "right_boost":         clean(row.iloc[12]),
            "strategie":           clean(row.iloc[13]),
            "ok_hard_nodes":       clean(row.iloc[14]),
            "ok_cn_node":          clean(row.iloc[15]),
            "all_3_non_boosted":   clean(row.iloc[16]),
            "note_additionnelle":  clean(row.iloc[17]),
            "status":              "active",
        })
    # Teams to Test (status = to_test) — sheet index 5
    if records:
        supabase.table("teams").upsert(records, on_conflict="name").execute()
    print(f"  ✓ {len(records)} équipes importées")

def import_teams_to_test(supabase: Client, df: pd.DataFrame):
    print("→ Import équipes à tester...")
    records = []
    for _, row in df.iterrows():
        name = clean(row.iloc[0])
        if not name or name == "Team": continue
        records.append({
            "name":               name,
            "note_additionnelle": clean(row.iloc[1]),
            "status":             "to_test",
        })
    if records:
        supabase.table("teams").upsert(records, on_conflict="name").execute()
    print(f"  ✓ {len(records)} équipes à tester importées")

def import_quetes(supabase: Client, df: pd.DataFrame):
    print("→ Import quêtes...")
    records = []
    for _, row in df.iterrows():
        nom = clean(row.iloc[0])
        if not nom or nom == "Quete": continue
        gauche = clean(row.iloc[1]) or ""
        parts_g = gauche.split("\n")
        milieu  = clean(row.iloc[2]) or ""
        parts_m = milieu.split("\n")
        droite  = clean(row.iloc[3]) or ""
        parts_d = droite.split("\n")
        records.append({
            "nom":               nom,
            "gauche_personnage": parts_g[0] if parts_g else None,
            "gauche_build":      parts_g[1] if len(parts_g) > 1 else None,
            "gauche_support":    parts_g[2] if len(parts_g) > 2 else None,
            "milieu_personnage": parts_m[0] if parts_m else None,
            "milieu_build":      parts_m[1] if len(parts_m) > 1 else None,
            "milieu_support":    parts_m[2] if len(parts_m) > 2 else None,
            "droite_personnage": parts_d[0] if parts_d else None,
            "droite_build":      parts_d[1] if len(parts_d) > 1 else None,
            "droite_support":    parts_d[2] if len(parts_d) > 2 else None,
            "note":              clean(row.iloc[4]),
        })
    if records:
        supabase.table("quetes").upsert(records, on_conflict="nom").execute()
    print(f"  ✓ {len(records)} quêtes importées")

def import_gauntlet(supabase: Client, df: pd.DataFrame):
    print("→ Import Puzzle Gauntlet...")
    records = []
    for _, row in df.iterrows():
        cat = clean(row.iloc[0])
        if not cat or cat == "Name": continue
        def split_slot(val):
            parts = (clean(val) or "").split("\n")
            return parts[0] or None, parts[1] if len(parts)>1 else None, parts[2] if len(parts)>2 else None
        lg, lb, ls = split_slot(row.iloc[3])
        mg, mb, ms = split_slot(row.iloc[4])
        rg, rb, rs = split_slot(row.iloc[5])
        records.append({
            "categorie":          cat,
            "node":               clean(row.iloc[1]),
            "condition_victoire": clean(row.iloc[2]),
            "gauche_personnage":  lg, "gauche_build": lb, "gauche_support": ls,
            "milieu_personnage":  mg, "milieu_build":  mb, "milieu_support":  ms,
            "droite_personnage":  rg, "droite_build":  rb, "droite_support":  rs,
            "equipe_utilisee":    clean(row.iloc[6]),
            "note":               clean(row.iloc[7]),
        })
    if records:
        supabase.table("puzzle_gauntlet").insert(records).execute()
    print(f"  ✓ {len(records)} nodes importées")

def main():
    path = sys.argv[1] if len(sys.argv) > 1 else "MPQ.xlsx"
    print(f"\n📂 Lecture de {path}...")
    xl = pd.ExcelFile(path)
    sheets = {s: pd.read_excel(path, sheet_name=s, header=None) for s in xl.sheet_names}

    supabase = get_client()
    print("✅ Connecté à Supabase\n")

    import_characters(supabase, sheets["Characters"])
    import_supports(supabase,   sheets["Supports"])
    import_teams(supabase,      sheets["Teams Database"])
    import_teams_to_test(supabase, sheets["Teams to Test"])
    import_quetes(supabase,     sheets["Quetes"])
    import_gauntlet(supabase,   sheets["Puzzle Gauntlet"])

    print("\n🎉 Import terminé !")

if __name__ == "__main__":
    main()
