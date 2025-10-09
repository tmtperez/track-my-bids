import React from 'react'
import { getJSON } from '../../lib/api'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Label,
  PieChart, Pie, Cell, Legend,
  LineChart, Line
} from 'recharts'

type Metrics = {
  activePipelineValue: number
  totalValueWonActiveBids: number      // now: total won from Completed bids in the selected KPI range
  activeWinLossRatio: number           // now: won/(won+lost) from Completed bids in the selected KPI range
  activeWonCount?: number              // won scopes counted (Completed bids only, in range)
  activeLostCount?: number             // lost scopes counted (Completed bids only, in range)
  pendingCount?: number                // snapshot count of pipeline (not range-based)
}

type BidsOver    = { month: string; count: number }[]
type ValueOver   = { month: string; total: number }[]
type ScopeTotals = { scope: string; total: number }[]

const kfmt = (n: number) => {
  if (!Number.isFinite(n)) return '—'
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000)     return `$${(n / 1_000).toFixed(1)}k`
  return `$${n}`
}

const iso = (d: Date) => d.toISOString().slice(0, 10)

const COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#06b6d4',
}

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#ec4899']

export default function Dashboard() {
  const [metrics, setMetrics] = React.useState<Metrics | null>(null)

  // Defaults: past 12 months (for KPI range)
  const today = new Date()
  const yearAgo = new Date(today); yearAgo.setFullYear(today.getFullYear() - 1)

  // KPI metrics range (Completed bids only)
  const [mFrom, setMFrom] = React.useState(iso(new Date(yearAgo)))
  const [mTo,   setMTo]   = React.useState(iso(new Date(today)))

  // Existing chart ranges
  const [bFrom, setBFrom] = React.useState(iso(new Date(yearAgo)))
  const [bTo,   setBTo]   = React.useState(iso(new Date(today)))
  const [vFrom, setVFrom] = React.useState(iso(new Date(yearAgo)))
  const [vTo,   setVTo]   = React.useState(iso(new Date(today)))
  const [sFrom, setSFrom] = React.useState(iso(new Date(yearAgo)))
  const [sTo,   setSTo]   = React.useState(iso(new Date(today)))

  const [bidsOver,    setBidsOver]    = React.useState<BidsOver>([])
  const [valueOver,   setValueOver]   = React.useState<ValueOver>([])
  const [scopeTotals, setScopeTotals] = React.useState<ScopeTotals>([])

  // ✅ KPI metrics — Completed bids only, rangeable
  React.useEffect(() => {
    const q = new URLSearchParams({
      start: mFrom,
      end: mTo,
      completedOnly: 'true',     // <-- key change
    })
    getJSON<Metrics>(`/charts/metrics?${q}`)
      .then(setMetrics)
      .catch(() => setMetrics(null))
  }, [mFrom, mTo])

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

  const winLossData = React.useMemo(() => {
    if (!metrics) return []
    return [
      { name: 'Won', value: metrics.activeWonCount ?? 0, color: COLORS.success },
      { name: 'Lost', value: metrics.activeLostCount ?? 0, color: COLORS.danger },
    ]
  }, [metrics])

  return (
    <div className="space-y-6 font-sans">
      {/* Heading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Bid Tracker Dashboard
          </h1>
          <p className="text-slate-600 mt-2">Track your bids, analyze performance, and grow your business</p>
        </div>
      </div>

      {/* KPI metrics range (Completed bids only) */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-700 font-medium">KPI range (Completed bids only):</span>
        <input
          type="date"
          className="input !w-28 sm:!w-40"
          value={mFrom}
          onChange={e => setMFrom(e.target.value)}
        />
        <span className="text-sm text-slate-600">to</span>
        <input
          type="date"
          className="input !w-28 sm:!w-40"
          value={mTo}
          onChange={e => setMTo(e.target.value)}
        />
      </div>

      {/* Stats - Compact Version */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Win/Loss Ratio Card */}
        <div className="relative rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-4 shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white rounded-full -mr-10 -mt-10 opacity-10 group-hover:scale-110 transition-transform duration-300"></div>
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <div className="text-blue-100 text-xs font-medium mb-1">Win/Loss Ratio</div>
              <div className="text-white font-extrabold text-3xl mb-1">
                {metrics ? metrics.activeWinLossRatio.toFixed(2) : '—'}
              </div>
              <div className="text-blue-200 text-xs">
                {metrics ? `Won ${metrics.activeWonCount ?? 0} / Lost ${metrics.activeLostCount ?? 0}` : '—'}
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold">
              %
            </div>
          </div>
        </div>

        {/* Active Pipeline Card */}
        <div className="relative rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-4 shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white rounded-full -mr-10 -mt-10 opacity-10 group-hover:scale-110 transition-transform duration-300"></div>
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <div className="text-purple-100 text-xs font-medium mb-1">Active Pipeline</div>
              <div className="text-white font-extrabold text-3xl mb-1">
                {metrics ? kfmt(metrics.activePipelineValue) : '—'}
              </div>
              <div className="text-purple-200 text-xs">
                {metrics?.pendingCount ?? 0} Pending scopes
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold">
              $
            </div>
          </div>
        </div>

        {/* Total Won Card */}
        <div className="relative rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white rounded-full -mr-10 -mt-10 opacity-10 group-hover:scale-110 transition-transform duration-300"></div>
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <div className="text-emerald-100 text-xs font-medium mb-1">Total Value Won</div>
              <div className="text-white font-extrabold text-3xl mb-1">
                {metrics ? kfmt(metrics.totalValueWonActiveBids) : '—'}
              </div>
              <div className="text-emerald-200 text-xs">
                Completed bids (range)
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold">
              ✓
            </div>
          </div>
        </div>

        {/* Win/Loss Pie Chart Card */}
        <div className="relative rounded-xl bg-white p-4 shadow-md hover:shadow-lg transition-all duration-200">
          <div className="text-slate-700 text-xs font-semibold mb-2">Win/Loss Distribution</div>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={winLossData}
                  cx="50%"
                  cy="50%"
                  innerRadius={20}
                  outerRadius={45}
                  paddingAngle={5}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {winLossData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-3 mt-1">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs text-slate-600">Won</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-xs text-slate-600">Lost</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section - Compact */}
      <div className="mt-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Analytics & Trends</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Bids over time */}
          <div className="rounded-xl bg-white p-4 shadow-md hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800">Bids Over Time</h3>
                <p className="text-xs text-slate-500">Submission trends</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="date"
                className="input !w-28 !py-1 text-xs"
                value={bFrom}
                onChange={e => setBFrom(e.target.value)}
              />
              <span className="text-xs text-slate-600">to</span>
              <input
                type="date"
                className="input !w-28 !py-1 text-xs"
                value={bTo}
                onChange={e => setBTo(e.target.value)}
              />
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bidsOver} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorBids" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.4}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                    tickMargin={8}
                  />
                  <YAxis
                    allowDecimals={false}
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                    tickMargin={8}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="url(#colorBids)"
                    radius={[6, 6, 0, 0]}
                    animationBegin={0}
                    animationDuration={800}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Value over time */}
          <div className="rounded-xl bg-white p-4 shadow-md hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800">Bid Value Trends</h3>
                <p className="text-xs text-slate-500">Revenue over time</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="date"
                className="input !w-28 !py-1 text-xs"
                value={vFrom}
                onChange={e => setVFrom(e.target.value)}
              />
              <span className="text-xs text-slate-600">to</span>
              <input
                type="date"
                className="input !w-28 !py-1 text-xs"
                value={vTo}
                onChange={e => setVTo(e.target.value)}
              />
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={valueOver} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                    tickMargin={8}
                  />
                  <YAxis
                    stroke="#64748b"
                    tickFormatter={kfmt}
                    tick={{ fontSize: 11 }}
                    tickMargin={8}
                  />
                  <Tooltip
                    formatter={(v) => kfmt(Number(v))}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke={COLORS.secondary}
                    strokeWidth={2.5}
                    dot={{ fill: COLORS.secondary, r: 4 }}
                    activeDot={{ r: 6 }}
                    animationBegin={0}
                    animationDuration={800}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Scope totals - Compact */}
      <div className="mt-6">
        <div className="rounded-xl bg-white p-4 shadow-md hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-bold text-slate-800">Top Performing Scopes</h3>
              <p className="text-xs text-slate-500">Value by scope type (Won only)</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <input
              type="date"
              className="input !w-28 !py-1 text-xs"
              value={sFrom}
              onChange={e => setSFrom(e.target.value)}
            />
            <span className="text-xs text-slate-600">to</span>
            <input
              type="date"
              className="input !w-28 !py-1 text-xs"
              value={sTo}
              onChange={e => setSTo(e.target.value)}
            />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={scopeTotals}
                margin={{ top: 5, right: 10, left: 40, bottom: 60 }}
                layout="horizontal"
              >
                <defs>
                  <linearGradient id="colorScope" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.success} stopOpacity={0.4}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                <XAxis
                  dataKey="scope"
                  stroke="#64748b"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 10 }}
                  interval={0}
                />
                <YAxis
                  stroke="#64748b"
                  tickFormatter={kfmt}
                  tick={{ fontSize: 11 }}
                  tickMargin={8}
                />
                <Tooltip
                  formatter={(v) => kfmt(Number(v))}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Bar
                  dataKey="total"
                  fill="url(#colorScope)"
                  radius={[6, 6, 0, 0]}
                  animationBegin={0}
                  animationDuration={800}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
