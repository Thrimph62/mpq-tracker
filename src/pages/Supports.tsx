import { Fragment, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchAll } from '../lib/fetchAll'
import { Support } from '../types'
import { StarBadge } from '../components/Badges'
import { EffectDisplay, EffectForm, EffectData, catColor } from '../components/EffectFields'
import { Plus, Search, X, Pencil, Trash2, ChevronDown, ChevronUp, List, LayoutGrid, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

const EFFECTS = [1, 2, 3, 4, 5] as const
type EffectNum = typeof EFFECTS[number]
const DEFAULT_RESTRICTIONS = ['/', 'Heroes', 'Villains']
type SortCol  = 'name' | 'rang' | 'niveau' | 'restriction'
type SortDir  = 'asc' | 'desc'
type ViewMode = 'cards' | 'table'

// every field of an effect / of the synergy block
const EFFECT_FIELDS = ['description', 'category', 'sous_category', 'sous_category_2', 'sous_category_3',
  'degats', 'quantite', 'force', 'choix', 'autre', 'trigger'] as const
// effect_1..effect_5 + synergy all share the same field names
const PREFIXES = [...EFFECTS.map(n => `effect_${n}`), 'synergy']
const get = (s: any, prefix: string, field: string) => s[`${prefix}_${field}`] as string | null

const EMPTY: Omit<Support, 'id' | 'created_at' | 'updated_at'> = {
  name: '', rang: 5, niveau: 250, restriction: '/',
  effect_1_description: null, effect_1_category: null, effect_1_sous_category: null, effect_1_sous_category_2: null, effect_1_sous_category_3: null, effect_1_degats: null, effect_1_quantite: null, effect_1_force: null, effect_1_choix: null, effect_1_autre: null, effect_1_trigger: null,
  effect_2_description: null, effect_2_category: null, effect_2_sous_category: null, effect_2_sous_category_2: null, effect_2_sous_category_3: null, effect_2_degats: null, effect_2_quantite: null, effect_2_force: null, effect_2_choix: null, effect_2_autre: null, effect_2_trigger: null,
  effect_3_description: null, effect_3_category: null, effect_3_sous_category: null, effect_3_sous_category_2: null, effect_3_sous_category_3: null, effect_3_degats: null, effect_3_quantite: null, effect_3_force: null, effect_3_choix: null, effect_3_autre: null, effect_3_trigger: null,
  effect_4_description: null, effect_4_category: null, effect_4_sous_category: null, effect_4_sous_category_2: null, effect_4_sous_category_3: null, effect_4_degats: null, effect_4_quantite: null, effect_4_force: null, effect_4_choix: null, effect_4_autre: null, effect_4_trigger: null,
  effect_5_description: null, effect_5_category: null, effect_5_sous_category: null, effect_5_sous_category_2: null, effect_5_sous_category_3: null, effect_5_degats: null, effect_5_quantite: null, effect_5_force: null, effect_5_choix: null, effect_5_autre: null, effect_5_trigger: null,
  synergy_restriction: null,
  synergy_description: null, synergy_category: null, synergy_sous_category: null, synergy_sous_category_2: null, synergy_sous_category_3: null, synergy_degats: null, synergy_quantite: null, synergy_force: null, synergy_choix: null, synergy_autre: null, synergy_trigger: null,
}

function hasEffect(f: typeof EMPTY, n: EffectNum) {
  return EFFECT_FIELDS.some(x => (f as any)[`effect_${n}_${x}`])
}

function SortIcon({ col, current, dir }: { col: SortCol; current: SortCol; dir: SortDir }) {
  if (col !== current) return <ArrowUpDown size={10} className="opacity-30" />
  return dir === 'asc' ? <ArrowUp size={10} className="text-marvel-gold" /> : <ArrowDown size={10} className="text-marvel-gold" />
}

function getEffectData(s: Support, n: EffectNum): EffectData {
  return {
    description:     s[`effect_${n}_description`]    as string | null,
    category:        s[`effect_${n}_category`]        as string | null,
    sous_category:   s[`effect_${n}_sous_category`]   as string | null,
    sous_category_2: s[`effect_${n}_sous_category_2`] as string | null,
    sous_category_3: s[`effect_${n}_sous_category_3`] as string | null,
    degats:          s[`effect_${n}_degats`]          as string | null,
    quantite:        s[`effect_${n}_quantite`]        as string | null,
    force:           s[`effect_${n}_force`]           as string | null,
    choix:           s[`effect_${n}_choix`]           as string | null,
    autre:           s[`effect_${n}_autre`]           as string | null,
    trigger:         s[`effect_${n}_trigger`]         as string | null,
  }
}

// effect_N or synergy → EffectData, for the card view
function dataOf(s: Support, prefix: string): EffectData {
  return {
    description: get(s, prefix, 'description'), category: get(s, prefix, 'category'),
    sous_category: get(s, prefix, 'sous_category'), sous_category_2: get(s, prefix, 'sous_category_2'),
    sous_category_3: get(s, prefix, 'sous_category_3'), degats: get(s, prefix, 'degats'),
    quantite: get(s, prefix, 'quantite'), force: get(s, prefix, 'force'), choix: get(s, prefix, 'choix'),
    autre: get(s, prefix, 'autre'), trigger: get(s, prefix, 'trigger'),
  }
}
const hasData = (d: EffectData) => EFFECT_FIELDS.some(x => d[x])

// ── Display pieces (module level so React keeps them mounted) ──────────────────
function RestrictionBadge({ restriction }: { restriction: string | null }) {
  if (!restriction || restriction === '/') return <span className="text-[#555]">—</span>
  return (
    <span className={`badge border text-xs ${
      restriction === 'Heroes'   ? 'bg-blue-900/40 text-blue-300 border-blue-700' :
      restriction === 'Villains' ? 'bg-red-900/40  text-red-300  border-red-700'  :
                                   'bg-[#3D3D60]   text-[#C8C8E0] border-[#555]'
    }`}>{restriction}</span>
  )
}

function Chain({ d }: { d: EffectData }) {
  const parts: React.ReactNode[] = []
  if (d.category)        parts.push(<span key="c"  className={`badge border ${catColor(d.category)}`}>{d.category}</span>)
  if (d.sous_category)   parts.push(<span key="s1" className="badge border bg-indigo-900/40 text-indigo-200 border-indigo-700">{d.sous_category}</span>)
  if (d.sous_category_2) parts.push(<span key="s2" className="badge border bg-violet-900/40 text-violet-200 border-violet-700">{d.sous_category_2}</span>)
  if (d.sous_category_3) parts.push(<span key="s3" className="badge border bg-fuchsia-900/40 text-fuchsia-200 border-fuchsia-700">{d.sous_category_3}</span>)
  return (
    <div className="flex flex-wrap items-center gap-1">
      {parts.map((p, i) => <Fragment key={i}>{i > 0 && <span className="text-[#555] select-none text-xs">→</span>}{p}</Fragment>)}
    </div>
  )
}

function EffectBlock({ label, d, synergyWith }: { label: string; d: EffectData; synergyWith?: string | null }) {
  const details = [
    d.degats && `Dmg: ${d.degats}`, d.quantite && `Qty: ${d.quantite}`, d.force && `Force: ${d.force}`,
    d.choix, d.autre, d.trigger && `Trigger: ${d.trigger}`,
  ].filter(Boolean) as string[]
  return (
    <div className={`rounded-lg p-3 space-y-2 ${synergyWith !== undefined ? 'bg-blue-900/20 border border-blue-900/60' : 'bg-[#1C1C2E]'}`}>
      <p className="text-xs text-[#C8C8E0] font-medium">
        {label}{synergyWith ? <span className="text-marvel-gold"> · with {synergyWith}</span> : null}
      </p>
      {d.description && (
        <p className="text-xs text-[#C8C8E0] leading-relaxed border-l-2 border-[#3D3D60] pl-2 italic whitespace-pre-line">{d.description}</p>
      )}
      <Chain d={d} />
      {details.length > 0 && <p className="text-xs text-[#D8D8EE]">{details.join('  ·  ')}</p>}
    </div>
  )
}

function SupportCard({ s, open, onToggle, onEdit, onRemove }: {
  s: Support; open: boolean; onToggle: () => void; onEdit: (s: Support) => void; onRemove: (id: string) => void
}) {
  const cats = [...new Set(PREFIXES.map(p => get(s, p, 'category')).filter(Boolean) as string[])]
  return (
    <div className="card">
      {/* two sibling controls: expand area + actions (no nested buttons) */}
      <div className="flex items-center gap-3">
        <button onClick={onToggle} aria-expanded={open} className="flex items-center gap-3 flex-1 min-w-0 text-left group">
          {s.rang ? <StarBadge stars={Math.min(s.rang, 6) as 1|2|3|4|5|6} /> : <span className="text-[#555]">—</span>}
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-white group-hover:text-marvel-gold transition-colors">{s.name}</span>
            {cats.length > 0 && (
              <div className="flex gap-1 mt-1 flex-wrap">
                {cats.map(c => <span key={c} className={`badge border text-xs ${catColor(c)}`}>{c}</span>)}
              </div>
            )}
          </div>
          <span className="text-xs text-[#C8C8E0] whitespace-nowrap">Lvl <span className="text-base font-semibold text-white">{s.niveau ?? '—'}</span></span>
          <span className="min-w-16 text-center"><RestrictionBadge restriction={s.restriction} /></span>
          {open ? <ChevronUp size={14} className="text-[#C8C8E0]" /> : <ChevronDown size={14} className="text-[#C8C8E0]" />}
        </button>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => onEdit(s)} aria-label="Edit" className="text-[#C8C8E0] hover:text-white"><Pencil size={14} /></button>
          <button onClick={() => onRemove(s.id)} aria-label="Delete" className="text-[#C8C8E0] hover:text-red-400"><Trash2 size={14} /></button>
        </div>
      </div>

      {open && (
        <div className="mt-4 pt-4 border-t border-[#3D3D60] space-y-2">
          {EFFECTS.map(n => {
            const d = dataOf(s, `effect_${n}`)
            return hasData(d) ? <EffectBlock key={n} label={`Effect ${n}`} d={d} /> : null
          })}
          {(() => {
            const d = dataOf(s, 'synergy')
            return hasData(d) || s.synergy_restriction
              ? <EffectBlock label="Synergy" d={d} synergyWith={s.synergy_restriction ?? ''} /> : null
          })()}
          {!EFFECTS.some(n => hasData(dataOf(s, `effect_${n}`))) && !hasData(dataOf(s, 'synergy')) && (
            <p className="text-xs text-[#555]">No effects yet</p>
          )}
        </div>
      )}
    </div>
  )
}

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

