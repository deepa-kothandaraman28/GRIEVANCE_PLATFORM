import { useEffect, useState } from 'react'
import { adminCreateEmployee, adminDepartments, adminEmployees } from '../api/client.js'

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  department_id: '',
  latitude: '',
  longitude: '',
  max_active_cases: 10,
}

export default function AdminEmployees() {
  const [departments, setDepartments] = useState([])
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [employees, setEmployees] = useState(null)
  const [error, setError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    adminDepartments().then(setDepartments).catch(() => {})
  }, [])

  function load() {
    setEmployees(null)
    adminEmployees(departmentFilter || undefined)
      .then(setEmployees)
      .catch(() => setError('Could not load employees.'))
  }

  useEffect(load, [departmentFilter])

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleCreate(e) {
    e.preventDefault()
    setCreating(true)
    setFormError('')
    try {
      await adminCreateEmployee({
        ...form,
        department_id: Number(form.department_id),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        max_active_cases: Number(form.max_active_cases),
      })
      setForm(emptyForm)
      setShowForm(false)
      load()
    } catch (err) {
      setFormError(err?.response?.data?.detail || 'Could not create this employee.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold text-ink">Employees</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-full bg-seal px-5 py-2 text-sm font-medium text-ink hover:bg-seal-light"
        >
          {showForm ? 'Cancel' : '+ Add employee'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mt-6 grid gap-4 rounded-xl border border-ink/10 bg-white p-6 sm:grid-cols-2">
          <Field label="Full name">
            <input
              required
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full rounded-md border border-ink/20 px-3 py-2 focus-ring"
            />
          </Field>
          <Field label="Email">
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              className="w-full rounded-md border border-ink/20 px-3 py-2 focus-ring"
            />
          </Field>
          <Field label="Phone">
            <input
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              className="w-full rounded-md border border-ink/20 px-3 py-2 focus-ring"
            />
          </Field>
          <Field label="Temporary password">
            <input
              required
              type="password"
              minLength={6}
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
              className="w-full rounded-md border border-ink/20 px-3 py-2 focus-ring"
            />
          </Field>
          <Field label="Department">
            <select
              required
              value={form.department_id}
              onChange={(e) => updateField('department_id', e.target.value)}
              className="w-full rounded-md border border-ink/20 px-3 py-2 focus-ring"
            >
              <option value="">Select…</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Max active cases">
            <input
              required
              type="number"
              min={1}
              value={form.max_active_cases}
              onChange={(e) => updateField('max_active_cases', e.target.value)}
              className="w-full rounded-md border border-ink/20 px-3 py-2 focus-ring"
            />
          </Field>
          <Field label="Latitude">
            <input
              required
              type="number"
              step="any"
              value={form.latitude}
              onChange={(e) => updateField('latitude', e.target.value)}
              className="w-full rounded-md border border-ink/20 px-3 py-2 focus-ring"
            />
          </Field>
          <Field label="Longitude">
            <input
              required
              type="number"
              step="any"
              value={form.longitude}
              onChange={(e) => updateField('longitude', e.target.value)}
              className="w-full rounded-md border border-ink/20 px-3 py-2 focus-ring"
            />
          </Field>

          {formError && <p className="sm:col-span-2 text-sm text-alert">{formError}</p>}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={creating}
              className="rounded-md bg-ink px-5 py-2 text-sm font-medium text-paper hover:bg-ink-light disabled:opacity-50"
            >
              {creating ? 'Creating…' : 'Create employee'}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6">
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

      {employees && employees.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-ink/20 p-10 text-center text-ink/50">
          No employees found.
        </div>
      )}

      {employees && employees.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-xl border border-ink/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink/5 text-xs uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Performance</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Workload</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id} className="border-t border-ink/10 hover:bg-paper">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{e.user.name}</p>
                    <p className="text-xs text-ink/40">{e.user.email}</p>
                  </td>
                  <td className="px-4 py-3 text-ink/60">{e.department.name}</td>
                  <td className="px-4 py-3 text-ink/60">{e.performance_score.toFixed(0)}/100</td>
                  <td className="px-4 py-3 text-ink/60">{e.avg_rating.toFixed(1)}/5</td>
                  <td className="px-4 py-3 text-ink/60">
                    {e.active_case_count}/{e.max_active_cases}
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

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink/80">{label}</label>
      {children}
    </div>
  )
}
