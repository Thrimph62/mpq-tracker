import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Character, CharacterPower, Stars } from '../types'
import { StarBadge } from '../components/Badges'
import { Plus, Search, X, Pencil, Trash2, ChevronDown, ChevronUp, List, LayoutGrid, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

// ── Constants ─────────────────────────────────────────────────────────────────
const COULEURS = ['Bleu', 'Rouge', 'Vert', 'Noir', 'Jaune', 'Violet'] as const
type Couleur = typeof COULEURS[number]

const COULEUR_STYLES: Record<Couleur, string> = {
  Bleu:   'bg-blue-600   text-white',
  Rouge:  'bg-red-600    text-white',
  Vert:   'bg-green-600  text-white',
  Noir:   'bg-gray-600   text-white',
  Jaune:  'bg-yellow-500 text-black',
  Violet: 'bg-purple-600 text-white',
}

const COULEUR_BORDER: Record<Couleur, string> = {
  Bleu:   'border-blue-700',   Rouge:  'border-red-700',
  Vert:   'border-green-700',  Noir:   'border-gray-600',
  Jaune:  'border-yellow-600', Violet: 'border-purple-700',
}

const DEFAULT_CATEGORIES: string[] = []

const EFFECTS = [1, 2, 3, 4, 5] as const
type EffectNum = typeof EFFECTS[number]

const EMPTY_POWER: Omit<CharacterPower, 'id' | 'created_at' | 'updated_at'> = {
  character_id: '', power_name: null, couleur: null, cout: null,
  effect_1_category: null, effect_1_detail: null,
  effect_2_category: null, effect_2_detail: null,
  effect_3_category: null, effect_3_detail: null,
  effect_4_category: null, effect_4_detail: null,
  effect_5_category: null, effect_5_detail: null,
}

type ViewMode = 'table' | 'byCharacter'
type SortCol  = 'character' | 'power_name' | 'couleur' | 'cout'
type SortDir  = 'asc' | 'desc'

// ── Helpers ───────────────────────────────────────────────────────────────────
function CouleurBadge({ couleur }: { couleur: string | null }) {
  if (!couleur) return null
  const style = COULEUR_STYLES[couleur as Couleur] ?? 'bg-gray-700 text-white'
  return <span className={`badge ${style} font-semibold`}>{couleur}</span>
}

function catColor(cat: string | null): string {
  if (!cat) return 'bg-[#3D3D60] text-[#C8C8E0] border-[#444]'
  if (cat.includes('Gain MP'))       return 'bg-blue-900/50   text-blue-300   border-blue-700'
  if (cat.includes('Dégâts'))        return 'bg-red-900/50    text-red-300    border-red-700'
  if (cat.includes('Création'))      return 'bg-green-900/50  text-green-300  border-green-700'
  if (cat.includes('Destruction'))   return 'bg-orange-900/50 text-orange-300 border-orange-700'
  if (cat.includes('Conversion'))    return 'bg-yellow-900/50 text-yellow-300 border-yellow-700'
  if (cat.includes('Fortification')) return 'bg-gray-700/50   text-gray-300   border-gray-500'
  if (cat.includes('Gemmes Spéc'))   return 'bg-purple-900/50 text-purple-300 border-purple-700'
  if (cat.includes('Santé'))         return 'bg-teal-900/50   text-teal-300   border-teal-700'
  if (cat.includes('Paralysie'))     return 'bg-pink-900/50   text-pink-300   border-pink-700'
  return 'bg-[#3D3D60] text-[#C8C8E0] border-[#444]'
}

function EffectBadges({ power }: { power: CharacterPower }) {
  return (
    <div className="flex flex-wrap gap-1">
      {EFFECTS.map(n => {
        const cat    = power[`effect_${n}_category`] as string | null
        const detail = power[`effect_${n}_detail`]   as string | null
        if (!cat && !detail) return null
        return (
          <div key={n} className="flex items-center gap-1">
            {cat    && <span className={`badge border text-xs ${catColor(cat)}`}>{cat}</span>}
            {detail && <span className="text-[#D8D8EE] text-xs">{detail}</span>}
          </div>
        )
      })}
    </div>
  )
}

function CategorySelect({ value, onChange, allCategories }: {
  value: string | null; onChange: (v: string | null) => void; allCategories: string[]
}) {
  const isNew = value !== null && value !== '' && !allCategories.includes(value)
  return (
    <div className="space-y-1">
      <select className="input text-sm"
        value={isNew ? '__new__' : (value ?? '')}
        onChange={e => { if (e.target.value === '__new__') onChange(''); else onChange(e.target.value || null) }}>
        <option value="">— Aucune —</option>
        {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
        <option value="__new__">+ Nouvelle catégorie...</option>
      </select>
      {(isNew || value === '') && (
        <input className="input text-sm" placeholder="Nouvelle catégorie..." autoFocus={value === ''}
          value={value ?? ''} onChange={e => onChange(e.target.value || null)} />
      )}
    </div>
  )
}

function CharacterSearch({ value, onChange, characters }: {
  value: string; onChange: (id: string) => void; characters: Character[]
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen]   = useState(false)
  const [label, setLabel] = useState('')

  useEffect(() => {
    if (value) { const c = characters.find(c => c.id === value); if (c) setLabel(c.name) }
  }, [value, characters])

  const filtered = characters.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.base_name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 20)

  return (
    <div className="relative">
      <input className="input" placeholder="Rechercher un personnage..."
        value={open ? query : label}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => { setQuery(''); setOpen(true) }}
        onBlur={() => setTimeout(() => setOpen(false), 150)} />
      {open && filtered.length > 0 && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-[#252540] border border-[#3D3D60] rounded-lg shadow-xl max-h-52 overflow-y-auto">
          {filtered.map(c => (
            <button key={c.id} type="button"
              onMouseDown={() => { onChange(c.id); setLabel(c.name); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-[#3D3D60] flex items-center gap-2">
              <StarBadge stars={c.stars as Stars} />
              <span className="text-white">{c.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SortIcon({ col, current, dir }: { col: SortCol; current: SortCol; dir: SortDir }) {
  if (col !== current) return <ArrowUpDown size={10} className="opacity-30" />
  return dir === 'asc' ? <ArrowUp size={10} className="text-marvel-gold" /> : <ArrowDown size={10} className="text-marvel-gold" />
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
  const [form, setForm]             = useState<typeof EMPTY_POWER>(EMPTY_POWER)
  const [editId, setEditId]         = useState<string | null>(null)
  const [saving, setSaving]         = useState(false)

  async function load() {
    const [{ data: pw }, { data: ch }] = await Promise.all([
      supabase.from('character_powers').select('*').order('couleur'),
      supabase.from('characters').select('*').order('base_name').order('version'),
    ])
    if (pw) setPowers(pw)
    if (ch) setCharacters(ch)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const allCategories = [...new Set([
    ...DEFAULT_CATEGORIES,
    ...powers.flatMap(p => [
      p.effect_1_category, p.effect_2_category, p.effect_3_category,
      p.effect_4_category, p.effect_5_category,
    ].filter(Boolean) as string[]),
  ])].sort()

  const charMap = useCallback(() =>
    Object.fromEntries(characters.map(c => [c.id, c])),
    [characters])

  const filtered = powers.filter(p => {
    const char = charMap()[p.character_id]
    const name = char?.name?.toLowerCase() ?? ''
    const matchSearch = !search || [
      name, p.power_name, p.couleur,
      p.effect_1_category, p.effect_1_detail, p.effect_2_category, p.effect_2_detail,
      p.effect_3_category, p.effect_3_detail, p.effect_4_category, p.effect_4_detail,
      p.effect_5_category, p.effect_5_detail,
    ].some(v => v?.toLowerCase().includes(search.toLowerCase()))
    const matchCouleur  = !filterCouleur  || p.couleur === filterCouleur
    const matchCategory = !filterCategory || [
      p.effect_1_category, p.effect_2_category, p.effect_3_category,
      p.effect_4_category, p.effect_5_category,
    ].some(c => c === filterCategory)
    return matchSearch && matchCouleur && matchCategory
  })

  // Sorted filtered for table view
  function toggleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const cmap = charMap()
  const sortedFiltered = [...filtered].sort((a, b) => {
    let va: string | number = '', vb: string | number = ''
    if (sortCol === 'character') {
      va = cmap[a.character_id]?.name?.toLowerCase() ?? ''
      vb = cmap[b.character_id]?.name?.toLowerCase() ?? ''
    } else if (sortCol === 'power_name') {
      va = a.power_name?.toLowerCase() ?? ''; vb = b.power_name?.toLowerCase() ?? ''
    } else if (sortCol === 'couleur') {
      va = a.couleur?.toLowerCase() ?? ''; vb = b.couleur?.toLowerCase() ?? ''
    } else if (sortCol === 'cout') {
      va = a.cout ?? -1; vb = b.cout ?? -1
    }
    if (va === '' && vb !== '') return 1
    if (vb === '' && va !== '') return -1
    if (va < vb) return sortDir === 'asc' ? -1 : 1
    if (va > vb) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  // Grouped for byCharacter view — alphabetical by character name
  const grouped = filtered.reduce<Record<string, CharacterPower[]>>((acc, p) => {
    acc[p.character_id] = acc[p.character_id] ?? []
    acc[p.character_id].push(p)
    return acc
  }, {})
  const groupedEntries = Object.entries(grouped).sort((a, b) => {
    const na = cmap[a[0]]?.name?.toLowerCase() ?? ''
    const nb = cmap[b[0]]?.name?.toLowerCase() ?? ''
    return na < nb ? -1 : na > nb ? 1 : 0
  })

  function openAdd(characterId?: string) {
    setForm({ ...EMPTY_POWER, character_id: characterId ?? '' })
    setEditId(null); setModal('add')
  }
  function openEdit(p: CharacterPower) {
    const { id, created_at, updated_at, ...rest } = p
    setForm(rest); setEditId(p.id); setModal('edit')
  }
  function closeModal() { setModal(null); setEditId(null) }

  function setEffect(n: EffectNum, field: 'category' | 'detail', val: string | null) {
    setForm(f => ({ ...f, [`effect_${n}_${field}`]: val }))
  }

  async function save() {
    if (!form.character_id) return
    setSaving(true)
    if (modal === 'add') await supabase.from('character_powers').insert([form])
    else if (editId) await supabase.from('character_powers')
      .update({ ...form, updated_at: new Date().toISOString() }).eq('id', editId)
    await load(); closeModal(); setSaving(false)
  }

  async function remove(id: string) {
    if (!confirm('Supprimer ce pouvoir ?')) return
    await supabase.from('character_powers').delete().eq('id', id)
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Pouvoirs</h1>
        <button onClick={() => openAdd()} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C8C8E0]" />
          <input className="input pl-9" placeholder="Rechercher perso, pouvoir, effet..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={filterCouleur} onChange={e => setFilterCouleur(e.target.value)}>
          <option value="">Toutes couleurs</option>
          {COULEURS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="input w-auto" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="">Tous les effets</option>
          {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex gap-1 bg-[#1E1E38] p-1 rounded-lg">
          <button onClick={() => setViewMode('byCharacter')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'byCharacter' ? 'bg-marvel-red text-white' : 'text-[#C8C8E0] hover:text-white'}`}>
            <LayoutGrid size={13} /> Par perso
          </button>
          <button onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'table' ? 'bg-marvel-red text-white' : 'text-[#C8C8E0] hover:text-white'}`}>
            <List size={13} /> Tableau
          </button>
        </div>
      </div>

      <p className="text-sm text-[#C8C8E0]">{filtered.length} pouvoir{filtered.length !== 1 ? 's' : ''}</p>

      {loading ? <Spinner /> : viewMode === 'byCharacter' ? (
        /* ── BY CHARACTER — alphabetical ── */
        <div className="space-y-2">
          {groupedEntries.map(([charId, charPowers]) => {
            const char   = cmap[charId]
            const isOpen = expanded === charId
            const byCouleur = charPowers.reduce<Record<string, CharacterPower[]>>((acc, p) => {
              const key = p.couleur ?? 'Inconnu'
              acc[key] = acc[key] ?? []; acc[key].push(p); return acc
            }, {})
            return (
              <div key={charId} className="card">
                <button onClick={() => setExpanded(isOpen ? null : charId)}
                  className="flex items-center gap-3 w-full text-left group">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {char && <StarBadge stars={char.stars as Stars} />}
                      <span className="font-semibold text-white group-hover:text-marvel-gold transition-colors">
                        {char?.name ?? charId}
                      </span>
                      <span className="text-xs text-[#C8C8E0]">({charPowers.length} pouvoir{charPowers.length !== 1 ? 's' : ''})</span>
                    </div>
                    <div className="flex gap-1 mt-1">
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
                      + Pouvoir
                    </button>
                    {isOpen ? <ChevronUp size={14} className="text-[#C8C8E0]" /> : <ChevronDown size={14} className="text-[#C8C8E0]" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-[#3D3D60] space-y-4">
                    {COULEURS.filter(col => byCouleur[col]).map(col => (
                      <div key={col}>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border mb-2 ${COULEUR_BORDER[col as Couleur]} bg-[#1C1C2E]`}>
                          <CouleurBadge couleur={col} />
                          <span className="text-xs text-[#C8C8E0]">{byCouleur[col].length} pouvoir{byCouleur[col].length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="space-y-2 pl-2">
                          {byCouleur[col].sort((a, b) => (a.cout ?? 0) - (b.cout ?? 0)).map(p => (
                            <div key={p.id} className="bg-[#1C1C2E] rounded-lg p-3 flex items-start gap-3 group">
                              <div className="shrink-0 text-center min-w-10">
                                {p.cout !== null && <span className="text-marvel-gold font-bold text-sm">{p.cout}</span>}
                                <p className="text-xs text-[#555]">MP</p>
                              </div>
                              <div className="flex-1 space-y-1">
                                {p.power_name && <p className="text-sm font-semibold text-white">{p.power_name}</p>}
                                <EffectBadges power={p} />
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <button onClick={() => openEdit(p)} className="text-[#C8C8E0] hover:text-white"><Pencil size={13} /></button>
                                <button onClick={() => remove(p.id)} className="text-[#C8C8E0] hover:text-red-400"><Trash2 size={13} /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          {groupedEntries.length === 0 && <div className="card text-center text-[#C8C8E0] py-12">Aucun pouvoir trouvé</div>}
        </div>
      ) : (
        /* ── TABLE VIEW — sortable columns ── */
        <div className="card overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#3D3D60]">
                <Th col="character"  label="Personnage" />
                <Th col="power_name" label="Nom du pouvoir" />
                <Th col="couleur"    label="Couleur" />
                <Th col="cout"       label="Coût MP" />
                <th className="py-2 px-2 font-normal text-left text-[#C8C8E0]">Effets</th>
                <th className="py-2 px-2 font-normal text-right text-[#C8C8E0]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedFiltered.map(p => (
                <tr key={p.id} className="border-b border-[#3D3D60]/40 hover:bg-[#3D3D60]/20 align-top">
                  <td className="py-2 px-2 font-medium text-white">{cmap[p.character_id]?.name ?? '—'}</td>
                  <td className="py-2 px-2 text-[#E8E8F8]">{p.power_name ?? '—'}</td>
                  <td className="py-2 px-2 text-center"><CouleurBadge couleur={p.couleur} /></td>
                  <td className="py-2 px-2 text-center text-marvel-gold font-bold">{p.cout ?? '—'}</td>
                  <td className="py-2 px-2"><EffectBadges power={p} /></td>
                  <td className="py-2 px-2 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(p)} className="text-[#C8C8E0] hover:text-white"><Pencil size={13} /></button>
                      <button onClick={() => remove(p.id)} className="text-[#C8C8E0] hover:text-red-400"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sortedFiltered.length === 0 && <p className="text-center text-[#C8C8E0] py-8">Aucun pouvoir trouvé</p>}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="card w-full max-w-2xl my-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-marvel text-xl text-marvel-gold">{modal === 'add' ? 'Nouveau Pouvoir' : 'Modifier Pouvoir'}</h2>
              <button onClick={closeModal}><X size={18} className="text-[#C8C8E0] hover:text-white" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#C8C8E0] mb-1 block">Personnage *</label>
                <CharacterSearch value={form.character_id} onChange={id => setForm(f => ({ ...f, character_id: id }))} characters={characters} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="text-xs text-[#C8C8E0] mb-1 block">Nom du pouvoir</label>
                  <input className="input" value={form.power_name ?? ''}
                    onChange={e => setForm(f => ({ ...f, power_name: e.target.value || null }))} placeholder="Ex: Assaut Cosmique" />
                </div>
                <div>
                  <label className="text-xs text-[#C8C8E0] mb-1 block">Couleur</label>
                  <select className="input" value={form.couleur ?? ''}
                    onChange={e => setForm(f => ({ ...f, couleur: e.target.value || null }))}>
                    <option value="">— Aucune —</option>
                    {COULEURS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#C8C8E0] mb-1 block">Coût MP</label>
                  <input type="number" className="input" value={form.cout ?? ''}
                    onChange={e => setForm(f => ({ ...f, cout: e.target.value ? Number(e.target.value) : null }))} />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-marvel-gold mb-2">Effets</p>
                <div className="space-y-2">
                  {EFFECTS.map(n => (
                    <div key={n} className="bg-[#1C1C2E] rounded-lg p-3 grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-[#C8C8E0] mb-1 block">Effet {n} — Catégorie</label>
                        <CategorySelect value={form[`effect_${n}_category`]} onChange={v => setEffect(n, 'category', v)} allCategories={allCategories} />
                      </div>
                      <div>
                        <label className="text-xs text-[#C8C8E0] mb-1 block">Détail</label>
                        <input className="input text-sm" value={form[`effect_${n}_detail`] ?? ''}
                          onChange={e => setEffect(n, 'detail', e.target.value || null)} placeholder="Description libre..." />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={closeModal} className="btn-secondary flex-1">Annuler</button>
                <button onClick={save} disabled={saving || !form.character_id} className="btn-primary flex-1">
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
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
