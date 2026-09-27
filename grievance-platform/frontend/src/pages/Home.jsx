import { Link } from 'react-router-dom'

const DEPARTMENTS = ['Water Supply', 'Electricity', 'Drainage', 'Roads', 'Sanitation', 'Street Light']

const STEPS = [
  {
    title: 'Describe what happened',
    body: 'Tell us the problem, where it is, and add a photo or video as proof.',
  },
  {
    title: 'We route it automatically',
    body: 'An NLP model reads your description and sends it straight to the right department.',
  },
  {
    title: 'The right officer is matched',
    body: 'A weighted scoring model picks the available officer best placed to resolve it.',
  },
  {
    title: 'Track it to resolution',
    body: 'Follow every status change, then rate the work once it is resolved.',
  },
]

export default function Home() {
  return (
    <div>
      <section className="grid gap-10 py-10 md:grid-cols-2 md:items-center">
        <div>
          <p className="mb-3 text-sm font-medium text-teal">Public Grievance Platform</p>
          <h1 className="font-display text-4xl font-semibold leading-tight text-ink md:text-5xl">
            Report a civic problem. Watch it get fixed.
          </h1>
          <p className="mt-4 max-w-md text-ink/70">
            No more calling five different offices to find out who handles a broken streetlight.
            Describe the issue once — our system classifies it, finds the right department, and
            assigns the officer best placed to resolve it near you.
          </p>
          <div className="mt-8 flex gap-4">
            <Link
              to="/register"
              className="rounded-full bg-ink px-6 py-3 font-medium text-paper hover:bg-ink-light"
            >
              File a complaint
            </Link>
            <Link
              to="/login"
              className="rounded-full border border-ink/20 px-6 py-3 font-medium text-ink hover:bg-ink/5"
            >
              Sign in
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
          <p className="mb-4 text-xs uppercase tracking-wide text-ink/40">Departments we route to</p>
          <ul className="grid grid-cols-2 gap-3">
            {DEPARTMENTS.map((d) => (
              <li
                key={d}
                className="rounded-lg border border-ink/10 bg-paper px-4 py-3 text-sm font-medium text-ink"
              >
                {d}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-ink/10 py-14">
        <h2 className="font-display text-2xl font-semibold text-ink">How it works</h2>
        <div className="mt-8 grid gap-8 md:grid-cols-4">
          {STEPS.map((step, i) => (
            <div key={step.title}>
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-semibold text-paper">
                {i + 1}
              </div>
              <h3 className="font-semibold text-ink">{step.title}</h3>
              <p className="mt-1 text-sm text-ink/60">{step.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
