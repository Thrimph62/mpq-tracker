import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Team, TeamStatus } from '../types'
import { TeamSlot } from '../components/TeamSlot'
import { OkBadge } from '../components/Badges'
import { Plus, Search, X, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react'

const EMPTY_FORM: Omit<Team, 'id' | 'created_at' | 'updated_at'> = {
  name: '', status: 'active',
  left_character: null, left_build: null, left_support: null, left_boost: null,
  mid_character: null,  mid_build: null,  mid_support: null,  mid_boost: null,
  right_character: null,right_build: null,right_support: null,right_boost: null,
  strategie: null, ok_hard_nodes: null, ok_cn_node: null,
  all_3_non_boosted: null, note_additionnelle: null,
}

type Tab = 'active' | 'to_test'

export default function Teams() {
  const [teams, setTeams]     = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState<Tab>('active')
  const [search, setSearch]   = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [modal, setModal]     = useState<'add' | 'edit' | null>(null)
  const [form, setForm]       = useState<typeof EMPTY_FORM>(EMPTY_FORM)
  const [editId, setEditId]   = useState<string | null>(null)
  const [saving, setSaving]   = useState(false)

  async function load() {
    const { data } = await supabase.from('teams').select('*').order('name')
    if (data) setTeams(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const visible = teams.filter(t => {
    const matchTab    = t.status === tab
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      [t.left_character, t.mid_character, t.right_character]
        .some(c => c?.toLowerCase().includes(search.toLowerCase()))
    return matchTab && matchSearch
  })

  function openAdd() {
    setForm({ ...EMPTY_FORM, status: tab })
    setEditId(null); setModal('add')
  }
  function openEdit(t: Team) {
    const { id, created_at, updated_at, ...rest } = t
    setForm(rest); setEditId(t.id); setModal('edit')
  }
  function closeModal() { setModal(null); setEditId(null) }

  async function save() {
    setSaving(true)
    if (modal === 'add') {
      await supabase.from('teams').insert([form])
    } else if (editId) {
      await supabase.from('teams').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editId)
    }
    await load(); closeModal(); setSaving(false)
  }

  async function remove(id: string) {
    if (!confirm('Supprimer cette équipe ?')) return
    await supabase.from('teams').delete().eq('id', id)
    setTeams(prev => prev.filter(t => t.id !== id))
  }

  async function moveToActive(id: string) {
    await supabase.from('teams').update({ status: 'active', updated_at: new Date().toISOString() }).eq('id', id)
    await load()
  }

  const f = (key: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value || null }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Équipes</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#12122A] p-1 rounded-lg w-fit">
        {(['active', 'to_test'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              tab === t ? 'bg-marvel-red text-white' : 'text-[#8888AA] hover:text-white'
            }`}
          >
            {t === 'active' ? 'Équipes Actives' : 'À Tester'}
            <span className="ml-2 text-xs opacity-70">
              ({teams.filter(x => x.status === t).length})
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8888AA]" />
        <input
          className="input pl-9"
          placeholder="Rechercher une équipe ou un perso..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      {loading ? <Spinner /> : (
        <div className="space-y-3">
          {visible.length === 0 && (
            <div className="card text-center text-[#8888AA] py-12">Aucune équipe trouvée</div>
          )}
          {visible.map(team => (
            <div key={team.id} className="card">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <button
                    onClick={() => setExpanded(expanded === team.id ? null : team.id)}
                    className="text-left w-full group"
                  >
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white group-hover:text-marvel-gold transition-colors">
                        {team.name}
                      </h3>
                      {expanded === team.id ? <ChevronUp size={14} className="text-[#8888AA]" /> : <ChevronDown size={14} className="text-[#8888AA]" />}
                    </div>
                  </button>
                  {tab === 'active' && (
                    <div className="flex gap-3 mt-1 text-xs text-[#8888AA]">
                      <span>Hard Nodes: <OkBadge value={team.ok_hard_nodes} /></span>
                      <span>CN Node: <OkBadge value={team.ok_cn_node} /></span>
                      <span>Sans Boost: <OkBadge value={team.all_3_non_boosted} /></span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {tab === 'to_test' && (
                    <button
                      onClick={() => moveToActive(team.id)}
                      className="text-xs bg-green-900/40 text-green-300 border border-green-700 px-2 py-1 rounded hover:bg-green-900/60 transition-colors"
                    >
                      ✓ Testé
                    </button>
                  )}
                  <button onClick={() => openEdit(team)} className="text-[#8888AA] hover:text-white transition-colors p-1">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => remove(team.id)} className="text-[#8888AA] hover:text-red-400 transition-colors p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Expanded */}
              {expanded === team.id && (
                <div className="mt-4 space-y-4 border-t border-[#2D2D4E] pt-4">
                  {/* Slots */}
                  <div className="grid grid-cols-3 gap-3">
                    <TeamSlot character={team.left_character}  build={team.left_build}  support={team.left_support}  boost={team.left_boost}  />
                    <TeamSlot character={team.mid_character}   build={team.mid_build}   support={team.mid_support}   boost={team.mid_boost}   />
                    <TeamSlot character={team.right_character} build={team.right_build} support={team.right_support} boost={team.right_boost} />
                  </div>
                  {/* Strategy */}
                  {team.strategie && (
                    <div className="bg-[#0D0D0D] rounded-lg p-3">
                      <p className="text-xs text-marvel-gold font-semibold mb-1">Stratégie</p>
                      <p className="text-sm text-[#CCCCCC] whitespace-pre-line leading-relaxed">{team.strategie}</p>
                    </div>
                  )}
                  {team.note_additionnelle && (
                    <div className="bg-[#0D0D0D] rounded-lg p-3">
                      <p className="text-xs text-[#8888AA] font-semibold mb-1">Note</p>
                      <p className="text-sm text-[#CCCCCC] whitespace-pre-line">{team.note_additionnelle}</p>
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="card w-full max-w-2xl my-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-marvel text-xl text-marvel-gold">
                {modal === 'add' ? 'Nouvelle Équipe' : 'Modifier Équipe'}
              </h2>
              <button onClick={closeModal}><X size={18} className="text-[#8888AA] hover:text-white" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-[#8888AA] mb-1 block">Nom de l'équipe *</label>
                  <input className="input" value={form.name} onChange={f('name')} placeholder="Perso1 / Perso2 / Perso3" />
                </div>
                <div>
                  <label className="text-xs text-[#8888AA] mb-1 block">Statut</label>
                  <select className="input" value={form.status} onChange={f('status')}>
                    <option value="active">Active</option>
                    <option value="to_test">À Tester</option>
                    <option value="archived">Archivée</option>
                  </select>
                </div>
              </div>

              {/* Slots */}
              {(['left','mid','right'] as const).map(pos => (
                <div key={pos} className="bg-[#0D0D0D] rounded-lg p-3 space-y-2">
                  <p className="text-xs font-semibold text-marvel-gold uppercase">
                    {pos === 'left' ? 'Gauche' : pos === 'mid' ? 'Milieu' : 'Droite'}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <input className="input text-sm" placeholder="Personnage" value={form[`${pos}_character`] ?? ''} onChange={f(`${pos}_character`)} />
                    <input className="input text-sm" placeholder="Build (ex: 5/3/5)" value={form[`${pos}_build`] ?? ''} onChange={f(`${pos}_build`)} />
                    <input className="input text-sm" placeholder="Support" value={form[`${pos}_support`] ?? ''} onChange={f(`${pos}_support`)} />
                    <input className="input text-sm" placeholder="Boost" value={form[`${pos}_boost`] ?? ''} onChange={f(`${pos}_boost`)} />
                  </div>
                </div>
              ))}

              <div>
                <label className="text-xs text-[#8888AA] mb-1 block">Stratégie</label>
                <textarea className="input resize-none h-28" value={form.strategie ?? ''} onChange={f('strategie')} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {(['ok_hard_nodes','ok_cn_node','all_3_non_boosted'] as const).map(key => (
                  <div key={key}>
                    <label className="text-xs text-[#8888AA] mb-1 block">
                      {key === 'ok_hard_nodes' ? 'Hard Nodes' : key === 'ok_cn_node' ? 'CN Node' : 'Sans Boost'}
                    </label>
                    <select className="input" value={form[key] ?? ''} onChange={f(key)}>
                      <option value="">—</option>
                      <option value="Oui">Oui</option>
                      <option value="Non">Non</option>
                      <option value="Only Tested in PVP">PVP seulement</option>
                    </select>
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs text-[#8888AA] mb-1 block">Note additionnelle</label>
                <textarea className="input resize-none h-16" value={form.note_additionnelle ?? ''} onChange={f('note_additionnelle')} />
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
