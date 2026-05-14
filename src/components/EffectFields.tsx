import React from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────
export interface EffectData {
  category:        string | null
  sous_category:   string | null
  sous_category_2: string | null
  sous_category_3: string | null  // Powers only
  degats:          string | null  // Supports only
  quantite:        string | null  // Supports only
  force:           string | null  // Supports only
  choix:           string | null  // Supports only
  autre:           string | null  // Supports only
  trigger:         string | null  // Supports only
}

export const EMPTY_EFFECT: EffectData = {
  category: null, sous_category: null, sous_category_2: null, sous_category_3: null,
  degats: null, quantite: null, force: null, choix: null, autre: null, trigger: null,
}

// ── Colors ────────────────────────────────────────────────────────────────────
export function catColor(cat: string | null): string {
  if (!cat) return 'bg-[#3D3D60] text-[#C8C8E0] border-[#555]'
  if (cat.includes('Gain MP'))       return 'bg-blue-900/50   text-blue-300   border-blue-700'
  if (cat.includes('Damage'))        return 'bg-red-900/50    text-red-300    border-red-700'
  if (cat.includes('Création'))      return 'bg-green-900/50  text-green-300  border-green-700'
  if (cat.includes('Destruction'))   return 'bg-orange-900/50 text-orange-300 border-orange-700'
  if (cat.includes('Conversion'))    return 'bg-yellow-900/50 text-yellow-300 border-yellow-700'
  if (cat.includes('Fortification')) return 'bg-gray-700/50   text-gray-300   border-gray-500'
  if (cat.includes('Santé'))         return 'bg-teal-900/50   text-teal-300   border-teal-700'
  if (cat.includes('Paralysie'))     return 'bg-pink-900/50   text-pink-300   border-pink-700'
  return 'bg-[#3D3D60] text-[#C8C8E0] border-[#555]'
}

// ── Display ───────────────────────────────────────────────────────────────────
interface EffectDisplayProps extends EffectData {
  cout?: number | null
  center?: boolean
}

