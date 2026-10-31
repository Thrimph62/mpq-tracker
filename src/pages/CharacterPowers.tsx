import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchAll } from '../lib/fetchAll'
import { Character, CharacterPower, Stars } from '../types'
import { StarBadge } from '../components/Badges'
import { SearchDropdown, toCharacterOptions } from '../components/SearchDropdown'
import { EffectDisplay, EffectForm, EffectData } from '../components/EffectFields'
import { Plus, Search, X, Pencil, Trash2, ChevronDown, ChevronUp, List, LayoutGrid, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

// ── Constants ─────────────────────────────────────────────────────────────────
// Alphabetical order
const COULEURS = ['Black', 'Blue', 'Green', 'Purple', 'Red', 'Yellow'] as const
type Couleur = typeof COULEURS[number]

const COULEUR_STYLES: Record<Couleur, string> = {
  Black:  'bg-gray-600   text-white',
  Blue:   'bg-blue-600   text-white',
  Green:  'bg-green-600  text-white',
  Purple: 'bg-purple-600 text-white',
  Red:    'bg-red-600    text-white',
  Yellow: 'bg-yellow-500 text-black',
}
const COULEUR_BORDER: Record<Couleur, string> = {
  Black:  'border-gray-600',   Blue:   'border-blue-700',
  Green:  'border-green-700',  Purple: 'border-purple-700',
  Red:    'border-red-700',    Yellow: 'border-yellow-600',
}

const EFFECTS = [1, 2, 3, 4, 5, 6, 7, 8] as const
type EffectNum = typeof EFFECTS[number]

const EMPTY: Omit<CharacterPower, 'id' | 'created_at' | 'updated_at'> = {
  character_id: '', power_name: null, couleur: null, position: null, description: null,
  effect_1_cout: null, effect_1_category: null, effect_1_sous_category: null, effect_1_sous_category_2: null, effect_1_sous_category_3: null,
  effect_2_cout: null, effect_2_category: null, effect_2_sous_category: null, effect_2_sous_category_2: null, effect_2_sous_category_3: null,
  effect_3_cout: null, effect_3_category: null, effect_3_sous_category: null, effect_3_sous_category_2: null, effect_3_sous_category_3: null,
  effect_4_cout: null, effect_4_category: null, effect_4_sous_category: null, effect_4_sous_category_2: null, effect_4_sous_category_3: null,
  effect_5_cout: null, effect_5_category: null, effect_5_sous_category: null, effect_5_sous_category_2: null, effect_5_sous_category_3: null,
  effect_6_cout: null, effect_6_category: null, effect_6_sous_category: null, effect_6_sous_category_2: null, effect_6_sous_category_3: null,
  effect_7_cout: null, effect_7_category: null, effect_7_sous_category: null, effect_7_sous_category_2: null, effect_7_sous_category_3: null,
  effect_8_cout: null, effect_8_category: null, effect_8_sous_category: null, effect_8_sous_category_2: null, effect_8_sous_category_3: null,
}

type ViewMode = 'table' | 'byCharacter'
type SortCol  = 'character' | 'power_name' | 'couleur' | 'position'
type SortDir  = 'asc' | 'desc'

// ── Helpers ───────────────────────────────────────────────────────────────────
function CouleurBadge({ couleur }: { couleur: string | null }) {
  if (!couleur) return null
  return <span className={`badge font-semibold ${COULEUR_STYLES[couleur as Couleur] ?? 'bg-gray-700 text-white'}`}>{couleur}</span>
}

function SortIcon({ col, current, dir }: { col: SortCol; current: SortCol; dir: SortDir }) {
  if (col !== current) return <ArrowUpDown size={10} className="opacity-30" />
  return dir === 'asc' ? <ArrowUp size={10} className="text-marvel-gold" /> : <ArrowDown size={10} className="text-marvel-gold" />
}

function getEffectData(p: CharacterPower, n: EffectNum): EffectData {
  return {
    description:     null,  // Powers use a single description field, not per-effect
    category:        p[`effect_${n}_category`]        as string | null,
    sous_category:   p[`effect_${n}_sous_category`]   as string | null,
    sous_category_2: p[`effect_${n}_sous_category_2`] as string | null,
    sous_category_3: p[`effect_${n}_sous_category_3`] as string | null,
    degats: null, quantite: null, force: null, choix: null, autre: null, trigger: null,
  }
}

function getFormEffectData(form: typeof EMPTY, n: EffectNum): EffectData {
  return {
    description:     null,
    category:        form[`effect_${n}_category`],
    sous_category:   form[`effect_${n}_sous_category`],
    sous_category_2: form[`effect_${n}_sous_category_2`],
    sous_category_3: form[`effect_${n}_sous_category_3`],
    degats: null, quantite: null, force: null, choix: null, autre: null, trigger: null,
  }
}

const EFFECT_FIELDS = ['cout', 'category', 'sous_category', 'sous_category_2', 'sous_category_3'] as const

function hasEffect(f: typeof EMPTY, n: EffectNum) {
  return EFFECT_FIELDS.some(x => (f as any)[`effect_${n}_${x}`] != null)
}

// Defined at module level so React keeps them mounted between renders
function Th({ col, label, sortCol, sortDir, onSort }: {
  col: SortCol; label: string; sortCol: SortCol; sortDir: SortDir; onSort: (c: SortCol) => void
}) {
  return (
    <th className="py-2 px-2 font-normal text-center">
      <button onClick={() => onSort(col)}
        className={`flex items-center gap-0.5 mx-auto hover:text-white transition-colors ${sortCol === col ? 'text-marvel-gold' : 'text-[#C8C8E0]'}`}>
        {label}<SortIcon col={col} current={sortCol} dir={sortDir} />
      </button>
    </th>
  )
}

function PowerCard({ p, onEdit, onRemove }: {
  p: CharacterPower; onEdit: (p: CharacterPower) => void; onRemove: (id: string) => void
}) {
  return (
    <div className="bg-[#1C1C2E] rounded-lg p-3 flex items-start gap-3 group">
      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {p.position   && <span className="badge bg-[#3D3D60] text-[#C8C8E0] border border-[#52527A] text-xs">#{p.position}</span>}
          {p.couleur    && <CouleurBadge couleur={p.couleur} />}
          {p.power_name && <p className="text-sm font-semibold text-white">{p.power_name}</p>}
        </div>
        {p.description && (
          <p className="text-xs text-[#C8C8E0] leading-relaxed border-l-2 border-[#3D3D60] pl-2 italic whitespace-pre-line">{p.description}</p>
        )}
        {EFFECTS.map(n => {
          const cout = p[`effect_${n}_cout`] as number | null
          const d    = getEffectData(p, n)
          if (!cout && !d.category && !d.sous_category && !d.sous_category_2 && !d.sous_category_3) return null
          return <EffectDisplay key={n} {...d} cout={cout} simplified />
        })}
      </div>
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={() => onEdit(p)} className="text-[#C8C8E0] hover:text-white"><Pencil size={13} /></button>
        <button onClick={() => onRemove(p.id)} className="text-[#C8C8E0] hover:text-red-400"><Trash2 size={13} /></button>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CharacterPowers() {
  const [powers, setPowers]         = useState<CharacterPower[]>([])
  const [characters, setCharacters] = useState<Character[]>([])  // all of them, duplicates included
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)      // page banner
  const [formError, setFormError]   = useState<string | null>(null)      // inside the modal
  const [search, setSearch]         = useState('')
  const [filterCouleur, setFilterCouleur]   = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [viewMode, setViewMode]     = useState<ViewMode>('byCharacter')
  const [sortCol, setSortCol]       = useState<SortCol>('character')
  const [sortDir, setSortDir]       = useState<SortDir>('asc')
  const [expanded, setExpanded]     = useState<string | null>(null)
  const [modal, setModal]           = useState<'add' | 'edit' | null>(null)
  const [form, setForm]             = useState<typeof EMPTY>(EMPTY)
  const [editId, setEditId]         = useState<string | null>(null)
  const [saving, setSaving]         = useState(false)
  const [shown, setShown]           = useState(1)   // effects visible in the modal

  async function load() {
    try {
      const [pw, ch] = await Promise.all([
        fetchAll<CharacterPower>('mpq_tracker_character_powers', ['position', 'id']),
        fetchAll<Character>('mpq_tracker_characters', ['base_name', 'version', 'id']),
      ])
      setPowers(pw); setCharacters(ch); setError(null)
    } catch (e: any) {
      setError(e?.message ?? String(e))
    }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  // cm: any character id (original OR duplicate) → its current original, i.e. the
  // non-duplicate with the same name. Powers of a duplicate show under the original.
  const { cm, origs } = useMemo(() => {
    const origs = characters.filter(c => !c.is_duplicate)
    const byName: Record<string, Character> = {}
    origs.forEach(c => { byName[c.name] = c })
    const cm: Record<string, Character> = {}
    characters.forEach(c => { cm[c.id] = byName[c.name] ?? c })
    return { cm, origs }
  }, [characters])

  const charOptions = useMemo(() => toCharacterOptions(origs), [origs])

  const { allCategories, categoryMap, sousMap, sousMap2 } = useMemo(() => {
    const cats = new Set<string>()
    const categoryMap: Record<string, string[]> = {}  // category → sous_categories
    const sousMap:     Record<string, string[]> = {}  // sous_category → sous_category_2
    const sousMap2:    Record<string, string[]> = {}  // sous_category_2 → sous_category_3
    const link = (m: Record<string, string[]>, k: string | null, v: string | null) => {
      if (!k || !v) return
      const a = m[k] ?? (m[k] = [])
      if (!a.includes(v)) a.push(v)
    }
    for (const p of powers) for (const n of EFFECTS) {
      const c  = p[`effect_${n}_category`]        as string | null
      const s1 = p[`effect_${n}_sous_category`]   as string | null
      const s2 = p[`effect_${n}_sous_category_2`] as string | null
      const s3 = p[`effect_${n}_sous_category_3`] as string | null
      if (c) cats.add(c)
      link(categoryMap, c, s1); link(sousMap, s1, s2); link(sousMap2, s2, s3)
    }
    ;[categoryMap, sousMap, sousMap2].forEach(m => Object.values(m).forEach(a => a.sort()))
    return { allCategories: [...cats].sort(), categoryMap, sousMap, sousMap2 }
  }, [powers])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return powers.filter(p => {
      const ch  = cm[p.character_id]
      const aff = ch?.affiliations
      const matchSearch = !q || [
        ch?.name, p.power_name, p.couleur, p.description,
        ...(Array.isArray(aff) ? aff : []),
        ...EFFECTS.flatMap(n => [
          p[`effect_${n}_category`], p[`effect_${n}_sous_category`],
          p[`effect_${n}_sous_category_2`], p[`effect_${n}_sous_category_3`],
        ]),
      ].some(v => v && String(v).toLowerCase().includes(q))
      const matchCouleur  = !filterCouleur  || p.couleur === filterCouleur
      const matchCategory = !filterCategory || EFFECTS.some(n => p[`effect_${n}_category`] === filterCategory)
      return matchSearch && matchCouleur && matchCategory
    })
  }, [powers, cm, search, filterCouleur, filterCategory])

  function toggleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const sortedFiltered = useMemo(() => [...filtered].sort((a, b) => {
    let va: string | number, vb: string | number
    if      (sortCol === 'character')  { va = cm[a.character_id]?.name?.toLowerCase() ?? ''; vb = cm[b.character_id]?.name?.toLowerCase() ?? '' }
    else if (sortCol === 'power_name') { va = a.power_name?.toLowerCase() ?? ''; vb = b.power_name?.toLowerCase() ?? '' }
    else if (sortCol === 'couleur')    { va = a.couleur?.toLowerCase() ?? ''; vb = b.couleur?.toLowerCase() ?? '' }
    else                               { va = a.position ?? 99; vb = b.position ?? 99 }
    if (va < vb) return sortDir === 'asc' ? -1 : 1
    if (va > vb) return sortDir === 'asc' ? 1 : -1
    return (a.position ?? 99) - (b.position ?? 99)
  }), [filtered, cm, sortCol, sortDir])

  // Group by original character, alphabetical; powers inside each group sorted by position
  const groupedEntries = useMemo(() => {
    const g: Record<string, CharacterPower[]> = {}
    filtered.forEach(p => {
      const k = cm[p.character_id]?.id ?? p.character_id
      ;(g[k] = g[k] ?? []).push(p)
    })
    return Object.entries(g)
      .map(([id, list]) => [id, list.sort((a, b) => (a.position ?? 99) - (b.position ?? 99))] as [string, CharacterPower[]])
      .sort((a, b) => {
        const na = cm[a[0]]?.name?.toLowerCase() ?? '', nb = cm[b[0]]?.name?.toLowerCase() ?? ''
        return na < nb ? -1 : na > nb ? 1 : 0
      })
  }, [filtered, cm])

  function openAdd(characterId?: string) {
    setForm({ ...EMPTY, character_id: characterId ?? '' }); setEditId(null); setShown(1); setModal('add')
  }
  function openEdit(p: CharacterPower) {
    const { id, created_at, updated_at, ...rest } = p
    // a power sitting on a duplicate moves to the original when saved
    setForm({ ...rest, character_id: cm[p.character_id]?.id ?? p.character_id }); setEditId(p.id)
    setShown(Math.max(1, ...EFFECTS.filter(n => hasEffect(rest, n))))  // show every filled effect
    setModal('edit')
  }
  function closeModal() { setModal(null); setEditId(null); setFormError(null) }

  function setEffect(n: EffectNum, field: keyof EffectData, val: string | null) {
    setForm(f => ({ ...f, [`effect_${n}_${field}`]: val }))
  }

  // Remove effect n: the following ones shift up (3 becomes 2...), the last one is emptied
  function removeEffect(n: number) {
    setForm(f => {
      const g: any = { ...f }
      for (let k = n; k <= EFFECTS.length; k++)
        for (const x of EFFECT_FIELDS) g[`effect_${k}_${x}`] = k < EFFECTS.length ? g[`effect_${k + 1}_${x}`] : null
      return g
    })
    setShown(s => Math.max(1, s - 1))
  }

  async function save() {
    if (!form.character_id) return
    setSaving(true); setFormError(null)
    const t = supabase.from('mpq_tracker_character_powers')
    const { error } = modal === 'add'
      ? await t.insert([form])
      : await t.update({ ...form, updated_at: new Date().toISOString() }).eq('id', editId!)
    if (error) { setFormError(error.message); setSaving(false); return }  // modal stays open, input kept
    await load(); closeModal(); setSaving(false)
  }

  async function remove(id: string) {
    if (!confirm('Delete this power?')) return
    const { error } = await supabase.from('mpq_tracker_character_powers').delete().eq('id', id)
    if (error) { setError(error.message); return }  // row stays on screen
    setPowers(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Powers</h1>
        <button onClick={() => openAdd()} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add</button>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-900/40 border border-red-700 text-red-200 text-sm rounded-lg px-3 py-2">
          <span className="flex-1">{error}</span>
          <button onClick={() => { setLoading(true); load() }} className="underline hover:text-white">Retry</button>
          <button onClick={() => setError(null)} aria-label="Dismiss"><X size={14} /></button>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C8C8E0]" />
          <input className="input pl-9" placeholder="Search character, power, description, effect..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={filterCouleur} onChange={e => setFilterCouleur(e.target.value)}>
          <option value="">All colors</option>
          {COULEURS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="input w-auto" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="">All effects</option>
          {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex gap-1 bg-[#1E1E38] p-1 rounded-lg">
          <button onClick={() => setViewMode('byCharacter')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'byCharacter' ? 'bg-marvel-red text-white' : 'text-[#C8C8E0] hover:text-white'}`}>
            <LayoutGrid size={13} /> By character
          </button>
          <button onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'table' ? 'bg-marvel-red text-white' : 'text-[#C8C8E0] hover:text-white'}`}>
            <List size={13} /> Table
          </button>
        </div>
      </div>

      <p className="text-sm text-[#C8C8E0]">{filtered.length} power{filtered.length !== 1 ? 's' : ''}</p>

      {loading ? <Spinner /> : viewMode === 'byCharacter' ? (
        /* ── BY CHARACTER — alphabetical, powers sorted by position ── */
        <div className="space-y-2">
          {groupedEntries.map(([charId, charPowers]) => {
            const char       = cm[charId]
            const isOpen     = expanded === charId
            const byCouleur  = charPowers.reduce<Record<string, CharacterPower[]>>((acc, p) => {
              const key = p.couleur ?? 'Unknown'; acc[key] = acc[key] ?? []; acc[key].push(p); return acc
            }, {})

            return (
              <div key={charId} className="card">
                {/* Two sibling buttons: expand area + "+ Power" (no nested buttons) */}
                <div className="flex items-center gap-3">
                  <button onClick={() => setExpanded(isOpen ? null : charId)} aria-expanded={isOpen}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left group">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {char && <StarBadge stars={char.stars as Stars} />}
                        <span className="font-semibold text-white group-hover:text-marvel-gold transition-colors">{char?.name ?? charId}</span>
                        <span className="text-xs text-[#C8C8E0]">({charPowers.length} power{charPowers.length !== 1 ? 's' : ''})</span>
                      </div>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {Object.keys(byCouleur).map(col => (
                          <span key={col} className={`badge text-xs ${COULEUR_STYLES[col as Couleur] ?? 'bg-gray-700 text-white'}`}>
                            {col} ({byCouleur[col].length})
                          </span>
                        ))}
                      </div>
                    </div>
                    {isOpen ? <ChevronUp size={14} className="text-[#C8C8E0]" /> : <ChevronDown size={14} className="text-[#C8C8E0]" />}
                  </button>
                  <button onClick={() => openAdd(charId)}
                    className="shrink-0 text-xs bg-[#3D3D60] hover:bg-marvel-red/40 text-[#C8C8E0] hover:text-white px-2 py-1 rounded transition-all">
                    + Power
                  </button>
                </div>

                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-[#3D3D60] space-y-2">
                    {charPowers.map(p => (
                      <PowerCard key={p.id} p={p} onEdit={openEdit} onRemove={remove} />
                    ))}
                    {/* Affiliations at the bottom */}
                    {([...(Array.isArray(char?.affiliations) ? char.affiliations : [])].sort()).length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-2 border-t border-[#3D3D60]/50">
                        <span className="text-xs text-[#C8C8E0] mr-1">Affiliations:</span>
                        {([...(Array.isArray(char?.affiliations) ? char.affiliations : [])].sort()).map(a => (
                          <span key={a} className="badge text-xs bg-teal-900/40 text-teal-300 border border-teal-700">{a}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
          {groupedEntries.length === 0 && <div className="card text-center text-[#C8C8E0] py-12">No powers found</div>}
        </div>
      ) : (
        /* ── TABLE VIEW ── */
        <div className="card overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#3D3D60]">
                <Th col="character"  label="Character"  sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                <Th col="position"   label="Pos."       sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                <Th col="power_name" label="Power name" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                <Th col="couleur"    label="Color"      sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                <th className="py-2 px-2 font-normal text-left text-[#C8C8E0] min-w-40">Description</th>
                {EFFECTS.map(n => <th key={n} className="py-2 px-1 font-normal text-center text-[#C8C8E0] min-w-28">Effect {n}</th>)}
                <th className="py-2 px-2 font-normal text-center text-[#C8C8E0] sticky right-0 bg-[#252540] z-10">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedFiltered.map(p => (
                <tr key={p.id} className="border-b border-[#3D3D60]/40 hover:bg-[#3D3D60]/20 align-top">
                  <td className="py-2 px-2 font-medium text-white text-center">{cm[p.character_id]?.name ?? '—'}</td>
                  <td className="py-2 px-2 text-center text-marvel-gold font-bold">{p.position ?? '—'}</td>
                  <td className="py-2 px-2 text-[#D8D8EE] text-center">{p.power_name ?? '—'}</td>
                  <td className="py-2 px-2 text-center"><CouleurBadge couleur={p.couleur} /></td>
                  <td className="py-2 px-2 text-xs text-[#C8C8E0] italic max-w-40 truncate" title={p.description ?? ''}>{p.description ?? '—'}</td>
                  {EFFECTS.map(n => (
                    <td key={n} className="py-2 px-1 text-center align-top">
                      <EffectDisplay {...getEffectData(p, n)} cout={p[`effect_${n}_cout`] as number | null} center simplified />
                    </td>
                  ))}
                  <td className="py-2 px-2 text-center sticky right-0 bg-[#252540] z-10">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openEdit(p)} className="text-[#C8C8E0] hover:text-white"><Pencil size={13} /></button>
                      <button onClick={() => remove(p.id)} className="text-[#C8C8E0] hover:text-red-400"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sortedFiltered.length === 0 && <p className="text-center text-[#C8C8E0] py-8">No powers found</p>}
        </div>
      )}

      {/* ── Modal ── */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="card w-full max-w-2xl my-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-marvel text-xl text-marvel-gold">{modal === 'add' ? 'New Power' : 'Edit Power'}</h2>
              <button onClick={closeModal}><X size={18} className="text-[#C8C8E0] hover:text-white" /></button>
            </div>
            <div className="space-y-4">
              {/* Character (originals only) */}
              <div>
                <label className="text-xs text-[#C8C8E0] mb-1 block">Character *</label>
                <SearchDropdown
                  value={form.character_id ? (cm[form.character_id]?.name ?? '') : ''}
                  onChange={() => {}}
                  onSelectId={id => setForm(f => ({ ...f, character_id: id ?? '' }))}
                  options={charOptions} placeholder="Search for a character..." allowFreeText={false} />
              </div>

              {/* Power name / Color / Position */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-[#C8C8E0] mb-1 block">Power name</label>
                  <input className="input" value={form.power_name ?? ''}
                    onChange={e => setForm(f => ({ ...f, power_name: e.target.value || null }))}
                    placeholder="Ex: Cosmic Assault" />
                </div>
                <div>
                  <label className="text-xs text-[#C8C8E0] mb-1 block">Color</label>
                  <select className="input" value={form.couleur ?? ''}
                    onChange={e => setForm(f => ({ ...f, couleur: e.target.value || null }))}>
                    <option value="">— None —</option>
                    {COULEURS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#C8C8E0] mb-1 block">Position (1–6)</label>
                  <select className="input" value={form.position ?? ''}
                    onChange={e => setForm(f => ({ ...f, position: e.target.value ? Number(e.target.value) : null }))}>
                    <option value="">—</option>
                    {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-[#C8C8E0] mb-1 block">Description <span className="text-[#555]">(full power description)</span></label>
                <textarea className="input resize-none h-20 text-sm" value={form.description ?? ''}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value || null }))}
                  placeholder="Full power description..." />
              </div>

              {/* Effects 1–8: effect 1 always shown, "+ Add effect" reveals the next one */}
              <div>
                <p className="text-xs font-semibold text-marvel-gold mb-2">Effects (up to {EFFECTS.length})</p>
                <div className="space-y-2">
                  {EFFECTS.filter(n => n <= shown).map(n => (
                    <div key={n} className="relative">
                      <EffectForm
                        label={`Effect ${n}`}
                        data={getFormEffectData(form, n)}
                        onChange={(field, val) => setEffect(n, field, val)}
                        allCategories={allCategories}
                        categoryMap={categoryMap}
                        sousMap={sousMap}
                        sousMap2={sousMap2}
                        allTriggers={[]}
                        coutValue={form[`effect_${n}_cout`]}
                        onCoutChange={val => setForm(f => ({ ...f, [`effect_${n}_cout`]: val }))}
                        simplified={true}
                      />
                      {n > 1 && (
                        <button type="button" onClick={() => removeEffect(n)} title="Remove this effect"
                          className="absolute top-2 right-2 text-[#C8C8E0] hover:text-red-400"><X size={14} /></button>
                      )}
                    </div>
                  ))}
                </div>
                {shown < EFFECTS.length && (
                  <button type="button" onClick={() => setShown(s => s + 1)}
                    className="mt-2 text-xs bg-[#3D3D60] hover:bg-marvel-red/40 text-[#C8C8E0] hover:text-white px-3 py-1.5 rounded transition-all">
                    + Add effect
                  </button>
                )}
              </div>

              {formError && (
                <div className="bg-red-900/40 border border-red-700 text-red-200 text-sm rounded-lg px-3 py-2">{formError}</div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
                <button onClick={save} disabled={saving || !form.character_id} className="btn-primary flex-1">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Spinner() {
  return <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-marvel-red border-t-transparent rounded-full" /></div>
}
