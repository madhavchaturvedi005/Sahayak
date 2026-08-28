'use client'

import { useParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Calendar, Check, Clock, Copy, MessageCircle, Scale, Star } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { useAssistant } from '@/context/AssistantContext'
import { useLanguage } from '@/context/LanguageContext'
import { api, type AppealWindow, type BackerStats, type Grievance, type ResolutionCheck } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { RaiseVerifyPanel } from '@/components/grievance/RaiseVerifyPanel'

function isResolved(status: string) {
  return /resolv|clos/i.test(status)
}

function resolutionFrom(row: Grievance) {
  const reply = [...row.events]
    .reverse()
    .find((event) => /resolv|reply|speaking|closed|redress/i.test(`${event.title} ${event.detail}`))
  if (reply?.detail) return reply
  return row.events[row.events.length - 1] || null
}

function StatusBadge({ status }: { status: string }) {
  const resolved = isResolved(status)
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${
        resolved ? 'bg-success/12 text-success' : /appeal/i.test(status) ? 'bg-attention/10 text-attention' : 'bg-indigo/8 text-indigo'
      }`}
    >
      {resolved ? <Check className="h-4 w-4" /> : <span className="h-2 w-2 rounded-full bg-current" />}
      {status}
    </span>
  )
}

function Meta({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof Calendar }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-xs font-medium text-slate">
        {Icon ? <Icon className="h-3.5 w-3.5 shrink-0 text-indigo" /> : null}
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-ink">{value}</p>
    </div>
  )
}

function officialCopy(row: Grievance, draft: string) {
  return [
    `Registration ID: ${row.registration_id}`,
    `Subject: ${row.subject}`,
    '',
    'Appeal:',
    draft.trim(),
    '',
    'File this appeal on this portal using the form below.',
  ].join('\n')
}

export default function StatusDetailPage() {
  const params = useParams<{ id: string | string[] }>()
  const id = Array.isArray(params.id) ? params.id.join('/') : decodeURIComponent(params.id ?? '')
  const { openVoice, setGrievanceId } = useAssistant()
  const { t } = useLanguage()
  const appealBox = useRef<HTMLDivElement | null>(null)
  const [row, setRow] = useState<Grievance | null>(null)
  const [check, setCheck] = useState<ResolutionCheck | null>(null)
  const [windowInfo, setWindowInfo] = useState<AppealWindow | null>(null)
  const [reviewing, setReviewing] = useState(true)
  const [error, setError] = useState('')
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [appealReason, setAppealReason] = useState('')
  const [drafted, setDrafted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [copied, setCopied] = useState(false)
  const [stats, setStats] = useState<BackerStats | null>(null)
  const [nearPin, setNearPin] = useState(false)

  useEffect(() => {
    setGrievanceId(id)
    return () => setGrievanceId('')
  }, [id, setGrievanceId])

  useEffect(() => {
    setReviewing(true)
    api
      .reviewGrievance(id)
      .then((data) => {
        setRow(data.grievance)
        setRating(data.grievance.rating || 0)
        setCheck(data.check)
        setWindowInfo(data.appeal_window)
        return api.backers(id).catch(() => null)
      })
      .then((s) => {
        if (s) setStats(s)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Not found'))
      .finally(() => setReviewing(false))
  }, [id])

  useEffect(() => {
    if (!row?.latitude || !row?.longitude || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const R = 6371000
        const toRad = (d: number) => (d * Math.PI) / 180
        const dLat = toRad(pos.coords.latitude - row.latitude!)
        const dLon = toRad(pos.coords.longitude - row.longitude!)
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(toRad(row.latitude!)) * Math.cos(toRad(pos.coords.latitude)) * Math.sin(dLon / 2) ** 2
        const dist = 2 * R * Math.asin(Math.sqrt(a))
        setNearPin(dist <= (row.onsite_radius_m || 150))
      },
      () => setNearPin(false),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [row?.latitude, row?.longitude, row?.onsite_radius_m])

  const reply = useMemo(() => (row ? resolutionFrom(row) : null), [row])
  const resolved = row ? isResolved(row.status) : false
  const canAppeal = (rating > 0 && rating <= 2) || drafted
  const expired = Boolean(windowInfo?.expired)
  const showDraft = Boolean(check && !check.addressed && check.appeal_draft && !expired)

  async function saveRating(next: number) {
    if (!row || busy) return
    setRating(next)
    setBusy(true)
    setNotice('')
    try {
      const updated = await api.rate(row.registration_id, next, comment)
      setRow(updated)
      setNotice(next <= 2 ? 'Rating saved. You can file an appeal below.' : `Saved a ${next}/5 rating.`)
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not save the rating.')
    } finally {
      setBusy(false)
    }
  }

  async function draftAppeal() {
    if (!row || !check?.appeal_draft) return
    setBusy(true)
    setNotice('')
    try {
      if (rating === 0 || rating > 2) {
        const updated = await api.rate(row.registration_id, 2, comment)
        setRow(updated)
        setRating(2)
      }
      let draft = check.appeal_draft
      if (reply?.detail) {
        try {
          const polished = await api.resolutionCheck(`${row.subject}\n${row.description}`, reply.detail)
          setCheck(polished)
          draft = polished.appeal_draft || draft
        } catch {
          /* keep the explainable keyword draft */
        }
      }
      setAppealReason(draft)
      setDrafted(true)
      setNotice('Appeal draft filled. Review it, then file the appeal on this portal.')
      requestAnimationFrame(() => appealBox.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not prepare the appeal.')
    } finally {
      setBusy(false)
    }
  }

  async function copyOfficial() {
    if (!row || !appealReason.trim()) return
    await navigator.clipboard.writeText(officialCopy(row, appealReason))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function fileAppeal() {
    if (!row || !appealReason.trim()) return
    setBusy(true)
    setNotice('')
    try {
      const result = await api.appeal(row.registration_id, appealReason.trim())
      const updated = await api.getGrievance(row.registration_id)
      setRow(updated)
      setNotice(`Appeal ${result.appeal_id} filed inside Sahayak. Copy the same text for the official portal if you still need to.`)
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not file the appeal.')
    } finally {
      setBusy(false)
    }
  }

  if (error) {
    return (
      <div className="page-wrap mx-auto max-w-[1200px] pb-16">
        <GlassCard>
          <h1 className="text-[32px] font-bold">Not found</h1>
          <p className="mt-3 text-slate">{error}</p>
          <Link href="/status" className="btn-secondary mt-6 inline-flex">
            Back to search
          </Link>
        </GlassCard>
      </div>
    )
  }

  if (!row) {
    return (
      <div className="page-wrap mx-auto max-w-[1200px] space-y-6 pb-16">
        <div className="h-16 animate-shimmer rounded-panel bg-[linear-gradient(90deg,#e8ebf2,#f7f8fa,#e8ebf2)] bg-[length:200%_100%]" />
        <div className="h-80 animate-shimmer rounded-panel bg-[linear-gradient(90deg,#e8ebf2,#f7f8fa,#e8ebf2)] bg-[length:200%_100%]" />
      </div>
    )
  }

  return (
    <div className="page-wrap mx-auto max-w-[1200px] space-y-6 pb-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Link href="/status" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate hover:text-indigo">
            <ArrowLeft className="h-4 w-4" />
            View status
          </Link>
          <h1 className="mt-2 text-[32px] font-bold leading-tight">Grievance Resolution Review</h1>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate">
            Review the department reply. If it did not resolve the complaint, draft an appeal within 30 days.
          </p>
        </div>
        <StatusBadge status={row.status} />
      </div>

      {row.escalation_level ? (
        <GlassCard hover={false} className={row.sla_overdue ? 'border border-attention/30' : ''}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber">
            {row.escalation_label || 'Desk'}
          </p>
          <p className="mt-2 text-lg font-semibold leading-snug">
            {t(
              row.escalation_level >= 3 ? 'escalatedBanner3' : row.escalation_level === 2 ? 'escalatedBanner2' : 'escalatedBanner1',
              { name: row.assigned_name || t('deskNow'), n: row.sla_days || 21 }
            )}
          </p>
          <p className="mt-2 text-sm text-slate">
            {row.sla_overdue ? t('slaOverdue') : t('daysOnDesk', { n: row.days_on_desk ?? 0 })}
            {row.field_officer_name && row.escalation_level && row.escalation_level > 1
              ? ` ${t('firstDesk')}: ${row.field_officer_name}.`
              : ''}
          </p>
          <Link href="/escalation-map" className="mt-4 inline-block text-sm font-semibold">
            {t('openDeskMap')}
          </Link>
        </GlassCard>
      ) : null}

      <GlassCard hover={false}>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber">Jan Samarthan</p>
        <h2 className="mt-1 text-[22px] font-semibold">Community weight</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-indigo/8 px-3 py-1.5 text-sm font-semibold text-indigo">
            Backed by {row.backer_count || 0} verified
          </span>
          <span className="rounded-full bg-success/12 px-3 py-1.5 text-sm font-semibold text-success">
            Pushed {row.push_count || 0} on-site
          </span>
          <span className="rounded-full bg-amber/15 px-3 py-1.5 text-sm font-semibold text-amber">
            Pending {row.pending_raise_count || stats?.pending_count || 0}
          </span>
          {row.priority_crossed || stats?.priority_crossed ? (
            <span className="rounded-full bg-attention/10 px-3 py-1.5 text-sm font-semibold text-attention">
              Response required
            </span>
          ) : null}
        </div>
        {stats && (
          <p className="mt-3 text-sm text-slate">
            {stats.distinct_mobiles} distinct mobiles
            {stats.avg_distance_m != null ? ` · avg ${stats.avg_distance_m} m` : ''}
            {stats.collection_span_days ? ` · collected over ${stats.collection_span_days} days` : ''}
            {' · '}
            thresholds {stats.priority_threshold_backers} backers / {stats.priority_threshold_pushes} on-site
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={`/back/${row.registration_id}`} className="btn-secondary">
            Share to add more
          </Link>
          <Link href="/nearby" className="btn-secondary">
            Find nearby problems
          </Link>
        </div>
      </GlassCard>

      {!/resolv|clos|reject/i.test(row.status) && (
        <RaiseVerifyPanel
          registrationId={row.registration_id}
          mode={nearPin ? 'onsite' : 'remote'}
          defaultVillage={row.village}
          defaultWard={row.ward}
          onDone={async () => {
            const [g, s] = await Promise.all([api.getGrievance(row.registration_id), api.backers(row.registration_id)])
            setRow(g)
            setStats(s)
          }}
        />
      )}

      <GlassCard hover={false} className="overflow-hidden p-0 md:p-0">
        <div className="grid gap-0 border-b border-indigo/10 lg:grid-cols-12">
          <div className="min-w-0 px-6 py-6 md:px-8 lg:col-span-7">
            <p className="text-xs font-medium text-slate">Grievance ID</p>
            <p className="mt-1 break-all text-xl font-semibold text-indigo">#{row.registration_id}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate">
              {row.ministry}
              <span className="text-indigo/30"> · </span>
              {row.category}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-indigo/10 px-6 py-6 sm:grid-cols-3 md:px-8 lg:col-span-5 lg:border-l lg:border-t-0">
            <Meta icon={Calendar} label="Filed" value={formatDate(row.created_at)} />
            <Meta
              icon={Calendar}
              label={resolved ? 'Closed' : 'Updated'}
              value={formatDate(reply?.created_at || row.updated_at || row.created_at)}
            />
            <Meta
              icon={Clock}
              label="Typical wait"
              value={`${row.expected_days} days · ${row.pendency_pct}% over 21`}
            />
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-2">
          <div className="min-w-0 space-y-6 px-6 py-6 md:px-8">
            <div>
              <p className="text-xs font-medium text-slate">Subject</p>
              <p className="mt-2 text-base font-medium leading-relaxed">{row.subject}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate">
                {resolved ? 'Department reply' : 'Latest update'}
              </p>
              <p className="mt-2 rounded-card bg-indigo/5 px-4 py-3 text-base leading-relaxed text-ink/90">
                {reply?.detail ||
                  (resolved
                    ? 'The department marked this grievance as resolved. No speaking order was attached.'
                    : 'The department has not uploaded a speaking order yet. You can send a reminder while you wait.')}
              </p>
            </div>
          </div>

          <div className="flex min-w-0 flex-col border-t border-indigo/10 px-6 py-6 md:px-8 lg:border-l lg:border-t-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber">Sahayak check</p>
                <h2 className="mt-1 text-[22px] font-semibold leading-tight">Did this reply resolve it?</h2>
              </div>
              {check && (
                <span
                  className={`inline-flex shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${
                    check.addressed ? 'bg-success/12 text-success' : 'bg-attention/10 text-attention'
                  }`}
                >
                  {check.addressed ? 'Looks addressed' : 'Not a real resolution'}
                </span>
              )}
            </div>
            {reviewing && !check && <p className="mt-4 text-sm text-slate">Reading the department reply…</p>}
            {check && (
              <>
                <p className="mt-4 text-base leading-relaxed text-ink/90">{check.reason}</p>
                {check.missing.length > 0 && !check.addressed && (
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate">
                    {check.missing.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </>
            )}
            {windowInfo && (
              <div className="mt-5 flex items-start gap-3 rounded-card bg-indigo/5 px-4 py-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-indigo" />
                <p className="text-sm leading-relaxed text-ink/90">{windowInfo.message}</p>
              </div>
            )}
            <div className="mt-auto pt-6">
              {showDraft && (
                <button type="button" className="btn-primary" disabled={busy} onClick={draftAppeal}>
                  <Scale className="h-4 w-4" />
                  Draft appeal
                </button>
              )}
              {expired && resolved && (
                <Link href="/desk/lodge" className="btn-secondary">
                  Lodge a fresh grievance
                </Link>
              )}
              <p className="mt-3 text-xs leading-relaxed text-slate">
                This check helps you read the reply. It is not a legal judgment.
              </p>
            </div>
          </div>
        </div>
      </GlassCard>

      {(row.village || row.district || row.filer_role === 'helper' || (row.evidence && row.evidence.length > 0)) && (
        <GlassCard hover={false}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber">Case pack</p>
          <h2 className="mt-1 text-[22px] font-semibold">Where, who, and the photo</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Meta label="Citizen" value={`${row.name} · ${row.mobile}`} />
            {row.filer_role === 'helper' && (
              <Meta label="Filed with help" value={`${row.helper_name || 'Helper'} (${row.helper_relation || 'CSC / family'})`} />
            )}
            <Meta
              label="Place"
              value={[row.street, row.village, row.ward && `Ward ${row.ward}`, row.district].filter(Boolean).join(', ') || 'Not pinned'}
            />
            {row.latitude && row.longitude ? (
              <Meta label="Pin" value={`${row.latitude}, ${row.longitude}`} />
            ) : null}
          </div>
          {row.description && (
            <p className="mt-5 whitespace-pre-wrap rounded-card bg-indigo/5 px-4 py-3 text-sm leading-relaxed">{row.description}</p>
          )}
          {row.evidence && row.evidence.length > 0 && (
            <div className="mt-5 grid grid-cols-3 gap-3">
              {row.evidence.map((item, index) =>
                item.data_url ? (
                  <img key={index} src={item.data_url} alt="" className="h-28 w-full rounded-card object-cover" />
                ) : null
              )}
            </div>
          )}
        </GlassCard>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <GlassCard hover={false}>
          <h2 className="text-[22px] font-semibold">How satisfied are you?</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate">
            1 or 2 stars opens the appeal path on this page.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-1" role="radiogroup" aria-label="Satisfaction rating">
            {[1, 2, 3, 4, 5].map((value) => {
              const filled = (hover || rating) >= value
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={rating === value}
                  aria-label={`${value} star${value === 1 ? '' : 's'}`}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl transition duration-200 ease-calm hover:bg-white/70"
                  onMouseEnter={() => setHover(value)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => saveRating(value)}
                >
                  <Star className={`h-7 w-7 ${filled ? 'fill-amber text-amber' : 'text-indigo/35'}`} />
                </button>
              )
            })}
          </div>
          <label className="label mt-6" htmlFor="rating-comment">
            Optional comment
          </label>
          <textarea
            id="rating-comment"
            className="field min-h-24"
            placeholder="What worked, and what is still missing?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          {notice && <p className="mt-3 text-sm text-indigo">{notice}</p>}

          {canAppeal && (
            <div ref={appealBox} className="mt-6 border-t border-indigo/10 pt-6">
              <p className="font-semibold text-indigo">File an appeal</p>
              <p className="mt-1 text-sm text-slate">
                {expired
                  ? 'The 30-day window has closed. Use a fresh grievance that cites this registration number.'
                  : 'Keep reasons factual. Mention what the reply did not address.'}
              </p>
              <textarea
                className="field mt-3 min-h-28"
                placeholder="The reply asked for papers I had already attached, and did not give a speaking order on the delay."
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                disabled={expired}
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  className={drafted ? 'btn-primary' : 'btn-secondary'}
                  disabled={busy || expired || !appealReason.trim()}
                  onClick={fileAppeal}
                >
                  <Scale className="h-4 w-4" />
                  File appeal
                </button>
                <button type="button" className="btn-secondary" disabled={!appealReason.trim()} onClick={copyOfficial}>
                  <Copy className="h-4 w-4" />
                  {copied ? 'Copied' : 'Copy appeal text'}
                </button>
              </div>
            </div>
          )}
        </GlassCard>

        <GlassCard hover={false}>
          <h2 className="text-[22px] font-semibold">Action timeline</h2>
          <ol className="mt-6 space-y-6">
            {row.events.map((event, index) => (
              <li key={event.id} className="relative pl-7">
                <span className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full bg-indigo ring-4 ring-indigo/15" />
                {index < row.events.length - 1 && (
                  <span className="absolute bottom-[-24px] left-[5px] top-6 w-px bg-indigo/10" />
                )}
                <h3 className="font-semibold leading-snug">{event.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate">{event.detail}</p>
                <p className="mt-1 text-xs text-slate">{formatDate(event.created_at)}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/grievance/reminder?id=${encodeURIComponent(row.registration_id)}`} className="btn-secondary">
              Reminder / clarification
            </Link>
            <Link href="/appeal/authority" className="btn-secondary">
              Nodal authority
            </Link>
          </div>
        </GlassCard>
      </div>

      <GlassCard hover={false} className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <img
          src="/avatar.png"
          alt=""
          className="h-14 w-14 shrink-0 rounded-full object-cover object-top ring-2 ring-white/70"
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Ask Sahayak about this reply</p>
          <p className="mt-1 text-sm leading-relaxed text-slate">
            I can read the speaking order with you and help you file an appeal on this portal.
          </p>
        </div>
        <button type="button" className="btn-secondary shrink-0 sm:w-auto" onClick={openVoice}>
          <MessageCircle className="h-4 w-4" />
          Ask a question
        </button>
      </GlassCard>
    </div>
  )
}
