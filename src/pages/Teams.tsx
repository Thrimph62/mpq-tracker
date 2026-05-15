import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Team, TeamStatus, Character, Support } from '../types'
import { OkBadge } from '../components/Badges'
import { SearchDropdown, toCharacterOptions, toSupportOptions } from '../components/SearchDropdown'
import { Plus, Search, X, ChevronDown, ChevronUp, Pencil, Trash2, Star } from 'lucide-react'

type Tab = 'active' | 'to_test' | 'archived'
type Pos = 'left' | 'mid' | 'right'

const POS_LABELS: Record<Pos, string> = { left: 'Left', mid: 'Middle', right: 'Right' }

const EMPTY_FORM: Omit<Team, 'id' | 'created_at' | 'updated_at'> = {
  name: '', status: 'active', favorite: false,
  left_character: null,  left_build: null,  left_support: null,  left_boost: null,  left_css: false,  left_strategy: null,
  mid_character: null,   mid_build: null,   mid_support: null,   mid_boost: null,   mid_css: false,   mid_strategy: null,
  right_character: null, right_build: null, right_support: null, right_boost: null, right_css: false, right_strategy: null,
  strategie: null, winfinite: null, hn1: null, hn2: null, hn3: null, cn: null,
  all_3_non_boosted: null, note_additionnelle: null,
}

