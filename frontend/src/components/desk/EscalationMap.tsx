'use client'

import Link from 'next/link'
import { GlassCard } from '@/components/ui/GlassCard'
import { useLanguage } from '@/context/LanguageContext'
import type { DeskMap, Grievance } from '@/lib/api'

const BAR_COLORS = ['#1B2A4A', '#2A3D68', '#E8A33D']

export function EscalationMap({
  data,
  community = [],
  showLogins = false,
}: {
  data: DeskMap
  community?: Grievance[]
  showLogins?: boolean
}) {
  const { lang, t } = useLanguage()
  const sla = data.sla_days
  const desks = data.levels
  const maxOpen = Math.max(1, ...desks.map((desk) => desk.open))
  const totalOpen = desks.reduce((sum, desk) => sum + desk.open, 0)
  void showLogins

  const hot = community
    .filter((g) => (g.backer_count || 0) > 0 || (g.push_count || 0) > 0 || g.priority_crossed)
    .sort(
      (a, b) =>
        (b.push_count || 0) * 5 + (b.backer_count || 0) - ((a.push_count || 0) * 5 + (a.backer_count || 0))
    )
    .slice(0, 8)

  const nodes = [
    { key: 'citizen', title: t('deskCitizenTitle'), sub: t('deskCitizenBlurb') },
    ...desks.map((desk) => ({
      key: desk.key,
      title: lang === 'hi' ? desk.title_hi : desk.title,
      sub: lang === 'hi' ? desk.blurb_hi : desk.blurb,
      open: desk.open,
      seats: desk.people.length,
    })),
  ]

  return (
    <div className="space-y-6">
      <GlassCard hover={false} className="overflow-hidden p-4 md:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber">{t('deskFlowTitle')}</p>
        <h2 className="mt-1 text-[22px] font-semibold">{t('deskMap')}</h2>

        <div className="mt-8 hidden lg:block">
          <svg viewBox="0 0 1040 420" className="h-auto w-full" role="img" aria-label={t('deskMap')}>
            <defs>
              <marker id="desk-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                <path d="M0 0 L8 4 L0 8 Z" fill="#E8A33D" />
              </marker>
            </defs>

            <line x1="220" y1="92" x2="272" y2="92" stroke="#E8A33D" strokeWidth="2.5" markerEnd="url(#desk-arrow)" />
            <text x="246" y="78" textAnchor="middle" fill="#6B7280" fontSize="11">
              {t('deskLodged')}
            </text>
            <line x1="460" y1="92" x2="512" y2="92" stroke="#E8A33D" strokeWidth="2.5" markerEnd="url(#desk-arrow)" />
            <text x="486" y="78" textAnchor="middle" fill="#6B7280" fontSize="11">
              {t('deskIfUnresolved', { n: sla })}
            </text>
            <line x1="700" y1="92" x2="752" y2="92" stroke="#E8A33D" strokeWidth="2.5" markerEnd="url(#desk-arrow)" />
            <text x="726" y="78" textAnchor="middle" fill="#6B7280" fontSize="11">
              {t('deskIfUnresolved', { n: sla })}
            </text>

            <line x1="370" y1="144" x2="370" y2="210" stroke="#2E7D4F" strokeWidth="2" markerEnd="url(#desk-arrow)" />
            <line x1="610" y1="144" x2="610" y2="210" stroke="#2E7D4F" strokeWidth="2" markerEnd="url(#desk-arrow)" />
            <line x1="850" y1="144" x2="850" y2="210" stroke="#2E7D4F" strokeWidth="2" markerEnd="url(#desk-arrow)" />

            {nodes.map((node, index) => {
              const x = 40 + index * 240
              const desk = index === 0 ? null : desks[index - 1]
              return (
                <g key={node.key}>
                  <rect
                    x={x}
                    y="40"
                    width="180"
                    height="104"
                    rx="18"
                    fill={index === 0 ? 'rgba(232,163,61,0.16)' : 'rgba(27,42,74,0.08)'}
                    stroke={index === 0 ? '#E8A33D' : '#1B2A4A'}
                    strokeWidth="1.5"
                  />
                  <text x={x + 90} y="68" textAnchor="middle" fill="#6B7280" fontSize="10" fontWeight="600">
                    {index === 0 ? t('deskCitizen') : t('deskLevelN', { n: index })}
                  </text>
                  <text x={x + 90} y="92" textAnchor="middle" fill="#1B2A4A" fontSize="16" fontWeight="700">
                    {node.title}
                  </text>
                  {desk ? (
                    <text x={x + 90} y="116" textAnchor="middle" fill="#1B2A4A" fontSize="12">
                      {t('deskOpenNow', { n: desk.open })}
                    </text>
                  ) : (
                    <text x={x + 90} y="116" textAnchor="middle" fill="#6B7280" fontSize="12">
                      {t('deskLodged')}
                    </text>
                  )}
                </g>
              )
            })}

            {[370, 610, 850].map((x) => (
              <g key={x}>
                <rect x={x - 70} y="226" width="140" height="56" rx="14" fill="rgba(46,125,79,0.12)" stroke="#2E7D4F" />
                <text x={x} y="260" textAnchor="middle" fill="#2E7D4F" fontSize="14" fontWeight="700">
                  {t('deskResolved')}
                </text>
              </g>
            ))}

            <text x="520" y="340" textAnchor="middle" fill="#6B7280" fontSize="13">
              {t('deskChartHint', { n: sla })}
            </text>
            <text x="520" y="368" textAnchor="middle" fill="#1B2A4A" fontSize="13" fontWeight="600">
              {t('deskOpenTotal', { n: totalOpen })}
            </text>
          </svg>
        </div>

        <ol className="mt-6 space-y-3 lg:hidden">
          {nodes.map((node, index) => (
            <li key={node.key}>
              <div className="rounded-2xl border border-white/50 bg-white/50 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber">
                  {index === 0 ? t('deskCitizen') : t('deskLevelN', { n: index })}
                </p>
                <p className="mt-1 text-lg font-semibold">{node.title}</p>
                <p className="mt-1 text-sm text-slate">{node.sub}</p>
                {index > 0 ? (
                  <p className="mt-2 text-sm font-medium text-indigo">{t('deskOpenNow', { n: desks[index - 1].open })}</p>
                ) : null}
              </div>
              {index < nodes.length - 1 ? (
                <p className="py-2 text-center text-xs font-medium text-amber">{t('deskIfUnresolved', { n: sla })} ↓</p>
              ) : null}
            </li>
          ))}
        </ol>
      </GlassCard>

      {hot.length > 0 && (
        <GlassCard hover={false}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber">Jan Samarthan</p>
          <h2 className="mt-1 text-[22px] font-semibold">Community-backed cluster</h2>
          <p className="mt-2 text-sm text-slate">
            Verified raises and on-site pushes only. Pending raises do not inflate priority.
          </p>
          <ul className="mt-4 divide-y divide-indigo/10">
            {hot.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <Link href={`/status/${row.registration_id}`} className="font-semibold text-indigo">
                    {row.registration_id}
                  </Link>
                  <p className="mt-0.5 truncate text-slate">{row.subject}</p>
                  <p className="mt-0.5 text-xs text-slate">
                    {[row.village, row.ward, row.district].filter(Boolean).join(', ') || '—'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-indigo/8 px-2.5 py-1 text-xs font-semibold text-indigo">
                    Backed {row.backer_count || 0}
                  </span>
                  <span className="rounded-full bg-success/12 px-2.5 py-1 text-xs font-semibold text-success">
                    Push {row.push_count || 0}
                  </span>
                  {row.priority_crossed ? (
                    <span className="rounded-full bg-attention/10 px-2.5 py-1 text-xs font-semibold text-attention">
                      Interim reply due
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}

      <GlassCard hover={false}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber">{t('deskLoadChart')}</p>
        <h2 className="mt-1 text-[22px] font-semibold">{t('deskOpenTotal', { n: totalOpen })}</h2>
        <div className="mt-8 grid h-64 grid-cols-3 items-end gap-4 md:gap-10">
          {desks.map((desk, index) => {
            const height = Math.max(12, Math.round((desk.open / maxOpen) * 180))
            return (
              <div key={desk.key} className="flex h-full flex-col items-center justify-end">
                <p className="mb-2 text-2xl font-bold text-indigo">{desk.open}</p>
                <div
                  className="w-full max-w-[88px] rounded-t-2xl"
                  style={{ height, background: BAR_COLORS[index] }}
                  title={t('deskOpenNow', { n: desk.open })}
                />
                <p className="mt-3 text-center text-sm font-semibold text-indigo">
                  {lang === 'hi' ? desk.title_hi : desk.title}
                </p>
                <p className="mt-1 text-center text-xs text-slate">{t('deskSla', { n: desk.sla_days })}</p>
                <p className="text-center text-xs text-slate">{t('deskSeats', { n: desk.people.length })}</p>
              </div>
            )
          })}
        </div>
        <div className="mt-8">
          <div className="flex h-4 overflow-hidden rounded-full bg-white/60">
            {desks.map((desk, index) => {
              const share = totalOpen === 0 ? 1 / desks.length : desk.open / totalOpen
              return (
                <div
                  key={desk.key}
                  style={{ width: `${Math.max(share * 100, desk.open === 0 ? 0 : 4)}%`, background: BAR_COLORS[index] }}
                />
              )
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate">
            {desks.map((desk, index) => (
              <span key={desk.key} className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: BAR_COLORS[index] }} />
                {lang === 'hi' ? desk.title_hi : desk.title}
              </span>
            ))}
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
