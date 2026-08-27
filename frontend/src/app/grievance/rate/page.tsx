'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { GlassCard } from '@/components/ui/GlassCard'
import { api } from '@/lib/api'

function RateForm() {
  const params = useSearchParams()
  const [id, setId] = useState(params.get('id') || '')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [done, setDone] = useState('')
  const [error, setError] = useState('')

  return (
    <div className="space-y-6">
      <GlassCard>
        <h1 className="text-[32px] font-bold">Rate Grievance</h1>
        <p className="mt-2 text-sm text-slate">Rate the redressal you received. Amber is reserved for the single confirm action.</p>
        {error && <p className="mt-3 text-sm text-attention">{error}</p>}
        {done && <p className="mt-3 text-sm text-success">{done}</p>}
        <form
          className="mt-6 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault()
            setError('')
            try {
              const row = await api.rate(id, rating, comment)
              setDone(`Saved a ${row.rating}/5 rating for ${row.registration_id}.`)
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed')
            }
          }}
        >
          <div>
            <label className="label" htmlFor="id">Registration number</label>
            <input id="id" className="field" value={id} onChange={(e) => setId(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="rating">Rating (1–5)</label>
            <input
              id="rating"
              type="number"
              min={1}
              max={5}
              className="field"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label" htmlFor="comment">Comment</label>
            <textarea id="comment" className="field min-h-28" value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>
          <button className="btn-primary">Submit rating</button>
        </form>
      </GlassCard>
    </div>
  )
}

export default function RatePage() {
  return (
    <Suspense>
      <RateForm />
    </Suspense>
  )
}
