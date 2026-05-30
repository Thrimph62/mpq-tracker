import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Character, CharacterStatus, Stars } from '../types'
import { StarBadge, InlineStatusBadge, InlineAscendedBadge, InlineDuplicateBadge } from '../components/Badges'
import { Plus, Search, X, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

const STATUSES: CharacterStatus[] = ['not_owned', 'rostered', 'champ', 'max_champ']
const STARS_OPTIONS: Stars[] = [6, 5, 4, 3, 2, 1]

const STATUS_FR: Record<CharacterStatus, string> = {
  max_champ: 'Max Champ', champ: 'Champ', rostered: 'Roster', not_owned: 'Not Owned',
}

function parseBaseName(name: string): { base: string; version: string | null } {
  const m = name.match(/^(.+?)\s*\((.+)\)$/)
  return m ? { base: m[1].trim(), version: m[2].trim() } : { base: name, version: null }
}

const EMPTY: Omit<Character, 'id' | 'created_at' | 'updated_at'> = {
  name: '', base_name: '', version: null, stars: 5,
  level: null, status: 'rostered', ascended: false, is_duplicate: false, affiliations: [], notes: null,
}

// Auto-assign duplicates within a name group
// The one with the highest level (ties: oldest created_at) = Original, rest = Dupe
async function autoAssignDuplicates(chars: Character[], nameFilter?: string): Promise<Character[]> {
  const groups: Record<string, Character[]> = {}
  chars.forEach(c => {
    const key = c.name
    groups[key] = groups[key] ?? []
    groups[key].push(c)
  })

  const updates: { id: string; is_duplicate: boolean }[] = []
  const result = [...chars]

  const groupsToProcess = nameFilter
    ? { [nameFilter]: groups[nameFilter] ?? [] }
    : groups

  for (const [, group] of Object.entries(groupsToProcess)) {
    if (group.length <= 1) {
      // Single copy — always Original
      if (group.length === 1 && group[0].is_duplicate) {
        updates.push({ id: group[0].id, is_duplicate: false })
        const idx = result.findIndex(c => c.id === group[0].id)
        if (idx !== -1) result[idx] = { ...result[idx], is_duplicate: false }
      }
      continue
    }
    // Find the "winner" — highest level, ties broken by oldest created_at
    const winner = group.reduce((best, c) => {
      const bLvl = best.level ?? -1
      const cLvl = c.level ?? -1
      if (cLvl > bLvl) return c
      if (cLvl === bLvl && c.created_at < best.created_at) return c
      return best
    })
    for (const c of group) {
      const shouldBeDupe = c.id !== winner.id
      if (c.is_duplicate !== shouldBeDupe) {
        updates.push({ id: c.id, is_duplicate: shouldBeDupe })
        const idx = result.findIndex(r => r.id === c.id)
        if (idx !== -1) result[idx] = { ...result[idx], is_duplicate: shouldBeDupe }
      }
    }
  }

  // Batch update Supabase
  for (const u of updates) {
    await supabase.from('mpq_tracker_characters')
      .update({ is_duplicate: u.is_duplicate, updated_at: new Date().toISOString() })
      .eq('id', u.id)
  }

  return result
}

// Common MPQ affiliations — pre-populated for quick reference
const DEFAULT_AFFILIATIONS = [
  'Avengers', 'Champions', 'Defenders', 'Guardians of the Galaxy',
  'Heroes', 'Horsemen', 'Illuminati', 'Inhumans',
  'S.H.I.E.L.D.', 'Spider-Friends', 'Symbiote', 'Villains',
  'X-Men', 'X-Force',
]
function AffiliationEditor({ affiliations, onChange, allAffiliations }: {
  affiliations: string[]
  onChange: (v: string[]) => void
  allAffiliations: string[]
}) {
  const [inputVal, setInputVal] = useState('')
  const [open, setOpen]         = useState(false)

  const suggestions = allAffiliations.filter(a =>
    !affiliations.includes(a) && a.toLowerCase().includes(inputVal.toLowerCase())
  )

  function add(val: string) {
    const v = val.trim()
    if (v && !affiliations.includes(v)) onChange([...affiliations, v].sort())
    setInputVal(''); setOpen(false)
  }

  function remove(a: string) {
    onChange(affiliations.filter(x => x !== a))
  }

  return (
    <div className="space-y-2">
      {/* Existing badges */}
      {affiliations.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {affiliations.map(a => (
            <span key={a} className="badge text-xs bg-teal-900/40 text-teal-300 border border-teal-700 flex items-center gap-1">
              {a}
              <button onClick={() => remove(a)} className="hover:text-white ml-0.5">×</button>
            </span>
          ))}
        </div>
      )}
      {/* Add new */}
      <div className="relative">
        <input
          className="input text-sm"
          placeholder="Add affiliation..."
          value={inputVal}
          onChange={e => { setInputVal(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={e => { if (e.key === 'Enter' && inputVal.trim()) { e.preventDefault(); add(inputVal) } }}
        />
        {open && (suggestions.length > 0 || inputVal.trim()) && (
          <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-[#1A1A2E] border border-[#3D3D60] rounded-lg shadow-xl max-h-40 overflow-y-auto">
            {suggestions.map(a => (
              <button key={a} type="button" onMouseDown={() => add(a)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-[#3D3D60] text-[#C8C8E0]">
                {a}
              </button>
            ))}
            {inputVal.trim() && !allAffiliations.includes(inputVal.trim()) && (
              <button type="button" onMouseDown={() => add(inputVal)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-[#3D3D60] text-teal-300 italic">
                + Add "{inputVal.trim()}"
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

type SortField = 'base_name' | 'stars' | 'level'
type SortDir   = 'asc' | 'desc'

function InlineLevelCell({ id, level, onSave }: {
  id: string; level: number | null; onSave: (id: string, val: number | null) => void
}) {
  const [editing, setEditing] = useState(false)
  const [val, setVal]         = useState(String(level ?? ''))
  const inputRef              = useRef<HTMLInputElement>(null)

  function startEdit() { setVal(String(level ?? '')); setEditing(true); setTimeout(() => inputRef.current?.select(), 0) }
  function commit() {
    setEditing(false)
    const n = val === '' ? null : Number(val)
    if (n !== level) onSave(id, n)
  }
  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commit()
    if (e.key === 'Escape') { setEditing(false); setVal(String(level ?? '')) }
  }
  function increment(e: React.MouseEvent) {
    e.stopPropagation()
    const next = (level ?? 0) + 1
    onSave(id, next)
  }

  if (editing) return (
    <input ref={inputRef} type="number" value={val}
      onChange={e => setVal(e.target.value)} onBlur={commit} onKeyDown={handleKey}
      className="w-16 bg-[#1C1C2E] border border-marvel-red rounded px-1 py-0.5 text-center text-white text-xs outline-none" />
  )
  return (
    <div className="flex items-center justify-center gap-1">
      <button onClick={startEdit} title="Cliquer pour modifier le niveau"
        className="text-[#C8C8E0] hover:text-white hover:bg-[#3D3D60] rounded px-2 py-0.5 transition-all min-w-8 text-center">
        {level ?? '—'}
      </button>
      <button onClick={increment} title="+1"
        className="text-[#C8C8E0] hover:text-white hover:bg-green-800/50 rounded px-1.5 py-0.5 text-xs font-bold transition-all leading-none">
        +
      </button>
    </div>
  )
}

function SortBtn({ field, current, dir, onClick }: {
  field: SortField; current: SortField; dir: SortDir; onClick: () => void
}) {
  const active = field === current
  return (
    <button onClick={onClick} className={`flex items-center gap-1 text-xs font-medium transition-colors ${active ? 'text-marvel-gold' : 'text-[#C8C8E0] hover:text-white'}`}>
      {field === 'base_name' ? 'Name' : field === 'stars' ? 'Stars' : 'Level'}
      {active ? (dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}
    </button>
  )
}

export default function Characters() {
  const [chars, setChars]     = useState<Character[]>([])
  const [loading, setLoading] = useState(true)

  // Collect all unique affiliations from existing characters only
  const allAffiliations = [...new Set(
    chars.flatMap(c => Array.isArray(c.affiliations) ? c.affiliations : [])
  )].sort()
  const [search, setSearch]   = useState('')
  const [filterStars, setFilterStars]       = useState<Stars | 0>(0)
  const [filterStatus, setFilterStatus]     = useState<CharacterStatus | ''>('')
  const [filterAscended, setFilterAscended] = useState<'all' | 'yes' | 'no'>('all')
  const [sortField, setSortField] = useState<SortField>('base_name')
  const [sortDir, setSortDir]     = useState<SortDir>('asc')
  const [modal, setModal]         = useState<'add' | 'edit' | null>(null)
  const [form, setForm]           = useState<typeof EMPTY>(EMPTY)
  const [editId, setEditId]       = useState<string | null>(null)
  const [saving, setSaving]       = useState(false)

  async function load() {
    const { data } = await supabase.from('mpq_tracker_characters').select('*')
      .order('base_name').order('version').order('level', { ascending: false })
    if (data) {
      const assigned = await autoAssignDuplicates(data as Character[])
      setChars(assigned)
    }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function toggleSort(f: SortField) {
    if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(f); setSortDir('asc') }
  }

  const filtered = chars
    .filter(c => {
      const matchSearch   = c.name.toLowerCase().includes(search.toLowerCase()) || c.base_name.toLowerCase().includes(search.toLowerCase())
      const matchStars    = filterStars === 0 || c.stars === filterStars
      const matchStatus   = filterStatus === '' || c.status === filterStatus
      const matchAscended = filterAscended === 'all' || (filterAscended === 'yes' ? c.ascended : !c.ascended)
      return matchSearch && matchStars && matchStatus && matchAscended
    })
    .sort((a, b) => {
      const va = sortField === 'base_name' ? a.base_name.toLowerCase() : sortField === 'stars' ? a.stars : (a.level ?? -1)
      const vb = sortField === 'base_name' ? b.base_name.toLowerCase() : sortField === 'stars' ? b.stars : (b.level ?? -1)
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      if (sortField === 'base_name') {
        const va2 = a.version?.toLowerCase() ?? '', vb2 = b.version?.toLowerCase() ?? ''
        if (va2 < vb2) return -1; if (va2 > vb2) return 1
        return (b.level ?? -1) - (a.level ?? -1)
      }
      return (b.level ?? -1) - (a.level ?? -1)
    })


  function openAdd()  { setForm(EMPTY); setEditId(null); setModal('add') }
  function openEdit(c: Character) {
    const { id, created_at, updated_at, ...rest } = c
    setForm(rest); setEditId(c.id); setModal('edit')
  }
  function closeModal() { setModal(null); setEditId(null) }

  function handleNameChange(name: string) {
    const { base, version } = parseBaseName(name)
    setForm(f => ({ ...f, name, base_name: base, version }))
  }

  async function save() {
    setSaving(true)
    const payload = { ...form, base_name: form.base_name || parseBaseName(form.name).base, version: form.version || parseBaseName(form.name).version }
    if (modal === 'add') await supabase.from('mpq_tracker_characters').insert([payload])
    else if (editId) await supabase.from('mpq_tracker_characters').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editId)
    await load(); closeModal(); setSaving(false)
  }

  async function remove(id: string) {
    if (!confirm('Delete this character?')) return
    await supabase.from('mpq_tracker_characters').delete().eq('id', id)
    const remaining = chars.filter(c => c.id !== id)
    const assigned  = await autoAssignDuplicates(remaining)
    setChars(assigned)
  }

  async function updateStatus(id: string, status: CharacterStatus) {
    await supabase.from('mpq_tracker_characters').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    setChars(prev => prev.map(c => c.id === id ? { ...c, status } : c))
  }

  async function updateAscended(id: string, ascended: boolean) {
    await supabase.from('mpq_tracker_characters').update({ ascended, updated_at: new Date().toISOString() }).eq('id', id)
    setChars(prev => prev.map(c => c.id === id ? { ...c, ascended } : c))
  }

  async function updateLevel(id: string, level: number | null) {
    await supabase.from('mpq_tracker_characters').update({ level, updated_at: new Date().toISOString() }).eq('id', id)
    const updated  = chars.map(c => c.id === id ? { ...c, level } : c)
    const charName = chars.find(c => c.id === id)?.name
    const assigned = await autoAssignDuplicates(updated, charName)
    setChars(assigned)
  }

  async function updateDuplicate(id: string, is_duplicate: boolean) {
    await supabase.from('mpq_tracker_characters').update({ is_duplicate, updated_at: new Date().toISOString() }).eq('id', id)
    setChars(prev => prev.map(c => c.id === id ? { ...c, is_duplicate } : c))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Characters</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add</button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C8C8E0]" />
          <input className="input pl-9" placeholder="Search by name or version..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={filterStars} onChange={e => setFilterStars(Number(e.target.value) as Stars | 0)} className="input w-auto">
          <option value={0}>All ★</option>
          {STARS_OPTIONS.map(s => <option key={s} value={s}>{'★'.repeat(s)}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as CharacterStatus | '')} className="input w-auto">
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_FR[s]}</option>)}
        </select>
        <select value={filterAscended} onChange={e => setFilterAscended(e.target.value as 'all' | 'yes' | 'no')} className="input w-auto">
          <option value="all">Ascended: all</option>
          <option value="yes">Ascended only</option>
          <option value="no">Not ascended</option>
        </select>
      </div>

      <div className="flex items-center gap-2 text-xs text-[#C8C8E0]">
        <span>Sort by:</span>
        <div className="flex gap-3 bg-[#1E1E38] px-3 py-1.5 rounded-lg">
          {(['base_name', 'stars', 'level'] as SortField[]).map(f => (
            <SortBtn key={f} field={f} current={sortField} dir={sortDir} onClick={() => toggleSort(f)} />
          ))}
        </div>
        <span className="ml-1 text-[#555]">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? <Spinner /> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#3D3D60] text-[#C8C8E0]">
                <th className="text-center py-2 font-normal">
                  <button onClick={() => toggleSort('base_name')} className="flex items-center gap-1 mx-auto hover:text-white transition-colors">
                    Character {sortField === 'base_name' ? (sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}
                  </button>
                </th>
                <th className="text-center py-2 font-normal text-xs">Version</th>
                <th className="text-center py-2 font-normal text-xs">Affiliations</th>
                <th className="text-center py-2 font-normal">
                  <button onClick={() => toggleSort('stars')} className="flex items-center gap-1 mx-auto hover:text-white transition-colors">
                    ★ {sortField === 'stars' ? (sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}
                  </button>
                </th>
                <th className="text-center py-2 font-normal">
                  <button onClick={() => toggleSort('level')} className="flex items-center gap-1 mx-auto hover:text-white transition-colors">
                    Level <span className="text-[#555] text-xs">(clic)</span> {sortField === 'level' ? (sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}
                  </button>
                </th>
                <th className="text-center py-2 font-normal">Status <span className="text-[#555] text-xs">(clic)</span></th>
                <th className="text-center py-2 font-normal">Asc. <span className="text-[#555] text-xs">(clic)</span></th>
                <th className="text-center py-2 font-normal">Duplicate <span className="text-[#555] text-xs">(click)</span></th>
                <th className="text-center py-2 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-[#3D3D60]/40 hover:bg-[#3D3D60]/20">
                  <td className="py-2 text-center font-medium">{c.base_name || parseBaseName(c.name).base}</td>
                  <td className="py-2 text-center text-xs text-[#C8C8E0]">
                    {c.version && <span className="bg-[#3D3D60] px-1.5 py-0.5 rounded">{c.version}</span>}
                  </td>
                  <td className="py-2 text-center">
                    <div className="flex flex-wrap gap-1 justify-center max-w-40">
                      {([...(Array.isArray(c.affiliations) ? c.affiliations : [])].sort()).map(a => (
                        <span key={a} className="badge text-xs bg-teal-900/40 text-teal-300 border border-teal-700">{a}</span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2 text-center"><StarBadge stars={c.stars as Stars} /></td>
                  <td className="py-2 text-center">
                    <InlineLevelCell id={c.id} level={c.level} onSave={updateLevel} />
                  </td>
                  <td className="py-2 text-center">
                    <InlineStatusBadge status={c.status as CharacterStatus} onChange={s => updateStatus(c.id, s)} />
                  </td>
                  <td className="py-2 text-center">
                    <InlineAscendedBadge ascended={c.ascended} onChange={a => updateAscended(c.id, a)} />
                  </td>
                  <td className="py-2 text-center">
                    <InlineDuplicateBadge is_duplicate={c.is_duplicate} onChange={d => updateDuplicate(c.id, d)} />
                  </td>
                  <td className="py-2 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openEdit(c)} className="text-[#C8C8E0] hover:text-white transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => remove(c.id)} className="text-[#C8C8E0] hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center text-[#C8C8E0] py-8">No characters found</p>}
        </div>
      )}


      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-marvel text-xl text-marvel-gold">{modal === 'add' ? 'Add un character' : 'Edit'}</h2>
              <button onClick={closeModal}><X size={18} className="text-[#C8C8E0] hover:text-white" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#C8C8E0] mb-1 block">Name *</label>
                  <input className="input" value={form.base_name}
                    onChange={e => setForm(f => ({ ...f, base_name: e.target.value, name: e.target.value + (f.version ? ` (${f.version})` : '') }))}
                    placeholder="Ex: Spider-Man" />
                </div>
                <div>
                  <label className="text-xs text-[#C8C8E0] mb-1 block">Version <span className="text-[#555]">(optional)</span></label>
                  <input className="input" value={form.version ?? ''}
                    onChange={e => setForm(f => ({ ...f, version: e.target.value || null, name: f.base_name + (e.target.value ? ` (${e.target.value})` : '') }))}
                    placeholder="Ex: Classic" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#C8C8E0] mb-1 block">Stars</label>
                  <select className="input" value={form.stars} onChange={e => setForm(f => ({ ...f, stars: Number(e.target.value) as Stars }))}>
                    {STARS_OPTIONS.map(s => <option key={s} value={s}>{s}★</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#C8C8E0] mb-1 block">Level</label>
                  <input type="number" className="input" value={form.level ?? ''}
                    onChange={e => setForm(f => ({ ...f, level: e.target.value ? Number(e.target.value) : null }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#C8C8E0] mb-1 block">Status</label>
                  <select className="input" value={form.status ?? 'rostered'} onChange={e => setForm(f => ({ ...f, status: e.target.value as CharacterStatus }))}>
                    {STATUSES.map(s => <option key={s} value={s}>{STATUS_FR[s]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#C8C8E0] mb-1 block">Ascended</label>
                  <button type="button" onClick={() => setForm(f => ({ ...f, ascended: !f.ascended }))}
                    className={`w-full py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                      form.ascended ? 'bg-cyan-900/60 border-cyan-600 text-cyan-300' : 'bg-[#1C1C2E] border-[#3D3D60] text-[#C8C8E0] hover:border-cyan-600/50'
                    }`}>
                    {form.ascended ? '⬆ Ascended' : '⬆ Not ascended'}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-[#C8C8E0] mb-1 block">Affiliations</label>
                <AffiliationEditor
                  affiliations={form.affiliations ?? []}
                  onChange={v => setForm(f => ({ ...f, affiliations: v }))}
                  allAffiliations={allAffiliations}
                />
              </div>
              <div>
                <label className="text-xs text-[#C8C8E0] mb-1 block">Notes</label>
                <textarea className="input resize-none h-20" value={form.notes ?? ''}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value || null }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
                <button onClick={save} disabled={saving || !form.base_name} className="btn-primary flex-1">
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
