import React from 'react'
import { getJSON } from '../../lib/api'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Label
} from 'recharts'

type Metrics = {
  activePipelineValue: number
  totalValueWonActiveBids: number
  activeWinLossRatio: number
  // extras used in the stat cards:
  activeWonCount?: number        // won scopes in Active bids
  activeLostCount?: number       // lost scopes in Active bids
  pendingCount?: number          // total Pending scopes (pipeline)
}

type BidsOver    = { month: string; count: number }[]
type ValueOver   = { month: string; total: number }[]
type ScopeTotals = { scope: string; total: number }[]

// $3,075k -> $3.08M, $307.5k -> $307.5k, etc.
const kfmt = (n: number) => {
  if (!Number.isFinite(n)) return '—'
  const abs = Math.abs(n)

  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M` // 👈 2 decimals for M
  if (abs >= 1_000)     return `$${(n / 1_000).toFixed(1)}k`      // 👈 still 1 decimal for k
  return `$${n}`
}

export default function Dashboard() {
  const [metrics, setMetrics] = React.useState<Metrics | null>(null)

  // Default ranges (past 12 months)
  const today = new Date()
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  const yearAgo = new Date(today); yearAgo.setFullYear(today.getFullYear() - 1)

  const [bFrom, setBFrom] = React.useState(iso(yearAgo))
  const [bTo,   setBTo]   = React.useState(iso(today))
  const [vFrom, setVFrom] = React.useState(iso(yearAgo))
  const [vTo,   setVTo]   = React.useState(iso(today))
  const [sFrom, setSFrom] = React.useState(iso(yearAgo))
  const [sTo,   setSTo]   = React.useState(iso(today))

  const [bidsOver,    setBidsOver]    = React.useState<BidsOver>([])
  const [valueOver,   setValueOver]   = React.useState<ValueOver>([])
  const [scopeTotals, setScopeTotals] = React.useState<ScopeTotals>([])

  // Top stats
  React.useEffect(() => {
    getJSON<Metrics>('/charts/metrics').then(setMetrics)
  }, [])

  // Bids over time — using start/end
  React.useEffect(() => {
    const q = new URLSearchParams({ start: bFrom, end: bTo })
    getJSON<BidsOver>(`/charts/bids-over?${q}`)
      .then(setBidsOver)
      .catch(() => setBidsOver([]))
  }, [bFrom, bTo])

  // Value over time — using start/end
  React.useEffect(() => {
    const q = new URLSearchParams({ start: vFrom, end: vTo })
    getJSON<ValueOver>(`/charts/value-over?${q}`)
      .then(setValueOver)
      .catch(() => setValueOver([]))
  }, [vFrom, vTo])

  // Scope totals — using start/end
  React.useEffect(() => {
    const q = new URLSearchParams({ start: sFrom, end: sTo })
    getJSON<ScopeTotals>(`/charts/scope-totals?${q}`)
      .then(setScopeTotals)
      .catch(() => setScopeTotals([]))
  }, [sFrom, sTo])

  return (
    <div className="space-y-6 font-sans">
      {/* Hero heading: serif for contrast */}
      <div className="text-3xl md:text-4xl font-extrabold tracking-tight font-sans-serif">
        Bid Tracker - Dashboard
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl bg-white p-5 shadow-2xl ring-1 ring-slate-900/20">
          <div className="stat-label font-semibold text-slate-600">Active Scope Win/Loss Ratio</div>
          <div className="stat-value mt-1 font-extrabold text-slate-900">
            {metrics ? metrics.activeWinLossRatio.toFixed(2) : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            {metrics ? `Won ${metrics.activeWonCount ?? 0} / Lost ${metrics.activeLostCount ?? 0}` : '—'}
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-2xl ring-1 ring-slate-900/20">
          <div className="stat-label font-semibold text-slate-600">Active Pipeline Value</div>
          <div className="stat-value mt-1 font-extrabold text-slate-900">
            {metrics ? kfmt(metrics.activePipelineValue) : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            Pending scopes: {metrics?.pendingCount ?? '—'}
          </div>
          <div className="text-xs text-slate-500">Sum of All Pending Scopes</div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-2xl ring-1 ring-slate-900/20">
          <div className="stat-label font-semibold text-slate-600">Total Value Won (Active Bids)</div>
          <div className="stat-value mt-1 font-extrabold text-slate-900">
            {metrics ? kfmt(metrics.totalValueWonActiveBids) : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            Won scopes (active): {metrics?.activeWonCount ?? '—'}
          </div>
        </div>
      </div>

      {/* Bids over time */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-700 font-medium">Bids range:</span>
        <input
          type="date"
          className="input !w-28 sm:!w-40"
          value={bFrom}
          onChange={e => setBFrom(e.target.value)}
        />
        <span className="text-sm text-slate-600">to</span>
        <input
          type="date"
          className="input !w-28 sm:!w-40"
          value={bTo}
          onChange={e => setBTo(e.target.value)}
        />
      </div>
      <div className="rounded-xl bg-white p-5 shadow-2xl ring-1 ring-slate-900/20">
        <div className="chart-title mb-2 font-semibold text-slate-800">Bids Over Selected Range</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={bidsOver}
              margin={{ top: 8, right: 20, left: 44, bottom: 46 }}
            >
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
              <XAxis dataKey="month" stroke="#334155" tickMargin={8}>
                <Label value="Bids Submitted" position="insideBottom" dy={22} />
              </XAxis>
              <YAxis allowDecimals={false} stroke="#334155" tickMargin={10} />
              <Tooltip />
              <Bar dataKey="count" fill="#60a5fa" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Value over time */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-700 font-medium">Value range:</span>
        <input
          type="date"
          className="input !w-28 sm:!w-40"
          value={vFrom}
          onChange={e => setVFrom(e.target.value)}
        />
        <span className="text-sm text-slate-600">to</span>
        <input
          type="date"
          className="input !w-28 sm:!w-40"
          value={vTo}
          onChange={e => setVTo(e.target.value)}
        />
      </div>
      <div className="rounded-xl bg-white p-5 shadow-2xl ring-1 ring-slate-900/20">
        <div className="chart-title mb-2 font-semibold text-slate-800">Bid Value Over Selected Range</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={valueOver}
              margin={{ top: 8, right: 20, left: 44, bottom: 46 }}
            >
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
              <XAxis dataKey="month" stroke="#334155" tickMargin={8}>
                <Label value="Total Bid Value" position="insideBottom" dy={22} />
              </XAxis>
              <YAxis stroke="#334155" tickFormatter={kfmt} tickMargin={10} />
              <Tooltip formatter={(v) => kfmt(Number(v))} />
              <Bar dataKey="total" fill="#a78bfa" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Scope totals */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-700 font-medium">Scope range:</span>
        <input
          type="date"
          className="input !w-28 sm:!w-40"
          value={sFrom}
          onChange={e => setSFrom(e.target.value)}
        />
        <span className="text-sm text-slate-600">to</span>
        <input
          type="date"
          className="input !w-28 sm:!w-40"
          value={sTo}
          onChange={e => setSTo(e.target.value)}
        />
      </div>
      <div className="rounded-xl bg-white p-5 shadow-2xl ring-1 ring-slate-900/20">
        <div className="chart-title mb-2 font-semibold text-slate-800">Total Value by Scope (Won)</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={scopeTotals}
              margin={{ top: 8, right: 20, left: 44, bottom: 46 }}
            >
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
              <XAxis dataKey="scope" stroke="#334155" tickMargin={8}>
                <Label value="Scopes" position="insideBottom" dy={22} />
              </XAxis>
              <YAxis stroke="#334155" tickFormatter={kfmt} tickMargin={10} />
              <Tooltip formatter={(v) => kfmt(Number(v))} />
              <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
