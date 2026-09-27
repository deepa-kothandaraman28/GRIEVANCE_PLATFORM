import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'

import CitizenDashboard from './pages/CitizenDashboard.jsx'
import SubmitComplaint from './pages/SubmitComplaint.jsx'
import ComplaintDetail from './pages/ComplaintDetail.jsx'

import EmployeeDashboard from './pages/EmployeeDashboard.jsx'
import EmployeeComplaintDetail from './pages/EmployeeComplaintDetail.jsx'

import AdminDashboard from './pages/AdminDashboard.jsx'
import AdminComplaints from './pages/AdminComplaints.jsx'
import AdminComplaintDetail from './pages/AdminComplaintDetail.jsx'
import AdminEmployees from './pages/AdminEmployees.jsx'

export default function App() {
  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={['citizen']}>
                <CitizenDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/submit"
            element={
              <ProtectedRoute roles={['citizen']}>
                <SubmitComplaint />
              </ProtectedRoute>
            }
          />
          <Route
            path="/complaints/:id"
            element={
              <ProtectedRoute roles={['citizen']}>
                <ComplaintDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employee"
            element={
              <ProtectedRoute roles={['employee']}>
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/complaints/:id"
            element={
              <ProtectedRoute roles={['employee']}>
                <EmployeeComplaintDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/complaints"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminComplaints />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/complaints/:id"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminComplaintDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/employees"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminEmployees />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  )
}
