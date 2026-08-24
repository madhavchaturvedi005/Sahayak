'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Building2, ClipboardList, GitBranch, LayoutDashboard, LogOut, Scale, Settings, Users } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { isAdmin } from '@/lib/roles'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/admin', labelKey: 'officerDashboard', icon: LayoutDashboard },
  { href: '/admin/grievances', labelKey: 'allGrievances', icon: ClipboardList },
  { href: '/admin/appeals', labelKey: 'appeals', icon: Scale },
  { href: '/admin/nodal-officers', labelKey: 'nodalDirectory', icon: Building2 },
  { href: '/admin/escalation', labelKey: 'deskMap', icon: GitBranch },
] as const

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { t } = useLanguage()
  const admin = isAdmin(user)

  const items = [
    ...LINKS,
    ...(admin
      ? [
          { href: '/admin/users', labelKey: 'usersAndRoles' as const, icon: Users },
          { href: '/admin/config', labelKey: 'adminConfig' as const, icon: Settings },
        ]
      : []),
  ]

  return (
    <aside className="flex h-full flex-col gap-4">
      <nav className="glass-indigo rounded-panel p-3">
        <p className="mb-2 px-3 pt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
          {t('officerDesk')}
        </p>
        {items.map((item) => {
          const active = item.href === '/admin' ? pathname === '/admin' : pathname === item.href || pathname.startsWith(`${item.href}/`)
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
            router.push('/admin/signin')
          }}
        >
          <LogOut className="h-4 w-4" />
          {t('signOut')}
        </button>
      </nav>
      <div className="glass-panel rounded-panel p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber">{t('signedInAs')}</p>
        <p className="mt-1 text-sm font-semibold text-indigo">{user?.name}</p>
        <p className="text-xs text-slate">
          {user?.role === 'cm'
            ? t('roleCm')
            : user?.role === 'supervisor'
              ? t('roleSupervisor')
              : user?.role === 'admin'
                ? t('roleAdmin')
                : t('roleOfficer')}
        </p>
      </div>
    </aside>
  )
}
