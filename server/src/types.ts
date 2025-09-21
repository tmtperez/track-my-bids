export type ScopeInput = { id?: number; name: string; cost: number; status: 'Pending'|'Won'|'Lost' }
export type BidInput = {
  projectName: string
  clientCompanyId?: number
  contactId?: number | null
  proposalDate?: string | null
  dueDate?: string | null
  followUpOn?: string | null        // NEW
  jobLocation?: string | null
  leadSource?: string | null
  bidStatus: 'Active' | 'Complete' | 'Archived' | 'Hot' | 'Cold'  // NEW
  scopes: ScopeInput[]
  tags?: string[]
}
