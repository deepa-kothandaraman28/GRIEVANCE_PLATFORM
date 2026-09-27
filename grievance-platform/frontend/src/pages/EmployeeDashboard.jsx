import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { myAssignedComplaints, myEmployeeProfile } from '../api/client.js'
import StatusBadge from '../components/StatusBadge.jsx'

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'Assigned', value: 'Assigned' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Resolved', value: 'Resolved' },
  { label: 'Closed', value: 'Closed' },
]

export default function EmployeeDashboard() {
  const [profile, setProfile] = useState(null)
  const [complaints, setComplaints] = useState(null)
  const [filter, setFilter] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    myEmployeeProfile().then(setProfile).catch(() => {})
  }, [])

  useEffect(() => {
    setComplaints(null)
    myAssignedComplaints(filter || undefined)
      .then(setComplaints)
      .catch(() => setError('Could not load your assigned complaints.'))
  }, [filter])

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">My assignments</h1>
          {profile && (
            <p className="mt-1 text-sm text-ink/60">
              {profile.department.name} · {profile.active_case_count}/{profile.max_active_cases} active cases ·
              {' '}rating {profile.avg_rating.toFixed(1)}/5
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              filter === f.value
                ? 'bg-ink text-paper'
                : 'bg-ink/5 text-ink/70 hover:bg-ink/10'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-alert">{error}</p>}

      {complaints && complaints.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-ink/20 p-10 text-center text-ink/50">
          No complaints match this filter.
        </div>
      )}

      {complaints && complaints.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-xl border border-ink/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink/5 text-xs uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Filed on</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {complaints.map((c) => (
                <tr key={c.id} className="border-t border-ink/10 hover:bg-paper">
                  <td className="px-4 py-3 font-medium text-ink">{c.title}</td>
                  <td className="px-4 py-3 text-ink/60">{c.category || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3 text-ink/60">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/employee/complaints/${c.id}`} className="text-teal underline underline-offset-2">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
