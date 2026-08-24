'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  ChevronDown,
  ClipboardList,
  Globe,
  HelpCircle,
  LogIn,
  LogOut,
  Menu,
  Search,
  Smartphone,
  Users,
  Workflow,
  X,
} from 'lucide-react'
import { Emblem } from '@/components/ui/Emblem'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { homeForUser } from '@/lib/roles'
import { cn } from '@/lib/utils'

type Item = { href: string; label: string }
type NavEntry =
  | { type: 'link'; href: string; label: string; icon: React.ReactNode }
  | { type: 'menu'; label: string; icon: React.ReactNode; items: Item[]; dividedAt?: number }

function SessionClock() {
  const [left, setLeft] = useState(30 * 60)

  useEffect(() => {
    const id = window.setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => window.clearInterval(id)
  }, [])

  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  const { t } = useLanguage()
  return (
    <p className="mt-1 text-xs font-semibold text-success">
      {t('session')}: {mm}:{ss}
    </p>
  )
}

function MenuPanel({ items, dividedAt }: { items: Item[]; dividedAt?: number }) {
  return (
    <div className="absolute left-0 top-full z-50 mt-2 min-w-56 animate-fade-scale rounded-card glass-panel p-2">
      {items.map((item, i) => (
        <div key={item.href}>
          {dividedAt === i && <div className="my-1 h-px bg-indigo/10" />}
          <Link
            href={item.href}
            className="block rounded-lg px-3 py-2.5 text-sm text-indigo hover:bg-white/70"
          >
            {item.label}
          </Link>
        </div>
      ))}
    </div>
  )
}

