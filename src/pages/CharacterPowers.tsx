import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Character, CharacterPower, Stars } from '../types'
import { StarBadge } from '../components/Badges'
import { SearchDropdown, toCharacterOptions } from '../components/SearchDropdown'
import { EffectDisplay, EffectForm, EffectData } from '../components/EffectFields'
import { Plus, Search, X, Pencil, Trash2, ChevronDown, ChevronUp, List, LayoutGrid, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

const COULEURS = ['Bleu', 'Rouge', 'Vert', 'Noir', 'Jaune', 'Violet'] as const
type Couleur = typeof COULEURS[number]

const COULEUR_STYLES: Record<Couleur, string> = {
  Bleu:   'bg-blue-600   text-white', Rouge:  'bg-red-600    text-white',
  Vert:   'bg-green-600  text-white', Noir:   'bg-gray-600   text-white',
  Jaune:  'bg-yellow-500 text-black', Violet: 'bg-purple-600 text-white',
}
const COULEUR_BORDER: Record<Couleur, string> = {
  Bleu:   'border-blue-700',   Rouge:  'border-red-700',
  Vert:   'border-green-700',  Noir:   'border-gray-600',
  Jaune:  'border-yellow-600', Violet: 'border-purple-700',
}

const EFFECTS = [1, 2, 3, 4] as const
type EffectNum = typeof EFFECTS[number]

const EMPTY: Omit<CharacterPower, 'id' | 'created_at' | 'updated_at'> = {
  character_id: '', power_name: null, couleur: null, position: null,
  effect_1_cout: null, effect_1_category: null, effect_1_sous_category: null, effect_1_quantite: null, effect_1_force: null, effect_1_autre: null, effect_1_trigger: null,
  effect_2_cout: null, effect_2_category: null, effect_2_sous_category: null, effect_2_quantite: null, effect_2_force: null, effect_2_autre: null, effect_2_trigger: null,
  effect_3_cout: null, effect_3_category: null, effect_3_sous_category: null, effect_3_quantite: null, effect_3_force: null, effect_3_autre: null, effect_3_trigger: null,
  effect_4_cout: null, effect_4_category: null, effect_4_sous_category: null, effect_4_quantite: null, effect_4_force: null, effect_4_autre: null, effect_4_trigger: null,
}

type ViewMode = 'table' | 'byCharacter'
type SortCol  = 'character' | 'power_name' | 'couleur' | 'position'
type SortDir  = 'asc' | 'desc'

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
    category:      p[`effect_${n}_category`]      as string | null,
    sous_category: p[`effect_${n}_sous_category`] as string | null,
    quantite:      p[`effect_${n}_quantite`]      as string | null,
    force:         p[`effect_${n}_force`]         as string | null,
    autre:         p[`effect_${n}_autre`]         as string | null,
    trigger:       p[`effect_${n}_trigger`]       as string | null,
  }
}

