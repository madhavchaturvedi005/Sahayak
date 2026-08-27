'use client'

import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { signInHref } from '@/lib/auth-next'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const search = useSearchParams()

  useEffect(() => {
    if (!ready || user) return
    const next = pathname + (search.toString() ? `?${search.toString()}` : '')
    router.replace(signInHref(next))
  }, [ready, user, pathname, search, router])

  if (!ready || !user) {
    return (
      <div className="h-40 animate-shimmer rounded-panel bg-[linear-gradient(90deg,#e8ebf2,#f7f8fa,#e8ebf2)] bg-[length:200%_100%]" />
    )
  }

  return <>{children}</>
}
