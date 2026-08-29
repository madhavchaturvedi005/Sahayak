'use client'

import { useMemo, useState } from 'react'
import { Camera, MapPin, ShieldCheck, ThumbsUp } from 'lucide-react'
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
  const [otp] = useState('123456')
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
    if (mode === 'onsite') return 'Raise on-site'
    return 'Add your support'
  }, [mode])

  function locate() {
    setDistanceHint('Getting your location…')
    if (!navigator.geolocation) {
      setDistanceHint('GPS not available on this device. Use village/ward or a photo instead.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude)
        setLon(pos.coords.longitude)
        setDistanceHint(
          preferOnsite
            ? 'Location saved. On-site verification needs to be within ~150 m of the complaint.'
            : 'Location saved. This helps verify you are in the affected area.'
        )
      },
      () => setDistanceHint('Location access denied. You can still add support using village/ward name.'),
      { enableHighAccuracy: true, timeout: 12000 }
    )
  }

  async function onPhotoSelected(file: File | null) {
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
          setMessage('Please share your GPS location first for on-site verification.')
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
      setMessage(err instanceof Error ? err.message : 'Could not submit. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <GlassCard hover={false} className={compact ? 'p-4' : undefined}>
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-indigo/10 text-indigo">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber">Jan Samarthan</p>
          <h2 className="mt-0.5 text-[22px] font-semibold leading-tight">{title}</h2>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-slate">
        {preferOnsite
          ? 'Raise on-site by sharing your GPS location within ~150 m of the complaint. On-site pushes count toward priority thresholds.'
          : 'Add your voice to this complaint. Providing your location or a photo lets us verify your raise and count it toward priority.'}
      </p>

      <div className={`mt-5 grid gap-4 ${compact ? '' : 'sm:grid-cols-2'}`}>
        <div>
          <label className="label" htmlFor={`raise-name-${registrationId}`}>
            Your name
          </label>
          <input
            id={`raise-name-${registrationId}`}
            className="field"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor={`raise-mobile-${registrationId}`}>
            Mobile number
          </label>
          <input
            id={`raise-mobile-${registrationId}`}
            className="field"
            inputMode="numeric"
            placeholder="10-digit mobile"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
          />
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
                placeholder="e.g. Nashik, Shivaji Nagar"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor={`raise-ward-${registrationId}`}>
                Ward / area (optional)
              </label>
              <input
                id={`raise-ward-${registrationId}`}
                className="field"
                placeholder="Ward number or name"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
              />
            </div>
          </>
        )}

        <div className="flex items-end">
          <button type="button" className="btn-secondary w-full" onClick={locate}>
            <MapPin className="h-4 w-4" />
            {lat != null ? 'Location saved ✓' : 'Use my GPS location'}
          </button>
        </div>

        <div className="flex items-end">
          <label className="w-full">
            <span className="label block">
              <Camera className="mr-1 inline h-3.5 w-3.5" />
              Photo of the spot (optional)
            </span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="block w-full rounded-card border border-indigo/20 bg-white/50 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-indigo/10 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-indigo"
              onChange={(e) => onPhotoSelected(e.target.files?.[0] || null)}
            />
            {photo && <p className="mt-1.5 text-xs font-medium text-success">Photo attached ✓</p>}
          </label>
        </div>
      </div>

      {distanceHint && (
        <p className="mt-3 rounded-card bg-indigo/5 px-3 py-2 text-sm text-slate">{distanceHint}</p>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        {preferOnsite ? (
          <button
            type="button"
            className="btn-primary"
            disabled={busy || mobile.length < 10}
            onClick={() => submit('onsite')}
          >
            <ShieldCheck className="h-4 w-4" />
            {busy ? 'Submitting…' : 'Raise on-site'}
          </button>
        ) : (
          <>
            <button
              type="button"
              className="btn-primary"
              disabled={busy || mobile.length < 10}
              onClick={() => submit('raise')}
            >
              <ThumbsUp className="h-4 w-4" />
              {busy ? 'Submitting…' : 'Add my support'}
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
