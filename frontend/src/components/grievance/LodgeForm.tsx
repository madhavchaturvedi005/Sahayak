'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { api, type ClassifyResult, type Grievance } from '@/lib/api'
import { CATEGORIES, MINISTRIES } from '@/lib/content'
import { useAuth } from '@/context/AuthContext'
import { GlassCard } from '@/components/ui/GlassCard'

export function LodgeForm({ kind }: { kind: 'public' | 'pension' }) {
  const { user } = useAuth()
  const params = useSearchParams()
  const presetMinistry = params.get('ministry') || ''
  const presetCategory = params.get('category') || ''
  const [step, setStep] = useState(kind === 'public' && presetMinistry ? 2 : 1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [routing, setRouting] = useState<ClassifyResult | null>(null)
  const [result, setResult] = useState<Grievance | null>(null)
  const [form, setForm] = useState({
    name: user?.name || '',
    mobile: user?.mobile || '',
    ministry:
      kind === 'pension'
        ? "Department of Pension & Pensioners' Welfare"
        : presetMinistry,
    category: kind === 'pension' ? 'Pension / retirement benefits' : presetCategory,
    subject: '',
    description: '',
  })

  const progress = useMemo(() => (step / 4) * 100, [step])

  useEffect(() => {
    if (kind !== 'public') return
    const ministry = params.get('ministry') || ''
    const category = params.get('category') || ''
    if (!ministry && !category) return
    setForm((current) => ({
      ...current,
      ministry: ministry || current.ministry,
      category: category || current.category,
    }))
    setStep((current) => (current === 1 && ministry ? 2 : current))
  }, [kind, params])

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function suggest() {
    setBusy(true)
    setError('')
    try {
      const res = await api.classify(`${form.subject} ${form.description}`)
      setRouting(res)
      if (!form.ministry) update('ministry', res.ministry)
      if (!form.category) update('category', res.category)
      setStep(3)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not classify')
    } finally {
      setBusy(false)
    }
  }

  async function submit() {
    setBusy(true)
    setError('')
    try {
      const created = await api.createGrievance({ kind, ...form })
      setResult(created)
      setStep(4)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save grievance')
    } finally {
      setBusy(false)
    }
  }

  const summary = result
    ? [
        `Registration: ${result.registration_id}`,
        `Name: ${result.name}`,
        `Mobile: ${result.mobile}`,
        `Department: ${result.ministry}`,
        `Category: ${result.category}`,
        `Subject: ${result.subject}`,
        '',
        result.description,
      ].join('\n')
    : ''

  return (
    <div className="w-full space-y-6 pb-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber">
          {kind === 'public' ? 'Public grievance' : 'Pension grievance'}
        </p>
        <h1 className="mt-2 text-[32px] font-bold">
          {kind === 'public' ? 'Lodge Public Grievance' : 'Lodge Pension Grievance'}
        </h1>
        <p className="mt-2 text-slate">
          One question group at a time. Confirm inside Sahayak, then file yourself on the official portal.
        </p>
      </div>

      <div className="h-1 overflow-hidden rounded-full bg-indigo/10">
        <div className="h-full bg-indigo transition-all duration-300 ease-calm" style={{ width: `${progress}%` }} />
      </div>

      {error && <p className="text-sm text-attention">{error}</p>}

      {step === 1 && (
        <GlassCard>
          <h2 className="mb-6 text-[22px] font-semibold">1. Who is filing</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label" htmlFor="name">
                Full name
              </label>
              <input id="name" className="field" value={form.name} onChange={(e) => update('name', e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="mobile">
                Mobile number
              </label>
              <input
                id="mobile"
                className="field"
                inputMode="numeric"
                value={form.mobile}
                onChange={(e) => update('mobile', e.target.value)}
              />
            </div>
          </div>
          <button
            type="button"
            className="btn-primary mt-6"
            disabled={form.name.length < 2 || form.mobile.length < 10}
            onClick={() => setStep(2)}
          >
            Continue
          </button>
        </GlassCard>
      )}

      {step === 2 && (
        <GlassCard>
          <h2 className="mb-6 text-[22px] font-semibold">2. Describe the problem</h2>
          <label className="label" htmlFor="subject">
            Subject
          </label>
          <input id="subject" className="field mb-4" value={form.subject} onChange={(e) => update('subject', e.target.value)} />
          <label className="label" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            className="field min-h-40"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
          />
          <div className="mt-6 flex gap-3">
            <button type="button" className="btn-secondary" onClick={() => setStep(1)}>
              Back
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={form.subject.length < 8 || form.description.length < 20 || busy}
              onClick={suggest}
            >
              {busy ? 'Reading…' : 'Suggest department'}
            </button>
          </div>
        </GlassCard>
      )}

      {step === 3 && (
        <GlassCard>
          <h2 className="mb-6 text-[22px] font-semibold">3. Department and expectations</h2>
          {routing && (
            <div className="mb-6 rounded-card bg-indigo/5 p-4 text-sm leading-relaxed">
              <p className="font-semibold text-indigo">Suggested because</p>
              <p className="mt-1 text-ink">{routing.reason}</p>
              <p className="mt-3 text-slate">
                Similar grievances in this department typically take about <strong>{routing.expected_days} days</strong>.
                Currently <strong>{routing.pendency_pct}%</strong> are pending beyond 21 days. You can override the
                suggestion.
              </p>
            </div>
          )}
          <label className="label" htmlFor="ministry">
            Ministry / Department
          </label>
          <select id="ministry" className="field mb-4" value={form.ministry} onChange={(e) => update('ministry', e.target.value)}>
            <option value="">Select ministry</option>
            {MINISTRIES.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <label className="label" htmlFor="category">
            Category
          </label>
          <select id="category" className="field" value={form.category} onChange={(e) => update('category', e.target.value)}>
            <option value="">Select category</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <div className="mt-6 flex gap-3">
            <button type="button" className="btn-secondary" onClick={() => setStep(2)}>
              Back
            </button>
            <button type="button" className="btn-primary" disabled={!form.ministry || !form.category || busy} onClick={submit}>
              Confirm
            </button>
          </div>
        </GlassCard>
      )}

      {step === 4 && result && (
        <GlassCard>
          <h2 className="mb-2 text-[22px] font-semibold">Your grievance is ready</h2>
          <p className="mb-6 text-sm text-slate">
            Registration <span className="font-semibold text-indigo">{result.registration_id}</span>. Copy the summary,
            then open the official CPGRAMS portal and paste it in yourself.
          </p>
          <pre className="mb-6 whitespace-pre-wrap rounded-card bg-white/70 p-4 text-sm leading-relaxed">{summary}</pre>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigator.clipboard.writeText(summary)}
            >
              Copy all
            </button>
            <a
              href="https://pgportal.gov.in"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
            >
              Open CPGRAMS
            </a>
            <Link href={`/status/${encodeURIComponent(result.registration_id)}`} className="btn-secondary">
              View status
            </Link>
          </div>
        </GlassCard>
      )}
    </div>
  )
}
