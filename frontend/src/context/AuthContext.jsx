import { createContext, useState, useEffect } from 'react'
import authService from '../services/authService'

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('loggedFinanceUser')
    if (stored) setUser(JSON.parse(stored))
  }, [])

  const login = async (credentials) => {
    const userData = await authService.login(credentials)
    localStorage.setItem('loggedFinanceUser', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const logout = () => {
    localStorage.removeItem('loggedFinanceUser')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
