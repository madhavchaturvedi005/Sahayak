'use client'

import { Suspense } from 'react'
import { CitizenAuthScreen } from '@/components/auth/CitizenAuthScreen'

export default function SignInPage() {
  return (
    <Suspense
      fallback={<div className="page-wrap h-40 animate-shimmer rounded-panel bg-[linear-gradient(90deg,#e8ebf2,#f7f8fa,#e8ebf2)] bg-[length:200%_100%]" />}
    >
      <CitizenAuthScreen />
    </Suspense>
  )
}