export default function Supports() {
  const [supports, setSupports]       = useState<Support[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)   // page banner
  const [formError, setFormError]     = useState<string | null>(null)   // inside the modal
  const [search, setSearch]           = useState('')
  const [filterEffect, setFilterEffect] = useState('')
  const [sortCol, setSortCol]         = useState<SortCol>('name')
  const [sortDir, setSortDir]         = useState<SortDir>('asc')
  const [view, setViewState]          = useState<ViewMode>(() => {
    try { return localStorage.getItem('supports_view') === 'table' ? 'table' : 'cards' } catch { return 'cards' }
  })
  const [expanded, setExpanded]       = useState<string | null>(null)
  const [modal, setModal]             = useState<'add' | 'edit' | null>(null)
  const [form, setForm]               = useState<typeof EMPTY>(EMPTY)
  const [editId, setEditId]           = useState<string | null>(null)
  const [saving, setSaving]           = useState(false)
  const [customRestr, setCustomRestr] = useState('')
  const [shown, setShown]             = useState(1)   // effects visible in the modal

  function setView(v: ViewMode) {
    setViewState(v)
    try { localStorage.setItem('supports_view', v) } catch { /* private mode: not remembered */ }
  }

  async function load() {
    try {
      setSupports(await fetchAll<Support>('mpq_tracker_supports', ['name', 'id']))
      setError(null)
    } catch (e: any) {
      setError(e?.message ?? String(e))
    }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function toggleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir(col === 'rang' || col === 'niveau' ? 'desc' : 'asc') }
  }

  // Unique lists built from existing data (effects 1-5 + synergy)
  const { allCategories, categoryMap, sousMap, sousMap2, allTriggers } = useMemo(() => {
    const cats = new Set<string>(), trig = new Set<string>()
    const categoryMap: Record<string, string[]> = {}  // category → sous_categories
    const sousMap:     Record<string, string[]> = {}  // sous_category → sous_category_2
    const sousMap2:    Record<string, string[]> = {}  // sous_category_2 → sous_category_3
    const link = (m: Record<string, string[]>, k: string | null, v: string | null) => {
      if (!k || !v) return
      const a = m[k] ?? (m[k] = [])
      if (!a.includes(v)) a.push(v)
    }
    for (const s of supports) for (const p of PREFIXES) {
      const c = get(s, p, 'category'), s1 = get(s, p, 'sous_category')
      const s2 = get(s, p, 'sous_category_2'), s3 = get(s, p, 'sous_category_3'), t = get(s, p, 'trigger')
      if (c) cats.add(c)
      if (t) trig.add(t)
      link(categoryMap, c, s1); link(sousMap, s1, s2); link(sousMap2, s2, s3)
    }
    ;[categoryMap, sousMap, sousMap2].forEach(m => Object.values(m).forEach(a => a.sort()))
    return { allCategories: [...cats].sort(), categoryMap, sousMap, sousMap2, allTriggers: [...trig].sort() }
  }, [supports])

  const allRestrictions = useMemo(() =>
    [...new Set([...DEFAULT_RESTRICTIONS, ...supports.map(s => s.restriction).filter(Boolean) as string[]])].sort(),
  [supports])

  // Search text per support, built once: name, restriction, synergy target and EVERY text field
  // of the 5 effects and of the synergy (description, 3 sub-categories, dmg, qty, force, choice, other, trigger)
  const index = useMemo(() => supports.map(s => ({
    s,
    text: [s.name, s.restriction, s.synergy_restriction,
      ...PREFIXES.flatMap(p => EFFECT_FIELDS.map(f => get(s, p, f)))]
      .filter(Boolean).join('\n').toLowerCase(),
  })), [supports])

  const visible = useMemo(() => {
    const q = search.toLowerCase()
    return index
      .filter(({ s, text }) => (!q || text.includes(q))
        && (!filterEffect || PREFIXES.some(p => get(s, p, 'category') === filterEffect)))
      .map(x => x.s)
      .sort((a, b) => {
        const va = a[sortCol] ?? '', vb = b[sortCol] ?? ''
        if (va === '' && vb !== '') return 1       // empty values always last
        if (vb === '' && va !== '') return -1
        const x = typeof va === 'number' ? va : String(va).toLowerCase()
        const y = typeof vb === 'number' ? vb : String(vb).toLowerCase()
        if (x < y) return sortDir === 'asc' ? -1 : 1
        if (x > y) return sortDir === 'asc' ? 1 : -1
        return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1
      })
  }, [index, search, filterEffect, sortCol, sortDir])

  function openAdd() { setForm(EMPTY); setEditId(null); setShown(1); setModal('add') }
  function openEdit(s: Support) {
    const { id, created_at, updated_at, ...rest } = s
    setForm(rest); setEditId(s.id)
    setShown(Math.max(1, ...EFFECTS.filter(n => hasEffect(rest, n))))  // show every filled effect
    setModal('edit')
  }
  function closeModal() { setModal(null); setEditId(null); setCustomRestr(''); setFormError(null) }

  function setEffect(n: EffectNum, field: keyof EffectData, val: string | null) {
    setForm(f => ({ ...f, [`effect_${n}_${field}`]: val }))
  }
  function setSynergyField(field: keyof EffectData, val: string | null) {
    setForm(f => ({ ...f, [`synergy_${field}`]: val }))
  }
  function getSynergyData(): EffectData {
    return {
      description:     form.synergy_description,
      category:        form.synergy_category,
      sous_category:   form.synergy_sous_category,
      sous_category_2: form.synergy_sous_category_2,
      sous_category_3: form.synergy_sous_category_3,
      degats: form.synergy_degats, quantite: form.synergy_quantite,
      force: form.synergy_force, choix: form.synergy_choix,
      autre: form.synergy_autre, trigger: form.synergy_trigger,
    }
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
    if (!form.name) return
    setSaving(true); setFormError(null)
    const row = { ...form, restriction: customRestr.trim() || form.restriction }
    const t = supabase.from('mpq_tracker_supports')
    const { error: err } = modal === 'add'
      ? await t.insert([row])
      : await t.update({ ...row, updated_at: new Date().toISOString() }).eq('id', editId!)
    if (err) { setFormError(err.message); setSaving(false); return }  // modal stays open, input kept
    await load(); closeModal(); setSaving(false)
  }

  async function remove(id: string) {
    if (!confirm('Delete this support?')) return
    const { error: err } = await supabase.from('mpq_tracker_supports').delete().eq('id', id)
    if (err) { setError(err.message); return }  // row stays on screen
    setSupports(prev => prev.filter(s => s.id !== id))
  }

  const sortBtns: [SortCol, string][] = [['name', 'Name'], ['rang', '★'], ['niveau', 'Lvl.'], ['restriction', 'Restr.']]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Supports</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add</button>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-900/40 border border-red-700 text-red-200 text-sm rounded-lg px-3 py-2">
          <span className="flex-1">{error}</span>
          <button onClick={() => { setLoading(true); load() }} className="underline hover:text-white">Retry</button>
          <button onClick={() => setError(null)} aria-label="Dismiss"><X size={14} /></button>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-56">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C8C8E0]" />
          <input className="input pl-9" placeholder="Search name, category, description, trigger, synergy..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={filterEffect} onChange={e => setFilterEffect(e.target.value)}>
          <option value="">All effects</option>
          {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex gap-1 bg-[#1E1E38] p-1 rounded-lg">
          <button onClick={() => setView('cards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === 'cards' ? 'bg-marvel-red text-white' : 'text-[#C8C8E0] hover:text-white'}`}>
            <LayoutGrid size={13} /> Cards
          </button>
          <button onClick={() => setView('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === 'table' ? 'bg-marvel-red text-white' : 'text-[#C8C8E0] hover:text-white'}`}>
            <List size={13} /> Table
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-[#C8C8E0]">
        {view === 'cards' && (
          <>
            <span>Sort by:</span>
            <div className="flex gap-3 bg-[#1E1E38] px-3 py-1.5 rounded-lg">
              {sortBtns.map(([col, label]) => (
                <button key={col} onClick={() => toggleSort(col)}
                  className={`flex items-center gap-1 text-xs font-medium transition-colors ${sortCol === col ? 'text-marvel-gold' : 'text-[#C8C8E0] hover:text-white'}`}>
                  {label}
                  {sortCol === col ? (sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}
                </button>
              ))}
            </div>
          </>
        )}
        <span className="text-sm">{visible.length} support{visible.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? <Spinner /> : view === 'cards' ? (
        <div className="space-y-2">
          {visible.map(s => (
            <SupportCard key={s.id} s={s} open={expanded === s.id}
              onToggle={() => setExpanded(expanded === s.id ? null : s.id)} onEdit={openEdit} onRemove={remove} />
          ))}
          {visible.length === 0 && <div className="card text-center text-[#C8C8E0] py-12">No supports found</div>}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#3D3D60]">
                <Th col="name"        label="Name"   sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                <Th col="rang"        label="★"      sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                <Th col="niveau"      label="Lvl."   sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                <Th col="restriction" label="Restr." sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                {EFFECTS.map(n => (
                  <th key={n} className="py-2 px-1 font-normal text-center text-[#C8C8E0] min-w-28">Effect {n}</th>
                ))}
                <th className="py-2 px-1 font-normal text-center text-[#C8C8E0] min-w-28">Synergy</th>
                <th className="py-2 px-2 font-normal text-center text-[#C8C8E0] sticky right-0 bg-[#252540] z-10">Actions</th>
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
                  <td className="py-2 px-2 text-center"><RestrictionBadge restriction={s.restriction} /></td>
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
                      {s.synergy_description   && <span className="text-[#D8D8EE] italic">{s.synergy_description}</span>}
                      {s.synergy_category      && <span className={`badge border ${catColor(s.synergy_category)}`}>{s.synergy_category}</span>}
                      {s.synergy_sous_category && <span className="badge border bg-indigo-900/40 text-indigo-200 border-indigo-700">{s.synergy_sous_category}</span>}
                      {s.synergy_sous_category_2 && <span className="badge border bg-violet-900/40 text-violet-200 border-violet-700">{s.synergy_sous_category_2}</span>}
                      {s.synergy_sous_category_3 && <span className="badge border bg-fuchsia-900/40 text-fuchsia-200 border-fuchsia-700">{s.synergy_sous_category_3}</span>}
                      {!s.synergy_restriction && !s.synergy_description && !s.synergy_category && !s.synergy_sous_category && !s.synergy_sous_category_2 && !s.synergy_sous_category_3 && (
                        <span className="text-[#444]">—</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-2 text-center sticky right-0 bg-[#252540] z-10">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openEdit(s)} className="text-[#C8C8E0] hover:text-white"><Pencil size={13} /></button>
                      <button onClick={() => remove(s.id)} className="text-[#C8C8E0] hover:text-red-400"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && <p className="text-center text-[#C8C8E0] py-8">No supports found</p>}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="card w-full max-w-2xl my-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-marvel text-xl text-marvel-gold">{modal === 'add' ? 'New Support' : 'Edit Support'}</h2>
              <button onClick={closeModal}><X size={18} className="text-[#C8C8E0] hover:text-white" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-[#C8C8E0] mb-1 block">Name *</label>
                  <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-[#C8C8E0] mb-1 block">Rank ★</label>
                  <input type="number" className="input" value={form.rang ?? ''} onChange={e => setForm(f => ({ ...f, rang: Number(e.target.value) || null }))} />
                </div>
                <div>
                  <label className="text-xs text-[#C8C8E0] mb-1 block">Level</label>
                  <input type="number" className="input" value={form.niveau ?? ''} onChange={e => setForm(f => ({ ...f, niveau: Number(e.target.value) || null }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#C8C8E0] mb-1 block">Restriction</label>
                  <select className="input" value={customRestr ? '__custom__' : (form.restriction ?? '/')}
                    onChange={e => { if (e.target.value === '__custom__') setCustomRestr(' '); else { setCustomRestr(''); setForm(f => ({ ...f, restriction: e.target.value })) } }}>
                    {allRestrictions.map(r => <option key={r} value={r}>{r}</option>)}
                    <option value="__custom__">+ New restriction...</option>
                  </select>
                </div>
                {customRestr !== '' && (
                  <div>
                    <label className="text-xs text-[#C8C8E0] mb-1 block">Nouvelle restriction</label>
                    <input className="input" placeholder="Ex: Symbiote, Mutant..." value={customRestr.trim()} onChange={e => setCustomRestr(e.target.value)} />
                  </div>
                )}
              </div>

              {/* Effects 1–5: effect 1 always shown, "+ Add effect" reveals the next one */}
              <div>
                <p className="text-xs font-semibold text-marvel-gold mb-2">Effects (up to {EFFECTS.length})</p>
                <div className="space-y-2">
                  {EFFECTS.filter(n => n <= shown).map(n => (
                    <div key={n} className="relative">
                      <EffectForm
                        label={`Effect ${n}`}
                        data={{
                          description:     form[`effect_${n}_description`],
                          category:        form[`effect_${n}_category`],
                          sous_category:   form[`effect_${n}_sous_category`],
                          sous_category_2: form[`effect_${n}_sous_category_2`],
                          sous_category_3: form[`effect_${n}_sous_category_3`],
                          degats:          form[`effect_${n}_degats`],
                          quantite:        form[`effect_${n}_quantite`],
                          force:           form[`effect_${n}_force`],
                          choix:           form[`effect_${n}_choix`],
                          autre:           form[`effect_${n}_autre`],
                          trigger:         form[`effect_${n}_trigger`],
                        }}
                        onChange={(field, val) => setEffect(n, field, val)}
                        allCategories={allCategories}
                        categoryMap={categoryMap}
                        sousMap={sousMap}
                        sousMap2={sousMap2}
                        allTriggers={allTriggers}
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

              <div>
                <p className="text-xs font-semibold text-marvel-gold mb-2">Synergy</p>
                <div className="bg-[#1C1C2E] rounded-lg p-3 space-y-2">
                  <div>
                    <label className="text-xs text-[#C8C8E0] mb-1 block">With (character / tag)</label>
                    <input className="input text-sm" value={form.synergy_restriction ?? ''}
                      onChange={e => setForm(f => ({ ...f, synergy_restriction: e.target.value || null }))} placeholder="Ex: Spider-Ham, Heroes..." />
                  </div>
                  <EffectForm
                    label="Effect synergie"
                    data={getSynergyData()}
                    onChange={setSynergyField}
                    allCategories={allCategories}
                    categoryMap={categoryMap}
                    sousMap={sousMap}
                    sousMap2={sousMap2}
                    allTriggers={allTriggers}
                  />
                </div>
              </div>

              {formError && (
                <div className="bg-red-900/40 border border-red-700 text-red-200 text-sm rounded-lg px-3 py-2">{formError}</div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
                <button onClick={save} disabled={saving || !form.name} className="btn-primary flex-1">{saving ? 'Saving...' : 'Save'}</button>
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