export function SiteHeader() {
  const { t, lang, setLang } = useLanguage()
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState<string | null>(null)
  const [mobile, setMobile] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setOpen(null)
    setMobile(false)
  }, [pathname])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpen(null)
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const nav: NavEntry[] = [
    {
      type: 'menu',
      label: t('viewStatus'),
      icon: <Search className="h-4 w-4" />,
      items: [
        { href: '/status?kind=grievance', label: t('grievanceStatus') },
        { href: '/status?kind=appeal', label: t('appealStatus') },
      ],
    },
    {
      type: 'menu',
      label: t('nodalOfficers'),
      icon: <Users className="h-4 w-4" />,
      items: [
        { href: '/nodal-officers/central', label: t('central') },
        { href: '/nodal-officers/state', label: t('state') },
      ],
    },
    {
      type: 'menu',
      label: t('redress'),
      icon: <Workflow className="h-4 w-4" />,
      items: [{ href: '/redress-process', label: t('redressFlow') }],
    },
    {
      type: 'menu',
      label: t('grievance'),
      icon: <ClipboardList className="h-4 w-4" />,
      dividedAt: 2,
      items: [
        { href: '/grievance/lodge', label: t('lodgePublic') },
        { href: '/grievance/lodge-pension', label: t('lodgePension') },
        { href: '/status?kind=grievance', label: t('viewStatus') },
        { href: '/grievance/reminder', label: t('reminder') },
        { href: '/grievance/rate', label: t('rate') },
      ],
    },
    { type: 'link', href: '/appeal/authority', label: t('appealAuthority'), icon: <Users className="h-4 w-4" /> },
    { type: 'link', href: '/mobile-app', label: t('mobileApp'), icon: <Smartphone className="h-4 w-4" /> },
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-wash/50 shadow-glass backdrop-blur-2xl backdrop-saturate-150">
      <div className="border-b border-white/10 bg-indigo-deep/55 text-white backdrop-blur-xl">
        <div className="page-wrap flex flex-wrap items-center justify-between gap-2 py-2 text-xs md:text-sm">
          <p className="text-white/80">{t('govLine')}</p>
          <nav className="flex flex-wrap items-center gap-3 text-white/90">
            <Link href="/" className="text-white/90 hover:text-white">
              {t('home')}
            </Link>
            <Link href="/contact" className="text-white/90 hover:text-white">
              {t('contact')}
            </Link>
            <Link href="/about" className="text-white/90 hover:text-white">
              {t('about')}
            </Link>
            <Link href="/help" className="text-white/90 hover:text-white">
              {t('help')}
            </Link>
            <Link href="/sitemap" className="text-white/90 hover:text-white">
              {t('sitemap')}
            </Link>
          </nav>
        </div>
      </div>

      <div className="page-wrap flex items-center justify-between gap-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <Emblem />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate">DARPG</p>
            <p className="max-w-[220px] text-sm font-semibold leading-tight text-indigo md:max-w-none">
              {t('darpg')}
            </p>
          </div>
        </Link>
        <div className="text-right">
          <p className="text-xl font-bold tracking-tight text-indigo md:text-2xl">CPGRAMS</p>
          <p className="hidden max-w-xs text-xs text-slate sm:block">
            {t('cpgramsFull')}
          </p>
          {user && <SessionClock />}
        </div>
      </div>

      <div className="page-wrap pb-3" ref={navRef}>
        <div className="glass-indigo flex w-full items-center justify-between gap-2 rounded-[20px] px-3 py-2 backdrop-blur-2xl backdrop-saturate-150 md:px-4">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-white md:hidden"
            aria-label="Open menu"
            onClick={() => setMobile((v) => !v)}
          >
            {mobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <nav className="hidden min-w-0 flex-1 flex-wrap items-center gap-0.5 md:flex">
            {nav.map((entry) =>
              entry.type === 'link' ? (
                <Link
                  key={entry.href}
                  href={entry.href}
                  className="inline-flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm text-white/90 hover:bg-white/10"
                >
                  {entry.icon}
                  {entry.label}
                </Link>
              ) : (
                <div key={entry.label} className="relative">
                  <button
                    type="button"
                    className="inline-flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm text-white/90 hover:bg-white/10"
                    onClick={() => setOpen(open === entry.label ? null : entry.label)}
                    aria-expanded={open === entry.label}
                  >
                    {entry.icon}
                    {entry.label}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  {open === entry.label && <MenuPanel items={entry.items} dividedAt={entry.dividedAt} />}
                </div>
              )
            )}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                className="inline-flex h-11 items-center gap-1 rounded-xl px-3 text-sm text-white/90 hover:bg-white/10"
                onClick={() => setLangOpen((v) => !v)}
              >
                <Globe className="h-4 w-4" />
                {lang === 'en' ? 'English' : 'हिन्दी'}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 min-w-36 animate-fade-scale rounded-card glass-panel p-2 text-indigo">
                  <button className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/70" onClick={() => setLang('en')}>
                    English
                  </button>
                  <button className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/70" onClick={() => setLang('hi')}>
                    हिन्दी
                  </button>
                </div>
              )}
            </div>
            {user ? (
              <>
                <Link href={homeForUser(user)} className="hidden max-w-[200px] truncate text-sm text-white/90 lg:inline">
                  {t('welcomeName', { name: user.name })}
                </Link>
                <button
                  type="button"
                  className="inline-flex h-11 items-center gap-2 rounded-btn bg-white/15 px-4 text-sm font-semibold text-white hover:bg-white/25"
                  onClick={() => {
                    signOut()
                    router.push('/')
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  {t('signOut')}
                </button>
              </>
            ) : (
              <Link href="/auth/signin" className="btn-primary h-11 px-4 text-sm">
                <LogIn className="h-4 w-4" />
                {t('signIn')}
              </Link>
            )}
          </div>
        </div>

        {mobile && (
          <div className="mt-2 animate-fade-scale rounded-panel glass-panel p-3 md:hidden">
            {nav.map((entry) =>
              entry.type === 'link' ? (
                <Link key={entry.href} href={entry.href} className="flex items-center gap-2 rounded-lg px-3 py-3 text-indigo">
                  {entry.icon}
                  {entry.label}
                </Link>
              ) : (
                <div key={entry.label} className="border-b border-indigo/10 py-2 last:border-0">
                  <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-slate">{entry.label}</p>
                  {entry.items.map((item) => (
                    <Link key={item.href} href={item.href} className="block rounded-lg px-3 py-2.5 text-indigo">
                      {item.label}
                    </Link>
                  ))}
                </div>
              )
            )}
            <Link href="/help" className="mt-2 flex items-center gap-2 rounded-lg px-3 py-3 text-indigo">
              <HelpCircle className="h-4 w-4" />
              {t('help')}
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
