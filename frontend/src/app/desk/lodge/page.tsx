'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GlassCard } from '@/components/ui/GlassCard'
import { EXCLUSIONS, NOTE_CSC } from '@/lib/content'

const MINISTRY_TILES = [
  {
    label: 'Water / Civic Amenities',
    icon: '/ministries/housing.png',
    ministry: 'Ministry of Housing and Urban Affairs',
    category: 'Water supply / civic amenities',
    playbook: 'water',
  },
  {
    label: 'Road / Transport',
    icon: '/ministries/road.png',
    ministry: 'Ministry of Road Transport and Highways',
    category: 'Road / transport',
    playbook: 'road',
  },
  {
    label: 'Sanitation / Waste',
    icon: '/ministries/housing.png',
    ministry: 'Ministry of Housing and Urban Affairs',
    category: 'Sanitation / waste',
    playbook: 'waste',
  },
  {
    label: 'Financial Services (Banking / PF / Pension)',
    icon: '/ministries/banking.png',
    ministry: 'Department of Financial Services',
    category: 'Banking / insurance',
    playbook: 'banking',
  },
  {
    label: 'Electricity / Power',
    icon: '/ministries/power.png',
    ministry: 'Ministry of Power',
    category: 'Power supply',
    playbook: 'power',
  },
  {
    label: 'PM-KISAN / Farmer Schemes',
    icon: '/ministries/agriculture.png',
    ministry: 'Department of Agriculture & Farmers Welfare',
    category: 'Farmers welfare / PM-KISAN',
    playbook: 'pmkisan',
  },
  {
    label: 'Income Tax / PAN',
    icon: '/ministries/income-tax.png',
    ministry: 'Central Board of Direct Taxes',
    category: 'Income tax / GST',
    playbook: 'income_tax',
  },
  {
    label: 'Telecommunications',
    icon: '/ministries/telecom.png',
    ministry: 'Department of Telecommunications',
    category: 'Telecom services',
    playbook: 'telecom',
  },
  {
    label: 'Railway Services',
    icon: '/ministries/railway.png',
    ministry: 'Ministry of Railways',
    category: 'Rail services',
    playbook: 'railway',
  },
  {
    label: 'Health & Family Welfare',
    icon: '/ministries/health.png',
    ministry: 'Ministry of Health & Family Welfare',
    category: 'Public health services',
    playbook: 'health',
  },
  {
    label: 'Cyber / Digital Fraud',
    icon: '/ministries/home-affairs.png',
    ministry: 'Ministry of Electronics and Information Technology',
    category: 'Cyber / digital fraud',
    playbook: 'cyber',
  },
  {
    label: 'Labour, MGNREGA & ESI',
    icon: '/ministries/labour.png',
    ministry: 'Ministry of Labour and Employment',
    category: 'Labour / employment',
    playbook: 'labour',
  },
  {
    label: 'Post Office & Postal Services',
    icon: '/ministries/posts.png',
    ministry: 'Department of Posts',
    category: 'Postal services',
    playbook: 'posts',
  },
  {
    label: 'Passport, Police & Home Affairs',
    icon: '/ministries/home-affairs.png',
    ministry: 'Ministry of Home Affairs',
    category: 'Home affairs',
    playbook: 'home_affairs',
  },
]

function lodgeHref(tile: (typeof MINISTRY_TILES)[number]) {
  const params = new URLSearchParams({ ministry: tile.ministry, category: tile.category, playbook: tile.playbook })
  return `/grievance/lodge?${params.toString()}`
}

export default function DeskLodgePage() {
  const router = useRouter()
  const [agreed, setAgreed] = useState(false)
  const [step, setStep] = useState<'terms' | 'ministry'>('terms')

  return (
    <div className="space-y-6">
      {step === 'terms' ? (
        <GlassCard>
          <h1 className="text-[32px] font-bold">Grievance terms and conditions</h1>
          <p className="mt-4 font-semibold text-attention">Issues which are not taken up for redress</p>
          <ul className="mt-3 space-y-2">
            {EXCLUSIONS.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-attention" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-6 rounded-card bg-amber/15 p-4 text-sm">{NOTE_CSC}</p>
          <label className="mt-6 flex items-start gap-3 text-sm">
            <input type="checkbox" className="mt-1 h-4 w-4" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            I agree that my grievance does not fall in any of the above listed categories
          </label>
          <button type="button" className="btn-primary mt-6" disabled={!agreed} onClick={() => setStep('ministry')}>
            Submit
          </button>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          <div>
            <h1 className="text-[32px] font-bold leading-tight">Please select a Ministry / Department / State Government</h1>
            <p className="mt-2 text-sm text-slate">Tap a department to start the lodge form with that desk selected.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
            {MINISTRY_TILES.map((tile) => (
              <button
                key={tile.label}
                type="button"
                className="glass-panel glass-hover flex min-h-[188px] flex-col items-center justify-center gap-3 rounded-panel px-3 py-5 text-center"
                onClick={() => router.push(lodgeHref(tile))}
              >
                <img src={tile.icon} alt="" className="h-20 w-20 object-contain drop-shadow-sm sm:h-24 sm:w-24" />
                <span className="text-sm font-semibold leading-snug text-indigo">{tile.label}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-secondary" onClick={() => router.push('/grievance/lodge')}>
              More… Ministries / Departments / State Governments
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => router.push('/grievance/lodge?helper=1')}
            >
              Help someone in a village file
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
