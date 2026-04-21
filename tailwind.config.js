# MPQ Tracker 🦸

Application web pour tracker ton roster, tes équipes, supports et stratégies Marvel Puzzle Quest.

**Stack :** React 18 + TypeScript + Vite · Supabase (BDD + Auth) · Tailwind CSS (dark Marvel theme)

---

## 📁 Structure du projet

```
mpq-tracker/
├── supabase/
│   └── schema.sql          ← Schéma SQL à coller dans Supabase
├── scripts/
│   └── import_excel.py     ← Import automatique depuis ton Excel
├── src/
│   ├── components/         ← Composants réutilisables
│   ├── hooks/              ← useAuth
│   ├── lib/                ← Client Supabase
│   ├── pages/              ← Dashboard, Characters, Teams, Supports, Quêtes, Gauntlet
│   └── types/              ← Types TypeScript
├── .env.example
├── package.json
└── README.md
```

---

## 🚀 Mise en place — Étape par étape

### Étape 1 — Créer ton projet Supabase

1. Va sur [supabase.com](https://supabase.com) → **New project**
2. Donne-lui un nom (ex: `mpq-tracker`) et un mot de passe fort
3. Attends que le projet démarre (~1 min)

### Étape 2 — Créer le schéma de base de données

1. Dans Supabase → **SQL Editor** → **New query**
2. Copie-colle tout le contenu de `supabase/schema.sql`
3. Clique **Run** — tu dois voir "Success"
4. Vérifie dans **Table Editor** que les 6 tables sont créées :
   - `characters`, `character_powers`, `supports`, `teams`, `quetes`, `puzzle_gauntlet`

### Étape 3 — Récupérer tes clés Supabase

1. Dans Supabase → **Settings** → **API**
2. Copie :
   - **Project URL** → `https://xxxx.supabase.co`
   - **anon public key** → `eyJxxx...`

### Étape 4 — Configurer l'environnement

```bash
cp .env.example .env
```

Édite `.env` avec tes clés :

```
VITE_SUPABASE_URL=https://TONPROJET.supabase.co
VITE_SUPABASE_ANON_KEY=eyJTACLÉPUBLIQUE
```

### Étape 5 — Créer ton compte utilisateur Supabase

1. Dans Supabase → **Authentication** → **Users** → **Add user**
2. Rentre ton email et un mot de passe
3. C'est le compte que tu utiliseras pour te connecter à l'app

### Étape 6 — Installer et lancer l'app

```bash
npm install
npm run dev
```

Ouvre [http://localhost:5173](http://localhost:5173) — connecte-toi avec l'email/mot de passe créé à l'étape 5.

---

## 📥 Import depuis ton Excel

### Prérequis Python

```bash
pip install pandas openpyxl supabase python-dotenv
```

### Lancer l'import

Assure-toi que ton `.env` est configuré, puis :

```bash
python scripts/import_excel.py MPQ.xlsx
```

L'import va charger automatiquement :
- ✅ Tous tes personnages (Characters)
- ✅ Tous tes supports (Supports)
- ✅ Toutes tes équipes (Teams Database + Teams to Test)
- ✅ Toutes tes quêtes (Quêtes)
- ✅ Tous les nodes Puzzle Gauntlet

> ⚠️ Les pouvoirs (Characters Powers) sont à saisir manuellement dans l'app car la structure du sheet est complexe.

---

## 🌐 Déploiement

### Option A — Vercel (recommandé, le plus simple)

```bash
npm install -g vercel
vercel
```

Vercel détecte automatiquement Vite. Ajoute tes variables d'environnement dans **Settings → Environment Variables**.

### Option B — Netlify

```bash
npm run build
# Drag & drop le dossier dist/ sur netlify.com
```

Configure les variables d'environnement dans **Site settings → Environment variables**.

### Option C — GitHub Pages

1. Dans `vite.config.ts`, ajoute `base: '/nom-du-repo/'`
2. Installe `gh-pages` : `npm install -D gh-pages`
3. Ajoute dans `package.json` :
   ```json
   "scripts": {
     "deploy": "npm run build && gh-pages -d dist"
   }
   ```
4. Lance : `npm run deploy`

> ⚠️ Avec GitHub Pages, crée un fichier `public/404.html` identique à `index.html` pour que le routing React fonctionne.

---

## 📱 Pages & Fonctionnalités

| Page | Fonctionnalités |
|------|-----------------|
| **Tableau de Bord** | Résumé roster par tier (★), KPIs, derniers modifiés |
| **Personnages** | Liste filtrable (★, statut, recherche), CRUD complet |
| **Équipes** | Tabs Actives / À Tester, affichage slots L/M/D, stratégies, CRUD |
| **Supports** | Filtrable par restriction, détail effets, synergies, CRUD |
| **Quêtes** | Compositions par quête avec stratégie, CRUD |
| **Puzzle Gauntlet** | Groupé par catégorie, condition de victoire, stratégie, CRUD |

---

## 🔮 Évolutions futures faciles à ajouter

Grâce à la structure Supabase, tout est extensible :

- **Nouveaux personnages** → Ajouter une ligne dans `characters`
- **Nouveau mode de jeu** → Créer une nouvelle table + page React
- **Statistiques** → Vue SQL ou page dédiée
- **Partage alliance** → Ajouter un champ `shared: boolean` + RLS par `user_id`
- **Images persos** → Supabase Storage pour les avatars
- **Backup** → Export SQL depuis Supabase à tout moment

---

## 🛠️ Commandes utiles

```bash
npm run dev      # Démarrer en local
npm run build    # Build de production
npm run preview  # Prévisualiser le build
```

---

*MPQ Tracker — Fait pour un joueur exigeant 🎮*
