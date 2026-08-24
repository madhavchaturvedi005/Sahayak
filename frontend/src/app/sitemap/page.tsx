'use client'

import Link from 'next/link'
import { GlassCard } from '@/components/ui/GlassCard'
import { useLanguage } from '@/context/LanguageContext'

export default function SitemapPage() {
  const { t } = useLanguage()
  const groups = [
    {
      title: t('utility'),
      links: [
        ['/', t('home')],
        ['/contact', t('contact')],
        ['/about', t('about')],
        ['/transparency', t('transparency')],
        ['/help', t('help')],
        ['/sitemap', t('sitemap')],
      ],
    },
    {
      title: t('viewStatus'),
      links: [
        ['/status?kind=grievance', t('grievanceStatus')],
        ['/status?kind=appeal', t('appealStatus')],
      ],
    },
    {
      title: t('nodalOfficers'),
      links: [
        ['/nodal-officers/central', t('central')],
        ['/nodal-officers/state', t('state')],
      ],
    },
    {
      title: t('grievance'),
      links: [
        ['/grievance/lodge', t('lodgePublic')],
        ['/grievance/lodge-pension', t('lodgePension')],
        ['/status', t('viewStatus')],
        ['/grievance/reminder', t('reminder')],
        ['/grievance/rate', t('rate')],
      ],
    },
    {
      title: t('other'),
      links: [
        ['/redress-process', t('redressFlow')],
        ['/appeal/authority', t('appealAuthority')],
        ['/mobile-app', t('mobileApp')],
        ['/auth/signin', t('signIn')],
        ['/admin/signin', t('officerSignInNav')],
        ['/disclaimer', t('footerDisclaimer')],
        ['/policies', t('footerPolicies')],
        ['/web-information-manager', t('footerWim')],
      ],
    },
  ]
  return (
    <div className="page-wrap space-y-6 pb-16">
      <h1 className="text-[32px] font-bold">{t('sitemap')}</h1>
      <div className="grid gap-6 md:grid-cols-2">
        {groups.map((group) => (
          <GlassCard key={group.title}>
            <h2 className="mb-4 text-[22px] font-semibold">{group.title}</h2>
            <ul className="space-y-2">
              {group.links.map(([href, label]) => (
                <li key={href}>
                  <Link href={href}>{label}</Link>
                </li>
              ))}
            </ul>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
