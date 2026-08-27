'use client'

import { Suspense } from 'react'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { LodgeForm } from '@/components/grievance/LodgeForm'

function LodgePublic() {
  return (
    <RequireAuth>
      <LodgeForm kind="public" />
    </RequireAuth>
  )
}

export default function LodgePublicPage() {
  return (
    <Suspense>
      <LodgePublic />
    </Suspense>
  )
}
