import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const user = await login(email, password)
      if (user.role === 'admin') navigate('/admin')
      else if (user.role === 'employee') navigate('/employee')
      else navigate('/dashboard')
    } catch (err) {
      setError(err?.response?.data?.detail || 'Sign in failed. Check your details and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-2xl font-semibold text-ink">Sign in</h1>
      <p className="mt-1 text-sm text-ink/60">Citizens, employees, and admins all sign in here.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl border border-ink/10 bg-white p-6">
        {error && <p className="rounded-md bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>}

        <div>
          <label className="mb-1 block text-sm font-medium text-ink/80">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-ink/20 px-3 py-2 focus-ring"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink/80">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-ink/20 px-3 py-2 focus-ring"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-ink py-2.5 font-medium text-paper hover:bg-ink-light disabled:opacity-50"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-4 text-sm text-ink/60">
        New here?{' '}
        <Link to="/register" className="text-teal underline underline-offset-2">
          Register as a citizen
        </Link>
      </p>
    </div>
  )
}
