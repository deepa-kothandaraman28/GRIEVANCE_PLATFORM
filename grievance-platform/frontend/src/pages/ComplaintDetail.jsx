import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getComplaint, submitFeedback } from '../api/client.js'
import StatusBadge from '../components/StatusBadge.jsx'
import StatusTimeline from '../components/StatusTimeline.jsx'

export default function ComplaintDetail() {
  const { id } = useParams()
  const [complaint, setComplaint] = useState(null)
  const [error, setError] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)

  function load() {
    getComplaint(id).then(setComplaint).catch(() => setError('Could not load this complaint.'))
  }

  useEffect(load, [id])

  async function handleFeedback(e) {
    e.preventDefault()
    setFeedbackSubmitting(true)
    try {
      await submitFeedback(id, { rating: Number(rating), comment })
      load()
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not submit feedback.')
    } finally {
      setFeedbackSubmitting(false)
    }
  }

  if (error) return <p className="text-alert">{error}</p>
  if (!complaint) return <p className="text-ink/50">Loading…</p>

  const canReview =
    ['Resolved', 'Closed'].includes(complaint.status) && !complaint.feedback

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
                View submitted proof
              </a>
            )}
          </section>

          <section className="rounded-xl border border-ink/10 bg-white p-6">
            <h2 className="font-semibold text-ink">Progress</h2>
            <div className="mt-4">
              <StatusTimeline history={complaint.status_history} />
            </div>
          </section>

          {canReview && (
            <section className="rounded-xl border border-ink/10 bg-white p-6">
              <h2 className="font-semibold text-ink">Rate the resolution</h2>
              <form onSubmit={handleFeedback} className="mt-4 space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink/80">Rating</label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="rounded-md border border-ink/20 px-3 py-2 focus-ring"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>{n} — {['Poor', 'Fair', 'Good', 'Very good', 'Excellent'][n - 1]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink/80">Comment (optional)</label>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full rounded-md border border-ink/20 px-3 py-2 focus-ring"
                  />
                </div>
                <button
                  type="submit"
                  disabled={feedbackSubmitting}
                  className="rounded-md bg-ink px-5 py-2 text-sm font-medium text-paper hover:bg-ink-light disabled:opacity-50"
                >
                  {feedbackSubmitting ? 'Submitting…' : 'Submit feedback'}
                </button>
              </form>
            </section>
          )}

          {complaint.feedback && (
            <section className="rounded-xl border border-ink/10 bg-white p-6">
              <h2 className="font-semibold text-ink">Your feedback</h2>
              <p className="mt-2 text-sm text-ink/80">
                Rating: {complaint.feedback.rating}/5
              </p>
              {complaint.feedback.comment && (
                <p className="mt-1 text-sm text-ink/60">{complaint.feedback.comment}</p>
              )}
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-ink/10 bg-white p-5 text-sm">
            <h3 className="font-semibold text-ink">Location</h3>
            <p className="mt-2 text-ink/70">{complaint.address || 'Not specified'}</p>
            {complaint.latitude && complaint.longitude && (
              <p className="mt-1 text-xs text-ink/40">
                {complaint.latitude.toFixed(4)}, {complaint.longitude.toFixed(4)}
              </p>
            )}
          </div>

          {complaint.assigned_employee && (
            <div className="rounded-xl border border-ink/10 bg-white p-5 text-sm">
              <h3 className="font-semibold text-ink">Assigned officer</h3>
              <p className="mt-2 text-ink/70">{complaint.assigned_employee.user.name}</p>
              <p className="text-xs text-ink/40">{complaint.assigned_employee.department.name}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
