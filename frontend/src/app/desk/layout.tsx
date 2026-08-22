'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function DeskLayout({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (ready && !user) router.replace('/auth/signin')
  }, [ready, user, router])

  if (!ready) {
    return <div className="h-40 animate-shimmer rounded-panel bg-[linear-gradient(90deg,#e8ebf2,#f7f8fa,#e8ebf2)] bg-[length:200%_100%]" />
  }
  if (!user) return null
  return <>{children}</>
}
