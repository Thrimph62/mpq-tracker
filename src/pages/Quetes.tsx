import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Quete, Character, Support } from '../types'
import { TeamSlot } from '../components/TeamSlot'
import { SearchDropdown, toCharacterOptions, toSupportOptions } from '../components/SearchDropdown'
import { Plus, Search, X, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

const EMPTY: Omit<Quete, 'id' | 'created_at' | 'updated_at'> = {
  nom: '',
  gauche_personnage: null, gauche_build: null, gauche_support: null,
  milieu_personnage: null, milieu_build: null, milieu_support: null,
  droite_personnage: null, droite_build: null, droite_support: null,
  note: null,
}

const SLOTS = [
  { pos: 'gauche', label: 'Gauche' },
  { pos: 'milieu', label: 'Milieu' },
  { pos: 'droite', label: 'Droite' },
] as const

export default function Quetes() {
  const [quetes, setQuetes]       = useState<Quete[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [supports, setSupports]   = useState<Support[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [expanded, setExpanded]   = useState<string | null>(null)
  const [modal, setModal]         = useState<'add' | 'edit' | null>(null)
  const [form, setForm]           = useState<typeof EMPTY>(EMPTY)
  const [editId, setEditId]       = useState<string | null>(null)
  const [saving, setSaving]       = useState(false)

  async function load() {
    const [{ data: q }, { data: c }, { data: s }] = await Promise.all([
      supabase.from('quetes').select('*').order('nom'),
      supabase.from('characters').select('*').order('base_name').order('version'),
      supabase.from('supports').select('*').order('name'),
    ])
    if (q) setQuetes(q)
    if (c) setCharacters(c)
    if (s) setSupports(s)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const visible = quetes.filter(q =>
    q.nom.toLowerCase().includes(search.toLowerCase()) ||
    [q.gauche_personnage, q.milieu_personnage, q.droite_personnage]
      .some(c => c?.toLowerCase().includes(search.toLowerCase()))
  )

  function openAdd()    { setForm(EMPTY); setEditId(null); setModal('add') }
  function openEdit(q: Quete) {
    const { id, created_at, updated_at, ...rest } = q
    setForm(rest); setEditId(q.id); setModal('edit')
  }
  function closeModal() { setModal(null); setEditId(null) }

  function setSlot(pos: 'gauche' | 'milieu' | 'droite', field: 'personnage' | 'build' | 'support', val: string | null) {
    setForm(f => ({ ...f, [`${pos}_${field}`]: val }))
  }

  async function save() {
    setSaving(true)
    if (modal === 'add') await supabase.from('quetes').insert([form])
    else if (editId) await supabase.from('quetes').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editId)
    await load(); closeModal(); setSaving(false)
  }

  async function remove(id: string) {
    if (!confirm('Supprimer cette quête ?')) return
    await supabase.from('quetes').delete().eq('id', id)
    setQuetes(prev => prev.filter(q => q.id !== id))
  }

  const charOptions    = toCharacterOptions(characters)
  const supportOptions = toSupportOptions(supports)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Quêtes</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16} /> Ajouter</button>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C8C8E0]" />
        <input className="input pl-9" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <p className="text-sm text-[#C8C8E0]">{visible.length} quête{visible.length !== 1 ? 's' : ''}</p>

      {loading ? <Spinner /> : (
        <div className="space-y-2">
          {visible.map(q => (
            <div key={q.id} className="card">
              <div className="flex items-center justify-between gap-4">
                <button onClick={() => setExpanded(expanded === q.id ? null : q.id)}
                  className="flex-1 text-left flex items-center gap-2 group">
                  <span className="font-semibold group-hover:text-marvel-gold transition-colors">{q.nom}</span>
                  {expanded === q.id ? <ChevronUp size={14} className="text-[#C8C8E0]" /> : <ChevronDown size={14} className="text-[#C8C8E0]" />}
                </button>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openEdit(q)} className="text-[#C8C8E0] hover:text-white p-1"><Pencil size={14} /></button>
                  <button onClick={() => remove(q.id)} className="text-[#C8C8E0] hover:text-red-400 p-1"><Trash2 size={14} /></button>
                </div>
              </div>

              {expanded === q.id && (
                <div className="mt-4 pt-4 border-t border-[#6A6A95] space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <TeamSlot character={q.gauche_personnage} build={q.gauche_build} support={q.gauche_support} />
                    <TeamSlot character={q.milieu_personnage} build={q.milieu_build} support={q.milieu_support} />
                    <TeamSlot character={q.droite_personnage} build={q.droite_build} support={q.droite_support} />
                  </div>
                  {q.note && (
                    <div className="bg-[#383860] rounded-lg p-3">
                      <p className="text-xs text-marvel-gold font-semibold mb-1">Note</p>
                      <p className="text-sm text-[#E8E8F8] whitespace-pre-line leading-relaxed">{q.note}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {visible.length === 0 && <div className="card text-center text-[#C8C8E0] py-12">Aucune quête trouvée</div>}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="card w-full max-w-xl my-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-marvel text-xl text-marvel-gold">{modal === 'add' ? 'Nouvelle Quête' : 'Modifier Quête'}</h2>
              <button onClick={closeModal}><X size={18} className="text-[#C8C8E0] hover:text-white" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#C8C8E0] mb-1 block">Nom de la quête *</label>
                <input className="input" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
              </div>

              {SLOTS.map(({ pos, label }) => (
                <div key={pos} className="bg-[#383860] rounded-lg p-3 space-y-2">
                  <p className="text-xs font-semibold text-marvel-gold">{label}</p>
                  <div className="grid grid-cols-1 gap-2">
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
                </div>
              ))}

              <div>
                <label className="text-xs text-[#C8C8E0] mb-1 block">Note / Stratégie</label>
                <textarea className="input resize-none h-24" value={form.note ?? ''}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value || null }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={closeModal} className="btn-secondary flex-1">Annuler</button>
                <button onClick={save} disabled={saving || !form.nom} className="btn-primary flex-1">
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
