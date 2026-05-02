// ── Types ─────────────────────────────────────────────────────────────────────
export interface EffectData {
  category:        string | null
  sous_category:   string | null
  sous_category_2: string | null
  degats:          string | null
  quantite:        string | null
  force:           string | null
  choix:           string | null
  autre:           string | null
  trigger:         string | null
}

export const EMPTY_EFFECT: EffectData = {
  category: null, sous_category: null, sous_category_2: null,
  degats: null, quantite: null, force: null, choix: null, autre: null, trigger: null,
}

// ── Colors ────────────────────────────────────────────────────────────────────
export function catColor(cat: string | null): string {
  if (!cat) return 'bg-[#3D3D60] text-[#C8C8E0] border-[#555]'
  if (cat.includes('Gain MP'))       return 'bg-blue-900/50   text-blue-300   border-blue-700'
  if (cat.includes('Dégâts'))        return 'bg-red-900/50    text-red-300    border-red-700'
  if (cat.includes('Création'))      return 'bg-green-900/50  text-green-300  border-green-700'
  if (cat.includes('Destruction'))   return 'bg-orange-900/50 text-orange-300 border-orange-700'
  if (cat.includes('Conversion'))    return 'bg-yellow-900/50 text-yellow-300 border-yellow-700'
  if (cat.includes('Fortification')) return 'bg-gray-700/50   text-gray-300   border-gray-500'
  if (cat.includes('Santé'))         return 'bg-teal-900/50   text-teal-300   border-teal-700'
  if (cat.includes('Paralysie'))     return 'bg-pink-900/50   text-pink-300   border-pink-700'
  return 'bg-[#3D3D60] text-[#C8C8E0] border-[#555]'
}

// Sous-category has its own softer badge palette (distinct from category)
function sousColor(val: string | null): string {
  if (!val) return 'bg-[#2A2A45] text-[#C8C8E0] border-[#4A4A6A]'
  return 'bg-indigo-900/40 text-indigo-200 border-indigo-700'
}

// ── Display ───────────────────────────────────────────────────────────────────
interface EffectDisplayProps extends EffectData {
  cout?: number | null
  center?: boolean
}

export function EffectDisplay({
  cout, category, sous_category, sous_category_2,
  degats, quantite, force, choix, autre, trigger, center = false
}: EffectDisplayProps) {
  const hasContent = cout || category || sous_category || sous_category_2 ||
    degats || quantite || force || choix || autre || trigger
  if (!hasContent) return <span className="text-[#444]">—</span>

  return (
    <div className={'space-y-1 text-xs' + (center ? ' text-center' : '')}>
      {cout !== null && cout !== undefined && <div><span className="text-marvel-gold font-bold">{cout} MP</span></div>}
      {category      && <div><span className={`badge border ${catColor(category)}`}>{category}</span></div>}
      {sous_category && <div><span className="badge border bg-indigo-900/40 text-indigo-200 border-indigo-700">{sous_category}</span></div>}
      {sous_category_2 && <div><span className="badge border bg-violet-900/40 text-violet-200 border-violet-700">{sous_category_2}</span></div>}
      {degats   && <div><span className="text-[#D8D8EE]">Dmg: {degats}</span></div>}
      {quantite && <div><span className="text-[#D8D8EE]">qte: {quantite}</span></div>}
      {force    && <div><span className="text-[#D8D8EE]">Force: {force}</span></div>}
      {choix    && <div><span className="text-[#D8D8EE]">{choix}</span></div>}
      {autre    && <div><span className="text-[#D8D8EE]">{autre}</span></div>}
      {trigger  && <div><span className="text-[#D8D8EE] italic">Trigger: {trigger}</span></div>}
    </div>
  )
}

// ── DynamicSelect ─────────────────────────────────────────────────────────────
interface DynamicSelectProps {
  value: string | null
  onChange: (v: string | null) => void
  options: string[]
  placeholder: string
  disabled?: boolean
}

export function DynamicSelect({ value, onChange, options, placeholder, disabled = false }: DynamicSelectProps) {
  const isNew = value !== null && value !== '' && !options.includes(value)
  if (disabled) {
    return <div className="input text-sm text-[#555] cursor-not-allowed opacity-50">— Sélectionner d'abord —</div>
  }
  return (
    <div className="space-y-1">
      <select className="input text-sm"
        value={isNew ? '__new__' : (value ?? '')}
        onChange={e => { if (e.target.value === '__new__') onChange(''); else onChange(e.target.value || null) }}>
        <option value="">— Aucun —</option>
        {options.map(c => <option key={c} value={c}>{c}</option>)}
        <option value="__new__">+ Nouveau {placeholder.toLowerCase()}...</option>
      </select>
      {(isNew || value === '') && (
        <input className="input text-sm" placeholder={`Nouveau ${placeholder.toLowerCase()}...`}
          autoFocus={value === ''} value={value ?? ''} onChange={e => onChange(e.target.value || null)} />
      )}
    </div>
  )
}

