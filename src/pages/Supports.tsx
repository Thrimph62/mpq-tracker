import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Support } from '../types'
import { Plus, Search, X, Pencil, Trash2 } from 'lucide-react'

// Effect columns shown in the table
const EFFECT_COLS: { key: keyof Support; label: string; short: string }[] = [
  { key: 'mp_bonus',           label: 'Bonus MP',          short: 'MP'    },
  { key: 'degats_up',          label: '🡹 Dégâts',          short: '🡹Dég' },
  { key: 'degats_ennemis',     label: '🢃 Dég. Ennemis',    short: '🢃Dég' },
  { key: 'creation',           label: 'Création',           short: 'Créa'  },
  { key: 'destruction_ennemi', label: 'Destruction',        short: 'Destr' },
  { key: 'fortification',      label: 'Fortification',      short: 'Fort'  },
  { key: 'sante',              label: 'Santé',              short: 'Santé' },
  { key: 'autre',              label: 'Autre',              short: 'Autre' },
  { key: 'synergie',           label: 'Synergie',           short: 'Syn'   },
]

const DEFAULT_RESTRICTIONS = ['/', 'Héros', 'Vilains']

const EMPTY: Omit<Support, 'id' | 'created_at' | 'updated_at'> = {
  name: '', rang: 5, niveau: 250, restriction: '/',
  mp_bonus: null, degats_up: null, degats_ennemis: null,
  creation: null, destruction_ennemi: null, fortification: null,
  sante: null, autre: null, synergie: null, for_filter: null,
}