// ── SlotDisplay — shows one slot in expanded view ─────────────────────────────
function SlotDisplay({ label, character, build, support, boost, css, strategy }: {
  label: string; character: string | null; build: string | null; support: string | null
  boost: string | null; css: boolean; strategy: string | null
}) {
  const hasBoost = boost === 'Required'
  const hasContent = character || build || support || hasBoost || css || strategy
  if (!hasContent) return null

  return (
    <div className="bg-[#1C1C2E] rounded-lg p-3 space-y-2">
      <p className="text-xs font-semibold text-marvel-gold uppercase">{label}</p>
      {character && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-white">{character}</span>
          {hasBoost && (
            <span className="badge text-xs bg-orange-900/60 text-orange-300 border border-orange-700">Boost Required</span>
          )}
          {css && (
            <span className="badge text-xs bg-purple-900/60 text-purple-300 border border-purple-800">CSS Only</span>
          )}
        </div>
      )}
      {build   && <p className="text-xs text-[#C8C8E0]">Build: {build}</p>}
      {support && <p className="text-xs text-[#C8C8E0]">Support: {support}</p>}
      {strategy && (
        <div className="border-t border-[#3D3D60] pt-2">
          <p className="text-xs text-[#C8C8E0] whitespace-pre-line leading-relaxed">{strategy}</p>
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Teams() {
  const [teams, setTeams]           = useState<Team[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [supports, setSupports]     = useState<Support[]>([])
  const [loading, setLoading]       = useState(true)
  const [tab, setTab]               = useState<Tab>('active')
  const [search, setSearch]         = useState('')
  const [filterFavorite, setFilterFavorite]   = useState<'all' | 'yes' | 'no'>('all')
  const [filterWinfinite, setFilterWinfinite] = useState<'all' | 'yes' | 'no'>('all')
  const [expanded, setExpanded]     = useState<string | null>(null)
  const [modal, setModal]           = useState<'add' | 'edit' | null>(null)
  const [form, setForm]             = useState<typeof EMPTY_FORM>(EMPTY_FORM)
  const [editId, setEditId]         = useState<string | null>(null)
  const [saving, setSaving]         = useState(false)

  async function load() {
    const [{ data: t }, { data: c }, { data: s }] = await Promise.all([
      supabase.from('mpq_tracker_teams').select('*').order('name'),
      supabase.from('mpq_tracker_characters').select('*').order('base_name').order('version'),
      supabase.from('mpq_tracker_supports').select('*').order('name'),
    ])
    if (t) setTeams(t)
    if (c) setCharacters(c.filter((ch: any) => !ch.is_duplicate))
    if (s) setSupports(s)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function autoName(f: typeof EMPTY_FORM): string {
    return [f.left_character, f.mid_character, f.right_character].filter(Boolean).join(' / ')
  }

  function setSlot(pos: Pos, field: string, val: string | boolean | null) {
    setForm(prev => {
      const updated = { ...prev, [`${pos}_${field}`]: val }
      if (field === 'character') {
        const generated = autoName(updated)
        if (!prev.name || prev.name === autoName(prev)) updated.name = generated
      }
      return updated
    })
  }

  const visible = teams.filter(t => {
    const matchTab      = t.status === tab
    const matchSearch   = t.name.toLowerCase().includes(search.toLowerCase()) ||
      [t.left_character, t.mid_character, t.right_character]
        .some(c => c?.toLowerCase().includes(search.toLowerCase()))
    const matchFavorite  = filterFavorite === 'all' || (filterFavorite === 'yes' ? t.favorite : !t.favorite)
    const matchWinfinite = filterWinfinite === 'all' || (filterWinfinite === 'yes' ? t.winfinite === 'Yes' : t.winfinite !== 'Yes')
    return matchTab && matchSearch && matchFavorite && matchWinfinite
  })

  function openAdd() { setForm({ ...EMPTY_FORM, status: tab === 'archived' ? 'active' : tab }); setEditId(null); setModal('add') }
  function openEdit(t: Team) {
    const { id, created_at, updated_at, ...rest } = t
    setForm(rest); setEditId(t.id); setModal('edit')
  }
  function closeModal() { setModal(null); setEditId(null) }

  const f = (key: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value || null }))

  async function save() {
    setSaving(true)
    if (modal === 'add') await supabase.from('mpq_tracker_teams').insert([form])
    else if (editId) await supabase.from('mpq_tracker_teams').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editId)
    await load(); closeModal(); setSaving(false)
  }

  async function remove(id: string) {
    if (!confirm('Delete this team?')) return
    await supabase.from('mpq_tracker_teams').delete().eq('id', id)
    setTeams(prev => prev.filter(t => t.id !== id))
  }

  async function toggleFavorite(id: string, current: boolean) {
    await supabase.from('mpq_tracker_teams').update({ favorite: !current, updated_at: new Date().toISOString() }).eq('id', id)
    setTeams(prev => prev.map(t => t.id === id ? { ...t, favorite: !current } : t))
  }

  async function moveToActive(id: string) {
    await supabase.from('mpq_tracker_teams').update({ status: 'active', updated_at: new Date().toISOString() }).eq('id', id)
    await load()
  }

  const charOptions    = toCharacterOptions(characters)
  const supportOptions = toSupportOptions(supports)

  const TABS: { key: Tab; label: string }[] = [
    { key: 'active',   label: 'Active Teams' },
    { key: 'to_test',  label: 'To Test' },
    { key: 'archived', label: 'Archived' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Teams</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#1E1E38] p-1 rounded-lg w-fit">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === key ? 'bg-marvel-red text-white' : 'text-[#C8C8E0] hover:text-white'}`}>
            {label}
            <span className="ml-2 text-xs opacity-70">({teams.filter(x => x.status === key).length})</span>
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C8C8E0]" />
          <input className="input pl-9" placeholder="Search team or character..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 bg-[#1E1E38] p-1 rounded-lg">
          {(['all', 'yes', 'no'] as const).map(v => (
            <button key={v} onClick={() => setFilterFavorite(v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filterFavorite === v ? 'bg-marvel-red text-white' : 'text-[#C8C8E0] hover:text-white'}`}>
              {v === 'all' && 'All'}
              {v === 'yes' && <><Star size={12} className="fill-yellow-400 text-yellow-400" /> Favorites</>}
              {v === 'no'  && 'Not favorites'}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-[#1E1E38] p-1 rounded-lg">
          {(['all', 'yes', 'no'] as const).map(v => (
            <button key={v} onClick={() => setFilterWinfinite(v)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filterWinfinite === v ? 'bg-marvel-red text-white' : 'text-[#C8C8E0] hover:text-white'}`}>
              {v === 'all' ? 'All' : v === 'yes' ? 'Winfinite ✓' : 'Winfinite ✗'}
            </button>
          ))}
        </div>
      </div>

      {/* Team list */}
      {loading ? <Spinner /> : (
        <div className="space-y-3">
          {visible.length === 0 && <div className="card text-center text-[#C8C8E0] py-12">No teams found</div>}
          {visible.map(team => (
            <div key={team.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <button onClick={() => setExpanded(expanded === team.id ? null : team.id)}
                    className="text-left w-full group">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white group-hover:text-marvel-gold transition-colors truncate">{team.name}</h3>
                      {expanded === team.id ? <ChevronUp size={14} className="text-[#C8C8E0] shrink-0" /> : <ChevronDown size={14} className="text-[#C8C8E0] shrink-0" />}
                    </div>
                  </button>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-[#C8C8E0]">
                    {team.hn1       && <span>HN1: <OkBadge value={team.hn1} /></span>}
                    {team.hn2       && <span>HN2: <OkBadge value={team.hn2} /></span>}
                    {team.hn3       && <span>HN3: <OkBadge value={team.hn3} /></span>}
                    {team.cn        && <span>CN: <OkBadge value={team.cn} /></span>}
                    {team.winfinite && <span>Winfinite: <OkBadge value={team.winfinite === 'Yes' ? 'yes' : 'no'} /></span>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 items-center">
                  <button onClick={() => toggleFavorite(team.id, team.favorite)} className="p-1 transition-colors hover:scale-110">
                    <Star size={16} className={team.favorite ? 'fill-yellow-400 text-yellow-400' : 'text-[#3D3D60] hover:text-yellow-400'} />
                  </button>
                  {tab === 'to_test' && (
                    <button onClick={() => moveToActive(team.id)}
                      className="text-xs bg-green-900/40 text-green-300 border border-green-700 px-2 py-1 rounded hover:bg-green-900/60 transition-colors">
                      ✓ Tested
                    </button>
                  )}
                  <button onClick={() => openEdit(team)} className="text-[#C8C8E0] hover:text-white p-1"><Pencil size={14} /></button>
                  <button onClick={() => remove(team.id)} className="text-[#C8C8E0] hover:text-red-400 p-1"><Trash2 size={14} /></button>
                </div>
              </div>

              {expanded === team.id && (
                <div className="mt-4 pt-4 border-t border-[#3D3D60] space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <SlotDisplay label="Left"   character={team.left_character}  build={team.left_build}  support={team.left_support}  boost={team.left_boost}  css={team.left_css}  strategy={team.left_strategy} />
                    <SlotDisplay label="Middle" character={team.mid_character}   build={team.mid_build}   support={team.mid_support}   boost={team.mid_boost}   css={team.mid_css}   strategy={team.mid_strategy} />
                    <SlotDisplay label="Right"  character={team.right_character} build={team.right_build} support={team.right_support} boost={team.right_boost} css={team.right_css} strategy={team.right_strategy} />
                  </div>
                  {team.note_additionnelle && (
                    <div className="bg-[#1C1C2E] rounded-lg p-3">
                      <p className="text-xs text-[#C8C8E0] font-semibold mb-1">Additional note</p>
                      <p className="text-sm text-[#C8C8E0] whitespace-pre-line">{team.note_additionnelle}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="card w-full max-w-4xl my-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-marvel text-xl text-marvel-gold">{modal === 'add' ? 'New Team' : 'Edit Team'}</h2>
              <button onClick={closeModal}><X size={18} className="text-[#C8C8E0] hover:text-white" /></button>
            </div>
            <div className="space-y-4">

              {/* Row 1: Name (75%) + Status (25%) */}
              <div className="flex gap-3">
                <div className="flex-[3]">
                  <label className="text-xs text-[#C8C8E0] mb-1 block">Team name <span className="text-[#555]">(auto-filled)</span></label>
                  <input className="input" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Char 1 / Char 2 / Char 3" />
                </div>
                <div className="flex-[1]">
                  <label className="text-xs text-[#C8C8E0] mb-1 block">Status</label>
                  <select className="input" value={form.status} onChange={f('status')}>
                    <option value="active">Active</option>
                    <option value="to_test">To Test</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Row 2: HN1 + HN2 + HN3 + CN + Winfinite */}
              <div className="grid grid-cols-5 gap-3">
                {(['hn1', 'hn2', 'hn3', 'cn'] as const).map(key => (
                  <div key={key}>
                    <label className="text-xs text-[#C8C8E0] mb-1 block">{key.toUpperCase()}</label>
                    <select className="input" value={form[key] ?? ''} onChange={f(key)}>
                      <option value="">—</option>
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                      <option value="Partial">Partial</option>
                    </select>
                  </div>
                ))}
                <div>
                  <label className="text-xs text-[#C8C8E0] mb-1 block">Winfinite</label>
                  <select className="input" value={form.winfinite ?? ''} onChange={f('winfinite')}>
                    <option value="">—</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>

              {/* 3 Slots side by side */}
              <div className="grid grid-cols-3 gap-3">
                {(['left', 'mid', 'right'] as Pos[]).map(pos => (
                  <div key={pos} className="bg-[#1C1C2E] rounded-lg p-3 space-y-2">
                    <p className="text-xs font-semibold text-marvel-gold uppercase">{POS_LABELS[pos]}</p>
                    <div>
                      <label className="text-xs text-[#C8C8E0] mb-1 block">Character</label>
                      <SearchDropdown
                        value={form[`${pos}_character`]}
                        onChange={v => setSlot(pos, 'character', v)}
                        options={charOptions}
                        placeholder="Search..."
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#C8C8E0] mb-1 block">Build</label>
                      <input className="input text-sm" placeholder="5/3/5"
                        value={form[`${pos}_build`] ?? ''}
                        onChange={e => setSlot(pos, 'build', e.target.value || null)} />
                    </div>
                    <div>
                      <label className="text-xs text-[#C8C8E0] mb-1 block">Support</label>
                      <SearchDropdown
                        value={form[`${pos}_support`]}
                        onChange={v => setSlot(pos, 'support', v)}
                        options={supportOptions}
                        placeholder="Search..."
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#C8C8E0] mb-1 block">Boost</label>
                      <select className="input text-sm"
                        value={form[`${pos}_boost`] ?? 'Not Required'}
                        onChange={e => setSlot(pos, 'boost', e.target.value)}>
                        <option value="Not Required">Not Required</option>
                        <option value="Required">Required</option>
                      </select>
                    </div>
                    {/* CSS Only checkbox */}
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox"
                          checked={form[`${pos}_css`] as boolean}
                          onChange={e => setSlot(pos, 'css', e.target.checked)}
                          className="w-4 h-4 accent-purple-600" />
                        <span className="text-xs text-[#C8C8E0]">CSS Only</span>
                      </label>
                    </div>
                    {/* Per-slot strategy */}
                    <div>
                      <label className="text-xs text-[#C8C8E0] mb-1 block">Strategy</label>
                      <textarea className="input resize-none h-20 text-sm"
                        value={form[`${pos}_strategy`] ?? ''}
                        onChange={e => setSlot(pos, 'strategy', e.target.value || null)}
                        placeholder="Strategy for this slot..." />
                    </div>
                  </div>
                ))}
              </div>

              {/* Additional note */}
              <div>
                <label className="text-xs text-[#C8C8E0] mb-1 block">Additional note</label>
                <textarea className="input resize-none h-16" value={form.note_additionnelle ?? ''} onChange={f('note_additionnelle')} />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
                <button onClick={save} disabled={saving || !form.name} className="btn-primary flex-1">
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
