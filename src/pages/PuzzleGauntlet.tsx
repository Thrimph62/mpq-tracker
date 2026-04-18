import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { PuzzleGauntlet as PGType } from '../types'
import { TeamSlot } from '../components/TeamSlot'
import { Plus, Search, X, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

const EMPTY: Omit<PGType, 'id' | 'created_at' | 'updated_at'> = {
  categorie: null, node: null, condition_victoire: null,
  gauche_personnage: null, gauche_build: null, gauche_support: null,
  milieu_personnage: null, milieu_build: null, milieu_support: null,
  droite_personnage: null, droite_build: null, droite_support: null,
  equipe_utilisee: null, note: null,
}

export default function PuzzleGauntlet() {
  const [nodes, setNodes]     = useState<PGType[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [expanded, setExpanded]   = useState<string | null>(null)
  const [modal, setModal]     = useState<'add' | 'edit' | null>(null)
  const [form, setForm]       = useState<typeof EMPTY>(EMPTY)
  const [editId, setEditId]   = useState<string | null>(null)
  const [saving, setSaving]   = useState(false)

  async function load() {
    const { data } = await supabase.from('puzzle_gauntlet').select('*').order('categorie').order('node')
    if (data) setNodes(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const categories = [...new Set(nodes.map(n => n.categorie).filter(Boolean))] as string[]

  const visible = nodes.filter(n => {
    const matchSearch = !search ||
      [n.node, n.categorie, n.condition_victoire, n.gauche_personnage, n.milieu_personnage, n.droite_personnage]
        .some(v => v?.toLowerCase().includes(search.toLowerCase()))
    const matchCat = !filterCat || n.categorie === filterCat
    return matchSearch && matchCat
  })

  // Group by category
  const grouped = categories.reduce<Record<string, PGType[]>>((acc, cat) => {
    acc[cat] = visible.filter(n => n.categorie === cat)
    return acc
  }, {})

  function openAdd()    { setForm(EMPTY); setEditId(null); setModal('add') }
  function openEdit(n: PGType) {
    const { id, created_at, updated_at, ...rest } = n
    setForm(rest); setEditId(n.id); setModal('edit')
  }
  function closeModal() { setModal(null); setEditId(null) }

  const f = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value || null }))

  async function save() {
    setSaving(true)
    if (modal === 'add') {
      await supabase.from('puzzle_gauntlet').insert([form])
    } else if (editId) {
      await supabase.from('puzzle_gauntlet').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editId)
    }
    await load(); closeModal(); setSaving(false)
  }

  async function remove(id: string) {
    if (!confirm('Supprimer ce node ?')) return
    await supabase.from('puzzle_gauntlet').delete().eq('id', id)
    setNodes(prev => prev.filter(n => n.id !== id))
  }

  const SLOTS = [
    { pos: 'gauche', label: 'Gauche' },
    { pos: 'milieu', label: 'Milieu' },
    { pos: 'droite', label: 'Droite' },
  ] as const

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Puzzle Gauntlet</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8888AA]" />
          <input className="input pl-9" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">Toutes catégories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <p className="text-sm text-[#8888AA]">{visible.length} node{visible.length !== 1 ? 's' : ''}</p>

      {loading ? <Spinner /> : (
        <div className="space-y-6">
          {(filterCat ? [filterCat] : categories).map(cat => {
            const catNodes = grouped[cat] ?? []
            if (catNodes.length === 0) return null
            return (
              <div key={cat}>
                <h2 className="font-marvel text-lg text-marvel-gold mb-2">{cat}</h2>
                <div className="space-y-2">
                  {catNodes.map(n => (
                    <div key={n.id} className="card">
                      <div className="flex items-start justify-between gap-4">
                        <button
                          onClick={() => setExpanded(expanded === n.id ? null : n.id)}
                          className="flex-1 text-left group"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold group-hover:text-marvel-gold transition-colors">
                              {n.node}
                            </span>
                            {expanded === n.id ? <ChevronUp size={14} className="text-[#8888AA]" /> : <ChevronDown size={14} className="text-[#8888AA]" />}
                          </div>
                          {n.condition_victoire && (
                            <p className="text-xs text-blue-300 mt-0.5">🎯 {n.condition_victoire}</p>
                          )}
                        </button>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => openEdit(n)} className="text-[#8888AA] hover:text-white p-1"><Pencil size={14} /></button>
                          <button onClick={() => remove(n.id)} className="text-[#8888AA] hover:text-red-400 p-1"><Trash2 size={14} /></button>
                        </div>
                      </div>

                      {expanded === n.id && (
                        <div className="mt-4 pt-4 border-t border-[#2D2D4E] space-y-4">
                          <div className="grid grid-cols-3 gap-3">
                            <TeamSlot character={n.gauche_personnage} build={n.gauche_build} support={n.gauche_support} />
                            <TeamSlot character={n.milieu_personnage} build={n.milieu_build} support={n.milieu_support} />
                            <TeamSlot character={n.droite_personnage} build={n.droite_build} support={n.droite_support} />
                          </div>
                          {n.equipe_utilisee && (
                            <div className="bg-purple-900/20 border border-purple-700/40 rounded-lg p-3">
                              <p className="text-xs text-purple-300 font-semibold mb-1">Équipe utilisée</p>
                              <p className="text-sm text-white">{n.equipe_utilisee}</p>
                            </div>
                          )}
                          {n.note && (
                            <div className="bg-[#0D0D0D] rounded-lg p-3">
                              <p className="text-xs text-marvel-gold font-semibold mb-1">Stratégie</p>
                              <p className="text-sm text-[#CCCCCC] whitespace-pre-line leading-relaxed">{n.note}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          {visible.length === 0 && <div className="card text-center text-[#8888AA] py-12">Aucun node trouvé</div>}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="card w-full max-w-xl my-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-marvel text-xl text-marvel-gold">
                {modal === 'add' ? 'Nouveau Node' : 'Modifier Node'}
              </h2>
              <button onClick={closeModal}><X size={18} className="text-[#8888AA] hover:text-white" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#8888AA] mb-1 block">Catégorie</label>
                  <input className="input text-sm" value={form.categorie ?? ''} onChange={f('categorie')} />
                </div>
                <div>
                  <label className="text-xs text-[#8888AA] mb-1 block">Node</label>
                  <input className="input text-sm" value={form.node ?? ''} onChange={f('node')} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-[#8888AA] mb-1 block">Condition de victoire</label>
                  <input className="input text-sm" value={form.condition_victoire ?? ''} onChange={f('condition_victoire')} />
                </div>
              </div>
              {SLOTS.map(({ pos, label }) => (
                <div key={pos} className="bg-[#0D0D0D] rounded-lg p-3 space-y-2">
                  <p className="text-xs font-semibold text-marvel-gold">{label}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <input className="input text-sm" placeholder="Personnage" value={form[`${pos}_personnage`] ?? ''} onChange={f(`${pos}_personnage`)} />
                    <input className="input text-sm" placeholder="Build" value={form[`${pos}_build`] ?? ''} onChange={f(`${pos}_build`)} />
                    <input className="input text-sm" placeholder="Support" value={form[`${pos}_support`] ?? ''} onChange={f(`${pos}_support`)} />
                  </div>
                </div>
              ))}
              <div>
                <label className="text-xs text-[#8888AA] mb-1 block">Équipe utilisée</label>
                <input className="input text-sm" value={form.equipe_utilisee ?? ''} onChange={f('equipe_utilisee')} />
              </div>
              <div>
                <label className="text-xs text-[#8888AA] mb-1 block">Stratégie / Note</label>
                <textarea className="input resize-none h-24 text-sm" value={form.note ?? ''} onChange={f('note')} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={closeModal} className="btn-secondary flex-1">Annuler</button>
                <button onClick={save} disabled={saving} className="btn-primary flex-1">
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
