'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, MapPin, RefreshCw, Search, ShieldCheck, Users } from 'lucide-react'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { GlassCard } from '@/components/ui/GlassCard'
import { api, type NearbyGrievance } from '@/lib/api'
import { useLanguage } from '@/context/LanguageContext'

function placeLine(row: NearbyGrievance) {
  return [row.street, row.village, row.ward, row.district].filter(Boolean).join(', ')
}

function NearbyInner() {
  const { lang } = useLanguage()
  const hi = lang === 'hi'
  const [lat, setLat] = useState<number | null>(null)
  const [lon, setLon] = useState<number | null>(null)
  const [village, setVillage] = useState('')
  const [ward, setWard] = useState('')
  const [rows, setRows] = useState<NearbyGrievance[]>([])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'open' | 'near'>('open')

  async function load(opts?: { lat?: number | null; lon?: number | null; village?: string; ward?: string }) {
    const useLat = opts?.lat ?? lat
    const useLon = opts?.lon ?? lon
    const useVillage = opts?.village ?? village
    const useWard = opts?.ward ?? ward
    setBusy(true)
    setError('')
    try {
      const list = await api.nearby({
        lat: useLat,
        lon: useLon,
        village: useVillage,
        ward: useWard,
      })
      setRows(list)
      setMode(useLat != null && useLon != null ? 'near' : 'open')
      if (!list.length) {
        setError(
          hi
            ? 'कोई खुली जगह-आधारित शिकायत नहीं मिली। गाँव लिखें, या नई शिकायत दर्ज करें।'
            : 'No open location complaints found. Try a village name, or lodge a new one.'
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load nearby grievances')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    load({ lat: null, lon: null })
    // first paint — open location list, no GPS required
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function locate() {
    setError('')
    if (!navigator.geolocation) {
      setError(hi ? 'इस डिवाइस पर GPS नहीं है। गाँव से खोजें।' : 'No GPS on this device. Search by village instead.')
      return
    }
    setBusy(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude)
        setLon(pos.coords.longitude)
        load({ lat: pos.coords.latitude, lon: pos.coords.longitude })
      },
      () => {
        setBusy(false)
        setError(hi ? 'स्थान अनुमति नहीं मिली। गाँव से खोजें।' : 'Location permission denied. Search by village instead.')
      },
      { enableHighAccuracy: true, timeout: 14000 }
    )
  }

  function raiseHref(row: NearbyGrievance) {
    const onSite = row.distance_m != null && row.distance_m <= 150
    const query = new URLSearchParams({
      id: row.registration_id,
      mode: onSite ? 'onsite' : 'remote',
    })
    return `/nearby/raise?${query.toString()}`
  }

  const steps = hi
    ? [
        { n: '1', title: 'खोजें', body: 'स्थान या गाँव से खुली शिकायतें देखें।' },
        { n: '2', title: 'बढ़ाएँ', body: 'जो पहले दर्ज है, उसी को समर्थन दें।' },
        { n: '3', title: 'सत्यापित करें', body: 'OTP / जगह के बाद ही प्राथमिकता बढ़े।' },
      ]
    : [
        { n: '1', title: 'Find', body: 'See open complaints by location or village.' },
        { n: '2', title: 'Raise', body: 'Add your weight to one already filed.' },
        { n: '3', title: 'Verify', body: 'Priority rises only after OTP / place check.' },
      ]

  return (
    <div className="page-wrap space-y-8 pb-16">
      <section className="relative overflow-hidden rounded-panel bg-gradient-to-br from-indigo-soft via-indigo to-indigo-deep px-6 py-8 text-white shadow-glass-lg md:px-10 md:py-10">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-amber/20 blur-3xl" />
        <p className="relative text-xs font-semibold uppercase tracking-[0.16em] text-amber-glow">
          Jan Samarthan
        </p>
        <h1 className="relative mt-2 max-w-2xl text-[28px] font-bold leading-tight text-white md:text-[32px]">
          {hi ? 'इलाके की शिकायत बढ़ाएँ' : 'Raise a problem in your area'}
        </h1>
        <p className="relative mt-3 max-w-2xl text-sm leading-relaxed text-white/85 md:text-base">
          {hi
            ? 'सड़क, नाली या पानी जैसी साझा समस्या पहले दर्ज हो चुकी हो तो नई शिकायत न खोलें — उसी को बढ़ाएँ। सत्यापन के बाद ही अधिकारी की प्राथमिकता बढ़ती है।'
            : 'If a shared problem — a broken road, drain, or water line — is already filed, raise that one. Officer priority moves only after your raise is verified.'}
        </p>
        <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.n} className="rounded-card bg-white/10 px-4 py-3 ring-1 ring-white/15">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-glow">
                {hi ? 'चरण' : 'Step'} {step.n}
              </p>
              <p className="mt-1 font-semibold">{step.title}</p>
              <p className="mt-1 text-sm text-white/75">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <GlassCard hover={false} className="py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber">
              {hi ? 'खोज' : 'Find complaints'}
            </p>
            <h2 className="mt-1 text-[22px] font-semibold">
              {hi ? 'स्थान या गाँव से देखें' : 'Search by location or village'}
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/70 px-3 py-1.5 text-xs font-medium text-indigo">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            {hi ? 'सत्यापन-पहले' : 'Verify-before-push'}
          </span>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <div>
            <label className="label" htmlFor="nearby-village">
              {hi ? 'गाँव / मोहल्ला' : 'Village / locality'}
            </label>
            <input
              id="nearby-village"
              className="field"
              placeholder={hi ? 'जैसे रामपुर' : 'e.g. Rampur'}
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') load({ lat: null, lon: null })
              }}
            />
          </div>
          <div>
            <label className="label" htmlFor="nearby-ward">
              {hi ? 'वार्ड' : 'Ward'}
            </label>
            <input
              id="nearby-ward"
              className="field"
              placeholder={hi ? 'वैकल्पिक' : 'Optional'}
              value={ward}
              onChange={(e) => setWard(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') load({ lat: null, lon: null })
              }}
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              className="btn-secondary w-full md:w-auto"
              disabled={busy}
              onClick={() => {
                setLat(null)
                setLon(null)
                load({ lat: null, lon: null })
              }}
            >
              <Search className="h-4 w-4" />
              {hi ? 'गाँव से खोजें' : 'Search village'}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" className="btn-primary" onClick={locate} disabled={busy}>
            <MapPin className="h-4 w-4" />
            {busy ? (hi ? 'खोज रहे हैं…' : 'Searching…') : hi ? 'मेरा स्थान इस्तेमाल करें' : 'Use my location'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => load()} disabled={busy}>
            <RefreshCw className="h-4 w-4" />
            {hi ? 'ताज़ा करें' : 'Refresh'}
          </button>
          <Link href="/grievance/lodge?helper=1" className="btn-secondary">
            {hi ? 'नई शिकायत दर्ज करें' : 'Lodge a new one'}
          </Link>
        </div>

        {lat != null && lon != null && (
          <p className="mt-4 text-sm text-indigo">
            {hi ? 'पिन सहेजा' : 'Pin saved'} · {lat.toFixed(5)}, {lon.toFixed(5)}
          </p>
        )}
        {error && <p className="mt-4 text-sm text-attention">{error}</p>}
      </GlassCard>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber">
              {mode === 'near' ? (hi ? 'आपके पास' : 'Near you') : hi ? 'खुली शिकायतें' : 'Open in the area'}
            </p>
            <h2 className="mt-1 text-[22px] font-semibold">
              {busy
                ? hi
                  ? 'शिकायतें लोड हो रही हैं…'
                  : 'Loading complaints…'
                : hi
                  ? `${rows.length} शिकायतें बढ़ाई जा सकती हैं`
                  : `${rows.length} complaint${rows.length === 1 ? '' : 's'} you can raise`}
            </h2>
          </div>
        </div>

        {busy && rows.length === 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 animate-shimmer rounded-panel bg-[linear-gradient(90deg,#e8ebf2,#f7f8fa,#e8ebf2)] bg-[length:200%_100%]"
              />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <GlassCard hover={false} className="text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-indigo/10 text-indigo">
              <MapPin className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-xl font-semibold">
              {hi ? 'अभी कोई खुली जगह-शिकायत नहीं' : 'No open location complaints yet'}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate">
              {hi
                ? 'गाँव का नाम लिखकर खोजें, या किसी की मदद करते हुए नई शिकायत दर्ज करें।'
                : 'Search by village, or lodge a new complaint — including for someone who cannot type.'}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link href="/grievance/lodge" className="btn-primary">
                {hi ? 'नई शिकायत' : 'Lodge a grievance'}
              </Link>
              <Link href="/grievance/lodge?helper=1" className="btn-secondary">
                {hi ? 'किसी की मदद करें' : 'Help someone file'}
              </Link>
            </div>
          </GlassCard>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {rows.map((row) => {
              const onSite = row.distance_m != null && row.distance_m <= 150
              const place = placeLine(row)
              return (
                <article
                  key={row.registration_id}
                  className="group flex flex-col rounded-panel border border-white/60 bg-white/70 p-5 shadow-glass transition duration-300 ease-calm hover:-translate-y-0.5 hover:border-indigo/20 hover:bg-white/90 md:p-6"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/status/${row.registration_id}`}
                      className="text-sm font-semibold text-indigo hover:underline"
                    >
                      {row.registration_id}
                    </Link>
                    <span className="rounded-full bg-indigo/8 px-2.5 py-0.5 text-[11px] font-semibold text-indigo">
                      {row.status}
                    </span>
                    {row.distance_m != null && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          onSite ? 'bg-success/12 text-success' : 'bg-indigo/8 text-indigo'
                        }`}
                      >
                        <MapPin className="h-3 w-3" />
                        {row.distance_m} m
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold leading-snug text-indigo">{row.subject}</h3>
                  <p className="mt-2 flex items-start gap-1.5 text-sm text-slate">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-indigo/60" />
                    {place || (hi ? 'जगह पिन नहीं है' : 'Place not pinned')}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo/8 px-2.5 py-1 text-xs font-semibold text-indigo">
                      <Users className="h-3 w-3" />
                      {hi ? 'समर्थन' : 'Backed'} {row.backer_count}
                    </span>
                    <span className="rounded-full bg-success/12 px-2.5 py-1 text-xs font-semibold text-success">
                      {hi ? 'ऑन-साइट' : 'On-site'} {row.push_count}
                    </span>
                    {row.pending_raise_count ? (
                      <span className="rounded-full bg-amber/15 px-2.5 py-1 text-xs font-semibold text-amber">
                        {hi ? 'लंबित' : 'Pending'} {row.pending_raise_count}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-auto pt-5">
                    <Link href={raiseHref(row)} className="btn-primary w-full">
                      {hi ? 'बढ़ाएँ' : 'Raise'}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

export default function NearbyPage() {
  return (
    <Suspense
      fallback={<div className="page-wrap h-40 animate-shimmer rounded-panel bg-[linear-gradient(90deg,#e8ebf2,#f7f8fa,#e8ebf2)] bg-[length:200%_100%]" />}
    >
      <RequireAuth>
        <NearbyInner />
      </RequireAuth>
    </Suspense>
  )
}
