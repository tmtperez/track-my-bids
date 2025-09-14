// server/src/routes/_date.ts

export function parseDateParam(q: unknown): Date | undefined {
  if (!q) return undefined
  let s: string | undefined
  if (typeof q === 'string') s = q
  else if (Array.isArray(q) && typeof q[0] === 'string') s = q[0]
  else return undefined
  const d = new Date(s)
  return isNaN(+d) ? undefined : d
}

export function clampRange(start?: Date, end?: Date) {
  if (start) start.setHours(0, 0, 0, 0)
  if (end) end.setHours(23, 59, 59, 999)
  return { start, end }
}

export function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function monthSpan(start: Date, end: Date) {
  const buckets: string[] = []
  const cur = new Date(start.getFullYear(), start.getMonth(), 1)
  const last = new Date(end.getFullYear(), end.getMonth(), 1)
  while (cur <= last) {
    buckets.push(monthKey(cur))
    cur.setMonth(cur.getMonth() + 1)
  }
  return buckets
}
