import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { PuzzleGauntlet as PGType, Character, Support } from '../types'
import { TeamSlot } from '../components/TeamSlot'
import { SearchDropdown, toCharacterOptions, toSupportOptions } from '../components/SearchDropdown'
import { Plus, Search, X, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

const EMPTY: Omit<PGType, 'id' | 'created_at' | 'updated_at'> = {
  categorie: null, node: null, condition_victoire: null,
  gauche_personnage: null, gauche_build: null, gauche_support: null,
  milieu_personnage: null, milieu_build: null, milieu_support: null,
  droite_personnage: null, droite_build: null, droite_support: null,
  equipe_utilisee: null, note: null,
}

const SLOTS = [
  { pos: 'gauche', label: 'Gauche' },
  { pos: 'milieu', label: 'Milieu' },
  { pos: 'droite', label: 'Droite' },
] as const

export default function PuzzleGauntlet() {
  const [nodes, setNodes]         = useState<PGType[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [supports, setSupports]   = useState<Support[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [expanded, setExpanded]   = useState<string | null>(null)
  const [modal, setModal]         = useState<'add' | 'edit' | null>(null)
  const [form, setForm]           = useState<typeof EMPTY>(EMPTY)
  const [editId, setEditId]       = useState<string | null>(null)
  const [saving, setSaving]       = useState(false)

  async function load() {
    const [{ data: n }, { data: c }, { data: s }] = await Promise.all([
      supabase.from('puzzle_gauntlet').select('*').order('categorie').order('node'),
      supabase.from('characters').select('*').order('base_name').order('version'),
      supabase.from('supports').select('*').order('name'),
    ])
    if (n) setNodes(n)
    if (c) setCharacters(c)
    if (s) setSupports(s)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const categories = [...new Set(nodes.map(n => n.categorie).filter(Boolean))] as string[]

  const visible = nodes.filter(n => {
    const matchSearch = !search || [n.node, n.categorie, n.condition_victoire,
      n.gauche_personnage, n.milieu_personnage, n.droite_personnage]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()))
    const matchCat = !filterCat || n.categorie === filterCat
    return matchSearch && matchCat
  })

  const grouped = (filterCat ? [filterCat] : categories).reduce<Record<string, PGType[]>>((acc, cat) => {
    acc[cat] = visible.filter(n => n.categorie === cat)
    return acc
  }, {})

  function openAdd()    { setForm(EMPTY); setEditId(null); setModal('add') }
  function openEdit(n: PGType) {
    const { id, created_at, updated_at, ...rest } = n
    setForm(rest); setEditId(n.id); setModal('edit')
  }
  function closeModal() { setModal(null); setEditId(null) }

  function setSlot(pos: 'gauche' | 'milieu' | 'droite', field: 'personnage' | 'build' | 'support', val: string | null) {
    setForm(f => ({ ...f, [`${pos}_${field}`]: val }))
  }

  async function save() {
    setSaving(true)
    if (modal === 'add') await supabase.from('puzzle_gauntlet').insert([form])
    else if (editId) await supabase.from('puzzle_gauntlet').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editId)
    await load(); closeModal(); setSaving(false)
  }

  async function remove(id: string) {
    if (!confirm('Supprimer ce node ?')) return
    await supabase.from('puzzle_gauntlet').delete().eq('id', id)
    setNodes(prev => prev.filter(n => n.id !== id))
  }

  const charOptions    = toCharacterOptions(characters)
  const supportOptions = toSupportOptions(supports)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Puzzle Gauntlet</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16} /> Ajouter</button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C8C8E0]" />
          <input className="input pl-9" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">Toutes catégories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <p className="text-sm text-[#C8C8E0]">{visible.length} node{visible.length !== 1 ? 's' : ''}</p>

      {loading ? <Spinner /> : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, catNodes]) => {
            if (catNodes.length === 0) return null
            return (
              <div key={cat}>
                <h2 className="font-marvel text-lg text-marvel-gold mb-2">{cat}</h2>
                <div className="space-y-2">
                  {catNodes.map(n => (
                    <div key={n.id} className="card">
                      <div className="flex items-start justify-between gap-4">
                        <button onClick={() => setExpanded(expanded === n.id ? null : n.id)}
                          className="flex-1 text-left group">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold group-hover:text-marvel-gold transition-colors">{n.node}</span>
                            {expanded === n.id ? <ChevronUp size={14} className="text-[#C8C8E0]" /> : <ChevronDown size={14} className="text-[#C8C8E0]" />}
                          </div>
                          {n.condition_victoire && <p className="text-xs text-blue-300 mt-0.5">🎯 {n.condition_victoire}</p>}
                        </button>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => openEdit(n)} className="text-[#C8C8E0] hover:text-white p-1"><Pencil size={14} /></button>
                          <button onClick={() => remove(n.id)} className="text-[#C8C8E0] hover:text-red-400 p-1"><Trash2 size={14} /></button>
                        </div>
                      </div>

                      {expanded === n.id && (
                        <div className="mt-4 pt-4 border-t border-[#6A6A95] space-y-4">
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
                            <div className="bg-[#383860] rounded-lg p-3">
                              <p className="text-xs text-marvel-gold font-semibold mb-1">Stratégie</p>
                              <p className="text-sm text-[#E8E8F8] whitespace-pre-line leading-relaxed">{n.note}</p>
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
          {visible.length === 0 && <div className="card text-center text-[#C8C8E0] py-12">Aucun node trouvé</div>}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="card w-full max-w-xl my-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-marvel text-xl text-marvel-gold">{modal === 'add' ? 'Nouveau Node' : 'Modifier Node'}</h2>
              <button onClick={closeModal}><X size={18} className="text-[#C8C8E0] hover:text-white" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#C8C8E0] mb-1 block">Catégorie</label>
                  <input className="input text-sm" value={form.categorie ?? ''}
                    onChange={e => setForm(f => ({ ...f, categorie: e.target.value || null }))} />
                </div>
                <div>
                  <label className="text-xs text-[#C8C8E0] mb-1 block">Node</label>
                  <input className="input text-sm" value={form.node ?? ''}
                    onChange={e => setForm(f => ({ ...f, node: e.target.value || null }))} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-[#C8C8E0] mb-1 block">Condition de victoire</label>
                  <input className="input text-sm" value={form.condition_victoire ?? ''}
                    onChange={e => setForm(f => ({ ...f, condition_victoire: e.target.value || null }))} />
                </div>
              </div>

              {SLOTS.map(({ pos, label }) => (
                <div key={pos} className="bg-[#383860] rounded-lg p-3 space-y-2">
                  <p className="text-xs font-semibold text-marvel-gold">{label}</p>
                  <div>
                    <label className="text-xs text-[#C8C8E0] mb-1 block">Personnage</label>
                    <SearchDropdown
                      value={form[`${pos}_personnage`]}
                      onChange={v => setSlot(pos, 'personnage', v)}
                      options={charOptions}
                      placeholder="Rechercher un personnage..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
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
                        placeholder="Rechercher un support..."
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div>
                <label className="text-xs text-[#C8C8E0] mb-1 block">Équipe utilisée</label>
                <input className="input text-sm" value={form.equipe_utilisee ?? ''}
                  onChange={e => setForm(f => ({ ...f, equipe_utilisee: e.target.value || null }))} />
              </div>
              <div>
                <label className="text-xs text-[#C8C8E0] mb-1 block">Stratégie / Note</label>
                <textarea className="input resize-none h-24 text-sm" value={form.note ?? ''}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value || null }))} />
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