// ── EffectForm ────────────────────────────────────────────────────────────────
interface EffectFormProps {
  label: string
  data: EffectData
  onChange: (field: keyof EffectData, val: string | null) => void
  allCategories: string[]
  categoryMap: Record<string, string[]>      // category  → sous_categories
  sousMap: Record<string, string[]>          // sous_category → sous_category_2 list
  allTriggers: string[]
  coutValue?: number | null
  onCoutChange?: (val: number | null) => void
}

export function EffectForm({
  label, data, onChange, allCategories, categoryMap, sousMap,
  allTriggers, coutValue, onCoutChange
}: EffectFormProps) {
  const availableSous = data.category ? (categoryMap[data.category] ?? []) : []
  const availableSous2 = data.sous_category ? (sousMap[data.sous_category] ?? []) : []

  function handleCategoryChange(val: string | null) {
    onChange('category', val)
    const validSous = val ? (categoryMap[val] ?? []) : []
    if (data.sous_category && !validSous.includes(data.sous_category)) {
      onChange('sous_category', null)
      onChange('sous_category_2', null)
    }
  }

  function handleSousChange(val: string | null) {
    onChange('sous_category', val)
    const validSous2 = val ? (sousMap[val] ?? []) : []
    if (data.sous_category_2 && !validSous2.includes(data.sous_category_2)) {
      onChange('sous_category_2', null)
    }
  }

  return (
    <div className="bg-[#1C1C2E] rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-xs text-[#C8C8E0] font-medium">{label}</p>
        {onCoutChange !== undefined && (
          <div className="flex items-center gap-1">
            <input type="number" className="input text-sm py-1 w-20" placeholder="MP"
              value={coutValue ?? ''}
              onChange={e => onCoutChange(e.target.value ? Number(e.target.value) : null)} />
            <span className="text-xs text-[#C8C8E0]">MP</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {/* Catégorie */}
        <div>
          <label className="text-xs text-[#C8C8E0] mb-1 block">Catégorie</label>
          <DynamicSelect value={data.category} onChange={handleCategoryChange} options={allCategories} placeholder="Catégorie" />
        </div>
        {/* Sous Catégorie — linked to Catégorie */}
        <div>
          <label className="text-xs text-[#C8C8E0] mb-1 block">
            Sous Catégorie {!data.category && <span className="text-[#555]">(choisir catégorie d'abord)</span>}
          </label>
          <DynamicSelect value={data.sous_category} onChange={handleSousChange}
            options={availableSous} placeholder="Sous Catégorie" disabled={!data.category} />
        </div>
        {/* Sous Catégorie 2 — linked to Sous Catégorie */}
        <div>
          <label className="text-xs text-[#C8C8E0] mb-1 block">
            Sous Catégorie 2
          </label>
          <DynamicSelect value={data.sous_category_2} onChange={v => onChange('sous_category_2', v)}
            options={availableSous2} placeholder="Sous Catégorie 2" />
        </div>
        {/* Dégâts */}
        <div>
          <label className="text-xs text-[#C8C8E0] mb-1 block">Dégâts <span className="text-[#555]">(Dmg: xxx)</span></label>
          <input className="input text-sm" placeholder="Ex: 2500" value={data.degats ?? ''}
            onChange={e => onChange('degats', e.target.value || null)} />
        </div>
        {/* Quantité */}
        <div>
          <label className="text-xs text-[#C8C8E0] mb-1 block">Quantité <span className="text-[#555]">(qte: xxx)</span></label>
          <input className="input text-sm" placeholder="Ex: 3" value={data.quantite ?? ''}
            onChange={e => onChange('quantite', e.target.value || null)} />
        </div>
        {/* Force */}
        <div>
          <label className="text-xs text-[#C8C8E0] mb-1 block">Force <span className="text-[#555]">(Force: xxx)</span></label>
          <input className="input text-sm" placeholder="Ex: x2" value={data.force ?? ''}
            onChange={e => onChange('force', e.target.value || null)} />
        </div>
        {/* Choix */}
        <div>
          <label className="text-xs text-[#C8C8E0] mb-1 block">Choix</label>
          <input className="input text-sm" placeholder="Description libre..." value={data.choix ?? ''}
            onChange={e => onChange('choix', e.target.value || null)} />
        </div>
        {/* Autre */}
        <div>
          <label className="text-xs text-[#C8C8E0] mb-1 block">Autre</label>
          <input className="input text-sm" placeholder="Description libre..." value={data.autre ?? ''}
            onChange={e => onChange('autre', e.target.value || null)} />
        </div>
        {/* Trigger */}
        <div className="col-span-2">
          <label className="text-xs text-[#C8C8E0] mb-1 block">Trigger <span className="text-[#555]">(Trigger: xxx)</span></label>
          <DynamicSelect value={data.trigger} onChange={v => onChange('trigger', v)} options={allTriggers} placeholder="Trigger" />
        </div>
      </div>
    </div>
  )
}
