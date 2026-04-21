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
  options: { id: string; label: string; sublabel?: string; starColor?: string }[]
  placeholder?: string
  allowFreeText?: boolean
}

export function SearchDropdown({ value, onChange, options, placeholder = 'Rechercher...', allowFreeText = true }: SearchDropdownProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen]   = useState(false)

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 20)

  return (
    <div className="relative">
      <input
        className="input text-sm"
        placeholder={placeholder}
        value={open ? query : (value ?? '')}
        onChange={e => { setQuery(e.target.value); setOpen(true); if (!e.target.value) onChange(null) }}
        onFocus={() => { setQuery(value ?? ''); setOpen(true) }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-[#1A1A2E] border border-[#2D2D4E] rounded-lg shadow-xl max-h-52 overflow-y-auto">
          <button type="button" onMouseDown={() => { onChange(null); setOpen(false) }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-[#2D2D4E] text-[#8888AA]">
            — Aucun —
          </button>
          {filtered.map(o => (
            <button key={o.id} type="button"
              onMouseDown={() => { onChange(o.label); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-[#2D2D4E]">
              <span className="text-white">{o.label}</span>
              {o.sublabel && <span style={{ color: o.starColor }} className="ml-2 text-xs">{o.sublabel}</span>}
            </button>
          ))}
          {allowFreeText && filtered.length === 0 && query && (
            <button type="button" onMouseDown={() => { onChange(query); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-[#2D2D4E] text-[#8888AA] italic">
              Utiliser "{query}" (texte libre)
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Typed helpers ─────────────────────────────────────────────────────────────
export function toCharacterOptions(characters: Character[]) {
  return characters.map(c => ({
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
