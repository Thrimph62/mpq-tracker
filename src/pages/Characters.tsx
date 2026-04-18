import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Character, CharacterStatus, Stars } from '../types'
import { StarBadge, InlineStatusBadge, InlineAscendedBadge } from '../components/Badges'
import { Plus, Search, X, Pencil, Trash2, Layers, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

const STATUSES: CharacterStatus[] = ['max_champ', 'champ', 'rostered', 'not_owned']
const STARS_OPTIONS: Stars[] = [6, 5, 4, 3, 2, 1]

const STATUS_FR: Record<CharacterStatus, string> = {
  max_champ: 'Max Champ', champ: 'Champ',
  rostered: 'Roster', not_owned: 'Non Possédé',
}

function parseBaseName(name: string): { base: string; version: string | null } {
  const m = name.match(/^(.+?)\s*\((.+)\)$/)
  return m ? { base: m[1].trim(), version: m[2].trim() } : { base: name, version: null }
}

const EMPTY: Omit<Character, 'id' | 'created_at' | 'updated_at'> = {
  name: '', base_name: '', version: null, stars: 5,
  level: null, status: 'rostered', ascended: false, notes: null,
}

type ViewMode  = 'list' | 'grouped'
type SortField = 'base_name' | 'stars' | 'level'
type SortDir   = 'asc' | 'desc'

// ── Inline level cell ─────────────────────────────────────────────────────────
function InlineLevelCell({ id, level, onSave }: {
  id: string; level: number | null; onSave: (id: string, val: number | null) => void
}) {
  const [editing, setEditing] = useState(false)
  const [val, setVal]         = useState(String(level ?? ''))
  const inputRef              = useRef<HTMLInputElement>(null)

  function startEdit() {
    setVal(String(level ?? ''))
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  function commit() {
    setEditing(false)
    const n = val === '' ? null : Number(val)
    if (n !== level) onSave(id, n)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commit()
    if (e.key === 'Escape') { setEditing(false); setVal(String(level ?? '')) }
  }

  if (editing) return (
    <input
      ref={inputRef}
      type="number"
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={commit}
      onKeyDown={handleKey}
      className="w-16 bg-[#0D0D0D] border border-marvel-red rounded px-1 py-0.5 text-center text-white text-xs outline-none"
    />
  )

  return (
    <button
      onClick={startEdit}
      title="Cliquer pour modifier le niveau"
      className="text-[#8888AA] hover:text-white hover:bg-[#2D2D4E] rounded px-2 py-0.5 transition-all min-w-8 text-center"
    >
      {level ?? '—'}
    </button>
  )
}

// ── Sort button ───────────────────────────────────────────────────────────────
function SortBtn({ field, current, dir, onClick }: {
  field: SortField; current: SortField; dir: SortDir; onClick: () => void
}) {
  const active = field === current
  return (
    <button onClick={onClick} className={`flex items-center gap-1 text-xs font-medium transition-colors ${active ? 'text-marvel-gold' : 'text-[#8888AA] hover:text-white'}`}>
      {field === 'base_name' ? 'Nom' : field === 'stars' ? 'Étoiles' : 'Niveau'}
      {active ? (dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Characters() {
  const [chars, setChars]       = useState<Character[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filterStars, setFilterStars]       = useState<Stars | 0>(0)
  const [filterStatus, setFilterStatus]     = useState<CharacterStatus | ''>('')
  const [filterAscended, setFilterAscended] = useState<'all' | 'yes' | 'no'>('all')
  const [sortField, setSortField] = useState<SortField>('base_name')
  const [sortDir, setSortDir]     = useState<SortDir>('asc')
  const [viewMode, setViewMode]   = useState<ViewMode>('list')
  const [modal, setModal]         = useState<'add' | 'edit' | null>(null)
  const [form, setForm]           = useState<typeof EMPTY>(EMPTY)
  const [editId, setEditId]       = useState<string | null>(null)
  const [saving, setSaving]       = useState(false)

  async function load() {
    const { data } = await supabase.from('characters').select('*').order('base_name').order('stars', { ascending: false })
    if (data) setChars(data)
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
      return 0
    })

  const grouped = filtered.reduce<Record<string, Character[]>>((acc, c) => {
    const key = c.base_name || parseBaseName(c.name).base
    acc[key] = acc[key] ?? []; acc[key].push(c); return acc
  }, {})

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
    if (modal === 'add') await supabase.from('characters').insert([payload])
    else if (editId) await supabase.from('characters').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editId)
    await load(); closeModal(); setSaving(false)
  }

  async function remove(id: string) {
    if (!confirm('Supprimer ce personnage ?')) return
    await supabase.from('characters').delete().eq('id', id)
    setChars(prev => prev.filter(c => c.id !== id))
  }

  async function updateStatus(id: string, status: CharacterStatus) {
    await supabase.from('characters').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    setChars(prev => prev.map(c => c.id === id ? { ...c, status } : c))
  }

  async function updateAscended(id: string, ascended: boolean) {
    await supabase.from('characters').update({ ascended, updated_at: new Date().toISOString() }).eq('id', id)
    setChars(prev => prev.map(c => c.id === id ? { ...c, ascended } : c))
  }

  // Inline level save — updates DB + local state instantly
  async function updateLevel(id: string, level: number | null) {
    await supabase.from('characters').update({ level, updated_at: new Date().toISOString() }).eq('id', id)
    setChars(prev => prev.map(c => c.id === id ? { ...c, level } : c))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Personnages</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16} /> Ajouter</button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8888AA]" />
          <input className="input pl-9" placeholder="Rechercher par nom ou version..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={filterStars} onChange={e => setFilterStars(Number(e.target.value) as Stars | 0)} className="input w-auto">
          <option value={0}>Toutes les ★</option>
          {STARS_OPTIONS.map(s => <option key={s} value={s}>{'★'.repeat(s)}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as CharacterStatus | '')} className="input w-auto">
          <option value="">Tous les statuts</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_FR[s]}</option>)}
        </select>
        <select value={filterAscended} onChange={e => setFilterAscended(e.target.value as 'all' | 'yes' | 'no')} className="input w-auto">
          <option value="all">Ascended : tous</option>
          <option value="yes">Ascended uniquement</option>
          <option value="no">Non ascended</option>
        </select>
        <button
          onClick={() => setViewMode(v => v === 'list' ? 'grouped' : 'list')}
          className={`btn-secondary flex items-center gap-2 ${viewMode === 'grouped' ? 'bg-marvel-red/20 border-marvel-red/40 text-white' : ''}`}
        >
          <Layers size={14} /> {viewMode === 'grouped' ? 'Groupé' : 'Liste'}
        </button>
      </div>

      {/* Sort bar */}
      <div className="flex items-center gap-2 text-xs text-[#8888AA]">
        <span>Trier par :</span>
        <div className="flex gap-3 bg-[#12122A] px-3 py-1.5 rounded-lg">
          {(['base_name', 'stars', 'level'] as SortField[]).map(f => (
            <SortBtn key={f} field={f} current={sortField} dir={sortDir} onClick={() => toggleSort(f)} />
          ))}
        </div>
        <span className="ml-1 text-[#555]">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? <Spinner /> : viewMode === 'list' ? (
        /* ── LIST VIEW ── */
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2D2D4E] text-[#8888AA]">
                <th className="text-left py-2 font-normal">
                  <button onClick={() => toggleSort('base_name')} className="flex items-center gap-1 hover:text-white transition-colors">
                    Personnage {sortField === 'base_name' ? (sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}
                  </button>
                </th>
                <th className="text-left py-2 font-normal text-xs">Version</th>
                <th className="text-center py-2 font-normal">
                  <button onClick={() => toggleSort('stars')} className="flex items-center gap-1 mx-auto hover:text-white transition-colors">
                    ★ {sortField === 'stars' ? (sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}
                  </button>
                </th>
                <th className="text-center py-2 font-normal">
                  <button onClick={() => toggleSort('level')} className="flex items-center gap-1 mx-auto hover:text-white transition-colors">
                    Niveau <span className="text-[#555] text-xs">(clic)</span> {sortField === 'level' ? (sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}
                  </button>
                </th>
                <th className="text-center py-2 font-normal">Statut <span className="text-[#555] text-xs">(clic)</span></th>
                <th className="text-center py-2 font-normal">Asc. <span className="text-[#555] text-xs">(clic)</span></th>
                <th className="text-right py-2 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-[#2D2D4E]/40 hover:bg-[#2D2D4E]/20">
                  <td className="py-2 font-medium">{c.base_name || parseBaseName(c.name).base}</td>
                  <td className="py-2 text-xs text-[#8888AA]">
                    {c.version && <span className="bg-[#2D2D4E] px-1.5 py-0.5 rounded">{c.version}</span>}
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
                  <td className="py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(c)} className="text-[#8888AA] hover:text-white transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => remove(c.id)} className="text-[#8888AA] hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center text-[#8888AA] py-8">Aucun personnage trouvé</p>}
        </div>
      ) : (
        /* ── GROUPED VIEW ── */
        <div className="space-y-2">
          {Object.entries(grouped).map(([baseName, versions]) => (
            <div key={baseName} className="card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-white">{baseName}</h3>
                <span className="text-xs text-[#8888AA]">{versions.length} version{versions.length > 1 ? 's' : ''}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {versions.map(c => (
                  <div key={c.id} className="flex items-center gap-2 bg-[#0D0D0D] rounded-lg px-3 py-2 group">
                    <StarBadge stars={c.stars as Stars} />
                    {c.version && <span className="text-xs text-[#8888AA]">{c.version}</span>}
                    <InlineLevelCell id={c.id} level={c.level} onSave={updateLevel} />
                    <InlineStatusBadge status={c.status as CharacterStatus} onChange={s => updateStatus(c.id, s)} />
                    <InlineAscendedBadge ascended={c.ascended} onChange={a => updateAscended(c.id, a)} />
                    <div className="flex gap-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(c)} className="text-[#8888AA] hover:text-white"><Pencil size={12} /></button>
                      <button onClick={() => remove(c.id)} className="text-[#8888AA] hover:text-red-400"><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {Object.keys(grouped).length === 0 && <div className="card text-center text-[#8888AA] py-8">Aucun personnage trouvé</div>}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-marvel text-xl text-marvel-gold">{modal === 'add' ? 'Ajouter un personnage' : 'Modifier'}</h2>
              <button onClick={closeModal}><X size={18} className="text-[#8888AA] hover:text-white" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#8888AA] mb-1 block">Nom complet <span className="text-[#555]">(ex: Spider-Man (Classic))</span></label>
                <input className="input" value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="Personnage (Version)" />
              </div>
              {form.base_name && (
                <div className="bg-[#0D0D0D] rounded-lg px-3 py-2 flex gap-4 text-xs">
                  <span className="text-[#8888AA]">Base: <span className="text-white">{form.base_name}</span></span>
                  {form.version && <span className="text-[#8888AA]">Version: <span className="text-marvel-gold">{form.version}</span></span>}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#8888AA] mb-1 block">Étoiles</label>
                  <select className="input" value={form.stars} onChange={e => setForm(f => ({ ...f, stars: Number(e.target.value) as Stars }))}>
                    {STARS_OPTIONS.map(s => <option key={s} value={s}>{s}★</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#8888AA] mb-1 block">Niveau</label>
                  <input type="number" className="input" value={form.level ?? ''}
                    onChange={e => setForm(f => ({ ...f, level: e.target.value ? Number(e.target.value) : null }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#8888AA] mb-1 block">Statut</label>
                  <select className="input" value={form.status ?? 'rostered'} onChange={e => setForm(f => ({ ...f, status: e.target.value as CharacterStatus }))}>
                    {STATUSES.map(s => <option key={s} value={s}>{STATUS_FR[s]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#8888AA] mb-1 block">Ascended</label>
                  <button type="button" onClick={() => setForm(f => ({ ...f, ascended: !f.ascended }))}
                    className={`w-full py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                      form.ascended ? 'bg-cyan-900/60 border-cyan-600 text-cyan-300' : 'bg-[#0D0D0D] border-[#2D2D4E] text-[#8888AA] hover:border-cyan-600/50'
                    }`}>
                    {form.ascended ? '⬆ Ascended' : '⬆ Non ascended'}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-[#8888AA] mb-1 block">Notes</label>
                <textarea className="input resize-none h-20" value={form.notes ?? ''}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value || null }))} />
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
