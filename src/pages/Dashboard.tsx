import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Character, RosterSummary, Stars } from '../types'
import { StarBadge } from '../components/Badges'

const STAR_TIERS: Stars[] = [6, 5, 4, 3, 2, 1]
const STATUS_COLS = ['max_champ', 'champ', 'rostered', 'not_owned'] as const
type StatusCol = typeof STATUS_COLS[number]

const STATUS_LABELS: Record<StatusCol, string> = {
  max_champ: 'Max Champ', champ: 'Champ', rostered: 'Roster', not_owned: 'Non Possédé',
}
const STATUS_COLORS: Record<StatusCol, string> = {
  max_champ: 'text-purple-400', champ: 'text-orange-400',
  rostered: 'text-green-400', not_owned: 'text-gray-400',
}

export default function Dashboard() {
  const [summary, setSummary] = useState<RosterSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [recent, setRecent]   = useState<Character[]>([])

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('characters').select('stars, status, ascended')
      if (data) {
        setSummary(STAR_TIERS.map(s => ({
          stars:     s,
          max_champ: data.filter(c => c.stars === s && c.status === 'max_champ').length,
          champ:     data.filter(c => c.stars === s && c.status === 'champ').length,
          rostered:  data.filter(c => c.stars === s && c.status === 'rostered').length,
          not_owned: data.filter(c => c.stars === s && c.status === 'not_owned').length,
          ascended:  data.filter(c => c.stars === s && c.ascended).length,
        })))
      }
      const { data: rec } = await supabase.from('characters').select('*')
        .order('updated_at', { ascending: false }).limit(5)
      if (rec) setRecent(rec)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <LoadingSpinner />

  const totalAscended = summary.reduce((acc, r) => acc + r.ascended, 0)
  const total         = summary.reduce((acc, r) => acc + r.max_champ + r.champ + r.rostered, 0)

  return (
    <div className="space-y-6">
      <h1 className="page-title">Tableau de Bord</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {STATUS_COLS.map(s => (
          <div key={s} className="card text-center">
            <p className={`text-2xl font-bold ${STATUS_COLORS[s]}`}>
              {summary.reduce((acc, r) => acc + r[s], 0)}
            </p>
            <p className="text-xs text-[#C8C8E0] mt-1">{STATUS_LABELS[s]}</p>
          </div>
        ))}
        <div className="card text-center">
          <p className="text-2xl font-bold text-cyan-400">{totalAscended}</p>
          <p className="text-xs text-[#C8C8E0] mt-1">⬆ Ascended</p>
        </div>
      </div>

      {/* Roster Table */}
      <div className="card overflow-x-auto">
        <h2 className="font-marvel text-xl text-marvel-gold mb-4">Suivi Roster</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#3D3D60]">
              <th className="text-center py-2 text-[#C8C8E0] font-normal">Tier</th>
              {STATUS_COLS.map(s => (
                <th key={s} className={`text-center py-2 font-normal ${STATUS_COLORS[s]}`}>
                  {STATUS_LABELS[s]}
                </th>
              ))}
              <th className="text-center py-2 font-normal text-cyan-400">⬆ Ascended</th>
              <th className="text-center py-2 text-[#C8C8E0] font-normal">Total</th>
            </tr>
          </thead>
          <tbody>
            {summary.map(row => {
              const rowTotal = row.max_champ + row.champ + row.rostered
              return (
                <tr key={row.stars} className="border-b border-[#3D3D60]/50 hover:bg-[#3D3D60]/20">
                  <td className="py-2.5 text-center"><StarBadge stars={row.stars} /></td>
                  {STATUS_COLS.map(s => (
                    <td key={s} className="text-center py-2.5">
                      {row[s] > 0
                        ? <span className={STATUS_COLORS[s]}>{row[s]}</span>
                        : <span className="text-[#C8C8E0]">—</span>}
                    </td>
                  ))}
                  <td className="text-center py-2.5">
                    {row.ascended > 0
                      ? <span className="text-cyan-400">{row.ascended}</span>
                      : <span className="text-[#555]">—</span>}
                  </td>
                  <td className="text-center py-2.5 text-white font-semibold">{rowTotal}</td>
                </tr>
              )
            })}
            <tr className="border-t-2 border-[#3D3D60] font-semibold">
              <td className="py-2.5 text-center text-[#C8C8E0]">Total</td>
              {STATUS_COLS.map(s => (
                <td key={s} className={`text-center py-2.5 ${STATUS_COLORS[s]}`}>
                  {summary.reduce((acc, r) => acc + r[s], 0)}
                </td>
              ))}
              <td className="text-center py-2.5 text-cyan-400">{totalAscended}</td>
              <td className="text-center py-2.5 text-marvel-gold">{total}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Recently Updated */}
      {recent.length > 0 && (
        <div className="card">
          <h2 className="font-marvel text-xl text-marvel-gold mb-4">Récemment Modifié</h2>
          <div className="space-y-2">
            {recent.map(c => (
              <div key={c.id} className="flex items-center gap-3 text-sm">
                <StarBadge stars={c.stars as Stars} />
                <span className="flex-1">{c.name}</span>
                {c.ascended && <span className="text-xs text-cyan-400 badge border border-cyan-700 bg-cyan-900/30">⬆ Asc.</span>}
                <span className="text-[#C8C8E0]">Niv. {c.level ?? '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-marvel-red border-t-transparent rounded-full" />
    </div>
  )
}
