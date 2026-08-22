'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GlassCard } from '@/components/ui/GlassCard'
import { FAQS } from '@/lib/content'
import { api } from '@/lib/api'

export default function HelpPage() {
  const [complaint, setComplaint] = useState('')
  const [reply, setReply] = useState('')
  const [result, setResult] = useState<{
    addressed: boolean
    reason: string
    appeal_draft: string
    missing?: string[]
  } | null>(null)
  const [error, setError] = useState('')

  return (
    <div className="page-wrap space-y-8 pb-16">
      <div className="text-center">
        <h1 className="text-[32px] font-bold md:text-5xl">How can we help you today?</h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate">
          Search the same destinations as the live CPGRAMS site — lodging, tracking, appeals, fees, and exclusions.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <GlassCard>
          <h2 className="text-xl font-semibold">Registration & Login</h2>
          <p className="mt-2 text-sm text-slate">Create an account or use the mocked mobile OTP flow.</p>
          <Link href="/auth/signin" className="mt-4 inline-flex text-sm font-semibold">
            Open sign in
          </Link>
        </GlassCard>
        <GlassCard className="md:col-span-2">
          <h2 className="text-xl font-semibold">Lodging a grievance</h2>
          <p className="mt-2 text-sm text-slate">Pick a department, describe the problem, review the summary, then hand off to pgportal.gov.in.</p>
          <div className="mt-4 flex gap-3">
            <Link href="/grievance/lodge" className="btn-secondary">Public</Link>
            <Link href="/grievance/lodge-pension" className="btn-secondary">Pension</Link>
          </div>
        </GlassCard>
        <GlassCard>
          <h2 className="text-xl font-semibold">Tracking & status</h2>
          <p className="mt-2 text-sm text-slate">Registration numbers, Under Process, reminders, and ratings.</p>
          <Link href="/status" className="mt-4 inline-flex text-sm font-semibold">
            View status
          </Link>
        </GlassCard>
        <GlassCard>
          <h2 className="text-xl font-semibold">Redressal time</h2>
          <p className="mt-2 text-sm text-slate">Typical disposal days and pendency, shown before you confirm.</p>
        </GlassCard>
        <GlassCard>
          <h2 className="text-xl font-semibold">Appeal process</h2>
          <p className="mt-2 text-sm text-slate">Escalate to DPG if the reply does not resolve the complaint.</p>
          <Link href="/appeal/authority" className="mt-4 inline-flex text-sm font-semibold">
            Nodal authority
          </Link>
        </GlassCard>
      </div>

      <GlassCard>
        <h2 className="mb-4 text-[22px] font-semibold">FAQs</h2>
        <dl className="space-y-5">
          {FAQS.map((item) => (
            <div key={item.q}>
              <dt className="font-semibold">{item.q}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-slate">{item.a}</dd>
            </div>
          ))}
        </dl>
      </GlassCard>

      <GlassCard>
        <h2 id="resolution" className="text-[22px] font-semibold">
          Resolution check
        </h2>
        <p className="mt-2 text-sm text-slate">
          Closed files now run this check automatically on the status page. You can also paste a complaint and reply
          here. This is a heuristic, not a legal judgment.
        </p>
        {error && <p className="mt-3 text-sm text-attention">{error}</p>}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="label" htmlFor="complaint">Original complaint</label>
            <textarea id="complaint" className="field min-h-40" value={complaint} onChange={(e) => setComplaint(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="reply">Department reply</label>
            <textarea id="reply" className="field min-h-40" value={reply} onChange={(e) => setReply(e.target.value)} />
          </div>
        </div>
        <button
          type="button"
          className="btn-primary mt-4"
          onClick={async () => {
            setError('')
            try {
              setResult(await api.resolutionCheck(complaint, reply))
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Check failed')
            }
          }}
        >
          Check reply
        </button>
        {result && (
          <div className="mt-6 rounded-card bg-white/70 p-4">
            <p className="font-semibold">{result.addressed ? 'Looks like a real response' : 'This may be a brush-off'}</p>
            <p className="mt-2 text-sm text-slate">{result.reason}</p>
            {result.missing && result.missing.length > 0 && !result.addressed && (
              <ul className="mt-3 space-y-1 text-sm text-slate">
                {result.missing.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {result.appeal_draft && (
              <>
                <pre className="mt-4 whitespace-pre-wrap text-sm">{result.appeal_draft}</pre>
                <button type="button" className="btn-secondary mt-3" onClick={() => navigator.clipboard.writeText(result.appeal_draft)}>
                  Copy appeal draft
                </button>
              </>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
