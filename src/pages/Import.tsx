import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'
import { Upload, CheckSquare, Square, FileSpreadsheet, AlertCircle, CheckCircle, Loader } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Section {
  key: string
  label: string
  sheet: string
  description: string
}

interface ImportResult {
  section: string
  inserted: number
  skipped: number
  error?: string
}

type ImportStatus = 'idle' | 'loading' | 'done' | 'error'

// ── Config ────────────────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  { key: 'characters',    label: 'Personnages',       sheet: 'Characters',     description: 'Nom, étoiles, niveau' },
  { key: 'supports',      label: 'Supports',          sheet: 'Supports',       description: 'Nom, rang, niveau, effets' },
  { key: 'teams',         label: 'Équipes (actives)', sheet: 'Teams Database', description: 'Compositions avec builds & supports' },
  { key: 'teams_to_test', label: 'Équipes à tester',  sheet: 'Teams to Test',  description: 'Équipes communautaires' },
  { key: 'quetes',        label: 'Quêtes',            sheet: 'Quetes',         description: 'Compositions par quête' },
  { key: 'gauntlet',      label: 'Puzzle Gauntlet',   sheet: 'Puzzle Gauntlet',description: 'Solutions par node' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function clean(val: unknown): string | null {
  if (val === null || val === undefined) return null
  const s = String(val).trim()
  return s === '' || s === 'NaN' ? null : s
}

function parseBaseName(name: string): { base: string; version: string | null } {
  const m = name.match(/^(.+?)\s*\((.+)\)$/)
  return m ? { base: m[1].trim(), version: m[2].trim() } : { base: name, version: null }
}

function getRows(wb: XLSX.WorkBook, sheetName: string): unknown[][] | null {
  const ws = wb.Sheets[sheetName]
  if (!ws) return null
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }) as unknown[][]
}

// ── Importers ─────────────────────────────────────────────────────────────────

async function importCharacters(rows: unknown[][]): Promise<ImportResult> {
  const records: object[] = []
  for (const row of rows.slice(1)) {
    const name  = clean(row[0])
    const stars = row[1] ? Number(row[1]) : null
    const level = row[2] ? Number(row[2]) : null
    if (!name || name === 'Character' || !stars) continue
    const { base, version } = parseBaseName(name)
    records.push({ name, base_name: base, version, stars, level, status: 'rostered', ascended: false })
  }
  let inserted = 0, skipped = 0
  for (const rec of records) {
    const { error } = await supabase.from('characters').insert([rec])
    if (error) skipped++
    else inserted++
  }
  return { section: 'Personnages', inserted, skipped }
}

async function importSupports(rows: unknown[][]): Promise<ImportResult> {
  const records: object[] = []
  for (const row of rows.slice(1)) {
    const name = clean(row[0])
    if (!name || name === 'Support') continue
    records.push({
      name,
      rang:               row[1] ? Number(row[1]) : null,
      niveau:             row[2] ? Number(row[2]) : null,
      restriction:        clean(row[3]),
      mp_bonus:           clean(row[4]),
      degats_up:          clean(row[5]),
      degats_ennemis:     clean(row[6]),
      creation:           clean(row[7]),
      destruction_ennemi: clean(row[8]),
      fortification:      clean(row[9]),
      sante:              clean(row[10]),
      autre:              clean(row[11]),
      synergie:           clean(row[12]),
    })
  }
  let inserted = 0, skipped = 0
  for (const rec of records) {
    const { error } = await supabase.from('supports').insert([rec])
    if (error) skipped++
    else inserted++
  }
  return { section: 'Supports', inserted, skipped }
}

async function importTeams(rows: unknown[][], isActive: boolean): Promise<ImportResult> {
  const records: object[] = []
  for (const row of rows.slice(1)) {
    const name = clean(row[0])
    if (!name || name === 'Team Name' || name === 'Team') continue
    if (isActive) {
      records.push({
        name,
        left_character: clean(row[1]),  left_build: clean(row[2]),
        left_support:   clean(row[3]),  left_boost: clean(row[4]),
        mid_character:  clean(row[5]),  mid_build:  clean(row[6]),
        mid_support:    clean(row[7]),  mid_boost:  clean(row[8]),
        right_character: clean(row[9]), right_build: clean(row[10]),
        right_support:  clean(row[11]), right_boost: clean(row[12]),
        strategie:          clean(row[13]),
        ok_hard_nodes:      clean(row[14]),
        ok_cn_node:         clean(row[15]),
        all_3_non_boosted:  clean(row[16]),
        note_additionnelle: clean(row[17]),
        status: 'active',
      })
    } else {
      records.push({ name, note_additionnelle: clean(row[1]), status: 'to_test' })
    }
  }
  let inserted = 0, skipped = 0
  for (const rec of records) {
    const { error } = await supabase.from('teams').insert([rec])
    if (error) skipped++
    else inserted++
  }
  return { section: isActive ? 'Équipes actives' : 'Équipes à tester', inserted, skipped }
}

