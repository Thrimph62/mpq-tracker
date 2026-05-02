// Shared types and components for effect fields
// Used by both Supports and CharacterPowers pages

export interface EffectData {
  category: string | null
  sous_category: string | null
  quantite: string | null
  force: string | null
  autre: string | null
  trigger: string | null
}

export const EMPTY_EFFECT: EffectData = {
  category: null, sous_category: null, quantite: null,
  force: null, autre: null, trigger: null,
}

// ── Display: in table cells ───────────────────────────────────────────────────
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

interface EffectDisplayProps extends EffectData {
  cout?: number | null  // only for CharacterPowers
  center?: boolean
}

export function EffectDisplay({ cout, category, sous_category, quantite, force, autre, trigger, center = false }: EffectDisplayProps) {
  const hasContent = cout || category || sous_category || quantite || force || autre || trigger
  if (!hasContent) return <span className="text-[#444]">—</span>

  return (
    <div className={`space-y-0.5 text-xs ${center ? 'flex flex-col items-center' : ''}`}>
      {cout       !== null && cout !== undefined && (
        <span className="text-marvel-gold font-bold">{cout} MP</span>
      )}
      {category     && <span className={`badge border ${catColor(category)}`}>{category}</span>}
      {sous_category && <span className="text-[#D8D8EE] leading-tight">{sous_category}</span>}
      {quantite     && <span className="text-[#D8D8EE] leading-tight">qte: {quantite}</span>}
      {force        && <span className="text-[#D8D8EE] leading-tight">force: {force}</span>}
      {autre        && <span className="text-[#D8D8EE] leading-tight">{autre}</span>}
      {trigger      && <span className="text-[#D8D8EE] leading-tight italic">{trigger}</span>}
    </div>
  )
}

// ── Form: fields in modal ─────────────────────────────────────────────────────
interface DynamicSelectProps {
  value: string | null
  onChange: (v: string | null) => void
  options: string[]
  placeholder: string
}

export function DynamicSelect({ value, onChange, options, placeholder }: DynamicSelectProps) {
  const isNew = value !== null && value !== '' && !options.includes(value)
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

interface EffectFormProps {
  label: string
  data: EffectData
  onChange: (field: keyof EffectData, val: string | null) => void
  allCategories: string[]
  categoryMap: Record<string, string[]>  // category -> its sous_categories
  allTriggers: string[]
  coutValue?: number | null
  onCoutChange?: (val: number | null) => void
}

export function EffectForm({ label, data, onChange, allCategories, categoryMap, allTriggers, coutValue, onCoutChange }: EffectFormProps) {
  // Sous categories filtered by selected category
  const availableSousCategories = data.category
    ? (categoryMap[data.category] ?? [])
    : []

  // When category changes, clear sous_category if it no longer belongs
  function handleCategoryChange(val: string | null) {
    onChange('category', val)
    const validSous = val ? (categoryMap[val] ?? []) : []
    if (data.sous_category && !validSous.includes(data.sous_category)) {
      onChange('sous_category', null)
    }
  }

  return (
    <div className="bg-[#1C1C2E] rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-xs text-[#C8C8E0] font-medium">{label}</p>
        {onCoutChange !== undefined && (
          <div className="flex items-center gap-1">
            <input type="number" className="input text-sm py-1 w-20"
              placeholder="MP"
              value={coutValue ?? ''}
              onChange={e => onCoutChange(e.target.value ? Number(e.target.value) : null)} />
            <span className="text-xs text-[#C8C8E0]">MP</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-[#C8C8E0] mb-1 block">Catégorie</label>
          <DynamicSelect value={data.category} onChange={handleCategoryChange} options={allCategories} placeholder="Catégorie" />
        </div>
        <div>
          <label className="text-xs text-[#C8C8E0] mb-1 block">
            Sous Catégorie
            {!data.category && <span className="text-[#555] ml-1">(choisir une catégorie d'abord)</span>}
          </label>
          {data.category ? (
            <DynamicSelect
              value={data.sous_category}
              onChange={v => onChange('sous_category', v)}
              options={availableSousCategories}
              placeholder="Sous Catégorie"
            />
          ) : (
            <div className="input text-sm text-[#555] cursor-not-allowed opacity-50">— Sélectionner catégorie —</div>
          )}
        </div>
        <div>
          <label className="text-xs text-[#C8C8E0] mb-1 block">Quantité</label>
          <input className="input text-sm" placeholder="Ex: +500" value={data.quantite ?? ''}
            onChange={e => onChange('quantite', e.target.value || null)} />
        </div>
        <div>
          <label className="text-xs text-[#C8C8E0] mb-1 block">Force</label>
          <input className="input text-sm" placeholder="Ex: x2" value={data.force ?? ''}
            onChange={e => onChange('force', e.target.value || null)} />
        </div>
        <div>
          <label className="text-xs text-[#C8C8E0] mb-1 block">Autre</label>
          <input className="input text-sm" placeholder="Description libre..." value={data.autre ?? ''}
            onChange={e => onChange('autre', e.target.value || null)} />
        </div>
        <div>
          <label className="text-xs text-[#C8C8E0] mb-1 block">Trigger</label>
          <DynamicSelect value={data.trigger} onChange={v => onChange('trigger', v)} options={allTriggers} placeholder="Trigger" />
        </div>
      </div>
    </div>
  )
}
