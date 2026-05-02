import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Support } from '../types'
import { StarBadge } from '../components/Badges'
import { EffectDisplay, EffectForm, EffectData, catColor } from '../components/EffectFields'
import { Plus, Search, X, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

const EFFECTS = [1, 2, 3, 4, 5] as const
type EffectNum = typeof EFFECTS[number]
const DEFAULT_RESTRICTIONS = ['/', 'Héros', 'Vilains']
type SortCol = 'name' | 'rang' | 'niveau' | 'restriction'
type SortDir = 'asc' | 'desc'

function emptyEffect(): EffectData {
  return { category: null, sous_category: null, quantite: null, force: null, autre: null, trigger: null }
}

const EMPTY: Omit<Support, 'id' | 'created_at' | 'updated_at'> = {
  name: '', rang: 5, niveau: 250, restriction: '/',
  effect_1_category: null, effect_1_sous_category: null, effect_1_quantite: null, effect_1_force: null, effect_1_autre: null, effect_1_trigger: null,
  effect_2_category: null, effect_2_sous_category: null, effect_2_quantite: null, effect_2_force: null, effect_2_autre: null, effect_2_trigger: null,
  effect_3_category: null, effect_3_sous_category: null, effect_3_quantite: null, effect_3_force: null, effect_3_autre: null, effect_3_trigger: null,
  effect_4_category: null, effect_4_sous_category: null, effect_4_quantite: null, effect_4_force: null, effect_4_autre: null, effect_4_trigger: null,
  effect_5_category: null, effect_5_sous_category: null, effect_5_quantite: null, effect_5_force: null, effect_5_autre: null, effect_5_trigger: null,
  synergy_restriction: null,
  synergy_category: null, synergy_sous_category: null, synergy_quantite: null, synergy_force: null, synergy_autre: null, synergy_trigger: null,
}

function SortIcon({ col, current, dir }: { col: SortCol; current: SortCol; dir: SortDir }) {
  if (col !== current) return <ArrowUpDown size={10} className="opacity-30" />
  return dir === 'asc' ? <ArrowUp size={10} className="text-marvel-gold" /> : <ArrowDown size={10} className="text-marvel-gold" />
}

function getEffectData(s: Support, n: EffectNum): EffectData {
  return {
    category:      s[`effect_${n}_category`]      as string | null,
    sous_category: s[`effect_${n}_sous_category`] as string | null,
    quantite:      s[`effect_${n}_quantite`]      as string | null,
    force:         s[`effect_${n}_force`]         as string | null,
    autre:         s[`effect_${n}_autre`]         as string | null,
    trigger:       s[`effect_${n}_trigger`]       as string | null,
  }
}

export default function Supports() {
  const [supports, setSupports]       = useState<Support[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [filterEffect, setFilterEffect] = useState('')
  const [sortCol, setSortCol]         = useState<SortCol>('name')
  const [sortDir, setSortDir]         = useState<SortDir>('asc')
  const [modal, setModal]             = useState<'add' | 'edit' | null>(null)
  const [form, setForm]               = useState<typeof EMPTY>(EMPTY)
  const [editId, setEditId]           = useState<string | null>(null)
  const [saving, setSaving]           = useState(false)
  const [customRestr, setCustomRestr] = useState('')

  async function load() {
    const { data } = await supabase.from('mpq_tracker_supports').select('*').order('name')
    if (data) setSupports(data)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function toggleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  // Build unique lists from existing data
  const allCategories = [...new Set(supports.flatMap(s =>
    [...EFFECTS.map(n => s[`effect_${n}_category`] as string | null), s.synergy_category].filter(Boolean) as string[]
  ))].sort()

  // Map: category -> sorted list of sous_categories used with that category
  const categoryMap = supports.reduce<Record<string, string[]>>((acc, s) => {
    EFFECTS.forEach(n => {
      const cat = s[`effect_${n}_category`] as string | null
      const sub = s[`effect_${n}_sous_category`] as string | null
      if (cat && sub) {
        if (!acc[cat]) acc[cat] = []
        if (!acc[cat].includes(sub)) acc[cat].push(sub)
      }
    })
    if (s.synergy_category && s.synergy_sous_category) {
      if (!acc[s.synergy_category]) acc[s.synergy_category] = []
      if (!acc[s.synergy_category].includes(s.synergy_sous_category)) acc[s.synergy_category].push(s.synergy_sous_category)
    }
    return acc
  }, {})
  // Sort each list
  Object.keys(categoryMap).forEach(k => categoryMap[k].sort())

  const allTriggers = [...new Set(supports.flatMap(s =>
    [...EFFECTS.map(n => s[`effect_${n}_trigger`] as string | null), s.synergy_trigger].filter(Boolean) as string[]
  ))].sort()

  const allRestrictions = [...new Set([...DEFAULT_RESTRICTIONS, ...supports.map(s => s.restriction).filter(Boolean) as string[]])].sort()

  const visible = supports
    .filter(s => {
      const matchSearch = !search || [
        s.name, s.restriction,
        ...EFFECTS.flatMap(n => [s[`effect_${n}_category`], s[`effect_${n}_sous_category`], s[`effect_${n}_quantite`], s[`effect_${n}_force`], s[`effect_${n}_autre`], s[`effect_${n}_trigger`]]),
        s.synergy_restriction, s.synergy_category, s.synergy_sous_category, s.synergy_trigger,
      ].some(v => v && String(v).toLowerCase().includes(search.toLowerCase()))
      const matchEffect = !filterEffect || [...EFFECTS.map(n => s[`effect_${n}_category`]), s.synergy_category].some(c => c === filterEffect)
      return matchSearch && matchEffect
    })
    .sort((a, b) => {
      const va = (a[sortCol] ?? '') as string | number
      const vb = (b[sortCol] ?? '') as string | number
      if (va === '' && vb !== '') return 1; if (vb === '' && va !== '') return -1
      if (String(va).toLowerCase() < String(vb).toLowerCase()) return sortDir === 'asc' ? -1 : 1
      if (String(va).toLowerCase() > String(vb).toLowerCase()) return sortDir === 'asc' ? 1 : -1
      return 0
    })

  function openAdd()  { setForm(EMPTY); setEditId(null); setModal('add') }
  function openEdit(s: Support) {
    const { id, created_at, updated_at, ...rest } = s
    setForm(rest); setEditId(s.id); setModal('edit')
  }
  function closeModal() { setModal(null); setEditId(null); setCustomRestr('') }

  function setEffect(n: EffectNum, field: keyof EffectData, val: string | null) {
    setForm(f => ({ ...f, [`effect_${n}_${field}`]: val }))
  }
  function setSynergyField(field: keyof EffectData, val: string | null) {
    setForm(f => ({ ...f, [`synergy_${field}`]: val }))
  }
  function getSynergyData(): EffectData {
    return {
      category: form.synergy_category, sous_category: form.synergy_sous_category,
      quantite: form.synergy_quantite, force: form.synergy_force,
      autre: form.synergy_autre, trigger: form.synergy_trigger,
    }
  }

  async function save() {
    setSaving(true)
    const payload = { ...form, restriction: customRestr.trim() || form.restriction }
    if (modal === 'add') await supabase.from('mpq_tracker_supports').insert([payload])
    else if (editId) await supabase.from('mpq_tracker_supports').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editId)
    await load(); closeModal(); setSaving(false)
  }

  async function remove(id: string) {
    if (!confirm('Supprimer ce support ?')) return
    await supabase.from('mpq_tracker_supports').delete().eq('id', id)
    setSupports(prev => prev.filter(s => s.id !== id))
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
        <h1 className="page-title">Supports</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16} /> Ajouter</button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-56">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C8C8E0]" />
          <input className="input pl-9" placeholder="Rechercher nom, catégorie, trigger, synergie..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={filterEffect} onChange={e => setFilterEffect(e.target.value)}>
          <option value="">Tous les effets</option>
          {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <p className="text-sm text-[#C8C8E0]">{visible.length} support{visible.length !== 1 ? 's' : ''}</p>

      {loading ? <Spinner /> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#3D3D60]">
                <Th col="name"        label="Nom"    />
                <Th col="rang"        label="★"      />
                <Th col="niveau"      label="Niv."   />
                <Th col="restriction" label="Restr." />
                {EFFECTS.map(n => (
                  <th key={n} className="py-2 px-1 font-normal text-center text-[#C8C8E0] min-w-28">Effet {n}</th>
                ))}
                <th className="py-2 px-1 font-normal text-center text-[#C8C8E0] min-w-28">Synergie</th>
                <th className="py-2 px-2 font-normal text-center text-[#C8C8E0]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(s => (
                <tr key={s.id} className="border-b border-[#3D3D60]/40 hover:bg-[#3D3D60]/20 align-top">
                  <td className="py-2 px-2 font-medium text-white text-center">{s.name}</td>
                  <td className="py-2 px-2 text-center">
                    {s.rang ? <StarBadge stars={Math.min(s.rang, 6) as 1|2|3|4|5|6} /> : <span className="text-[#555]">—</span>}
                  </td>
                  <td className="py-2 px-2 text-center text-[#C8C8E0]">{s.niveau ?? '—'}</td>
                  <td className="py-2 px-2 text-center">
                    {s.restriction && s.restriction !== '/' ? (
                      <span className={`badge border text-xs ${
                        s.restriction === 'Héros'   ? 'bg-blue-900/40 text-blue-300 border-blue-700' :
                        s.restriction === 'Vilains' ? 'bg-red-900/40  text-red-300  border-red-700'  :
                                                      'bg-[#3D3D60]   text-[#C8C8E0] border-[#555]'
                      }`}>{s.restriction}</span>
                    ) : <span className="text-[#555]">—</span>}
                  </td>
                  {EFFECTS.map(n => (
                    <td key={n} className="py-2 px-1 text-center">
                      <EffectDisplay {...getEffectData(s, n)} center />
                    </td>
                  ))}
                  <td className="py-2 px-1 text-center">
                    <div className="space-y-0.5 flex flex-col items-center text-xs">
                      {s.synergy_restriction && (
                        <span className="badge border bg-marvel-red/20 text-red-300 border-red-800 truncate max-w-28">{s.synergy_restriction}</span>
                      )}
                      {s.synergy_category && <span className={`badge border ${catColor(s.synergy_category)}`}>{s.synergy_category}</span>}
                      {s.synergy_sous_category && <span className="text-[#D8D8EE]">{s.synergy_sous_category}</span>}
                      {s.synergy_quantite && <span className="text-[#D8D8EE]">qte: {s.synergy_quantite}</span>}
                      {s.synergy_force && <span className="text-[#D8D8EE]">force: {s.synergy_force}</span>}
                      {s.synergy_autre && <span className="text-[#D8D8EE]">{s.synergy_autre}</span>}
                      {s.synergy_trigger && <span className="text-[#D8D8EE] italic">{s.synergy_trigger}</span>}
                      {!s.synergy_restriction && !s.synergy_category && !s.synergy_sous_category && !s.synergy_quantite && !s.synergy_force && !s.synergy_autre && !s.synergy_trigger && (
                        <span className="text-[#444]">—</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openEdit(s)} className="text-[#C8C8E0] hover:text-white"><Pencil size={13} /></button>
                      <button onClick={() => remove(s.id)} className="text-[#C8C8E0] hover:text-red-400"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && <p className="text-center text-[#C8C8E0] py-8">Aucun support trouvé</p>}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="card w-full max-w-2xl my-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-marvel text-xl text-marvel-gold">{modal === 'add' ? 'Nouveau Support' : 'Modifier Support'}</h2>
              <button onClick={closeModal}><X size={18} className="text-[#C8C8E0] hover:text-white" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-[#C8C8E0] mb-1 block">Nom *</label>
                  <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-[#C8C8E0] mb-1 block">Rang ★</label>
                  <input type="number" className="input" value={form.rang ?? ''} onChange={e => setForm(f => ({ ...f, rang: Number(e.target.value) || null }))} />
                </div>
                <div>
                  <label className="text-xs text-[#C8C8E0] mb-1 block">Niveau</label>
                  <input type="number" className="input" value={form.niveau ?? ''} onChange={e => setForm(f => ({ ...f, niveau: Number(e.target.value) || null }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#C8C8E0] mb-1 block">Restriction</label>
                  <select className="input" value={customRestr ? '__custom__' : (form.restriction ?? '/')}
                    onChange={e => { if (e.target.value === '__custom__') setCustomRestr(' '); else { setCustomRestr(''); setForm(f => ({ ...f, restriction: e.target.value })) } }}>
                    {allRestrictions.map(r => <option key={r} value={r}>{r}</option>)}
                    <option value="__custom__">+ Nouvelle restriction...</option>
                  </select>
                </div>
                {customRestr !== '' && (
                  <div>
                    <label className="text-xs text-[#C8C8E0] mb-1 block">Nouvelle restriction</label>
                    <input className="input" placeholder="Ex: Symbiote, Mutant..." value={customRestr.trim()} onChange={e => setCustomRestr(e.target.value)} />
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-marvel-gold mb-2">Effets</p>
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
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-marvel-gold mb-2">Synergie</p>
                <div className="bg-[#1C1C2E] rounded-lg p-3 space-y-2">
                  <div>
                    <label className="text-xs text-[#C8C8E0] mb-1 block">Avec (personnage / tag)</label>
                    <input className="input text-sm" value={form.synergy_restriction ?? ''}
                      onChange={e => setForm(f => ({ ...f, synergy_restriction: e.target.value || null }))} placeholder="Ex: Spider-Ham, Héros..." />
                  </div>
                  <EffectForm
                    label="Effet synergie"
                    data={getSynergyData()}
                    onChange={setSynergyField}
                    allCategories={allCategories}
                    categoryMap={categoryMap}
                    allTriggers={allTriggers}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={closeModal} className="btn-secondary flex-1">Annuler</button>
                <button onClick={save} disabled={saving || !form.name} className="btn-primary flex-1">{saving ? 'Sauvegarde...' : 'Sauvegarder'}</button>
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