async function importQuetes(rows: unknown[][]): Promise<ImportResult> {
  const records: object[] = []
  for (const row of rows.slice(1)) {
    const nom = clean(row[0])
    if (!nom || nom === 'Quete') continue
    const slot = (val: unknown) => {
      const parts = (clean(val) ?? '').split('\n')
      return { char: parts[0] || null, build: parts[1] || null, support: parts[2] || null }
    }
    const g = slot(row[1]), m = slot(row[2]), d = slot(row[3])
    records.push({
      nom,
      gauche_personnage: g.char, gauche_build: g.build, gauche_support: g.support,
      milieu_personnage: m.char, milieu_build: m.build, milieu_support: m.support,
      droite_personnage: d.char, droite_build: d.build, droite_support: d.support,
      note: clean(row[4]),
    })
  }
  let inserted = 0, skipped = 0
  for (const rec of records) {
    const { error } = await supabase.from('quetes').insert([rec])
    if (error) skipped++
    else inserted++
  }
  return { section: 'Quêtes', inserted, skipped }
}

async function importGauntlet(rows: unknown[][]): Promise<ImportResult> {
  const records: object[] = []
  for (const row of rows.slice(1)) {
    const cat = clean(row[0])
    if (!cat || cat === 'Name') continue
    const slot = (val: unknown) => {
      const parts = (clean(val) ?? '').split('\n')
      return { char: parts[0] || null, build: parts[1] || null, support: parts[2] || null }
    }
    const g = slot(row[3]), m = slot(row[4]), d = slot(row[5])
    records.push({
      categorie: cat, node: clean(row[1]), condition_victoire: clean(row[2]),
      gauche_personnage: g.char, gauche_build: g.build, gauche_support: g.support,
      milieu_personnage: m.char, milieu_build: m.build, milieu_support: m.support,
      droite_personnage: d.char, droite_build: d.build, droite_support: d.support,
      equipe_utilisee: clean(row[6]), note: clean(row[7]),
    })
  }
  let inserted = 0, skipped = 0
  for (const rec of records) {
    const { error } = await supabase.from('puzzle_gauntlet').insert([rec])
    if (error) skipped++
    else inserted++
  }
  return { section: 'Puzzle Gauntlet', inserted, skipped }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Import() {
  const [file, setFile]         = useState<File | null>(null)
  const [selected, setSelected] = useState<Record<string, boolean>>(
    Object.fromEntries(SECTIONS.map(s => [s.key, true]))
  )
  const [status, setStatus]     = useState<ImportStatus>('idle')
  const [results, setResults]   = useState<ImportResult[]>([])
  const [dragging, setDragging] = useState(false)
  const inputRef                = useRef<HTMLInputElement>(null)

  const allSelected = SECTIONS.every(s => selected[s.key])
  const anySelected = SECTIONS.some(s => selected[s.key])

  function toggleAll() {
    setSelected(Object.fromEntries(SECTIONS.map(s => [s.key, !allSelected])))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f?.name.endsWith('.xlsx')) setFile(f)
  }

  async function runImport() {
    if (!file) return
    setStatus('loading')
    setResults([])

    try {
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer, { type: 'array' })
      const res: ImportResult[] = []

      const run = async (key: string, sheetName: string, fn: (rows: unknown[][]) => Promise<ImportResult>, label: string) => {
        if (!selected[key]) return
        const rows = getRows(wb, sheetName)
        if (rows) res.push(await fn(rows))
        else res.push({ section: label, inserted: 0, skipped: 0, error: `Feuille "${sheetName}" introuvable` })
      }

      await run('characters',    'Characters',     importCharacters,               'Personnages')
      await run('supports',      'Supports',       importSupports,                 'Supports')
      await run('teams',         'Teams Database', r => importTeams(r, true),      'Équipes actives')
      await run('teams_to_test', 'Teams to Test',  r => importTeams(r, false),     'Équipes à tester')
      await run('quetes',        'Quetes',         importQuetes,                   'Quêtes')
      await run('gauntlet',      'Puzzle Gauntlet',importGauntlet,                 'Puzzle Gauntlet')

      setResults(res)
      setStatus('done')
    } catch (err) {
      setResults([{ section: 'Erreur générale', inserted: 0, skipped: 0, error: String(err) }])
      setStatus('error')
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="page-title">Import Excel</h1>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
          dragging ? 'border-marvel-red bg-marvel-red/10'
          : file   ? 'border-green-600 bg-green-900/10'
                   : 'border-[#3D3D60] hover:border-[#8888AA]'
        }`}
      >
        <input ref={inputRef} type="file" accept=".xlsx" className="hidden"
          onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
        {file ? (
          <div className="space-y-1">
            <FileSpreadsheet size={32} className="mx-auto text-green-400" />
            <p className="font-semibold text-green-300">{file.name}</p>
            <p className="text-xs text-[#C8C8E0]">{(file.size / 1024).toFixed(0)} KB · Cliquer pour changer</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload size={32} className="mx-auto text-[#C8C8E0]" />
            <p className="text-white font-medium">Glisser-déposer ton fichier Excel ici</p>
            <p className="text-sm text-[#C8C8E0]">ou cliquer pour choisir · Format .xlsx uniquement</p>
          </div>
        )}
      </div>

      {/* Section checkboxes */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white">Sections à importer</h2>
          <button onClick={toggleAll} className="text-xs text-[#C8C8E0] hover:text-white flex items-center gap-1 transition-colors">
            {allSelected ? <CheckSquare size={14} /> : <Square size={14} />}
            {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
          </button>
        </div>
        <div className="space-y-1">
          {SECTIONS.map(s => (
            <button
              key={s.key} type="button"
              onClick={() => setSelected(prev => ({ ...prev, [s.key]: !prev[s.key] }))}
              className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-[#3D3D60]/40 transition-colors"
            >
              <span className={`shrink-0 transition-colors ${selected[s.key] ? 'text-marvel-red' : 'text-[#555]'}`}>
                {selected[s.key] ? <CheckSquare size={18} /> : <Square size={18} />}
              </span>
              <span className="flex-1">
                <span className={`text-sm font-medium block ${selected[s.key] ? 'text-white' : 'text-[#C8C8E0]'}`}>
                  {s.label}
                </span>
                <span className="text-xs text-[#555]">{s.description} · feuille «&nbsp;{s.sheet}&nbsp;»</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Launch button */}
      <button
        onClick={runImport}
        disabled={!file || !anySelected || status === 'loading'}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {status === 'loading'
          ? <><Loader size={16} className="animate-spin" /> Import en cours...</>
          : <><Upload size={16} /> Lancer l'import</>}
      </button>

      {/* Results */}
      {results.length > 0 && (
        <div className="card space-y-3">
          <h2 className="font-semibold text-white">Résultats</h2>
          {results.map((r, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${
              r.error ? 'bg-red-900/20 border border-red-800/40' : 'bg-[#1C1C2E]'
            }`}>
              {r.error
                ? <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
                : <CheckCircle size={16} className="text-green-400 mt-0.5 shrink-0" />}
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{r.section}</p>
                {r.error
                  ? <p className="text-xs text-red-400 mt-0.5">{r.error}</p>
                  : <p className="text-xs text-[#C8C8E0] mt-0.5">
                      <span className="text-green-400">{r.inserted} ajouté{r.inserted !== 1 ? 's' : ''}</span>
                      {r.skipped > 0 && <span className="ml-2 text-[#555]">{r.skipped} ignoré{r.skipped !== 1 ? 's' : ''} (déjà existants)</span>}
                    </p>}
              </div>
            </div>
          ))}
          {status === 'done' && results.every(r => !r.error) && (
            <p className="text-xs text-center text-[#C8C8E0] pt-1">
              ✅ Import terminé — les données sont visibles dans les autres pages
            </p>
          )}
        </div>
      )}
    </div>
  )
}
