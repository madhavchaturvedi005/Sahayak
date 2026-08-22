'use client'

import { Suspense } from 'react'
import { LodgeForm } from '@/components/grievance/LodgeForm'
import { useAuth } from '@/context/AuthContext'

function LodgePension() {
  const { user } = useAuth()
  return (
    <div className={user ? '' : 'page-wrap'}>
      <LodgeForm kind="pension" />
    </div>
  )
}

export default function LodgePensionPage() {
  return (
    <Suspense>
      <LodgePension />
    </Suspense>
  )
}
