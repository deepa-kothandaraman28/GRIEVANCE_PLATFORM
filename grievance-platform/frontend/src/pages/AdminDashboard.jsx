import { useEffect, useState } from 'react'
import { adminStats } from '../api/client.js'

const STATUS_CARDS = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'closed', label: 'Closed' },
]

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    adminStats().then(setStats).catch(() => setError('Could not load dashboard stats.'))
  }, [])

  if (error) return <p className="text-alert">{error}</p>
  if (!stats) return <p className="text-ink/50">Loading…</p>

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Overview</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Total complaints" value={stats.total_complaints} accent="bg-ink" />
        <SummaryCard label="Departments" value={stats.total_departments} accent="bg-teal" />
        <SummaryCard label="Employees" value={stats.total_employees} accent="bg-seal" />
        <SummaryCard
          label="Avg. resolution time"
          value={stats.avg_resolution_hours != null ? `${stats.avg_resolution_hours}h` : '—'}
          accent="bg-ink-light"
        />
      </div>

      <h2 className="mt-10 font-display text-lg font-semibold text-ink">Complaints by status</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {STATUS_CARDS.map((s) => (
          <div key={s.key} className="rounded-xl border border-ink/10 bg-white p-5 text-center">
            <p className="text-2xl font-semibold text-ink">{stats[s.key]}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-ink/50">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function SummaryCard({ label, value, accent }) {
  return (
    <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
      <div className={`h-1.5 ${accent}`} />
      <div className="p-5">
        <p className="text-3xl font-semibold text-ink">{value}</p>
        <p className="mt-1 text-sm text-ink/60">{label}</p>
      </div>
    </div>
  )
}
