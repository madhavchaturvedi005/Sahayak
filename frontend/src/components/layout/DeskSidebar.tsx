'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Activity,
  ClipboardList,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Scale,
  Trash2,
  UserRound,
} from 'lucide-react'
import { useAssistant } from '@/context/AssistantContext'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/desk', labelKey: 'grievanceDashboard', icon: LayoutDashboard },
  { href: '/desk/appeals', labelKey: 'appealDashboard', icon: Scale },
  { href: '/desk/lodge', labelKey: 'lodgePublic', icon: ClipboardList },
  { href: '/grievance/lodge-pension', labelKey: 'lodgePension', icon: ClipboardList },
  { href: '/desk/activity', labelKey: 'accountActivity', icon: Activity },
  { href: '/desk/profile', labelKey: 'editProfile', icon: UserRound },
  { href: '/desk/password', labelKey: 'changePassword', icon: KeyRound },
  { href: '/desk/delete', labelKey: 'deleteAccount', icon: Trash2 },
] as const

export function DeskSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useAuth()
  const { openVoice } = useAssistant()
  const { t } = useLanguage()

  return (
    <aside className="flex h-full flex-col gap-4">
      <nav className="glass-indigo rounded-panel p-3">
        {LINKS.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/85 hover:bg-white/10',
                active && 'bg-white text-indigo hover:bg-white'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {t(item.labelKey)}
            </Link>
          )
        })}
        <button
          type="button"
          className="mt-1 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-amber hover:bg-white/10"
          onClick={() => {
            signOut()
            router.push('/')
          }}
        >
          <LogOut className="h-4 w-4" />
          {t('signOut')}
        </button>
      </nav>

      <button
        type="button"
        onClick={() => {
          openVoice()
        }}
        className="glass-panel glass-hover rounded-panel p-4 text-left"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber">{t('speakGrievanceHi')}</p>
        <p className="text-xs text-slate">{t('speakGrievanceEn')}</p>
        <div className="mt-3 flex items-center gap-3">
          <img
            src="/avatar.png"
            alt="Sahayak, the voice assistant"
            className="h-16 w-16 rounded-full object-cover object-top ring-2 ring-amber/70"
          />
          <div>
            <p className="text-sm font-semibold text-indigo">Sahayak</p>
            <p className="text-xs text-slate">{t('aiGuide')}</p>
          </div>
        </div>
      </button>
    </aside>
  )
}
