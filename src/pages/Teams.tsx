import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Team, TeamStatus, Character, Support, CoreDuo, CoreDuoThird } from '../types'
import { OkBadge } from '../components/Badges'
import { SearchDropdown, toCharacterOptions, toSupportOptions } from '../components/SearchDropdown'
import { Plus, Search, X, ChevronDown, ChevronUp, Pencil, Trash2, Star } from 'lucide-react'

type Tab = 'active' | 'to_test' | 'archived' | 'pick_third'
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

function SlotDisplay({ label, character, build, support, boost, css, strategy, affiliations }: {
  label: string; character: string | null; build: string | null; support: string | null
  boost: string | null; css: boolean; strategy: string | null; affiliations?: string[]
}) {
  const hasBoost = boost === 'Required'
  const hasContent = character || build || support || hasBoost || css || strategy
  if (!hasContent) return null
  return (
    <div className="bg-[#1C1C2E] rounded-lg p-3 space-y-2">
      <p className="text-xs font-semibold text-marvel-gold uppercase">{label}</p>
      {character && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white">{character}</span>
            {hasBoost && <span className="badge text-xs bg-orange-900/60 text-orange-300 border border-orange-700">Boost Required</span>}
            {css      && <span className="badge text-xs bg-purple-900/60 text-purple-300 border border-purple-800">CSS Only</span>}
          </div>
          {([...(affiliations ?? [])].sort()).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {([...(affiliations ?? [])].sort()).map(a => (
                <span key={a} className="badge text-xs bg-teal-900/40 text-teal-300 border border-teal-700">{a}</span>
              ))}
            </div>
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

// ── PickAThird ────────────────────────────────────────────────────────────────
function PickAThird({ characters, supports }: { characters: Character[]; supports: Support[] }) {
  const [duos, setDuos]       = useState<CoreDuo[]>([])
  const [thirds, setThirds]   = useState<CoreDuoThird[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [expandedThird, setExpandedThird] = useState<string | null>(null)
  const [modal, setModal]     = useState<'add' | 'edit' | null>(null)
  const [editDuo, setEditDuo] = useState<CoreDuo | null>(null)
  const [thirdModal, setThirdModal] = useState<{ duoId: string; third?: CoreDuoThird } | null>(null)

  const EMPTY_DUO: Omit<CoreDuo, 'id' | 'created_at' | 'updated_at'> = {
    name: null,
    left_character: null,  left_build: null,  left_support: null,  left_boost: null,  left_css: false,  left_strategy: null,
    right_character: null, right_build: null, right_support: null, right_boost: null, right_css: false, right_strategy: null,
    note_additionnelle: null,
  }
  const EMPTY_THIRD: Omit<CoreDuoThird, 'id' | 'core_duo_id' | 'created_at' | 'updated_at'> = {
    character: null, build: null, support: null, boost: null, css: false, strategy: null,
  }

  const [duoForm, setDuoForm]     = useState<typeof EMPTY_DUO>(EMPTY_DUO)
  const [thirdForm, setThirdForm] = useState<typeof EMPTY_THIRD>(EMPTY_THIRD)
  const [saving, setSaving]       = useState(false)

  const charOptions    = toCharacterOptions(characters)
  const supportOptions = toSupportOptions(supports)

  async function load() {
    const [{ data: d }, { data: t }] = await Promise.all([
      supabase.from('mpq_tracker_core_duos').select('*').order('created_at'),
      supabase.from('mpq_tracker_core_duo_thirds').select('*').order('character'),
    ])
    if (d) setDuos(d)
    if (t) setThirds(t)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function autoName(f: typeof EMPTY_DUO) {
    return [f.left_character, f.right_character].filter(Boolean).join(' + ')
  }

  function setDuoSlot(pos: 'left' | 'right', field: string, val: string | boolean | null) {
    setDuoForm(prev => {
      const updated = { ...prev, [`${pos}_${field}`]: val }
      if (field === 'character') {
        const generated = autoName(updated)
        if (!prev.name || prev.name === autoName(prev)) updated.name = generated
      }
      return updated
    })
  }

  async function saveDuo() {
    setSaving(true)
    if (modal === 'add') {
      await supabase.from('mpq_tracker_core_duos').insert([duoForm])
    } else if (editDuo) {
      await supabase.from('mpq_tracker_core_duos').update({ ...duoForm, updated_at: new Date().toISOString() }).eq('id', editDuo.id)
    }
    await load(); setModal(null); setEditDuo(null); setSaving(false)
  }

  async function removeDuo(id: string) {
    if (!confirm('Delete this core duo?')) return
    await supabase.from('mpq_tracker_core_duos').delete().eq('id', id)
    setDuos(prev => prev.filter(d => d.id !== id))
    setThirds(prev => prev.filter(t => t.core_duo_id !== id))
  }

  async function saveThird() {
    if (!thirdModal) return
    setSaving(true)
    if (thirdModal.third) {
      await supabase.from('mpq_tracker_core_duo_thirds').update({ ...thirdForm, updated_at: new Date().toISOString() }).eq('id', thirdModal.third.id)
    } else {
      await supabase.from('mpq_tracker_core_duo_thirds').insert([{ ...thirdForm, core_duo_id: thirdModal.duoId }])
    }
    await load(); setThirdModal(null); setThirdForm(EMPTY_THIRD); setSaving(false)
  }

  async function removeThird(id: string) {
    if (!confirm('Remove this 3rd character?')) return
    await supabase.from('mpq_tracker_core_duo_thirds').delete().eq('id', id)
    setThirds(prev => prev.filter(t => t.id !== id))
  }

  function openAddDuo() { setDuoForm(EMPTY_DUO); setEditDuo(null); setModal('add') }
  function openEditDuo(duo: CoreDuo) {
    const { id, created_at, updated_at, ...rest } = duo
    setDuoForm(rest); setEditDuo(duo); setModal('edit')
  }

  function SlotCol({ pos, duo }: { pos: 'left' | 'right'; duo: CoreDuo }) {
    const label     = pos === 'left' ? 'Left' : 'Right'
    const char      = duo[`${pos}_character`]
    const build     = duo[`${pos}_build`]
    const support   = duo[`${pos}_support`]
    const boost     = duo[`${pos}_boost`]
    const css       = duo[`${pos}_css`]
    const strategy  = duo[`${pos}_strategy`]
    const hasBoost  = boost === 'Required'
    return (
      <div className="bg-[#1C1C2E] rounded-lg p-3 space-y-1.5">
        <p className="text-xs font-semibold text-marvel-gold uppercase">{label}</p>
        {char && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white">{char}</span>
            {hasBoost && <span className="badge text-xs bg-orange-900/60 text-orange-300 border border-orange-700">Boost Required</span>}
            {css      && <span className="badge text-xs bg-purple-900/60 text-purple-300 border border-purple-800">CSS Only</span>}
          </div>
        )}
        {build   && <p className="text-xs text-[#C8C8E0]">Build: {build}</p>}
        {support && <p className="text-xs text-[#C8C8E0]">Support: {support}</p>}
        {strategy && <p className="text-xs text-[#C8C8E0] italic border-l-2 border-[#3D3D60] pl-2 whitespace-pre-line mt-1">{strategy}</p>}
      </div>
    )
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={openAddDuo} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Core Duo
        </button>
      </div>

      {duos.length === 0 && <div className="card text-center text-[#C8C8E0] py-12">No core duos yet</div>}

      {duos.map(duo => {
        const duoThirds = thirds.filter(t => t.core_duo_id === duo.id)
        const isOpen    = expanded === duo.id
        return (
          <div key={duo.id} className="card">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <button onClick={() => setExpanded(isOpen ? null : duo.id)} className="flex-1 text-left group">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white group-hover:text-marvel-gold transition-colors">{duo.name || '—'}</h3>
                  <span className="text-xs text-[#C8C8E0]">({duoThirds.length} 3rd{duoThirds.length !== 1 ? 's' : ''})</span>
                  {isOpen ? <ChevronUp size={14} className="text-[#C8C8E0]" /> : <ChevronDown size={14} className="text-[#C8C8E0]" />}
                </div>
              </button>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEditDuo(duo)} className="text-[#C8C8E0] hover:text-white p-1"><Pencil size={14} /></button>
                <button onClick={() => removeDuo(duo.id)} className="text-[#C8C8E0] hover:text-red-400 p-1"><Trash2 size={14} /></button>
              </div>
            </div>

            {isOpen && (
              <div className="mt-4 pt-4 border-t border-[#3D3D60] space-y-4">
                {/* Left + Middle (reserved) + Right */}
                <div className="grid grid-cols-3 gap-3">
                  <SlotCol pos="left"  duo={duo} />
                  <div className="bg-[#1C1C2E] rounded-lg p-3 border border-dashed border-[#3D3D60] flex items-center justify-center">
                    <p className="text-xs text-[#555] text-center">Middle<br/>← 3rd character</p>
                  </div>
                  <SlotCol pos="right" duo={duo} />
                </div>

                {/* Additional note */}
                {duo.note_additionnelle && (
                  <div className="bg-[#1C1C2E] rounded-lg p-3">
                    <p className="text-xs text-[#C8C8E0] font-semibold mb-1">Additional note</p>
                    <p className="text-xs text-[#C8C8E0] whitespace-pre-line">{duo.note_additionnelle}</p>
                  </div>
                )}

                {/* 3rd characters */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-marvel-gold">3rd Characters</p>
                    <button
                      onClick={() => { setThirdForm(EMPTY_THIRD); setThirdModal({ duoId: duo.id }) }}
                      className="text-xs bg-[#3D3D60] hover:bg-marvel-red/40 text-[#C8C8E0] hover:text-white px-2 py-1 rounded transition-all">
                      + Add 3rd
                    </button>
                  </div>
                  {duoThirds.length === 0 && <p className="text-xs text-[#555]">No 3rd characters yet</p>}
                  <div className="space-y-1">
                    {duoThirds.map(t => {
                      const isThirdOpen = expandedThird === t.id
                      const affiliations = t.character ? ([...(charAffiliations[t.character] ?? [])].sort()) : []
                      return (
                        <div key={t.id} className="bg-[#1C1C2E] rounded-lg overflow-hidden">
                          <div className="flex items-center justify-between px-3 py-2">
                            <button onClick={() => setExpandedThird(isThirdOpen ? null : t.id)}
                              className="flex items-center gap-2 flex-1 text-left group">
                              <span className="text-sm font-semibold text-white group-hover:text-marvel-gold transition-colors">{t.character ?? '—'}</span>
                              {t.boost === 'Required' && <span className="badge text-xs bg-orange-900/60 text-orange-300 border border-orange-700">Boost Required</span>}
                              {t.css && <span className="badge text-xs bg-purple-900/60 text-purple-300 border border-purple-800">CSS Only</span>}
                              {isThirdOpen ? <ChevronUp size={12} className="text-[#C8C8E0] shrink-0" /> : <ChevronDown size={12} className="text-[#C8C8E0] shrink-0" />}
                            </button>
                            <div className="flex gap-2 shrink-0">
                              <button onClick={() => { const { id, core_duo_id, created_at, updated_at, ...rest } = t; setThirdForm(rest); setThirdModal({ duoId: duo.id, third: t }) }}
                                className="text-[#C8C8E0] hover:text-white"><Pencil size={13} /></button>
                              <button onClick={() => removeThird(t.id)} className="text-[#C8C8E0] hover:text-red-400"><Trash2 size={13} /></button>
                            </div>
                          </div>
                          {isThirdOpen && (
                            <div className="px-3 pb-3 pt-1 border-t border-[#3D3D60] space-y-1.5">
                              {affiliations.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {affiliations.map(a => (
                                    <span key={a} className="badge text-xs bg-teal-900/40 text-teal-300 border border-teal-700">{a}</span>
                                  ))}
                                </div>
                              )}
                              {t.build   && <p className="text-xs text-[#C8C8E0]">Build: {t.build}</p>}
                              {t.support && <p className="text-xs text-[#C8C8E0]">Support: {t.support}</p>}
                              {t.strategy && (
                                <div className="border-t border-[#3D3D60] pt-2">
                                  <p className="text-xs text-[#C8C8E0] whitespace-pre-line leading-relaxed">{t.strategy}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Core Duo Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="card w-full max-w-3xl my-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-marvel text-xl text-marvel-gold">{modal === 'add' ? 'New Core Duo' : 'Edit Core Duo'}</h2>
              <button onClick={() => { setModal(null); setEditDuo(null) }}><X size={18} className="text-[#C8C8E0] hover:text-white" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#C8C8E0] mb-1 block">Name <span className="text-[#555]">(auto-filled)</span></label>
                <input className="input" value={duoForm.name ?? ''}
                  onChange={e => setDuoForm(f => ({ ...f, name: e.target.value || null }))} placeholder="A + B" />
              </div>
              {/* Left + Right slots (Middle reserved) */}
              <div className="grid grid-cols-3 gap-3">
                {(['left', 'right'] as const).map((pos, idx) => (
                  <div key={pos} className={`bg-[#1C1C2E] rounded-lg p-3 space-y-2 ${idx === 0 ? '' : 'col-start-3'}`}>
                    <p className="text-xs font-semibold text-marvel-gold uppercase">{pos === 'left' ? 'Left' : 'Right'}</p>
                    <div>
                      <label className="text-xs text-[#C8C8E0] mb-1 block">Character</label>
                      <SearchDropdown value={duoForm[`${pos}_character`]} onChange={v => setDuoSlot(pos, 'character', v)} options={charOptions} placeholder="Search..." />
                    </div>
                    <div>
                      <label className="text-xs text-[#C8C8E0] mb-1 block">Build</label>
                      <input className="input text-sm" placeholder="5/3/5" value={duoForm[`${pos}_build`] ?? ''} onChange={e => setDuoSlot(pos, 'build', e.target.value || null)} />
                    </div>
                    <div>
                      <label className="text-xs text-[#C8C8E0] mb-1 block">Support</label>
                      <SearchDropdown value={duoForm[`${pos}_support`]} onChange={v => setDuoSlot(pos, 'support', v)} options={supportOptions} placeholder="Search..." />
                    </div>
                    <div>
                      <label className="text-xs text-[#C8C8E0] mb-1 block">Boost</label>
                      <select className="input text-sm" value={duoForm[`${pos}_boost`] ?? 'Not Required'} onChange={e => setDuoSlot(pos, 'boost', e.target.value)}>
                        <option value="Not Required">Not Required</option>
                        <option value="Required">Required</option>
                      </select>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={duoForm[`${pos}_css`]} onChange={e => setDuoSlot(pos, 'css', e.target.checked)} className="w-4 h-4 accent-purple-600" />
                      <span className="text-xs text-[#C8C8E0]">CSS Only</span>
                    </label>
                    <div>
                      <label className="text-xs text-[#C8C8E0] mb-1 block">Strategy</label>
                      <textarea className="input resize-none h-20 text-sm" value={duoForm[`${pos}_strategy`] ?? ''} onChange={e => setDuoSlot(pos, 'strategy', e.target.value || null)} placeholder="Strategy..." />
                    </div>
                  </div>
                ))}
                {/* Middle placeholder */}
                <div className="bg-[#1C1C2E] rounded-lg p-3 border border-dashed border-[#3D3D60] flex items-center justify-center col-start-2 row-start-1">
                  <p className="text-xs text-[#555] text-center">Middle<br/>← 3rd character<br/>(added later)</p>
                </div>
              </div>
              <div>
                <label className="text-xs text-[#C8C8E0] mb-1 block">Additional note</label>
                <textarea className="input resize-none h-16" value={duoForm.note_additionnelle ?? ''} onChange={e => setDuoForm(f => ({ ...f, note_additionnelle: e.target.value || null }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setModal(null); setEditDuo(null) }} className="btn-secondary flex-1">Cancel</button>
                <button onClick={saveDuo} disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit 3rd Modal */}
      {thirdModal && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="card w-full max-w-md my-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-marvel text-xl text-marvel-gold">{thirdModal.third ? 'Edit 3rd Character' : 'Add 3rd Character'}</h2>
              <button onClick={() => { setThirdModal(null); setThirdForm(EMPTY_THIRD) }}><X size={18} className="text-[#C8C8E0] hover:text-white" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#C8C8E0] mb-1 block">Character</label>
                <SearchDropdown value={thirdForm.character} onChange={v => setThirdForm(f => ({ ...f, character: v }))} options={charOptions} placeholder="Search..." />
              </div>
              <div>
                <label className="text-xs text-[#C8C8E0] mb-1 block">Build</label>
                <input className="input text-sm" placeholder="5/3/5" value={thirdForm.build ?? ''} onChange={e => setThirdForm(f => ({ ...f, build: e.target.value || null }))} />
              </div>
              <div>
                <label className="text-xs text-[#C8C8E0] mb-1 block">Support</label>
                <SearchDropdown value={thirdForm.support} onChange={v => setThirdForm(f => ({ ...f, support: v }))} options={supportOptions} placeholder="Search..." />
              </div>
              <div>
                <label className="text-xs text-[#C8C8E0] mb-1 block">Boost</label>
                <select className="input" value={thirdForm.boost ?? 'Not Required'} onChange={e => setThirdForm(f => ({ ...f, boost: e.target.value }))}>
                  <option value="Not Required">Not Required</option>
                  <option value="Required">Required</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={thirdForm.css} onChange={e => setThirdForm(f => ({ ...f, css: e.target.checked }))} className="w-4 h-4 accent-purple-600" />
                <span className="text-xs text-[#C8C8E0]">CSS Only</span>
              </label>
              <div>
                <label className="text-xs text-[#C8C8E0] mb-1 block">Strategy</label>
                <textarea className="input resize-none h-20 text-sm" value={thirdForm.strategy ?? ''} onChange={e => setThirdForm(f => ({ ...f, strategy: e.target.value || null }))} placeholder="Strategy for this 3rd..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setThirdModal(null); setThirdForm(EMPTY_THIRD) }} className="btn-secondary flex-1">Cancel</button>
                <button onClick={saveThird} disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Teams component ──────────────────────────────────────────────────────
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
    if (c) setCharacters((c as any[]).filter(ch => !ch.is_duplicate))
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



  const regularTeams = teams

  const visible = regularTeams.filter(t => {
    const matchTab      = t.status === tab
    const matchSearch   = t.name.toLowerCase().includes(search.toLowerCase()) ||
      [t.left_character, t.mid_character, t.right_character].some(c => c?.toLowerCase().includes(search.toLowerCase())) ||
      [t.left_character, t.mid_character, t.right_character].some(c =>
        c ? (charAffiliations[c] ?? []).some(a => a.toLowerCase().includes(search.toLowerCase())) : false
      )
    const matchFavorite  = filterFavorite === 'all' || (filterFavorite === 'yes' ? t.favorite : !t.favorite)
    const matchWinfinite = filterWinfinite === 'all' || (filterWinfinite === 'yes' ? t.winfinite === 'Yes' : t.winfinite !== 'Yes')
    return matchTab && matchSearch && matchFavorite && matchWinfinite
  })

  function openAdd() {
    setForm({ ...EMPTY_FORM, status: tab === 'archived' ? 'active' : tab === 'pick_third' ? 'active' : tab })
    setEditId(null); setModal('add')
  }
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

  // Map character name → affiliations for display (handle NULL from DB)
  const charAffiliations: Record<string, string[]> = Object.fromEntries(
    characters.map(c => [c.name, Array.isArray(c.affiliations) ? c.affiliations : []])
  )

  const TABS: { key: Tab; label: string }[] = [
    { key: 'active',   label: 'Active Teams' },
    { key: 'to_test',  label: 'To Test' },
    { key: 'archived', label: 'Archived' },
    { key: 'pick_third', label: 'Pick a 3rd' },
  ]

  function TeamCard({ team }: { team: Team }) {
    return (
      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <button onClick={() => setExpanded(expanded === team.id ? null : team.id)}
              className="text-left w-full group">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white group-hover:text-marvel-gold transition-colors truncate">
                  {team.name}
                </h3>
                {team.winfinite === 'Yes' && (
                  <span className="badge text-xs bg-cyan-900/60 text-cyan-300 border border-cyan-700 shrink-0">Winf.</span>
                )}
                {expanded === team.id ? <ChevronUp size={14} className="text-[#C8C8E0] shrink-0" /> : <ChevronDown size={14} className="text-[#C8C8E0] shrink-0" />}
              </div>
            </button>
            <div className="flex flex-wrap gap-3 mt-1 text-xs text-[#C8C8E0]">
              {team.hn1 && <span>HN1: <OkBadge value={team.hn1} /></span>}
              {team.hn2 && <span>HN2: <OkBadge value={team.hn2} /></span>}
              {team.hn3 && <span>HN3: <OkBadge value={team.hn3} /></span>}
              {team.cn  && <span>CN: <OkBadge value={team.cn} /></span>}
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
              <SlotDisplay label="Left"   character={team.left_character}  build={team.left_build}  support={team.left_support}  boost={team.left_boost}  css={team.left_css}  strategy={team.left_strategy}  affiliations={team.left_character  ? charAffiliations[team.left_character]  : []} />
              <SlotDisplay label="Middle" character={team.mid_character}   build={team.mid_build}   support={team.mid_support}   boost={team.mid_boost}   css={team.mid_css}   strategy={team.mid_strategy}   affiliations={team.mid_character   ? charAffiliations[team.mid_character]   : []} />
              <SlotDisplay label="Right"  character={team.right_character} build={team.right_build} support={team.right_support} boost={team.right_boost} css={team.right_css} strategy={team.right_strategy}  affiliations={team.right_character ? charAffiliations[team.right_character] : []} />
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
    )
  }

  const currentList = visible

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Teams</h1>
        {tab !== 'pick_third' && (
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#1E1E38] p-1 rounded-lg w-fit flex-wrap">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === key ? 'bg-marvel-red text-white' : 'text-[#C8C8E0] hover:text-white'}`}>
            {label}
            <span className="ml-2 text-xs opacity-70">
              ({regularTeams.filter(x => x.status === key).length})
            </span>
          </button>
        ))}
      </div>

      {/* Filters (not on template or pick_third tab) */}
      {tab !== 'pick_third' && (
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
      )}



      {/* List */}
      {tab === 'pick_third' ? (
        <PickAThird characters={characters} supports={supports} />
      ) : loading ? <Spinner /> : (
        <div className="space-y-3">
          {currentList.length === 0 && <div className="card text-center text-[#C8C8E0] py-12">No teams found</div>}
          {currentList.map(team => <TeamCard key={team.id} team={team} />)}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="card w-full max-w-4xl my-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-marvel text-xl text-marvel-gold">
                {modal === 'add' ? 'New Team' : 'Edit Team'}
              </h2>
              <button onClick={closeModal}><X size={18} className="text-[#C8C8E0] hover:text-white" /></button>
            </div>
            <div className="space-y-4">

              {/* Row 1: Name (75%) + Status (25%) */}
              <div className="flex gap-3">
                <div className="flex-[3]">
                  <label className="text-xs text-[#C8C8E0] mb-1 block">
                    Team name <span className="text-[#555]">(auto-filled)</span>
                  </label>
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
                      <SearchDropdown value={form[`${pos}_character`]} onChange={v => setSlot(pos, 'character', v)} options={charOptions} placeholder="Search..." />
                    </div>
                    <div>
                      <label className="text-xs text-[#C8C8E0] mb-1 block">Build</label>
                      <input className="input text-sm" placeholder="5/3/5" value={form[`${pos}_build`] ?? ''} onChange={e => setSlot(pos, 'build', e.target.value || null)} />
                    </div>
                    <div>
                      <label className="text-xs text-[#C8C8E0] mb-1 block">Support</label>
                      <SearchDropdown value={form[`${pos}_support`]} onChange={v => setSlot(pos, 'support', v)} options={supportOptions} placeholder="Search..." />
                    </div>
                    <div>
                      <label className="text-xs text-[#C8C8E0] mb-1 block">Boost</label>
                      <select className="input text-sm" value={form[`${pos}_boost`] ?? 'Not Required'} onChange={e => setSlot(pos, 'boost', e.target.value)}>
                        <option value="Not Required">Not Required</option>
                        <option value="Required">Required</option>
                      </select>
                    </div>
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form[`${pos}_css`] as boolean} onChange={e => setSlot(pos, 'css', e.target.checked)} className="w-4 h-4 accent-purple-600" />
                        <span className="text-xs text-[#C8C8E0]">CSS Only</span>
                      </label>
                    </div>
                    <div>
                      <label className="text-xs text-[#C8C8E0] mb-1 block">Strategy</label>
                      <textarea className="input resize-none h-20 text-sm" value={form[`${pos}_strategy`] ?? ''} onChange={e => setSlot(pos, 'strategy', e.target.value || null)} placeholder="Strategy for this slot..." />
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
