import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { adminCandidates, adminGetComplaint, adminReassign } from '../api/client.js'
import ScoreBar from '../components/ScoreBar.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import StatusTimeline from '../components/StatusTimeline.jsx'

export default function AdminComplaintDetail() {
  const { id } = useParams()
  const [complaint, setComplaint] = useState(null)
  const [candidates, setCandidates] = useState(null)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [remarks, setRemarks] = useState('')
  const [error, setError] = useState('')
  const [reassigning, setReassigning] = useState(false)

  function load() {
    adminGetComplaint(id).then(setComplaint).catch(() => setError('Could not load this complaint.'))
    adminCandidates(id)
      .then((list) => {
        setCandidates(list)
        setSelectedEmployee(list[0]?.employee_id ?? null)
      })
      .catch(() => setCandidates([]))
  }

  useEffect(load, [id])

  const canReassign = complaint && !['Resolved', 'Closed'].includes(complaint.status)

  async function handleReassign(e) {
    e.preventDefault()
    if (!selectedEmployee) return
    setReassigning(true)
    setError('')
    try {
      await adminReassign(id, { employee_id: selectedEmployee, remarks: remarks || undefined })
      setRemarks('')
      load()
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not reassign this complaint.')
    } finally {
      setReassigning(false)
    }
  }

  if (error && !complaint) return <p className="text-alert">{error}</p>
  if (!complaint) return <p className="text-ink/50">Loading…</p>

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            #{complaint.id} — {complaint.title}
          </h1>
          <p className="mt-1 text-sm text-ink/60">
            Filed by {complaint.citizen.name} on {new Date(complaint.created_at).toLocaleString()} · Category:{' '}
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
          </section>

          <section className="rounded-xl border border-ink/10 bg-white p-6">
            <h2 className="font-semibold text-ink">Progress</h2>
            <div className="mt-4">
              <StatusTimeline history={complaint.status_history} />
            </div>
          </section>

          <section className="rounded-xl border border-ink/10 bg-white p-6">
            <h2 className="font-semibold text-ink">Assignment</h2>
            <p className="mt-2 text-sm text-ink/70">
              Currently assigned to{' '}
              <span className="font-medium text-ink">
                {complaint.assigned_employee ? complaint.assigned_employee.user.name : 'No one yet'}
              </span>
            </p>

            {!canReassign && (
              <p className="mt-3 text-sm text-ink/50">
                This complaint is {complaint.status.toLowerCase()} and can no longer be reassigned.
              </p>
            )}

            {canReassign && candidates && candidates.length === 0 && (
              <p className="mt-3 text-sm text-ink/50">
                No employees found in this complaint's department.
              </p>
            )}

            {canReassign && candidates && candidates.length > 0 && (
              <form onSubmit={handleReassign} className="mt-4 space-y-4">
                <p className="text-xs uppercase tracking-wide text-ink/40">
                  Ranked candidates — same weighted algorithm used for auto-assignment
                </p>
                <div className="space-y-3">
                  {candidates.map((c) => (
                    <label
                      key={c.employee_id}
                      className={`block cursor-pointer rounded-lg border p-4 transition ${
                        selectedEmployee === c.employee_id
                          ? 'border-teal bg-teal/5'
                          : 'border-ink/10 bg-white hover:border-ink/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="employee"
                            checked={selectedEmployee === c.employee_id}
                            onChange={() => setSelectedEmployee(c.employee_id)}
                          />
                          <span className="font-medium text-ink">Employee #{c.employee_id}</span>
                        </div>
                        <span className="text-sm font-semibold text-ink">
                          {c.total_score.toFixed(1)} / 100
                        </span>
                      </div>
                      <div className="mt-3">
                        <ScoreBar scores={c} />
                      </div>
                    </label>
                  ))}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-ink/80">Remarks (optional)</label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Reason for manual reassignment…"
                    className="w-full rounded-md border border-ink/20 px-3 py-2 focus-ring"
                  />
                </div>

                {error && <p className="text-sm text-alert">{error}</p>}

                <button
                  type="submit"
                  disabled={reassigning}
                  className="rounded-md bg-ink px-5 py-2 text-sm font-medium text-paper hover:bg-ink-light disabled:opacity-50"
                >
                  {reassigning ? 'Reassigning…' : 'Reassign to selected employee'}
                </button>
              </form>
            )}
          </section>
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