export default function CharacterPowers() {
  const [powers, setPowers]         = useState<CharacterPower[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [filterCouleur, setFilterCouleur]   = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [viewMode, setViewMode]     = useState<ViewMode>('byCharacter')
  const [sortCol, setSortCol]       = useState<SortCol>('position')
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

  // Map: category -> sorted sous_categories linked to it
  const categoryMap = powers.reduce<Record<string, string[]>>((acc, p) => {
    EFFECTS.forEach(n => {
      const cat = p[`effect_${n}_category`] as string | null
      const sub = p[`effect_${n}_sous_category`] as string | null
      if (cat && sub) {
        if (!acc[cat]) acc[cat] = []
        if (!acc[cat].includes(sub)) acc[cat].push(sub)
      }
    })
    return acc
  }, {})
  Object.keys(categoryMap).forEach(k => categoryMap[k].sort())

  const allTriggers = [...new Set(powers.flatMap(p =>
    EFFECTS.map(n => p[`effect_${n}_trigger`] as string | null).filter(Boolean) as string[]
  ))].sort()

  const cmap = useCallback(() => Object.fromEntries(characters.map(c => [c.id, c])), [characters])

  const filtered = powers.filter(p => {
    const cm = cmap()
    const name = cm[p.character_id]?.name?.toLowerCase() ?? ''
    const matchSearch = !search || [
      name, p.power_name, p.couleur,
      ...EFFECTS.flatMap(n => [p[`effect_${n}_category`], p[`effect_${n}_sous_category`], p[`effect_${n}_quantite`], p[`effect_${n}_force`], p[`effect_${n}_autre`], p[`effect_${n}_trigger`]]),
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
    if (sortCol !== 'position') { const pa = a.position ?? 99, pb = b.position ?? 99; if (pa !== pb) return pa - pb }
    return 0
  })

  const grouped = filtered.reduce<Record<string, CharacterPower[]>>((acc, p) => {
    acc[p.character_id] = acc[p.character_id] ?? []; acc[p.character_id].push(p); return acc
  }, {})
  const groupedEntries = Object.entries(grouped).sort((a, b) => {
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
    else if (editId) await supabase.from('mpq_tracker_character_powers').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editId)
    await load(); closeModal(); setSaving(false)
  }

  async function remove(id: string) {
    if (!confirm('Supprimer ce pouvoir ?')) return
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Pouvoirs</h1>
        <button onClick={() => openAdd()} className="btn-primary flex items-center gap-2"><Plus size={16} /> Ajouter</button>
      </div>

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
        <div className="space-y-2">
          {groupedEntries.map(([charId, charPowers]) => {
            const char   = cm[charId]
            const isOpen = expanded === charId
            const sortedPowers = [...charPowers].sort((a, b) => (a.position ?? 99) - (b.position ?? 99))
            const byCouleur = sortedPowers.reduce<Record<string, CharacterPower[]>>((acc, p) => {
              const key = p.couleur ?? 'Inconnu'; acc[key] = acc[key] ?? []; acc[key].push(p); return acc
            }, {})
            return (
              <div key={charId} className="card">
                <button onClick={() => setExpanded(isOpen ? null : charId)} className="flex items-center gap-3 w-full text-left group">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {char && <StarBadge stars={char.stars as Stars} />}
                      <span className="font-semibold text-white group-hover:text-marvel-gold transition-colors">{char?.name ?? charId}</span>
                      <span className="text-xs text-[#C8C8E0]">({charPowers.length} pouvoir{charPowers.length !== 1 ? 's' : ''})</span>
                    </div>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {Object.keys(byCouleur).map(col => (
                        <span key={col} className={`badge text-xs ${COULEUR_STYLES[col as Couleur] ?? 'bg-gray-700 text-white'}`}>{col} ({byCouleur[col].length})</span>
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
                        </div>
                        <div className="space-y-2 pl-2">
                          {byCouleur[col].sort((a, b) => (a.position ?? 99) - (b.position ?? 99)).map(p => (
                            <div key={p.id} className="bg-[#1C1C2E] rounded-lg p-3 flex items-start gap-3 group">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  {p.power_name && <p className="text-sm font-semibold text-white">{p.power_name}</p>}
                                  {p.position && <span className="badge bg-[#3D3D60] text-[#C8C8E0] border border-[#52527A] text-xs">#{p.position}</span>}
                                </div>
                                {EFFECTS.map(n => {
                                  const cout = p[`effect_${n}_cout`] as number | null
                                  const d    = getEffectData(p, n)
                                  if (!cout && !d.category && !d.sous_category && !d.quantite && !d.force && !d.autre && !d.trigger) return null
                                  return (
                                    <div key={n} className="flex items-start gap-2">
                                      {cout !== null && (
                                        <span className="shrink-0 text-marvel-gold font-bold text-xs bg-marvel-gold/10 px-1.5 py-0.5 rounded">{cout} MP</span>
                                      )}
                                      <EffectDisplay {...d} />
                                    </div>
                                  )
                                })}
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
        <div className="card overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#3D3D60]">
                <Th col="character"  label="Personnage" />
                <Th col="position"   label="Pos." />
                <Th col="power_name" label="Nom du pouvoir" />
                <Th col="couleur"    label="Couleur" />
                {EFFECTS.map(n => <th key={n} className="py-2 px-1 font-normal text-center text-[#C8C8E0] min-w-28">Effet {n}</th>)}
                <th className="py-2 px-2 font-normal text-center text-[#C8C8E0]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedFiltered.map(p => (
                <tr key={p.id} className="border-b border-[#3D3D60]/40 hover:bg-[#3D3D60]/20 align-top">
                  <td className="py-2 px-2 font-medium text-white text-center">{cm[p.character_id]?.name ?? '—'}</td>
                  <td className="py-2 px-2 text-center text-marvel-gold font-bold">{p.position ?? '—'}</td>
                  <td className="py-2 px-2 text-[#D8D8EE] text-center">{p.power_name ?? '—'}</td>
                  <td className="py-2 px-2 text-center"><CouleurBadge couleur={p.couleur} /></td>
                  {EFFECTS.map(n => (
                    <td key={n} className="py-2 px-1 text-center align-top">
                      <EffectDisplay
                        {...getEffectData(p, n)}
                        cout={p[`effect_${n}_cout`] as number | null}
                        center
                      />
                    </td>
                  ))}
                  <td className="py-2 px-2 text-center">
                    <div className="flex justify-center gap-2">
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
                <SearchDropdown
                  value={form.character_id ? (characters.find(c => c.id === form.character_id)?.name ?? '') : ''}
                  onChange={() => {}}
                  onSelectId={id => setForm(f => ({ ...f, character_id: id ?? '' }))}
                  options={charOptions} placeholder="Rechercher un personnage..." allowFreeText={false} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-[#C8C8E0] mb-1 block">Nom du pouvoir</label>
                  <input className="input" value={form.power_name ?? ''} onChange={e => setForm(f => ({ ...f, power_name: e.target.value || null }))} placeholder="Ex: Assaut Cosmique" />
                </div>
                <div>
                  <label className="text-xs text-[#C8C8E0] mb-1 block">Couleur</label>
                  <select className="input" value={form.couleur ?? ''} onChange={e => setForm(f => ({ ...f, couleur: e.target.value || null }))}>
                    <option value="">— Aucune —</option>
                    {COULEURS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#C8C8E0] mb-1 block">Position (1–6)</label>
                  <select className="input" value={form.position ?? ''} onChange={e => setForm(f => ({ ...f, position: e.target.value ? Number(e.target.value) : null }))}>
                    <option value="">—</option>
                    {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-marvel-gold mb-2">Effets (jusqu'à 4)</p>
                <div className="space-y-2">
                  {EFFECTS.map(n => (
                    <EffectForm
                      key={n}
                      label={`Effet ${n}`}
                      data={{ category: form[`effect_${n}_category`], sous_category: form[`effect_${n}_sous_category`], quantite: form[`effect_${n}_quantite`], force: form[`effect_${n}_force`], autre: form[`effect_${n}_autre`], trigger: form[`effect_${n}_trigger`] }}
                      onChange={(field, val) => setEffect(n, field, val)}
                      allCategories={allCategories}
                      categoryMap={categoryMap}
                      allTriggers={allTriggers}
                      coutValue={form[`effect_${n}_cout`]}
                      onCoutChange={val => setForm(f => ({ ...f, [`effect_${n}_cout`]: val }))}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={closeModal} className="btn-secondary flex-1">Annuler</button>
                <button onClick={save} disabled={saving || !form.character_id} className="btn-primary flex-1">{saving ? 'Sauvegarde...' : 'Sauvegarder'}</button>
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
