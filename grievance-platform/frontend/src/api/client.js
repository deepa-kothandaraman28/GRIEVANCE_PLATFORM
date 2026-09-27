import axios from 'axios'

const client = axios.create({ baseURL: '/' })

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('gp_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default client

// ---------- Auth ----------
export const login = (email, password) =>
  client.post('/api/auth/login', { email, password }).then((r) => r.data)

export const register = (payload) =>
  client.post('/api/auth/register', payload).then((r) => r.data)

export const fetchMe = () => client.get('/api/auth/me').then((r) => r.data)

// ---------- Citizen ----------
export const submitComplaint = (formData) =>
  client
    .post('/api/complaints', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((r) => r.data)

export const myComplaints = () => client.get('/api/complaints/my').then((r) => r.data)

export const getComplaint = (id) => client.get(`/api/complaints/${id}`).then((r) => r.data)

export const submitFeedback = (id, payload) =>
  client.post(`/api/complaints/${id}/feedback`, payload).then((r) => r.data)

// ---------- Employee ----------
export const myEmployeeProfile = () => client.get('/api/employees/me').then((r) => r.data)

export const myAssignedComplaints = (statusFilter) =>
  client
    .get('/api/employees/me/complaints', { params: statusFilter ? { status_filter: statusFilter } : {} })
    .then((r) => r.data)

export const getAssignedComplaint = (id) =>
  client.get(`/api/employees/me/complaints/${id}`).then((r) => r.data)

export const updateComplaintStatus = (id, formData) =>
  client
    .patch(`/api/employees/me/complaints/${id}/status`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data)

// ---------- Admin ----------
export const adminStats = () => client.get('/api/admin/stats').then((r) => r.data)

export const adminDepartments = () => client.get('/api/admin/departments').then((r) => r.data)

export const adminEmployees = (departmentId) =>
  client
    .get('/api/admin/employees', { params: departmentId ? { department_id: departmentId } : {} })
    .then((r) => r.data)

export const adminCreateEmployee = (payload) =>
  client.post('/api/admin/employees', payload).then((r) => r.data)

export const adminComplaints = (params) =>
  client.get('/api/admin/complaints', { params }).then((r) => r.data)

export const adminGetComplaint = (id) => client.get(`/api/admin/complaints/${id}`).then((r) => r.data)

export const adminCandidates = (id) =>
  client.get(`/api/admin/complaints/${id}/candidates`).then((r) => r.data)

export const adminReassign = (id, payload) =>
  client.post(`/api/admin/complaints/${id}/reassign`, payload).then((r) => r.data)
