import { CharacterStatus, Stars } from '../types'

const STAR_COLORS: Record<Stars, string> = {
  1: '#60A5FA',  // Bleu
  2: '#4ADE80',  // Vert
  3: '#B45309',  // Bronze
  4: '#9CA3AF',  // Gris
  5: '#FACC15',  // Or
  6: '#C084FC',  // Violet
}

export function StarBadge({ stars }: { stars: Stars }) {
  return (
    <span style={{ color: STAR_COLORS[stars] }} className="font-bold text-sm">
      {'★'.repeat(stars)}
    </span>
  )
}

export const STATUS_CONFIG: Record<CharacterStatus, { label: string; className: string }> = {
  max_champ: { label: 'Max Champ', className: 'bg-purple-900/60 text-purple-300 border-purple-700' },
  champ:     { label: 'Champ',     className: 'bg-orange-900/60 text-orange-300 border-orange-700' },
  rostered:  { label: 'Roster',    className: 'bg-green-900/60  text-green-300  border-green-700'  },
  not_owned: { label: 'Non Possédé', className: 'bg-[#252540]  text-[#8888AA]  border-[#3D3D60]'  },
}

export function StatusBadge({ status }: { status: CharacterStatus | null }) {
  if (!status) return null
  const cfg = STATUS_CONFIG[status]
  return <span className={`badge border ${cfg.className}`}>{cfg.label}</span>
}

export function AscendedBadge() {
  return (
    <span className="badge border bg-cyan-900/60 text-cyan-300 border-cyan-600">⬆ Ascended</span>
  )
}

// Clickable status — cycles through the 4 statuses on click
const STATUS_ORDER: CharacterStatus[] = ['max_champ', 'champ', 'rostered', 'not_owned']

interface InlineStatusProps {
  status: CharacterStatus | null
  onChange: (next: CharacterStatus) => void
}

export function InlineStatusBadge({ status, onChange }: InlineStatusProps) {
  const current = (status ?? 'rostered') as CharacterStatus
  const cfg = STATUS_CONFIG[current]
  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    const idx = STATUS_ORDER.indexOf(current)
    onChange(STATUS_ORDER[(idx + 1) % STATUS_ORDER.length])
  }
  return (
    <button onClick={handleClick} title="Cliquer pour changer le statut"
      className={`badge border cursor-pointer hover:opacity-80 transition-opacity select-none ${cfg.className}`}>
      {cfg.label}
    </button>
  )
}

// Clickable ascended toggle
interface InlineAscendedProps {
  ascended: boolean
  onChange: (next: boolean) => void
}

export function InlineAscendedBadge({ ascended, onChange }: InlineAscendedProps) {
  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    onChange(!ascended)
  }
  if (!ascended) return (
    <button onClick={handleClick} title="Cliquer pour marquer comme Ascended"
      className="badge border border-dashed border-[#444] text-[#666] hover:border-cyan-600 hover:text-cyan-400 transition-colors cursor-pointer select-none">
      ⬆
    </button>
  )
  return (
    <button onClick={handleClick} title="Cliquer pour retirer Ascended"
      className="badge border bg-cyan-900/60 text-cyan-300 border-cyan-600 cursor-pointer hover:opacity-80 transition-opacity select-none">
      ⬆ Ascended
    </button>
  )
}

const POWER_COLORS: Record<string, string> = {
  Bleu: 'bg-blue-600', Rouge: 'bg-red-600', Vert: 'bg-green-600',
  Noir: 'bg-gray-600', Jaune: 'bg-yellow-500', Violet: 'bg-purple-600',
}

export function PowerColorDot({ couleur }: { couleur: string | null }) {
  if (!couleur) return null
  return <span className={`inline-block w-3 h-3 rounded-full ${POWER_COLORS[couleur] ?? 'bg-gray-500'}`} title={couleur} />
}

export function OkBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-[#8888AA] text-xs">—</span>
  const isOk = value.toLowerCase().includes('oui') || value.toLowerCase().includes('yes')
  return (
    <span className={`badge ${isOk ? 'bg-green-900/60 text-green-300' : 'bg-red-900/60 text-red-300'}`}>
      {isOk ? '✓' : '✗'}
    </span>
  )
}
