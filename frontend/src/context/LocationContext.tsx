'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from '@/lib/api'

type LocationState = {
  lat: number | null
  lon: number | null
  label: string
  village: string
  district: string
  hasLocation: boolean
  requesting: boolean
  denied: boolean
  request: () => void
}

const LocationContext = createContext<LocationState>({
  lat: null,
  lon: null,
  label: '',
  village: '',
  district: '',
  hasLocation: false,
  requesting: false,
  denied: false,
  request: () => {},
})

const STORAGE_KEY = 'sahayak_location'
const TTL_MS = 4 * 60 * 60 * 1000 // refresh after 4 hours

type Stored = {
  lat: number
  lon: number
  village: string
  district: string
  label: string
  savedAt: number
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [lat, setLat] = useState<number | null>(null)
  const [lon, setLon] = useState<number | null>(null)
  const [label, setLabel] = useState('')
  const [village, setVillage] = useState('')
  const [district, setDistrict] = useState('')
  const [requesting, setRequesting] = useState(false)
  const [denied, setDenied] = useState(false)

  const applyCoords = useCallback(async (latitude: number, longitude: number) => {
    setLat(latitude)
    setLon(longitude)
    try {
      const place = await api.reversePlace(latitude, longitude)
      const lbl = place.village || place.district || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`
      setVillage(place.village)
      setDistrict(place.district)
      setLabel(lbl)
      const stored: Stored = {
        lat: latitude,
        lon: longitude,
        village: place.village,
        district: place.district,
        label: lbl,
        savedAt: Date.now(),
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
      } catch {
        /* private browsing may block writes */
      }
    } catch {
      setLabel(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`)
    }
  }, [])

  const request = useCallback(() => {
    if (!navigator.geolocation) return
    setRequesting(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await applyCoords(pos.coords.latitude, pos.coords.longitude)
        setRequesting(false)
        setDenied(false)
      },
      () => {
        setRequesting(false)
        setDenied(true)
      },
      { enableHighAccuracy: false, timeout: 12000 }
    )
  }, [applyCoords])

  useEffect(() => {
    // Restore from localStorage if recent enough
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const stored = JSON.parse(raw) as Stored
        if (Date.now() - stored.savedAt < TTL_MS) {
          setLat(stored.lat)
          setLon(stored.lon)
          setVillage(stored.village)
          setDistrict(stored.district)
          setLabel(stored.label)
          return
        }
      }
    } catch {
      /* ignore */
    }
    // No fresh cached location — silently ask if already granted, or prompt once
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      if (navigator.permissions) {
        navigator.permissions
          .query({ name: 'geolocation' })
          .then((perm) => {
            if (perm.state === 'granted' || perm.state === 'prompt') {
              request()
            } else {
              setDenied(true)
            }
          })
          .catch(() => request())
      } else {
        request()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <LocationContext.Provider
      value={{
        lat,
        lon,
        label,
        village,
        district,
        hasLocation: lat !== null && lon !== null,
        requesting,
        denied,
        request,
      }}
    >
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  return useContext(LocationContext)
}
