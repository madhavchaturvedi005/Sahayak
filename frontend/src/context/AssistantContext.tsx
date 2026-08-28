'use client'

import { createContext, useContext, useMemo, useRef, useState } from 'react'

export type LoginGuide = {
  setMode: (mode: 'otp' | 'password') => void
  setMobile: (value: string) => void
  setOtp: (value: string) => void
  setPassword: (value: string) => void
  sendOtp: () => Promise<string>
  verifyOtp: () => Promise<string>
  signInPassword: () => Promise<string>
}

export type LodgeGuide = {
  apply: (action: string, args: Record<string, string>) => Promise<string>
}

type AssistantContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  startVoice: boolean
  consumeStartVoice: () => void
  openChat: () => void
  openVoice: () => void
  resumeLiveSession: () => void
  grievanceId: string
  setGrievanceId: (id: string) => void
  pendingLodge: string
  setPendingLodge: (href: string) => void
  peekPendingLodge: () => string
  takePendingLodge: () => string
  registerLoginGuide: (guide: LoginGuide | null) => void
  loginGuide: () => LoginGuide | null
  registerLodgeGuide: (guide: LodgeGuide | null) => void
  lodgeGuide: () => LodgeGuide | null
  activity: string
  setActivity: (text: string) => void
}

const AssistantContext = createContext<AssistantContextValue | null>(null)

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [startVoice, setStartVoice] = useState(false)
  const [grievanceId, setGrievanceId] = useState('')
  const [pendingLodge, setPendingLodgeState] = useState('')
  const [activity, setActivity] = useState('')
  const pendingLodgeRef = useRef('')
  const loginGuideRef = useRef<LoginGuide | null>(null)
  const lodgeGuideRef = useRef<LodgeGuide | null>(null)

  const value = useMemo<AssistantContextValue>(
    () => ({
      open,
      setOpen,
      startVoice,
      consumeStartVoice: () => setStartVoice(false),
      openChat: () => {
        setOpen(true)
        setStartVoice(false)
      },
      openVoice: () => {
        setOpen(true)
        setStartVoice(true)
      },
      resumeLiveSession: () => {
        setOpen(true)
        setStartVoice(true)
      },
      grievanceId,
      setGrievanceId,
      pendingLodge,
      setPendingLodge: (href: string) => {
        pendingLodgeRef.current = href
        setPendingLodgeState(href)
      },
      peekPendingLodge: () => pendingLodgeRef.current,
      takePendingLodge: () => {
        const href = pendingLodgeRef.current
        pendingLodgeRef.current = ''
        setPendingLodgeState('')
        return href
      },
      registerLoginGuide: (guide) => {
        loginGuideRef.current = guide
      },
      loginGuide: () => loginGuideRef.current,
      registerLodgeGuide: (guide) => {
        lodgeGuideRef.current = guide
      },
      lodgeGuide: () => lodgeGuideRef.current,
      activity,
      setActivity,
    }),
    [open, startVoice, grievanceId, pendingLodge, activity]
  )

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>
}

export function useAssistant() {
  const ctx = useContext(AssistantContext)
  if (!ctx) throw new Error('useAssistant must be used within AssistantProvider')
  return ctx
}