export function EffectDisplay({
  cout, category, sous_category, sous_category_2, sous_category_3,
  degats, quantite, force, choix, autre, trigger, center = false
}: EffectDisplayProps) {
  const hasContent = cout || category || sous_category || sous_category_2 || sous_category_3 ||
    degats || quantite || force || choix || autre || trigger
  if (!hasContent) return <span className="text-[#444]">—</span>

  return (
    <div className={'space-y-1 text-xs' + (center ? ' text-center' : '')}>
      {cout !== null && cout !== undefined && <div><span className="text-marvel-gold font-bold">{cout} MP</span></div>}
      {category        && <div><span className={`badge border ${catColor(category)}`}>{category}</span></div>}
      {sous_category   && <div><span className="badge border bg-indigo-900/40 text-indigo-200 border-indigo-700">{sous_category}</span></div>}
      {sous_category_2 && <div><span className="badge border bg-violet-900/40 text-violet-200 border-violet-700">{sous_category_2}</span></div>}
      {sous_category_3 && <div><span className="badge border bg-fuchsia-900/40 text-fuchsia-200 border-fuchsia-700">{sous_category_3}</span></div>}
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
  const isNew    = value !== null && value !== '' && !options.includes(value)
  const showInput = isNew || value === ''

  if (disabled) {
    return <div className="input text-sm text-[#555] cursor-not-allowed opacity-50">— Select first —</div>
  }
  return (
    <div className="space-y-1">
      <select className="input text-sm"
        value={isNew ? '__new__' : (value ?? '')}
        onChange={e => { if (e.target.value === '__new__') onChange(''); else onChange(e.target.value || null) }}>
        <option value="">— None —</option>
        {options.map(c => <option key={c} value={c}>{c}</option>)}
        <option value="__new__">+ New {placeholder.toLowerCase()}...</option>
      </select>
      {showInput && (
        <StableInput
          initialValue={value ?? ''}
          onCommit={v => onChange(v === '' ? null : v)}
          placeholder={`New ${placeholder.toLowerCase()}...`}
          autoFocus={value === ''}
        />
      )}
    </div>
  )
}

// ── StableInput ───────────────────────────────────────────────────────────────
interface StableInputProps {
  initialValue: string
  onCommit: (v: string) => void
  placeholder?: string
  autoFocus?: boolean
  type?: string
  className?: string
}

function StableInput({ initialValue, onCommit, placeholder, autoFocus, type = 'text', className = 'input text-sm' }: StableInputProps) {
  const [val, setVal] = React.useState(initialValue)
  const prevInit = React.useRef(initialValue)
  if (prevInit.current !== initialValue) { prevInit.current = initialValue; setVal(initialValue) }
  return (
    <input type={type} className={className} placeholder={placeholder} autoFocus={autoFocus}
      value={val} onChange={e => setVal(e.target.value)} onBlur={e => onCommit(e.target.value)} />
  )
}

// ── EffectForm ────────────────────────────────────────────────────────────────
interface EffectFormProps {
  label: string
  data: EffectData
  onChange: (field: keyof EffectData, val: string | null) => void
  allCategories: string[]
  categoryMap: Record<string, string[]>   // category → sous_categories
  sousMap: Record<string, string[]>       // sous_category → sous_category_2
  sousMap2: Record<string, string[]>      // sous_category_2 → sous_category_3
  allTriggers: string[]
  coutValue?: number | null
  onCoutChange?: (val: number | null) => void
  simplified?: boolean  // true = Powers mode (only cat/sub chain, no dmg/qte/force/choice/other/trigger)
}

export function EffectForm({
  label, data, onChange, allCategories, categoryMap, sousMap, sousMap2,
  allTriggers, coutValue, onCoutChange, simplified = false
}: EffectFormProps) {
  const availableSous  = data.category        ? (categoryMap[data.category]              ?? []) : []
  const availableSous2 = data.sous_category   ? (sousMap[data.sous_category]             ?? []) : []
  const availableSous3 = data.sous_category_2 ? (sousMap2[data.sous_category_2]          ?? []) : []

  function handleCategoryChange(val: string | null) {
    onChange('category', val)
    const valid = val ? (categoryMap[val] ?? []) : []
    if (data.sous_category && !valid.includes(data.sous_category)) {
      onChange('sous_category', null); onChange('sous_category_2', null); onChange('sous_category_3', null)
    }
  }

  function handleSousChange(val: string | null) {
    onChange('sous_category', val)
    const valid = val ? (sousMap[val] ?? []) : []
    if (data.sous_category_2 && !valid.includes(data.sous_category_2)) {
      onChange('sous_category_2', null); onChange('sous_category_3', null)
    }
  }

  function handleSous2Change(val: string | null) {
    onChange('sous_category_2', val)
    const valid = val ? (sousMap2[val] ?? []) : []
    if (data.sous_category_3 && !valid.includes(data.sous_category_3)) {
      onChange('sous_category_3', null)
    }
  }

  return (
    <div className="bg-[#1C1C2E] rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-xs text-[#C8C8E0] font-medium">{label}</p>
        {onCoutChange !== undefined && (
          <div className="flex items-center gap-1">
            <StableInput type="number" className="input text-sm py-1 w-20"
              initialValue={String(coutValue ?? '')}
              onCommit={v => onCoutChange(v ? Number(v) : null)}
              placeholder="MP" />
            <span className="text-xs text-[#C8C8E0]">MP</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {/* Category */}
        <div>
          <label className="text-xs text-[#C8C8E0] mb-1 block">Category</label>
          <DynamicSelect value={data.category} onChange={handleCategoryChange} options={allCategories} placeholder="Category" />
        </div>
        {/* Sub Category */}
        <div>
          <label className="text-xs text-[#C8C8E0] mb-1 block">
            Sub Category {!data.category && <span className="text-[#555]">(select category first)</span>}
          </label>
          <DynamicSelect value={data.sous_category} onChange={handleSousChange}
            options={availableSous} placeholder="Sub Category" disabled={!data.category} />
        </div>
        {/* Sub Category 2 */}
        <div>
          <label className="text-xs text-[#C8C8E0] mb-1 block">Sub Category 2</label>
          <DynamicSelect value={data.sous_category_2} onChange={handleSous2Change}
            options={availableSous2} placeholder="Sub Category 2" />
        </div>
        {/* Sub Category 3 — Powers only */}
        {simplified && (
          <div>
            <label className="text-xs text-[#C8C8E0] mb-1 block">Sub Category 3</label>
            <DynamicSelect value={data.sous_category_3} onChange={v => onChange('sous_category_3', v)}
              options={availableSous3} placeholder="Sub Category 3" />
          </div>
        )}
        {/* Supports-only fields */}
        {!simplified && (
          <>
            <div>
              <label className="text-xs text-[#C8C8E0] mb-1 block">Damage <span className="text-[#555]">(Dmg: xxx)</span></label>
              <StableInput initialValue={data.degats ?? ''} onCommit={v => onChange('degats', v || null)} placeholder="Ex: 2500" />
            </div>
            <div>
              <label className="text-xs text-[#C8C8E0] mb-1 block">Quantity <span className="text-[#555]">(qte: xxx)</span></label>
              <StableInput initialValue={data.quantite ?? ''} onCommit={v => onChange('quantite', v || null)} placeholder="Ex: 3" />
            </div>
            <div>
              <label className="text-xs text-[#C8C8E0] mb-1 block">Force <span className="text-[#555]">(Force: xxx)</span></label>
              <StableInput initialValue={data.force ?? ''} onCommit={v => onChange('force', v || null)} placeholder="Ex: x2" />
            </div>
            <div>
              <label className="text-xs text-[#C8C8E0] mb-1 block">Choice</label>
              <StableInput initialValue={data.choix ?? ''} onCommit={v => onChange('choix', v || null)} placeholder="Free text..." />
            </div>
            <div>
              <label className="text-xs text-[#C8C8E0] mb-1 block">Other</label>
              <StableInput initialValue={data.autre ?? ''} onCommit={v => onChange('autre', v || null)} placeholder="Free text..." />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-[#C8C8E0] mb-1 block">Trigger <span className="text-[#555]">(Trigger: xxx)</span></label>
              <DynamicSelect value={data.trigger} onChange={v => onChange('trigger', v)} options={allTriggers} placeholder="Trigger" />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
