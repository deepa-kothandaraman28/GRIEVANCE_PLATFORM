import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const homeLink = !user
    ? '/'
    : user.role === 'admin'
    ? '/admin'
    : user.role === 'employee'
    ? '/employee'
    : '/dashboard'

  return (
    <header className="border-b border-ink/10 bg-ink text-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to={homeLink} className="flex items-baseline gap-2">
          <span className="font-display text-xl font-semibold tracking-tight">CivicResolve</span>
          <span className="hidden text-xs uppercase tracking-widest text-seal-light sm:inline">
            Grievance Platform
          </span>
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          {!user && (
            <>
              <Link to="/login" className="hover:text-seal-light">Sign in</Link>
              <Link
                to="/register"
                className="rounded-full bg-seal px-4 py-1.5 font-medium text-ink hover:bg-seal-light"
              >
                Register a complaint
              </Link>
            </>
          )}

          {user && user.role === 'citizen' && (
            <>
              <Link to="/dashboard" className="hover:text-seal-light">My complaints</Link>
              <Link
                to="/submit"
                className="rounded-full bg-seal px-4 py-1.5 font-medium text-ink hover:bg-seal-light"
              >
                New complaint
              </Link>
            </>
          )}

          {user && user.role === 'employee' && (
            <Link to="/employee" className="hover:text-seal-light">My assignments</Link>
          )}

          {user && user.role === 'admin' && (
            <>
              <Link to="/admin" className="hover:text-seal-light">Overview</Link>
              <Link to="/admin/complaints" className="hover:text-seal-light">Complaints</Link>
              <Link to="/admin/employees" className="hover:text-seal-light">Employees</Link>
            </>
          )}

          {user && (
            <button onClick={handleLogout} className="text-paper/70 hover:text-alert">
              Sign out
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}
