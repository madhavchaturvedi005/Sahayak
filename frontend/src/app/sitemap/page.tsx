import Link from 'next/link'
import { GlassCard } from '@/components/ui/GlassCard'

const GROUPS = [
  {
    title: 'Utility',
    links: [
      ['/', 'Home'],
      ['/contact', 'Contact Us'],
      ['/about', 'About Us'],
      ['/help', 'FAQs/Help'],
      ['/sitemap', 'Site Map'],
    ],
  },
  {
    title: 'View Status',
    links: [
      ['/status?kind=grievance', 'Grievance Status'],
      ['/status?kind=appeal', 'Appeal Status'],
    ],
  },
  {
    title: 'Nodal PG Officers',
    links: [
      ['/nodal-officers/central', 'Central Government'],
      ['/nodal-officers/state', 'State Government'],
    ],
  },
  {
    title: 'Grievance',
    links: [
      ['/grievance/lodge', 'Lodge Public Grievance'],
      ['/grievance/lodge-pension', 'Lodge Pension Grievance'],
      ['/status', 'View Status'],
      ['/grievance/reminder', 'Reminder Clarification'],
      ['/grievance/rate', 'Rate Grievance'],
    ],
  },
  {
    title: 'Other',
    links: [
      ['/redress-process', 'Redress Process Flow'],
      ['/appeal/authority', 'Nodal Authority for Appeal'],
      ['/mobile-app', 'Mobile App'],
      ['/auth/signin', 'Sign In'],
      ['/disclaimer', 'Disclaimer'],
      ['/policies', 'Website Policies'],
      ['/web-information-manager', 'Web Information Manager'],
    ],
  },
]

export default function SitemapPage() {
  return (
    <div className="page-wrap space-y-6 pb-16">
      <h1 className="text-[32px] font-bold">Site Map</h1>
      <div className="grid gap-6 md:grid-cols-2">
        {GROUPS.map((group) => (
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
