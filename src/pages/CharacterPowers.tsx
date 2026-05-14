import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
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

const EFFECTS = [1, 2, 3, 4] as const
type EffectNum = typeof EFFECTS[number]

const EMPTY: Omit<CharacterPower, 'id' | 'created_at' | 'updated_at'> = {
  character_id: '', power_name: null, couleur: null, position: null, description: null,
  effect_1_cout: null, effect_1_category: null, effect_1_sous_category: null, effect_1_sous_category_2: null, effect_1_sous_category_3: null,
  effect_2_cout: null, effect_2_category: null, effect_2_sous_category: null, effect_2_sous_category_2: null, effect_2_sous_category_3: null,
  effect_3_cout: null, effect_3_category: null, effect_3_sous_category: null, effect_3_sous_category_2: null, effect_3_sous_category_3: null,
  effect_4_cout: null, effect_4_category: null, effect_4_sous_category: null, effect_4_sous_category_2: null, effect_4_sous_category_3: null,
}

type ViewMode = 'table' | 'byCharacter'
type SortCol  = 'character' | 'power_name' | 'couleur' | 'position'
type SortDir  = 'asc' | 'desc'

// ── Helpers ───────────────────────────────────────────────────────────────────
function CouleurBadge({ couleur }: { couleur: string | null }) {
  if (!couleur) return null
  return <span className={`badge font-semibold ${COULEUR_STYLES[couleur as Couleur] ?? 'bg-gray-700 text-white'}`}>{couleur}</span>
}

function catColor(cat: string | null): string {
  if (!cat) return 'bg-[#1E1E38] text-[#C8C8E0] border-[#3D3D60]'
  return 'bg-[#3D3D60] text-[#C8C8E0] border-[#555]'
}

function SortIcon({ col, current, dir }: { col: SortCol; current: SortCol; dir: SortDir }) {
  if (col !== current) return <ArrowUpDown size={10} className="opacity-30" />
  return dir === 'asc' ? <ArrowUp size={10} className="text-marvel-gold" /> : <ArrowDown size={10} className="text-marvel-gold" />
}

function getEffectData(p: CharacterPower, n: EffectNum): EffectData {
  return {
    category:        p[`effect_${n}_category`]        as string | null,
    sous_category:   p[`effect_${n}_sous_category`]   as string | null,
    sous_category_2: p[`effect_${n}_sous_category_2`] as string | null,
    sous_category_3: p[`effect_${n}_sous_category_3`] as string | null,
    // Powers don't use these fields
    degats: null, quantite: null, force: null, choix: null, autre: null, trigger: null,
  }
}

