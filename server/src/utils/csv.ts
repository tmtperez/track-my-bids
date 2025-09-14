import { parse } from 'csv-parse/sync'

export function parseImportCSV(content: Buffer) {
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  }) as any[]

  return records.map(r => ({
    projectName: r.projectName?.toString() || '',
    clientCompany: r.clientCompany?.toString() || '',
    contactName: r.contactName?.toString() || '',
    proposalDate: r.proposalDate ? new Date(r.proposalDate) : null,
    dueDate: r.dueDate ? new Date(r.dueDate) : null,
    jobLocation: r.jobLocation?.toString() || '',
    leadSource: r.leadSource?.toString() || '',
    bidStatus: (r.bidStatus || 'Active').toString(),
    scopeName: r.scopeName?.toString() || '',
    scopeCost: r.scopeCost ? parseFloat(r.scopeCost) : 0,
    scopeStatus: (r.scopeStatus || 'Pending').toString()
  }))
}
