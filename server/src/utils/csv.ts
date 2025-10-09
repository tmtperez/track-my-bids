import { parse } from 'csv-parse/sync'

export function parseImportCSV(content: Buffer) {
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  }) as any[]

  // Just pass through the raw data - let import.ts handle parsing
  return records
}
