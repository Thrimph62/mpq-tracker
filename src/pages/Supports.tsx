import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Support } from '../types'
import { StarBadge } from '../components/Badges'
import { Plus, Search, X, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

// ── Effect categories ─────────────────────────────────────────────────────────
// Predefined list — user can type anything else (free text combo)
const DEFAULT_CATEGORIES = [
  'Gain MP',
  'Dégâts Gemmes',
  'Dégâts Pouvoirs',
  'Dégâts Equipe Ennemie',
  'Création Gemmes',
  'Destruction Gemmes',
  'Conversion Gemmes',
  'Fortification Gemmes',
  'Gemmes Spéciales',
  'Santé',
  'Paralysie',
  'Passif',
  'Autre',
]

// Category badge colors (partial match)
const CAT_COLORS: { match: string; className: string }[] = [
  { match: 'Gain MP',       className: 'bg-blue-900/50   text-blue-300   border-blue-700'   },
  { match: 'Dégâts',        className: 'bg-red-900/50    text-red-300    border-red-700'    },
  { match: 'Création',      className: 'bg-green-900/50  text-green-300  border-green-700'  },
  { match: 'Destruction',   className: 'bg-orange-900/50 text-orange-300 border-orange-700' },
  { match: 'Conversion',    className: 'bg-yellow-900/50 text-yellow-300 border-yellow-700' },
  { match: 'Fortification', className: 'bg-gray-700/50   text-gray-300   border-gray-500'   },
  { match: 'Gemmes Spéc',   className: 'bg-purple-900/50 text-purple-300 border-purple-700' },
  { match: 'Santé',         className: 'bg-teal-900/50   text-teal-300   border-teal-700'   },
  { match: 'Paralysie',     className: 'bg-pink-900/50   text-pink-300   border-pink-700'   },
  { match: 'Passif',        className: 'bg-[#2D2D4E]     text-[#8888AA]  border-[#444]'     },
]

function catColor(cat: string | null): string {
  if (!cat) return 'bg-[#2D2D4E] text-[#8888AA] border-[#444]'
  const found = CAT_COLORS.find(c => cat.includes(c.match))
  return found?.className ?? 'bg-[#2D2D4E] text-[#8888AA] border-[#444]'
}

// ── Types ─────────────────────────────────────────────────────────────────────
type SortCol = 'name' | 'rang' | 'niveau' | 'restriction'
type SortDir = 'asc' | 'desc'

const DEFAULT_RESTRICTIONS = ['/', 'Héros', 'Vilains']

const EFFECTS = [1, 2, 3, 4, 5] as const
type EffectNum = typeof EFFECTS[number]

const EMPTY: Omit<Support, 'id' | 'created_at' | 'updated_at'> = {
  name: '', rang: 5, niveau: 250, restriction: '/',
  effect_1_category: null, effect_1_detail: null,
  effect_2_category: null, effect_2_detail: null,
  effect_3_category: null, effect_3_detail: null,
  effect_4_category: null, effect_4_detail: null,
  effect_5_category: null, effect_5_detail: null,
  synergy_restriction: null, synergy_category: null, synergy_detail: null,
}

// ── Combo input for category ──────────────────────────────────────────────────
function CategoryCombo({ value, onChange, allCategories }: {
  value: string
  onChange: (v: string) => void
  allCategories: string[]
}) {
  const [open, setOpen] = useState(false)
  const filtered = allCategories.filter(c => c.toLowerCase().includes(value.toLowerCase()) && c !== value)

  return (
    <div className="relative">
      <input
        className="input text-sm"
        value={value}
        placeholder="Catégorie..."
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-[#1A1A2E] border border-[#2D2D4E] rounded-lg shadow-xl max-h-40 overflow-y-auto">
          {filtered.map(c => (
            <button key={c} type="button" onMouseDown={() => { onChange(c); setOpen(false) }}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-[#2D2D4E] text-[#CCCCCC]">
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Sort icon ─────────────────────────────────────────────────────────────────
function SortIcon({ col, current, dir }: { col: SortCol; current: SortCol; dir: SortDir }) {
  if (col !== current) return <ArrowUpDown size={10} className="opacity-30" />
  return dir === 'asc' ? <ArrowUp size={10} className="text-marvel-gold" /> : <ArrowDown size={10} className="text-marvel-gold" />
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Supports() {
  const [supports, setSupports]   = useState<Support[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterRestr, setFilterRestr] = useState('')
  const [sortCol, setSortCol]     = useState<SortCol>('name')
  const [sortDir, setSortDir]     = useState<SortDir>('asc')
  const [modal, setModal]         = useState<'add' | 'edit' | null>(null)
  const [form, setForm]           = useState<typeof EMPTY>(EMPTY)
  const [editId, setEditId]       = useState<string | null>(null)
  const [saving, setSaving]       = useState(false)
  const [customRestr, setCustomRestr] = useState('')

  async function load() {
    const { data } = await supabase.from('supports').select('*').order('name')
    if (data) setSupports(data)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function toggleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  // Build category list from all existing data + defaults
  const allCategories = [
    ...new Set([
      ...DEFAULT_CATEGORIES,
      ...supports.flatMap(s => [
        s.effect_1_category, s.effect_2_category, s.effect_3_category,
        s.effect_4_category, s.effect_5_category, s.synergy_category,
      ].filter(Boolean) as string[]),
    ])
  ].sort()

  const allRestrictions = [
    ...new Set([
      ...DEFAULT_RESTRICTIONS,
      ...supports.map(s => s.restriction).filter(Boolean) as string[],
    ])
  ].sort()

  // Search across name, all categories, all details, synergy
  const visible = supports
    .filter(s => {
      if (filterRestr && s.restriction !== filterRestr) return false
      if (!search) return true
      const q = search.toLowerCase()
      return [
        s.name, s.restriction,
        s.effect_1_category, s.effect_1_detail,
        s.effect_2_category, s.effect_2_detail,
        s.effect_3_category, s.effect_3_detail,
        s.effect_4_category, s.effect_4_detail,
        s.effect_5_category, s.effect_5_detail,
        s.synergy_restriction, s.synergy_category, s.synergy_detail,
      ].some(v => v?.toLowerCase().includes(q))
    })
    .sort((a, b) => {
      const va = (a[sortCol] ?? '') as string | number
      const vb = (b[sortCol] ?? '') as string | number
      if (va === '' && vb !== '') return 1
      if (vb === '' && va !== '') return -1
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

  async function save() {
    setSaving(true)
    const payload = { ...form, restriction: customRestr.trim() || form.restriction }
    if (modal === 'add') await supabase.from('supports').insert([payload])
    else if (editId) await supabase.from('supports').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editId)
    await load(); closeModal(); setSaving(false)
  }

  async function remove(id: string) {
    if (!confirm('Supprimer ce support ?')) return
    await supabase.from('supports').delete().eq('id', id)
    setSupports(prev => prev.filter(s => s.id !== id))
  }

  function setEffect(n: EffectNum, field: 'category' | 'detail', val: string) {
    setForm(f => ({ ...f, [`effect_${n}_${field}`]: val || null }))
  }

  // Sortable column header
  function Th({ col, label, align = 'center' }: { col: SortCol; label: string; align?: 'left' | 'center' }) {
    return (
      <th className={`py-2 px-2 font-normal text-${align}`}>
        <button onClick={() => toggleSort(col)}
          className={`flex items-center gap-0.5 ${align === 'center' ? 'mx-auto' : ''} hover:text-white transition-colors ${sortCol === col ? 'text-marvel-gold' : 'text-[#8888AA]'}`}>
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

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-56">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8888AA]" />
          <input className="input pl-9" placeholder="Rechercher nom, catégorie, effet, synergie..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={filterRestr} onChange={e => setFilterRestr(e.target.value)}>
          <option value="">Toutes restrictions</option>
          {allRestrictions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <p className="text-sm text-[#8888AA]">{visible.length} support{visible.length !== 1 ? 's' : ''}</p>

      {/* Table */}
      {loading ? <Spinner /> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#2D2D4E]">
                <Th col="name"        label="Nom"    align="left" />
                <Th col="rang"        label="★"      />
                <Th col="niveau"      label="Niv."   />
                <Th col="restriction" label="Restr." />
                {EFFECTS.map(n => (
                  <th key={n} className="py-2 px-1 font-normal text-center text-[#8888AA] min-w-24">
                    Effet {n}
                  </th>
                ))}
                <th className="py-2 px-1 font-normal text-center text-[#8888AA] min-w-28">Synergie</th>
                <th className="py-2 px-2 font-normal text-right text-[#8888AA]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(s => (
                <tr key={s.id} className="border-b border-[#2D2D4E]/40 hover:bg-[#2D2D4E]/20 align-top">
                  <td className="py-2 px-2 font-medium text-white">{s.name}</td>
                  <td className="py-2 px-2 text-center">
                    {s.rang ? <StarBadge stars={Math.min(s.rang, 6) as 1|2|3|4|5|6} /> : <span className="text-[#555]">—</span>}
                  </td>
                  <td className="py-2 px-2 text-center text-[#8888AA]">{s.niveau ?? '—'}</td>
                  <td className="py-2 px-2 text-center">
                    {s.restriction && s.restriction !== '/' ? (
                      <span className={`badge border ${
                        s.restriction === 'Héros'   ? 'bg-blue-900/40 text-blue-300 border-blue-700' :
                        s.restriction === 'Vilains' ? 'bg-red-900/40  text-red-300  border-red-700'  :
                                                      'bg-[#2D2D4E]   text-[#8888AA] border-[#444]'
                      }`}>{s.restriction}</span>
                    ) : <span className="text-[#555]">—</span>}
                  </td>
                  {EFFECTS.map(n => {
                    const cat    = s[`effect_${n}_category`] as string | null
                    const detail = s[`effect_${n}_detail`]   as string | null
                    return (
                      <td key={n} className="py-2 px-1 text-center">
                        {cat || detail ? (
                          <div className="space-y-1">
                            {cat && (
                              <span className={`badge border text-xs block ${catColor(cat)}`} title={cat}>
                                {cat}
                              </span>
                            )}
                            {detail && (
                              <span className="text-[#AAAAAA] block leading-tight truncate max-w-24" title={detail}>
                                {detail}
                              </span>
                            )}
                          </div>
                        ) : <span className="text-[#333]">—</span>}
                      </td>
                    )
                  })}
                  {/* Synergy column */}
                  <td className="py-2 px-1 text-center">
                    {(s.synergy_restriction || s.synergy_category || s.synergy_detail) ? (
                      <div className="space-y-1">
                        {s.synergy_restriction && (
                          <span className="badge border bg-marvel-red/20 text-red-300 border-red-800 block text-xs truncate max-w-28" title={s.synergy_restriction}>
                            {s.synergy_restriction}
                          </span>
                        )}
                        {s.synergy_category && (
                          <span className={`badge border text-xs block ${catColor(s.synergy_category)}`} title={s.synergy_category}>
                            {s.synergy_category}
                          </span>
                        )}
                        {s.synergy_detail && (
                          <span className="text-[#AAAAAA] block leading-tight truncate max-w-28" title={s.synergy_detail}>
                            {s.synergy_detail}
                          </span>
                        )}
                      </div>
                    ) : <span className="text-[#333]">—</span>}
                  </td>
                  <td className="py-2 px-2 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(s)} className="text-[#8888AA] hover:text-white transition-colors"><Pencil size={13} /></button>
                      <button onClick={() => remove(s.id)} className="text-[#8888AA] hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && <p className="text-center text-[#8888AA] py-8">Aucun support trouvé</p>}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="card w-full max-w-2xl my-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-marvel text-xl text-marvel-gold">{modal === 'add' ? 'Nouveau Support' : 'Modifier Support'}</h2>
              <button onClick={closeModal}><X size={18} className="text-[#8888AA] hover:text-white" /></button>
            </div>
            <div className="space-y-4">

              {/* Base info */}
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-[#8888AA] mb-1 block">Nom *</label>
                  <input className="input" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-[#8888AA] mb-1 block">Rang ★</label>
                  <input type="number" className="input" value={form.rang ?? ''}
                    onChange={e => setForm(f => ({ ...f, rang: Number(e.target.value) || null }))} />
                </div>
                <div>
                  <label className="text-xs text-[#8888AA] mb-1 block">Niveau</label>
                  <input type="number" className="input" value={form.niveau ?? ''}
                    onChange={e => setForm(f => ({ ...f, niveau: Number(e.target.value) || null }))} />
                </div>
              </div>

              {/* Restriction */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#8888AA] mb-1 block">Restriction</label>
                  <select className="input" value={customRestr ? '__custom__' : (form.restriction ?? '/')}
                    onChange={e => {
                      if (e.target.value === '__custom__') setCustomRestr(' ')
                      else { setCustomRestr(''); setForm(f => ({ ...f, restriction: e.target.value })) }
                    }}>
                    {allRestrictions.map(r => <option key={r} value={r}>{r}</option>)}
                    <option value="__custom__">+ Nouvelle restriction...</option>
                  </select>
                </div>
                {customRestr !== '' && (
                  <div>
                    <label className="text-xs text-[#8888AA] mb-1 block">Nouvelle restriction</label>
                    <input className="input" placeholder="Ex: Symbiote, Mutant..."
                      value={customRestr.trim()} onChange={e => setCustomRestr(e.target.value)} />
                  </div>
                )}
              </div>

              {/* Effects 1–5 */}
              <div>
                <p className="text-xs font-semibold text-marvel-gold mb-2">Effets</p>
                <div className="space-y-2">
                  {EFFECTS.map(n => (
                    <div key={n} className="bg-[#0D0D0D] rounded-lg p-3 grid grid-cols-2 gap-2 items-start">
                      <div>
                        <label className="text-xs text-[#8888AA] mb-1 block">Effet {n} — Catégorie</label>
                        <CategoryCombo
                          value={form[`effect_${n}_category`] ?? ''}
                          onChange={v => setEffect(n, 'category', v)}
                          allCategories={allCategories}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[#8888AA] mb-1 block">Détail</label>
                        <input className="input text-sm"
                          value={form[`effect_${n}_detail`] ?? ''}
                          onChange={e => setEffect(n, 'detail', e.target.value)}
                          placeholder="Description libre..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Synergy */}
              <div>
                <p className="text-xs font-semibold text-marvel-gold mb-2">Synergie</p>
                <div className="bg-[#0D0D0D] rounded-lg p-3 space-y-2">
                  <div>
                    <label className="text-xs text-[#8888AA] mb-1 block">Avec (personnage / tag)</label>
                    <input className="input text-sm"
                      value={form.synergy_restriction ?? ''}
                      onChange={e => setForm(f => ({ ...f, synergy_restriction: e.target.value || null }))}
                      placeholder="Ex: Spider-Ham, Héros, Vilains..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-[#8888AA] mb-1 block">Catégorie</label>
                      <CategoryCombo
                        value={form.synergy_category ?? ''}
                        onChange={v => setForm(f => ({ ...f, synergy_category: v || null }))}
                        allCategories={allCategories}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#8888AA] mb-1 block">Détail</label>
                      <input className="input text-sm"
                        value={form.synergy_detail ?? ''}
                        onChange={e => setForm(f => ({ ...f, synergy_detail: e.target.value || null }))}
                        placeholder="Description libre..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={closeModal} className="btn-secondary flex-1">Annuler</button>
                <button onClick={save} disabled={saving || !form.name} className="btn-primary flex-1">
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
