'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api, type TokenPayload, type User } from '@/lib/api'

type AuthContextValue = {
  user: User | null
  ready: boolean
  setSession: (payload: TokenPayload) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('sahayak_token')
    if (!stored) {
      setReady(true)
      return
    }
    api
      .me()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('sahayak_token')
        setUser(null)
      })
      .finally(() => setReady(true))
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      setSession: (payload) => {
        localStorage.setItem('sahayak_token', payload.access_token)
        setUser(payload.user)
      },
      signOut: () => {
        localStorage.removeItem('sahayak_token')
        setUser(null)
      },
    }),
    [user, ready]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
