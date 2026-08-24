'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { MapPin, Phone, ShieldCheck } from 'lucide-react'
import { api, type RaiseResult } from '@/lib/api'
import { GlassCard } from '@/components/ui/GlassCard'

type Props = {
  registrationId: string
  mode?: 'onsite' | 'remote' | 'auto'
  defaultName?: string
  defaultMobile?: string
  defaultVillage?: string
  defaultWard?: string
  onDone?: (result: RaiseResult) => void
  compact?: boolean
}

export function RaiseVerifyPanel({
  registrationId,
  mode = 'auto',
  defaultName = '',
  defaultMobile = '',
  defaultVillage = '',
  defaultWard = '',
  onDone,
  compact = false,
}: Props) {
  const [name, setName] = useState(defaultName)
  const [mobile, setMobile] = useState(defaultMobile)
  const [otp, setOtp] = useState('123456')
  const [village, setVillage] = useState(defaultVillage)
  const [ward, setWard] = useState(defaultWard)
  const [lat, setLat] = useState<number | null>(null)
  const [lon, setLon] = useState<number | null>(null)
  const [distanceHint, setDistanceHint] = useState('')
  const [photo, setPhoto] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [verified, setVerified] = useState<boolean | null>(null)
  const preferOnsite = mode === 'onsite'

  const title = useMemo(() => {
    if (mode === 'onsite') return 'I am here — confirm this is still a problem'
    if (mode === 'remote') return "This place's problem affects me"
    return 'Raise this location complaint'
  }, [mode])

  function locate() {
    setDistanceHint('Asking for location…')
    if (!navigator.geolocation) {
      setDistanceHint('No GPS on this device. Use village/ward or a photo to verify.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude)
        setLon(pos.coords.longitude)
        setDistanceHint(
          `Pin saved ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}. On-site needs ~150 m.`
        )
      },
      () => setDistanceHint('Location denied. You can still raise with village/ward + mock OTP, then verify.'),
      { enableHighAccuracy: true, timeout: 12000 }
    )
  }

  async function onPhoto(file: File | null) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const value = String(reader.result || '')
      if (value.startsWith('data:image/')) setPhoto(value)
    }
    reader.readAsDataURL(file)
  }

  async function submit(path: 'raise' | 'onsite' | 'verify') {
    setBusy(true)
    setMessage('')
    try {
      let result: RaiseResult
      if (path === 'onsite') {
        if (lat == null || lon == null) {
          setMessage('Share GPS first for on-site push.')
          setBusy(false)
          return
        }
        result = await api.onsiteVerify(registrationId, {
          name,
          mobile,
          otp,
          latitude: lat,
          longitude: lon,
          photo_data_url: photo,
        })
      } else if (path === 'verify') {
        result = await api.verifyRaise(registrationId, {
          mobile,
          otp,
          latitude: lat,
          longitude: lon,
          village,
          ward,
          photo_data_url: photo,
          prefer_onsite: preferOnsite,
        })
      } else {
        result = await api.raiseGrievance(registrationId, {
          name,
          mobile,
          otp,
          latitude: lat,
          longitude: lon,
          village,
          ward,
          photo_data_url: photo,
          source: preferOnsite ? 'onsite' : 'remote',
          prefer_onsite: preferOnsite,
        })
      }
      setVerified(Boolean(result.verified || result.already_verified))
      setMessage(result.message || result.reason || 'Done.')
      onDone?.(result)
    } catch (err) {
      setVerified(false)
      setMessage(err instanceof Error ? err.message : 'Could not raise')
    } finally {
      setBusy(false)
    }
  }

  return (
    <GlassCard hover={false} className={compact ? 'p-4' : undefined}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber">Jan Samarthan</p>
      <h2 className="mt-1 text-[22px] font-semibold leading-tight">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate">
        Anyone can raise an existing location problem. It only pushes officer priority after verification
        (mock OTP <span className="font-semibold text-indigo">123456</span>
        {preferOnsite ? ' + GPS within ~150 m' : ' + village/ward match, GPS within ~800 m, or a photo'}).
      </p>

      <div className={`mt-5 grid gap-4 ${compact ? '' : 'md:grid-cols-2'}`}>
        <div>
          <label className="label" htmlFor={`raise-name-${registrationId}`}>
            Your name
          </label>
          <input
            id={`raise-name-${registrationId}`}
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor={`raise-mobile-${registrationId}`}>
            Mobile
          </label>
          <input
            id={`raise-mobile-${registrationId}`}
            className="field"
            inputMode="numeric"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor={`raise-otp-${registrationId}`}>
            Mock OTP
          </label>
          <input
            id={`raise-otp-${registrationId}`}
            className="field"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <button type="button" className="btn-secondary w-full" onClick={locate}>
            <MapPin className="h-4 w-4" />
            Use my location
          </button>
        </div>
        {!preferOnsite && (
          <>
            <div>
              <label className="label" htmlFor={`raise-village-${registrationId}`}>
                Village / locality
              </label>
              <input
                id={`raise-village-${registrationId}`}
                className="field"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor={`raise-ward-${registrationId}`}>
                Ward
              </label>
              <input
                id={`raise-ward-${registrationId}`}
                className="field"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      {distanceHint && <p className="mt-3 text-sm text-slate">{distanceHint}</p>}

      <div className="mt-4">
        <label className="label" htmlFor={`raise-photo-${registrationId}`}>
          Photo of the spot (helps verify)
        </label>
        <input
          id={`raise-photo-${registrationId}`}
          type="file"
          accept="image/*"
          capture="environment"
          className="block w-full text-sm"
          onChange={(e) => onPhoto(e.target.files?.[0] || null)}
        />
        {photo ? <p className="mt-2 text-sm text-success">Photo attached.</p> : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {preferOnsite ? (
          <button
            type="button"
            className="btn-primary"
            disabled={busy || mobile.length < 10}
            onClick={() => submit('onsite')}
          >
            <ShieldCheck className="h-4 w-4" />
            {busy ? 'Checking…' : 'Confirm on-site & push'}
          </button>
        ) : (
          <>
            <button
              type="button"
              className="btn-primary"
              disabled={busy || mobile.length < 10}
              onClick={() => submit('raise')}
            >
              <Phone className="h-4 w-4" />
              {busy ? 'Saving…' : 'Raise this complaint'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={busy || mobile.length < 10}
              onClick={() => submit('verify')}
            >
              Complete verification
            </button>
          </>
        )}
        <Link href={`/back/${encodeURIComponent(registrationId)}`} className="btn-secondary">
          Open share / IVR page
        </Link>
      </div>

      {message && (
        <p
          className={`mt-4 rounded-card px-4 py-3 text-sm ${
            verified ? 'bg-success/12 text-success' : 'bg-indigo/5 text-indigo'
          }`}
        >
          {message}
        </p>
      )}
    </GlassCard>
  )
}
