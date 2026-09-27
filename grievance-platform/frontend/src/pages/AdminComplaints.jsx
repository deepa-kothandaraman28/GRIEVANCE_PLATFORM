import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminComplaints, adminDepartments } from '../api/client.js'
import StatusBadge from '../components/StatusBadge.jsx'

const STATUSES = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed']

export default function AdminComplaints() {
  const [departments, setDepartments] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [complaints, setComplaints] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    adminDepartments().then(setDepartments).catch(() => {})
  }, [])

  useEffect(() => {
    setComplaints(null)
    adminComplaints({
      status_filter: statusFilter || undefined,
      department_id: departmentFilter || undefined,
    })
      .then(setComplaints)
      .catch(() => setError('Could not load complaints.'))
  }, [statusFilter, departmentFilter])

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">All complaints</h1>

      <div className="mt-4 flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-ink/20 px-3 py-2 text-sm focus-ring"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="rounded-md border border-ink/20 px-3 py-2 text-sm focus-ring"
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {error && <p className="mt-4 text-alert">{error}</p>}

      {complaints && complaints.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-ink/20 p-10 text-center text-ink/50">
          No complaints match these filters.
        </div>
      )}

      {complaints && complaints.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-xl border border-ink/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink/5 text-xs uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-4 py-3">#</th>
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
                  <td className="px-4 py-3 text-ink/50">{c.id}</td>
                  <td className="px-4 py-3 font-medium text-ink">{c.title}</td>
                  <td className="px-4 py-3 text-ink/60">{c.category || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3 text-ink/60">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/complaints/${c.id}`} className="text-teal underline underline-offset-2">
                      View
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