function getFormEffectData(form: typeof EMPTY, n: EffectNum): EffectData {
  return {
    category:        form[`effect_${n}_category`],
    sous_category:   form[`effect_${n}_sous_category`],
    sous_category_2: form[`effect_${n}_sous_category_2`],
    sous_category_3: form[`effect_${n}_sous_category_3`],
    degats: null, quantite: null, force: null, choix: null, autre: null, trigger: null,
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CharacterPowers() {
  const [powers, setPowers]         = useState<CharacterPower[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading]       = useState(true)
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

  async function load() {
    const [{ data: pw }, { data: ch }] = await Promise.all([
      supabase.from('mpq_tracker_character_powers').select('*').order('position'),
      supabase.from('mpq_tracker_characters').select('*').order('base_name').order('version'),
    ])
    if (pw) setPowers(pw)
    if (ch) setCharacters(ch)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const allCategories = [...new Set(powers.flatMap(p =>
    EFFECTS.map(n => p[`effect_${n}_category`] as string | null).filter(Boolean) as string[]
  ))].sort()

  // categoryMap: category → sous_categories
  const categoryMap = powers.reduce<Record<string, string[]>>((acc, p) => {
    EFFECTS.forEach(n => {
      const cat = p[`effect_${n}_category`] as string | null
      const sub = p[`effect_${n}_sous_category`] as string | null
      if (cat && sub) { if (!acc[cat]) acc[cat] = []; if (!acc[cat].includes(sub)) acc[cat].push(sub) }
    }); return acc
  }, {})
  Object.keys(categoryMap).forEach(k => categoryMap[k].sort())

  // sousMap: sous_category → sous_category_2
  const sousMap = powers.reduce<Record<string, string[]>>((acc, p) => {
    EFFECTS.forEach(n => {
      const sub  = p[`effect_${n}_sous_category`]   as string | null
      const sub2 = p[`effect_${n}_sous_category_2`] as string | null
      if (sub && sub2) { if (!acc[sub]) acc[sub] = []; if (!acc[sub].includes(sub2)) acc[sub].push(sub2) }
    }); return acc
  }, {})
  Object.keys(sousMap).forEach(k => sousMap[k].sort())

  // sousMap2: sous_category_2 → sous_category_3
  const sousMap2 = powers.reduce<Record<string, string[]>>((acc, p) => {
    EFFECTS.forEach(n => {
      const sub2 = p[`effect_${n}_sous_category_2`] as string | null
      const sub3 = p[`effect_${n}_sous_category_3`] as string | null
      if (sub2 && sub3) { if (!acc[sub2]) acc[sub2] = []; if (!acc[sub2].includes(sub3)) acc[sub2].push(sub3) }
    }); return acc
  }, {})
  Object.keys(sousMap2).forEach(k => sousMap2[k].sort())

  const cmap = useCallback(() => Object.fromEntries(characters.map(c => [c.id, c])), [characters])

  const filtered = powers.filter(p => {
    const cm   = cmap()
    const name = cm[p.character_id]?.name?.toLowerCase() ?? ''
    const matchSearch = !search || [
      name, p.power_name, p.couleur, p.description,
      ...EFFECTS.flatMap(n => [
        p[`effect_${n}_category`], p[`effect_${n}_sous_category`],
        p[`effect_${n}_sous_category_2`], p[`effect_${n}_sous_category_3`],
      ]),
    ].some(v => v && String(v).toLowerCase().includes(search.toLowerCase()))
    const matchCouleur  = !filterCouleur  || p.couleur === filterCouleur
    const matchCategory = !filterCategory || EFFECTS.some(n => p[`effect_${n}_category`] === filterCategory)
    return matchSearch && matchCouleur && matchCategory
  })

  function toggleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const cm = cmap()
  const sortedFiltered = [...filtered].sort((a, b) => {
    let va: string | number, vb: string | number
    if      (sortCol === 'character')  { va = cm[a.character_id]?.name?.toLowerCase() ?? ''; vb = cm[b.character_id]?.name?.toLowerCase() ?? '' }
    else if (sortCol === 'power_name') { va = a.power_name?.toLowerCase() ?? ''; vb = b.power_name?.toLowerCase() ?? '' }
    else if (sortCol === 'couleur')    { va = a.couleur?.toLowerCase() ?? ''; vb = b.couleur?.toLowerCase() ?? '' }
    else                               { va = a.position ?? 99; vb = b.position ?? 99 }
    if (va < vb) return sortDir === 'asc' ? -1 : 1
    if (va > vb) return sortDir === 'asc' ? 1 : -1
    return (a.position ?? 99) - (b.position ?? 99)
  })

  // Group by character, sorted alphabetically; within each group sort by position
  const grouped = filtered.reduce<Record<string, CharacterPower[]>>((acc, p) => {
    acc[p.character_id] = acc[p.character_id] ?? []; acc[p.character_id].push(p); return acc
  }, {})
  const groupedEntries = Object.entries(grouped)
    .sort((a, b) => {
      const na = cm[a[0]]?.name?.toLowerCase() ?? '', nb = cm[b[0]]?.name?.toLowerCase() ?? ''
      return na < nb ? -1 : na > nb ? 1 : 0
    })

  function openAdd(characterId?: string) {
    setForm({ ...EMPTY, character_id: characterId ?? '' }); setEditId(null); setModal('add')
  }
  function openEdit(p: CharacterPower) {
    const { id, created_at, updated_at, ...rest } = p; setForm(rest); setEditId(p.id); setModal('edit')
  }
  function closeModal() { setModal(null); setEditId(null) }

  function setEffect(n: EffectNum, field: keyof EffectData, val: string | null) {
    setForm(f => ({ ...f, [`effect_${n}_${field}`]: val }))
  }

  async function save() {
    if (!form.character_id) return
    setSaving(true)
    if (modal === 'add') await supabase.from('mpq_tracker_character_powers').insert([form])
    else if (editId) await supabase.from('mpq_tracker_character_powers')
      .update({ ...form, updated_at: new Date().toISOString() }).eq('id', editId)
    await load(); closeModal(); setSaving(false)
  }

  async function remove(id: string) {
    if (!confirm('Delete this power?')) return
    await supabase.from('mpq_tracker_character_powers').delete().eq('id', id)
    setPowers(prev => prev.filter(p => p.id !== id))
  }

  function Th({ col, label }: { col: SortCol; label: string }) {
    return (
      <th className="py-2 px-2 font-normal text-center">
        <button onClick={() => toggleSort(col)}
          className={`flex items-center gap-0.5 mx-auto hover:text-white transition-colors ${sortCol === col ? 'text-marvel-gold' : 'text-[#C8C8E0]'}`}>
          {label}<SortIcon col={col} current={sortCol} dir={sortDir} />
        </button>
      </th>
    )
  }

  const charOptions = toCharacterOptions(characters)

  // Render a power card in by-character view
  function PowerCard({ p }: { p: CharacterPower }) {
    return (
      <div className="bg-[#1C1C2E] rounded-lg p-3 flex items-start gap-3 group">
        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {p.position   && <span className="badge bg-[#3D3D60] text-[#C8C8E0] border border-[#52527A] text-xs">#{p.position}</span>}
            {p.couleur    && <CouleurBadge couleur={p.couleur} />}
            {p.power_name && <p className="text-sm font-semibold text-white">{p.power_name}</p>}
          </div>
          {p.description && (
            <p className="text-xs text-[#C8C8E0] leading-relaxed border-l-2 border-[#3D3D60] pl-2 italic">{p.description}</p>
          )}
          {EFFECTS.map(n => {
            const cout = p[`effect_${n}_cout`] as number | null
            const d    = getEffectData(p, n)
            if (!cout && !d.category && !d.sous_category && !d.sous_category_2 && !d.sous_category_3) return null
            return (
              <EffectDisplay key={n} {...d} cout={cout} simplified />
            )
          })}
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={() => openEdit(p)} className="text-[#C8C8E0] hover:text-white"><Pencil size={13} /></button>
          <button onClick={() => remove(p.id)} className="text-[#C8C8E0] hover:text-red-400"><Trash2 size={13} /></button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Powers</h1>
        <button onClick={() => openAdd()} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add</button>
      </div>

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
            // Sort by position
            const sorted     = [...charPowers].sort((a, b) => (a.position ?? 99) - (b.position ?? 99))
            const byCouleur  = sorted.reduce<Record<string, CharacterPower[]>>((acc, p) => {
              const key = p.couleur ?? 'Unknown'; acc[key] = acc[key] ?? []; acc[key].push(p); return acc
            }, {})

            return (
              <div key={charId} className="card">
                <button onClick={() => setExpanded(isOpen ? null : charId)} className="flex items-center gap-3 w-full text-left group">
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
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={e => { e.stopPropagation(); openAdd(charId) }}
                      className="text-xs bg-[#3D3D60] hover:bg-marvel-red/40 text-[#C8C8E0] hover:text-white px-2 py-1 rounded transition-all">
                      + Power
                    </button>
                    {isOpen ? <ChevronUp size={14} className="text-[#C8C8E0]" /> : <ChevronDown size={14} className="text-[#C8C8E0]" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-[#3D3D60] space-y-2">
                    {sorted.map(p => (
                      <PowerCard key={p.id} p={p} />
                    ))}
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
                <Th col="character"  label="Character" />
                <Th col="position"   label="Pos." />
                <Th col="power_name" label="Power name" />
                <Th col="couleur"    label="Color" />
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
              {/* Character */}
              <div>
                <label className="text-xs text-[#C8C8E0] mb-1 block">Character *</label>
                <SearchDropdown
                  value={form.character_id ? (characters.find(c => c.id === form.character_id)?.name ?? '') : ''}
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

              {/* Effects 1–4 */}
              <div>
                <p className="text-xs font-semibold text-marvel-gold mb-2">Effects (up to 4)</p>
                <div className="space-y-2">
                  {EFFECTS.map(n => (
                    <EffectForm
                      key={n}
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
                  ))}
                </div>
              </div>

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
