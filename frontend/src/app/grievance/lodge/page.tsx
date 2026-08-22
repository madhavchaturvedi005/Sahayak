'use client'

import { Suspense } from 'react'
import { LodgeForm } from '@/components/grievance/LodgeForm'
import { useAuth } from '@/context/AuthContext'

function LodgePublic() {
  const { user } = useAuth()
  return (
    <div className={user ? '' : 'page-wrap'}>
      <LodgeForm kind="public" />
    </div>
  )
}

export default function LodgePublicPage() {
  return (
    <Suspense>
      <LodgePublic />
    </Suspense>
  )
}
