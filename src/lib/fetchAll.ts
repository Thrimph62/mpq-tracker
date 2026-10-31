import { supabase } from './supabase'

// Supabase caps one query at 1000 rows: read page by page until a short page.
// `order` must end with 'id' so the sort is stable (no row skipped or repeated between pages).
export async function fetchAll<T>(table: string, order: string[]): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += 1000) {
    const q = order.reduce((q: any, col) => q.order(col), supabase.from(table).select('*'))
    const { data, error } = await q.range(from, from + 999)
    if (error) throw error
    rows.push(...(data as T[]))
    if (data.length < 1000) return rows
  }
}
