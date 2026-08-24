'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GlassCard } from '@/components/ui/GlassCard'
import { useAuth } from '@/context/AuthContext'

export default function DeleteAccountPage() {
  const { signOut } = useAuth()
  const router = useRouter()

  return (
    <div className="space-y-6">
      <h1 className="text-[32px] font-bold">Delete Account</h1>
      <GlassCard>
        <p className="leading-relaxed">
          Deleting your account signs you out and removes this session. Grievances already registered remain on the
          portal for tracking.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              signOut()
              router.push('/')
            }}
          >
            Sign out of Sahayak
          </button>
          <Link href="/desk" className="btn-secondary">
            Back to dashboard
          </Link>
        </div>
      </GlassCard>
    </div>
  )
}
