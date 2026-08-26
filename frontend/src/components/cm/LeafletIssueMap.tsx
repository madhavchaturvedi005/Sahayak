'use client'

import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { firstPhoto, isRapid, MH_BOUNDS, trendScore } from '@/lib/cm'
import type { Grievance } from '@/lib/api'

const CENTER: [number, number] = [19.15, 76.35]
const MAX_BOUNDS = L.latLngBounds(
  [MH_BOUNDS.minLat - 0.35, MH_BOUNDS.minLng - 0.35],
  [MH_BOUNDS.maxLat + 0.35, MH_BOUNDS.maxLng + 0.35]
)

function pinIcon(kind: 'rapid' | 'overdue' | 'normal' | 'selected') {
  const fill = kind === 'overdue' ? '#C0392B' : kind === 'rapid' ? '#E8A33D' : kind === 'selected' ? '#1B2A4A' : '#2A3D68'
  const size = kind === 'selected' ? 22 : 16
  return L.divIcon({
    className: 'cm-pin',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:999px;background:${fill};border:2px solid #fff;box-shadow:0 2px 10px rgba(27,42,74,.35)"></span>`,
  })
}

function MapEffects({ issue }: { issue: Grievance | null }) {
  const map = useMap()
  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 80)
    return () => window.clearTimeout(timer)
  }, [map])
  useEffect(() => {
    if (issue?.latitude == null || issue?.longitude == null) return
    map.flyTo([issue.latitude, issue.longitude], Math.max(map.getZoom(), 10), { duration: 0.55 })
  }, [issue, map])
  return null
}

export default function LeafletIssueMap({
  issues,
  selectedId,
  onSelect,
}: {
  issues: Grievance[]
  selectedId?: string | null
  onSelect: (issue: Grievance) => void
}) {
  const selected = useMemo(() => issues.find((row) => row.id === selectedId) || null, [issues, selectedId])

  return (
    <MapContainer
      center={CENTER}
      zoom={7}
      minZoom={6}
      maxZoom={16}
      maxBounds={MAX_BOUNDS}
      maxBoundsViscosity={0.85}
      scrollWheelZoom
      className="cm-leaflet h-full min-h-[520px] w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <MapEffects issue={selected} />
      {issues.map((issue) => {
        if (issue.latitude == null || issue.longitude == null) return null
        const selectedPin = issue.id === selectedId
        const kind = selectedPin ? 'selected' : issue.sla_overdue ? 'overdue' : isRapid(issue) || trendScore(issue) >= 12 ? 'rapid' : 'normal'
        const photo = firstPhoto(issue)
        const place = [issue.village, issue.district].filter(Boolean).join(', ')
        return (
          <Marker
            key={issue.id}
            position={[issue.latitude, issue.longitude]}
            icon={pinIcon(kind)}
            zIndexOffset={selectedPin ? 80 : isRapid(issue) ? 40 : 0}
            eventHandlers={{ click: () => onSelect(issue) }}
          >
            <Tooltip direction="top" offset={[0, -10]} className="cm-map-tip" opacity={1}>
              <div className="w-[240px]">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt="" className="h-28 w-full object-cover" />
                ) : null}
                <div className="p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-amber">{place || issue.registration_id}</p>
                  <p className="mt-0.5 text-sm font-semibold leading-snug text-indigo">{issue.subject}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate">{issue.description}</p>
                </div>
              </div>
            </Tooltip>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
