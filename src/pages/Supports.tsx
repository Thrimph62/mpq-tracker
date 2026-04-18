import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Support } from '../types'
import { Plus, Search, X, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

const RESTRICTIONS = ['/', 'Héros', 'Vilains']

const EMPTY: Omit<Support, 'id' | 'created_at' | 'updated_at'> = {
  name: '', rang: 5, niveau: 250, restriction: '/',
  mp_bonus: null, degats_up: null, degats_ennemis: null,
  creation: null, destruction_ennemi: null, fortification: null,
  sante: null, autre: null, synergie: null, for_filter: null,
}

export default function Supports() {
  const [supports, setSupports] = useState<Support[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filterRestr, setFilterRestr] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [modal, setModal]       = useState<'add' | 'edit' | null>(null)
  const [form, setForm]         = useState<typeof EMPTY>(EMPTY)
  const [editId, setEditId]     = useState<string | null>(null)
  const [saving, setSaving]     = useState(false)

  async function load() {
    const { data } = await supabase.from('supports').select('*').order('name')
    if (data) setSupports(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const visible = supports.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.synergie?.toLowerCase().includes(search.toLowerCase()) ?? false)
    const matchRestr  = !filterRestr || s.restriction === filterRestr
    return matchSearch && matchRestr
  })

  function openAdd()     { setForm(EMPTY); setEditId(null); setModal('add') }
  function openEdit(s: Support) {
    const { id, created_at, updated_at, ...rest } = s
    setForm(rest); setEditId(s.id); setModal('edit')
  }
  function closeModal()  { setModal(null); setEditId(null) }

  const f = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value || null }))

  async function save() {
    setSaving(true)
    if (modal === 'add') {
      await supabase.from('supports').insert([form])
    } else if (editId) {
      await supabase.from('supports').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editId)
    }
    await load(); closeModal(); setSaving(false)
  }

  async function remove(id: string) {
    if (!confirm('Supprimer ce support ?')) return
    await supabase.from('supports').delete().eq('id', id)
    setSupports(prev => prev.filter(s => s.id !== id))
  }

  const EFFECT_FIELDS: Array<[keyof Support, string]> = [
    ['mp_bonus', 'Bonus MP'], ['degats_up', '🡹 Dégats'], ['degats_ennemis', '🢃 Dégats Ennemis'],
    ['creation', 'Création'], ['destruction_ennemi', 'Destruction Ennemi'],
    ['fortification', 'Fortification'], ['sante', 'Santé'], ['autre', 'Autre'],
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Supports</h1>
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
        <select className="input w-auto" value={filterRestr} onChange={e => setFilterRestr(e.target.value)}>
          <option value="">Toutes restrictions</option>
          {RESTRICTIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <p className="text-sm text-[#8888AA]">{visible.length} support{visible.length !== 1 ? 's' : ''}</p>

      {loading ? <Spinner /> : (
        <div className="space-y-2">
          {visible.map(s => (
            <div key={s.id} className="card">
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                  className="flex-1 text-left flex items-center gap-3 group"
                >
                  <div className="flex-1">
                    <span className="font-semibold group-hover:text-marvel-gold transition-colors">{s.name}</span>
                    <div className="flex gap-3 mt-0.5 text-xs text-[#8888AA]">
                      {s.rang && <span>{s.rang}★</span>}
                      {s.niveau && <span>Niv. {s.niveau}</span>}
                      {s.restriction && s.restriction !== '/' && (
                        <span className={s.restriction === 'Héros' ? 'text-blue-400' : 'text-red-400'}>
                          {s.restriction}
                        </span>
                      )}
                      {s.synergie && <span className="text-marvel-gold">⚡ {s.synergie}</span>}
                    </div>
                  </div>
                  {expanded === s.id ? <ChevronUp size={14} className="text-[#8888AA]" /> : <ChevronDown size={14} className="text-[#8888AA]" />}
                </button>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openEdit(s)} className="text-[#8888AA] hover:text-white p-1">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => remove(s.id)} className="text-[#8888AA] hover:text-red-400 p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {expanded === s.id && (
                <div className="mt-3 pt-3 border-t border-[#2D2D4E] grid grid-cols-2 md:grid-cols-4 gap-2">
                  {EFFECT_FIELDS.map(([key, label]) =>
                    s[key] ? (
                      <div key={key} className="bg-[#0D0D0D] rounded-lg p-2">
                        <p className="text-xs text-[#8888AA]">{label}</p>
                        <p className="text-sm text-white mt-0.5">{String(s[key])}</p>
                      </div>
                    ) : null
                  )}
                  {s.mp_bonus && <div className="col-span-full text-xs text-marvel-gold mt-1">MP: {s.mp_bonus}</div>}
                </div>
              )}
            </div>
          ))}
          {visible.length === 0 && <div className="card text-center text-[#8888AA] py-12">Aucun support trouvé</div>}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="card w-full max-w-xl my-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-marvel text-xl text-marvel-gold">
                {modal === 'add' ? 'Nouveau Support' : 'Modifier Support'}
              </h2>
              <button onClick={closeModal}><X size={18} className="text-[#8888AA] hover:text-white" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-3">
                  <label className="text-xs text-[#8888AA] mb-1 block">Nom *</label>
                  <input className="input" value={form.name} onChange={f('name')} />
                </div>
                <div>
                  <label className="text-xs text-[#8888AA] mb-1 block">Rang</label>
                  <input type="number" className="input" value={form.rang ?? ''} onChange={e => setForm(p => ({...p, rang: Number(e.target.value) || null}))} />
                </div>
                <div>
                  <label className="text-xs text-[#8888AA] mb-1 block">Niveau</label>
                  <input type="number" className="input" value={form.niveau ?? ''} onChange={e => setForm(p => ({...p, niveau: Number(e.target.value) || null}))} />
                </div>
                <div>
                  <label className="text-xs text-[#8888AA] mb-1 block">Restriction</label>
                  <select className="input" value={form.restriction ?? '/'} onChange={f('restriction')}>
                    {RESTRICTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              {EFFECT_FIELDS.map(([key, label]) => (
                <div key={key}>
                  <label className="text-xs text-[#8888AA] mb-1 block">{label}</label>
                  <input className="input text-sm" value={String(form[key] ?? '')} onChange={f(key as any)} />
                </div>
              ))}
              <div>
                <label className="text-xs text-[#8888AA] mb-1 block">Synergie (personnage)</label>
                <input className="input text-sm" value={form.synergie ?? ''} onChange={f('synergie')} />
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
