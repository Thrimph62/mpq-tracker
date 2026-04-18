interface TeamSlotProps {
  character: string | null
  build?: string | null
  support?: string | null
  boost?: string | null
}

export function TeamSlot({ character, build, support, boost }: TeamSlotProps) {
  if (!character) return (
    <div className="card flex items-center justify-center text-[#8888AA] text-sm h-24">—</div>
  )
  return (
    <div className="card space-y-1">
      <p className="font-semibold text-sm text-white leading-tight">{character}</p>
      {build && <p className="text-xs text-marvel-gold">Build: {build}</p>}
      {support && <p className="text-xs text-blue-300">Support: {support}</p>}
      {boost && boost !== 'Not Required' && (
        <p className="text-xs text-orange-300">Boost requis</p>
      )}
    </div>
  )
}
