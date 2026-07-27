import { createContext, useContext, useMemo, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

function getSavedAuth() {
  const savedToken = localStorage.getItem('token')
  const savedUser = localStorage.getItem('user')

  if (!savedToken || !savedUser) {
    return { token: null, user: null }
  }

  try {
    return { token: savedToken, user: JSON.parse(savedUser) }
  } catch {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    return { token: null, user: null }
  }
}

export function AuthProvider({ children }) {
  const savedAuth = getSavedAuth()
  const [token, setToken] = useState(savedAuth.token)
  const [user, setUser] = useState(savedAuth.user)

  const saveAuth = (authToken, authUser) => {
    localStorage.setItem('token', authToken)
    localStorage.setItem('user', JSON.stringify(authUser))
    setToken(authToken)
    setUser(authUser)

    return {
      token: authToken,
      user: authUser,
      role: authUser.role,
    }
  }

  const login = async (identifier, password) => {
    const username = identifier?.trim()
    const response = await api.post('/auth/login', { identifier: username, password })
    const { token: authToken, user: authUser } = response.data.data
    return saveAuth(authToken, authUser)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  const role = user?.role || null

  const value = useMemo(() => ({
    token,
    user,
    role,
    isAuthenticated: Boolean(token),
    login,
    logout,
  }), [token, user, role])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
