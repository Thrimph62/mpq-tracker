import { useState } from 'react'
import { Character, Support, Stars } from '../types'

const STAR_COLORS: Record<Stars, string> = {
  1: '#60A5FA',  // Bleu
  2: '#4ADE80',  // Vert
  3: '#B45309',  // Bronze
  4: '#9CA3AF',  // Gris
  5: '#FACC15',  // Or
  6: '#C084FC',  // Violet
}

// ── Generic search dropdown ───────────────────────────────────────────────────
interface SearchDropdownProps {
  value: string | null
  onChange: (val: string | null) => void
  onSelectId?: (id: string | null) => void
  options: { id: string; label: string; sublabel?: string; starColor?: string }[]
  placeholder?: string
  allowFreeText?: boolean
}

export function SearchDropdown({ value, onChange, onSelectId, options, placeholder = 'Search...', allowFreeText = true }: SearchDropdownProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen]   = useState(false)

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 20)

  const exactMatch = options.some(o => o.label.toLowerCase() === query.toLowerCase())

  return (
    <div className="relative">
      <input
        className="input text-sm"
        placeholder={placeholder}
        value={open ? query : (value ?? '')}
        onChange={e => {
          const v = e.target.value
          setQuery(v)
          setOpen(true)
          if (!v) {
            onChange(null); onSelectId?.(null)
          } else if (allowFreeText) {
            // Commit as free text live, so it's never lost on blur/close.
            // Selecting a suggestion below will overwrite this with the canonical label + id.
            onChange(v); onSelectId?.(null)
          }
        }}
        onFocus={() => { setQuery(value ?? ''); setOpen(true) }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-[#252540] border border-[#3D3D60] rounded-lg shadow-xl max-h-52 overflow-y-auto">
          <button type="button" onMouseDown={() => { onChange(null); onSelectId?.(null); setOpen(false) }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-[#3D3D60] text-[#C8C8E0]">
            — None —
          </button>
          {filtered.map(o => (
            <button key={o.id} type="button"
              onMouseDown={() => { onChange(o.label); onSelectId?.(o.id); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-[#3D3D60]">
              <span className="text-white">{o.label}</span>
              {o.sublabel && <span style={{ color: o.starColor }} className="ml-2 text-xs">{o.sublabel}</span>}
            </button>
          ))}
          {allowFreeText && query && !exactMatch && (
            <button type="button" onMouseDown={() => { onChange(query); onSelectId?.(null); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-[#3D3D60] text-[#C8C8E0] italic">
              Use "{query}" (new entry)
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Typed helpers ─────────────────────────────────────────────────────────────
export function toCharacterOptions(characters: Character[]) {
  // Deduplicate by name — same name can appear multiple times (different levels/copies)
  // but we only need it once in the dropdown for powers
  const seen = new Set<string>()
  return characters
    .filter(c => {
      if (seen.has(c.name)) return false
      seen.add(c.name)
      return true
    })
    .map(c => ({
      id: c.id,
      label: c.name,
      sublabel: '★'.repeat(c.stars),
      starColor: STAR_COLORS[c.stars as Stars],
    }))
}

export function toSupportOptions(supports: Support[]) {
  return supports.map(s => ({
    id: s.id,
    label: s.name,
    sublabel: s.restriction && s.restriction !== '/' ? s.restriction : undefined,
  }))
}

// Builds alphabetically-sorted, de-duplicated dropdown options from a list of
// free-text values (e.g. previously-used custom names). Used with SearchDropdown
// to give an autocomplete experience while still allowing a brand-new value.
export function toNameOptions(values: (string | null | undefined)[]) {
  const unique = Array.from(new Set(values.filter((v): v is string => !!v && v.trim() !== '')))
  unique.sort((a, b) => a.localeCompare(b))
  return unique.map(v => ({ id: v, label: v }))
}
