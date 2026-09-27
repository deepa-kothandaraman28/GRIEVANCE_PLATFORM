import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function Register() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await register(form)
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err?.response?.data?.detail || 'Registration failed. Please check your details.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-2xl font-semibold text-ink">Register as a citizen</h1>
      <p className="mt-1 text-sm text-ink/60">Create an account to file and track complaints.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl border border-ink/10 bg-white p-6">
        {error && <p className="rounded-md bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>}

        <div>
          <label className="mb-1 block text-sm font-medium text-ink/80">Full name</label>
          <input
            required
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className="w-full rounded-md border border-ink/20 px-3 py-2 focus-ring"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/80">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            className="w-full rounded-md border border-ink/20 px-3 py-2 focus-ring"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/80">Phone</label>
          <input
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            className="w-full rounded-md border border-ink/20 px-3 py-2 focus-ring"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/80">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            className="w-full rounded-md border border-ink/20 px-3 py-2 focus-ring"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-ink py-2.5 font-medium text-paper hover:bg-ink-light disabled:opacity-50"
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-4 text-sm text-ink/60">
        Already registered?{' '}
        <Link to="/login" className="text-teal underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </div>
  )
}
