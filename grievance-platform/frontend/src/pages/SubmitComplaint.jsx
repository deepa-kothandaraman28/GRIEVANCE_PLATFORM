import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { submitComplaint } from '../api/client.js'

export default function SubmitComplaint() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', description: '', address: '' })
  const [coords, setCoords] = useState(null)
  const [locating, setLocating] = useState(false)
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError('Your browser does not support location detection.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
        setLocating(false)
      },
      () => {
        setError('Could not detect your location. You can still describe it in the address field.')
        setLocating(false)
      },
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const data = new FormData()
      data.append('title', form.title)
      data.append('description', form.description)
      data.append('address', form.address)
      if (coords) {
        data.append('latitude', coords.latitude)
        data.append('longitude', coords.longitude)
      }
      if (file) data.append('proof', file)

      const complaint = await submitComplaint(data)
      navigate(`/complaints/${complaint.id}`)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not submit your complaint. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-ink">File a new complaint</h1>
      <p className="mt-1 text-sm text-ink/60">
        Describe the problem clearly — our system reads this to route it to the right department.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-xl border border-ink/10 bg-white p-6">
        {error && <p className="rounded-md bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>}

        <div>
          <label className="mb-1 block text-sm font-medium text-ink/80">Title</label>
          <input
            required
            placeholder="e.g. No streetlight on Gandhi Nagar main road"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            className="w-full rounded-md border border-ink/20 px-3 py-2 focus-ring"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink/80">Description</label>
          <textarea
            required
            rows={5}
            placeholder="Describe what's wrong, since when, and how it's affecting you or your neighbourhood…"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            className="w-full rounded-md border border-ink/20 px-3 py-2 focus-ring"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink/80">Address / landmark</label>
          <input
            placeholder="Street, area, nearby landmark"
            value={form.address}
            onChange={(e) => update('address', e.target.value)}
            className="w-full rounded-md border border-ink/20 px-3 py-2 focus-ring"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink/80">Precise location</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              className="rounded-md border border-ink/20 px-4 py-2 text-sm font-medium text-ink hover:bg-paper disabled:opacity-50"
            >
              {locating ? 'Detecting…' : 'Use my current location'}
            </button>
            {coords && (
              <span className="text-xs text-ink/50">
                {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink/80">
            Photo or video proof (optional)
          </label>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-ink/70"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-ink py-2.5 font-medium text-paper hover:bg-ink-light disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit complaint'}
        </button>
      </form>
    </div>
  )
}
