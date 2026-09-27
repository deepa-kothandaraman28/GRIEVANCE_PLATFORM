import { createContext, useContext, useEffect, useState } from 'react'
import { fetchMe, login as apiLogin } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('gp_token')
    if (!token) {
      setLoading(false)
      return
    }
    fetchMe()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('gp_token')
      })
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    const data = await apiLogin(email, password)
    localStorage.setItem('gp_token', data.access_token)
    setUser(data.user)
    return data.user
  }

  function logout() {
    localStorage.removeItem('gp_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
