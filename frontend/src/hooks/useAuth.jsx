import { createContext, useContext, useEffect, useState } from 'react'
import { Auth } from '../lib/api.js'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('smartcourt:token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      Auth.me(token).then(setUser).catch(() => {
        localStorage.removeItem('smartcourt:token')
        setToken(null)
      }).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  const login = async (email, password) => {
    const { access_token, user: u } = await Auth.login(email, password)
    localStorage.setItem('smartcourt:token', access_token)
    setToken(access_token)
    setUser(u)
    return u
  }
  const signup = async (full_name, email, password) => {
    const { access_token, user: u } = await Auth.signup(full_name, email, password)
    localStorage.setItem('smartcourt:token', access_token)
    setToken(access_token)
    setUser(u)
    return u
  }
  const logout = () => {
    localStorage.removeItem('smartcourt:token')
    setUser(null); setToken(null)
  }

  return (
    <AuthCtx.Provider value={{ user, token, login, signup, logout, loading, isAuthed: !!user }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
