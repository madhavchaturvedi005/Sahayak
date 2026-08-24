'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MapPin, RefreshCw } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { RaiseVerifyPanel } from '@/components/grievance/RaiseVerifyPanel'
import { api, type NearbyGrievance } from '@/lib/api'
import { useLanguage } from '@/context/LanguageContext'

export default function NearbyPage() {
  const { lang } = useLanguage()
  const hi = lang === 'hi'
  const [lat, setLat] = useState<number | null>(null)
  const [lon, setLon] = useState<number | null>(null)
  const [village, setVillage] = useState('')
  const [ward, setWard] = useState('')
  const [rows, setRows] = useState<NearbyGrievance[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<NearbyGrievance | null>(null)

  async function load(nextLat?: number, nextLon?: number) {
    const useLat = nextLat ?? lat
    const useLon = nextLon ?? lon
    if (useLat == null || useLon == null) {
      setError(hi ? 'पहले स्थान साझा करें।' : 'Share your location first.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const list = await api.nearby({
        lat: useLat,
        lon: useLon,
        village,
        ward,
      })
      setRows(list)
      if (!list.length) setError(hi ? 'पास कोई खुली शिकायत नहीं मिली।' : 'No open grievances found nearby.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load nearby grievances')
    } finally {
      setBusy(false)
    }
  }

  function locate() {
    setError('')
    if (!navigator.geolocation) {
      setError(hi ? 'इस डिवाइस पर GPS नहीं है।' : 'No GPS on this device.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude)
        setLon(pos.coords.longitude)
        load(pos.coords.latitude, pos.coords.longitude)
      },
      () => setError(hi ? 'स्थान अनुमति नहीं मिली।' : 'Location permission denied.'),
      { enableHighAccuracy: true, timeout: 14000 }
    )
  }

  useEffect(() => {
    // optional auto-locate
  }, [])

  return (
    <div className="page-wrap mx-auto max-w-[1000px] space-y-6 pb-16">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber">Jan Samarthan</p>
        <h1 className="mt-2 text-[32px] font-bold leading-tight">
          {hi ? 'पास की शिकायतें बढ़ाएँ' : 'Raise a problem near me'}
        </h1>
        <p className="mt-2 text-base leading-relaxed text-slate">
          {hi
            ? 'अगर कोई शिकायत पहले दर्ज है, उसे जोड़ें। प्राथमिकता तभी बढ़ेगी जब सत्यापन पूरा हो।'
            : 'If someone already logged this location issue, join it. Priority only rises after verification.'}
        </p>
      </div>

      <GlassCard hover={false}>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn-primary" onClick={locate} disabled={busy}>
            <MapPin className="h-4 w-4" />
            {busy ? (hi ? 'खोज रहे हैं…' : 'Searching…') : hi ? 'मेरा स्थान इस्तेमाल करें' : 'Use my location'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => load()} disabled={busy || lat == null}>
            <RefreshCw className="h-4 w-4" />
            {hi ? 'फिर खोजें' : 'Refresh'}
          </button>
          <Link href="/grievance/lodge?helper=1" className="btn-secondary">
            {hi ? 'नई शिकायत दर्ज करें' : 'Lodge a new one instead'}
          </Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="nearby-village">
              {hi ? 'गाँव / मोहल्ला' : 'Village (optional filter)'}
            </label>
            <input id="nearby-village" className="field" value={village} onChange={(e) => setVillage(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="nearby-ward">
              {hi ? 'वार्ड' : 'Ward (optional)'}
            </label>
            <input id="nearby-ward" className="field" value={ward} onChange={(e) => setWard(e.target.value)} />
          </div>
        </div>
        {lat != null && lon != null && (
          <p className="mt-3 text-sm text-indigo">
            {hi ? 'पिन' : 'Pin'}: {lat.toFixed(5)}, {lon.toFixed(5)}
          </p>
        )}
        {error && <p className="mt-3 text-sm text-attention">{error}</p>}
      </GlassCard>

      <div className="space-y-3">
        {rows.map((row) => (
          <GlassCard key={row.registration_id} hover={false} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={`/status/${encodeURIComponent(row.registration_id)}`}
                  className="font-semibold text-indigo"
                >
                  {row.registration_id}
                </Link>
                <p className="mt-1 text-sm font-medium">{row.subject}</p>
                <p className="mt-1 text-sm text-slate">
                  {[row.street, row.village, row.ward, row.district].filter(Boolean).join(', ') || '—'}
                  {row.distance_m != null ? ` · ${row.distance_m} m` : ''}
                </p>
                <p className="mt-2 text-xs text-slate">
                  {hi ? 'समर्थन' : 'Backed'} {row.backer_count} · {hi ? 'ऑन-साइट' : 'On-site'} {row.push_count}
                  {row.pending_raise_count ? ` · ${hi ? 'लंबित' : 'Pending'} ${row.pending_raise_count}` : ''}
                </p>
              </div>
              <button type="button" className="btn-primary" onClick={() => setSelected(row)}>
                {row.distance_m != null && row.distance_m <= 150
                  ? hi
                    ? 'यहाँ हूँ — पुष्टि करें'
                    : 'I am here — confirm'
                  : hi
                    ? 'यह मुझे प्रभावित करता है'
                    : 'This affects me'}
              </button>
            </div>
          </GlassCard>
        ))}
      </div>

      {selected && (
        <RaiseVerifyPanel
          registrationId={selected.registration_id}
          mode={selected.distance_m != null && selected.distance_m <= 150 ? 'onsite' : 'remote'}
          defaultVillage={selected.village || village}
          defaultWard={selected.ward || ward}
          onDone={() => load()}
        />
      )}
    </div>
  )
}