export default function Supports() {
  const [supports, setSupports]   = useState<Support[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterRestr, setFilterRestr] = useState('')
  const [modal, setModal]         = useState<'add' | 'edit' | null>(null)
  const [form, setForm]           = useState<typeof EMPTY>(EMPTY)
  const [editId, setEditId]       = useState<string | null>(null)
  const [saving, setSaving]       = useState(false)
  const [customRestr, setCustomRestr] = useState('')

  async function load() {
    const { data } = await supabase.from('supports').select('*').order('name')
    if (data) setSupports(data)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  // Build restriction list from existing data + defaults
  const allRestrictions = [
    ...new Set([
      ...DEFAULT_RESTRICTIONS,
      ...supports.map(s => s.restriction).filter(Boolean) as string[],
    ])
  ].sort()

  // Search across name + all effect fields
  const visible = supports.filter(s => {
    if (filterRestr && s.restriction !== filterRestr) return false
    if (!search) return true
    const q = search.toLowerCase()
    return [
      s.name, s.mp_bonus, s.degats_up, s.degats_ennemis, s.creation,
      s.destruction_ennemi, s.fortification, s.sante, s.autre, s.synergie,
      s.restriction,
    ].some(v => v?.toLowerCase().includes(q))
  })

  function openAdd()  { setForm(EMPTY); setEditId(null); setModal('add') }
  function openEdit(s: Support) {
    const { id, created_at, updated_at, ...rest } = s
    setForm(rest); setEditId(s.id); setModal('edit')
  }
  function closeModal() { setModal(null); setEditId(null); setCustomRestr('') }

  const f = (key: keyof typeof EMPTY) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value || null }))

  async function save() {
    setSaving(true)
    // Apply custom restriction if entered
    const payload = { ...form, restriction: customRestr || form.restriction }
    if (modal === 'add') await supabase.from('supports').insert([payload])
    else if (editId) await supabase.from('supports').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editId)
    await load(); closeModal(); setSaving(false)
  }

  async function remove(id: string) {
    if (!confirm('Supprimer ce support ?')) return
    await supabase.from('supports').delete().eq('id', id)
    setSupports(prev => prev.filter(s => s.id !== id))
  }

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
        <div className="relative flex-1 min-w-56">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8888AA]" />
          <input
            className="input pl-9"
            placeholder="Rechercher nom, effet, synergie..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-auto" value={filterRestr} onChange={e => setFilterRestr(e.target.value)}>
          <option value="">Toutes restrictions</option>
          {allRestrictions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <p className="text-sm text-[#8888AA]">{visible.length} support{visible.length !== 1 ? 's' : ''}</p>

      {/* Table */}
      {loading ? <Spinner /> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#2D2D4E] text-[#8888AA]">
                <th className="text-left py-2 px-2 font-normal min-w-36">Nom</th>
                <th className="text-center py-2 px-2 font-normal">★</th>
                <th className="text-center py-2 px-2 font-normal">Niv.</th>
                <th className="text-center py-2 px-2 font-normal">Restr.</th>
                {EFFECT_COLS.map(c => (
                  <th key={c.key} className="text-center py-2 px-1 font-normal min-w-20" title={c.label}>
                    {c.short}
                  </th>
                ))}
                <th className="text-right py-2 px-2 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(s => (
                <tr key={s.id} className="border-b border-[#2D2D4E]/40 hover:bg-[#2D2D4E]/20">
                  <td className="py-2 px-2 font-medium text-white">{s.name}</td>
                  <td className="py-2 px-2 text-center text-yellow-400">{s.rang ? '★'.repeat(Math.min(s.rang, 5)) : '—'}</td>
                  <td className="py-2 px-2 text-center text-[#8888AA]">{s.niveau ?? '—'}</td>
                  <td className="py-2 px-2 text-center">
                    {s.restriction && s.restriction !== '/' ? (
                      <span className={`badge border text-xs ${
                        s.restriction === 'Héros'
                          ? 'bg-blue-900/40 text-blue-300 border-blue-700'
                          : s.restriction === 'Vilains'
                          ? 'bg-red-900/40 text-red-300 border-red-700'
                          : 'bg-[#2D2D4E] text-[#8888AA] border-[#444]'
                      }`}>{s.restriction}</span>
                    ) : <span className="text-[#555]">—</span>}
                  </td>
                  {EFFECT_COLS.map(c => (
                    <td key={c.key} className="py-2 px-1 text-center max-w-32">
                      {s[c.key] ? (
                        <span
                          className="text-[#CCCCCC] leading-tight block truncate"
                          title={String(s[c.key])}
                        >
                          {String(s[c.key])}
                        </span>
                      ) : (
                        <span className="text-[#333]">—</span>
                      )}
                    </td>
                  ))}
                  <td className="py-2 px-2 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(s)} className="text-[#8888AA] hover:text-white transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => remove(s.id)} className="text-[#8888AA] hover:text-red-400 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && (
            <p className="text-center text-[#8888AA] py-8">Aucun support trouvé</p>
          )}
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
              <div>
                <label className="text-xs text-[#8888AA] mb-1 block">Nom *</label>
                <input className="input" value={form.name} onChange={f('name')} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-[#8888AA] mb-1 block">Rang</label>
                  <input type="number" className="input" value={form.rang ?? ''}
                    onChange={e => setForm(p => ({ ...p, rang: Number(e.target.value) || null }))} />
                </div>
                <div>
                  <label className="text-xs text-[#8888AA] mb-1 block">Niveau</label>
                  <input type="number" className="input" value={form.niveau ?? ''}
                    onChange={e => setForm(p => ({ ...p, niveau: Number(e.target.value) || null }))} />
                </div>
                <div>
                  <label className="text-xs text-[#8888AA] mb-1 block">Restriction</label>
                  <select className="input" value={customRestr ? '__custom__' : (form.restriction ?? '/')}
                    onChange={e => {
                      if (e.target.value === '__custom__') setCustomRestr(' ')
                      else { setCustomRestr(''); setForm(p => ({ ...p, restriction: e.target.value })) }
                    }}>
                    {allRestrictions.map(r => <option key={r} value={r}>{r}</option>)}
                    <option value="__custom__">+ Nouvelle restriction...</option>
                  </select>
                </div>
              </div>
              {/* Custom restriction input */}
              {(customRestr !== '') && (
                <div>
                  <label className="text-xs text-[#8888AA] mb-1 block">Nouvelle restriction</label>
                  <input className="input" placeholder="Ex: Symbiote, Mutant..." value={customRestr.trim()}
                    onChange={e => setCustomRestr(e.target.value)} />
                </div>
              )}
              {/* Effect fields */}
              <div className="grid grid-cols-2 gap-2">
                {EFFECT_COLS.map(c => (
                  <div key={c.key}>
                    <label className="text-xs text-[#8888AA] mb-1 block">{c.label}</label>
                    <input className="input text-sm" value={String((form as Record<string, unknown>)[c.key] ?? '')}
                      onChange={f(c.key as keyof typeof EMPTY)} />
                  </div>
                ))}
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
  return <div className="flex justify-center py-12">
    <div className="animate-spin w-8 h-8 border-2 border-marvel-red border-t-transparent rounded-full" />
  </div>
}
