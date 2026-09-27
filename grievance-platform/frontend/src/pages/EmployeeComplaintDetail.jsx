import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getAssignedComplaint, updateComplaintStatus } from '../api/client.js'
import StatusBadge from '../components/StatusBadge.jsx'
import StatusTimeline from '../components/StatusTimeline.jsx'

// Mirrors the backend's VALID_TRANSITIONS in app/routers/employees.py
const NEXT_STATUS = {
  Assigned: ['In Progress'],
  'In Progress': ['Resolved'],
  Resolved: ['Closed'],
}

export default function EmployeeComplaintDetail() {
  const { id } = useParams()
  const [complaint, setComplaint] = useState(null)
  const [error, setError] = useState('')
  const [nextStatus, setNextStatus] = useState('')
  const [remarks, setRemarks] = useState('')
  const [proof, setProof] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function load() {
    getAssignedComplaint(id)
      .then((c) => {
        setComplaint(c)
        const options = NEXT_STATUS[c.status] || []
        setNextStatus(options[0] || '')
      })
      .catch(() => setError('Could not load this complaint.'))
  }

  useEffect(load, [id])

  async function handleUpdate(e) {
    e.preventDefault()
    if (!nextStatus) return
    setSubmitting(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('status', nextStatus)
      if (remarks) formData.append('remarks', remarks)
      if (proof) formData.append('proof', proof)
      await updateComplaintStatus(id, formData)
      setRemarks('')
      setProof(null)
      load()
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not update status.')
    } finally {
      setSubmitting(false)
    }
  }

  if (error && !complaint) return <p className="text-alert">{error}</p>
  if (!complaint) return <p className="text-ink/50">Loading…</p>

  const options = NEXT_STATUS[complaint.status] || []

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">{complaint.title}</h1>
          <p className="mt-1 text-sm text-ink/60">
            Filed on {new Date(complaint.created_at).toLocaleString()} · Category:{' '}
            {complaint.category || 'Pending classification'}
          </p>
        </div>
        <StatusBadge status={complaint.status} />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <section className="rounded-xl border border-ink/10 bg-white p-6">
            <h2 className="font-semibold text-ink">Description</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-ink/80">{complaint.description}</p>
            {complaint.proof_path && (
              <a
                href={`/uploads/${complaint.proof_path}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm text-teal underline underline-offset-2"
              >
                View citizen-submitted proof
              </a>
            )}
          </section>

          <section className="rounded-xl border border-ink/10 bg-white p-6">
            <h2 className="font-semibold text-ink">Progress</h2>
            <div className="mt-4">
              <StatusTimeline history={complaint.status_history} />
            </div>
          </section>

          {options.length > 0 ? (
            <section className="rounded-xl border border-ink/10 bg-white p-6">
              <h2 className="font-semibold text-ink">Update status</h2>
              {error && <p className="mt-2 text-sm text-alert">{error}</p>}
              <form onSubmit={handleUpdate} className="mt-4 space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink/80">Move to</label>
                  <select
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value)}
                    className="rounded-md border border-ink/20 px-3 py-2 focus-ring"
                  >
                    {options.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink/80">Remarks</label>
                  <textarea
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="What did you find or fix?"
                    className="w-full rounded-md border border-ink/20 px-3 py-2 focus-ring"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink/80">
                    Resolution proof (optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => setProof(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-ink/70"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-ink px-5 py-2 text-sm font-medium text-paper hover:bg-ink-light disabled:opacity-50"
                >
                  {submitting ? 'Updating…' : `Mark as ${nextStatus}`}
                </button>
              </form>
            </section>
          ) : (
            <section className="rounded-xl border border-dashed border-ink/20 p-6 text-center text-sm text-ink/50">
              This complaint is closed — no further updates possible.
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-ink/10 bg-white p-5 text-sm">
            <h3 className="font-semibold text-ink">Citizen</h3>
            <p className="mt-2 text-ink/70">{complaint.citizen.name}</p>
            <p className="text-xs text-ink/40">{complaint.citizen.phone || complaint.citizen.email}</p>
          </div>

          <div className="rounded-xl border border-ink/10 bg-white p-5 text-sm">
            <h3 className="font-semibold text-ink">Location</h3>
            <p className="mt-2 text-ink/70">{complaint.address || 'Not specified'}</p>
            {complaint.latitude && complaint.longitude && (
              <p className="mt-1 text-xs text-ink/40">
                {complaint.latitude.toFixed(4)}, {complaint.longitude.toFixed(4)}
              </p>
            )}
          </div>

          {complaint.feedback && (
            <div className="rounded-xl border border-ink/10 bg-white p-5 text-sm">
              <h3 className="font-semibold text-ink">Citizen feedback</h3>
              <p className="mt-2 text-ink/70">Rating: {complaint.feedback.rating}/5</p>
              {complaint.feedback.comment && (
                <p className="mt-1 text-ink/60">{complaint.feedback.comment}</p>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
