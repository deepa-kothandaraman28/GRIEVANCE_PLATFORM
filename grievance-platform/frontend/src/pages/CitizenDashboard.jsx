import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { myComplaints } from '../api/client.js'
import StatusBadge from '../components/StatusBadge.jsx'

export default function CitizenDashboard() {
  const [complaints, setComplaints] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    myComplaints().then(setComplaints).catch(() => setError('Could not load your complaints.'))
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">My complaints</h1>
        <Link
          to="/submit"
          className="rounded-full bg-seal px-5 py-2 text-sm font-medium text-ink hover:bg-seal-light"
        >
          + New complaint
        </Link>
      </div>

      {error && <p className="mt-4 text-alert">{error}</p>}

      {complaints && complaints.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-ink/20 p-10 text-center text-ink/50">
          You haven't filed any complaints yet.
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
                    <Link to={`/complaints/${c.id}`} className="text-teal underline underline-offset-2">
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
