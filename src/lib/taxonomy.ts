import { fetchAll } from './fetchAll'

export type TaxRow = Record<string, string | null>
export const effectPrefixes = (n: number) => Array.from({ length: n }, (_, i) => `effect_${i + 1}`)
const FIELDS = ['category', 'sous_category', 'sous_category_2', 'sous_category_3']

// Only the category columns of a table (used to share the lists between Powers and Supports)
export const fetchTaxRows = (table: string, prefixes: string[]) =>
  fetchAll<TaxRow>(table, ['id'], ['id', ...prefixes.flatMap(p => FIELDS.map(f => `${p}_${f}`))].join(','))

// Merge category chains from several tables: [rows, prefixes][]
export function buildTaxonomy(sources: [TaxRow[], string[]][]) {
  const cats = new Set<string>()
  const categoryMap: Record<string, string[]> = {}  // category → sous_categories
  const sousMap:     Record<string, string[]> = {}  // sous_category → sous_category_2
  const sousMap2:    Record<string, string[]> = {}  // sous_category_2 → sous_category_3
  const link = (m: Record<string, string[]>, k: string | null, v: string | null) => {
    if (!k || !v) return
    const a = m[k] ?? (m[k] = [])
    if (!a.includes(v)) a.push(v)
  }
  for (const [rows, prefixes] of sources) for (const r of rows) for (const p of prefixes) {
    const c = r[`${p}_category`], s1 = r[`${p}_sous_category`]
    const s2 = r[`${p}_sous_category_2`], s3 = r[`${p}_sous_category_3`]
    if (c) cats.add(c)
    link(categoryMap, c, s1); link(sousMap, s1, s2); link(sousMap2, s2, s3)
  }
  ;[categoryMap, sousMap, sousMap2].forEach(m => Object.values(m).forEach(a => a.sort()))
  return { allCategories: [...cats].sort(), categoryMap, sousMap, sousMap2 }
}
