import type { DeskMap, DeskPerson, Grievance } from './api'

export const MH_BOUNDS = { minLat: 15.55, maxLat: 22.15, minLng: 72.5, maxLng: 80.95 }

/** Closed ring of [lng, lat] for a simplified Maharashtra outline. */
export const MH_OUTLINE: [number, number][] = [
  [72.65, 20.12],
  [72.78, 19.25],
  [72.82, 18.95],
  [72.93, 18.52],
  [73.05, 17.92],
  [73.28, 16.98],
  [73.48, 16.4],
  [73.68, 15.87],
  [73.95, 15.72],
  [74.15, 15.72],
  [74.45, 15.85],
  [74.75, 16.05],
  [75.1, 16.2],
  [75.55, 16.55],
  [75.95, 16.85],
  [76.35, 17.15],
  [76.8, 17.55],
  [77.2, 17.85],
  [77.7, 18.15],
  [78.15, 18.55],
  [78.55, 19.0],
  [79.0, 19.35],
  [79.6, 19.7],
  [80.4, 19.95],
  [80.9, 20.15],
  [80.55, 20.55],
  [80.1, 20.9],
  [79.7, 21.25],
  [79.2, 21.55],
  [78.7, 21.7],
  [78.1, 21.75],
  [77.5, 21.55],
  [76.9, 21.7],
  [76.3, 21.85],
  [75.7, 21.95],
  [75.1, 21.85],
  [74.5, 21.75],
  [74.0, 21.55],
  [73.55, 21.2],
  [73.2, 20.8],
  [72.85, 20.45],
  [72.65, 20.12],
]

export const MH_CITIES = [
  { name: 'Mumbai', nameHi: 'मुंबई', lat: 19.076, lng: 72.8777 },
  { name: 'Pune', nameHi: 'पुणे', lat: 18.5204, lng: 73.8567 },
  { name: 'Nashik', nameHi: 'नाशिक', lat: 19.9975, lng: 73.7898 },
  { name: 'Nagpur', nameHi: 'नागपुर', lat: 21.1458, lng: 79.0882 },
  { name: 'Chh. Sambhajinagar', nameHi: 'छ. संभाजीनगर', lat: 19.8762, lng: 75.3433 },
  { name: 'Kolhapur', nameHi: 'कोल्हापुर', lat: 16.705, lng: 74.2433 },
  { name: 'Solapur', nameHi: 'सोलापुर', lat: 17.6599, lng: 75.9064 },
  { name: 'Amravati', nameHi: 'अमरावती', lat: 20.9374, lng: 77.7796 },
] as const

export type ManagerSeat = {
  name: string
  role: string
  title: string
  current: boolean
  mobile?: string
}

export function projectMh(lat: number, lng: number, width: number, height: number) {
  const pad = 28
  const innerW = width - pad * 2
  const innerH = height - pad * 2
  const x = pad + ((lng - MH_BOUNDS.minLng) / (MH_BOUNDS.maxLng - MH_BOUNDS.minLng)) * innerW
  const y = pad + ((MH_BOUNDS.maxLat - lat) / (MH_BOUNDS.maxLat - MH_BOUNDS.minLat)) * innerH
  return { x, y }
}

export function inMaharashtra(lat?: number | null, lng?: number | null) {
  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) return false
  return lat >= MH_BOUNDS.minLat && lat <= MH_BOUNDS.maxLat && lng >= MH_BOUNDS.minLng && lng <= MH_BOUNDS.maxLng
}

export function outlinePath(width: number, height: number) {
  return MH_OUTLINE.map(([lng, lat], index) => {
    const { x, y } = projectMh(lat, lng, width, height)
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ') + ' Z'
}

export function firstPhoto(row: Grievance) {
  const shot = (row.evidence || []).find((item) => {
    const url = item.data_url || ''
    const kind = (item.kind || '').toLowerCase()
    return url.startsWith('http') || url.startsWith('data:image') || kind.includes('photo') || kind.includes('image')
  })
  return shot?.data_url || ''
}

export function isClosed(row: Grievance) {
  return ['Resolved', 'Closed', 'Rejected'].includes(row.status)
}

export function trendScore(row: Grievance) {
  const backers = row.backer_count || 0
  const pushes = row.push_count || 0
  const pending = row.pending_raise_count || 0
  const level = row.escalation_level || 1
  return (
    backers * 2 +
    pushes * 6 +
    pending +
    (row.priority_crossed ? 16 : 0) +
    (level > 1 ? level * 8 : 0) +
    (row.sla_overdue ? 10 : 0)
  )
}

export function isRapid(row: Grievance) {
  if (isClosed(row)) return false
  return (
    (row.push_count || 0) >= 1 ||
    (row.backer_count || 0) >= 3 ||
    !!row.priority_crossed ||
    (row.escalation_level || 1) >= 2
  )
}

export function slaProgress(row: Grievance) {
  const slaDays = row.sla_days || 21
  const daysOnDesk = row.days_on_desk ?? 0
  const created = row.created_at ? Math.max(0, Math.floor((Date.now() - new Date(row.created_at).getTime()) / 86_400_000)) : daysOnDesk
  const daysRemaining = Math.max(0, slaDays - daysOnDesk)
  return {
    slaDays,
    daysOnDesk,
    daysCompleted: created,
    daysRemaining,
    overdue: !!row.sla_overdue,
    pct: Math.min(100, Math.round((daysOnDesk / slaDays) * 100)),
  }
}

function peopleAt(desk: DeskMap | null | undefined, key: string) {
  return desk?.levels.find((level) => level.key === key)?.people || []
}

function matchByArea(people: DeskPerson[], row: Grievance) {
  const hay = `${row.district || ''} ${row.village || ''}`.toLowerCase()
  if (!hay.trim()) return people[0]
  return (
    people.find((person) => {
      const title = (person.desk_title || '').toLowerCase()
      return hay.split(/\s+/).some((word) => word.length > 3 && title.includes(word))
    }) || people[0]
  )
}

function asSeat(person: DeskPerson | undefined, fallbackName: string, fallbackTitle: string): ManagerSeat {
  return {
    name: person?.name || fallbackName,
    role: person?.role || '',
    title: person?.desk_title || fallbackTitle,
    current: false,
    mobile: person?.mobile,
  }
}

export function managerChain(row: Grievance, desk?: DeskMap | null): ManagerSeat[] {
  const officers = peopleAt(desk, 'officer')
  const supers = peopleAt(desk, 'supervisor')
  const cms = peopleAt(desk, 'cm')
  const level = row.escalation_level || 1

  const fieldMatch = officers.find((person) => person.name === row.field_officer_name) || matchByArea(officers, row)
  const field = asSeat(fieldMatch, row.field_officer_name || 'Unassigned', 'Field officer')

  const superMatch =
    row.assigned_role === 'supervisor'
      ? supers.find((person) => person.id === row.assigned_user_id) ||
        supers.find((person) => person.name === row.assigned_name) ||
        matchByArea(supers, row)
      : matchByArea(supers, row)
  const supervisor = asSeat(superMatch, row.assigned_role === 'supervisor' ? row.assigned_name || '' : 'District supervisor', 'Supervisor')
  if (row.assigned_role === 'supervisor' && row.assigned_title) supervisor.title = row.assigned_title

  const cmMatch =
    row.assigned_role === 'cm'
      ? cms.find((person) => person.id === row.assigned_user_id) ||
        cms.find((person) => person.name === row.assigned_name) ||
        cms[0]
      : cms[0]
  const cmSeat = asSeat(cmMatch, row.assigned_role === 'cm' ? row.assigned_name || '' : 'CM Grievance Cell', "Chief Minister's Office")
  if (row.assigned_role === 'cm' && row.assigned_title) cmSeat.title = row.assigned_title

  field.role = 'officer'
  supervisor.role = 'supervisor'
  cmSeat.role = 'cm'
  field.current = level === 1 && !isClosed(row)
  supervisor.current = level === 2 && !isClosed(row)
  cmSeat.current = level >= 3 && !isClosed(row)
  return [field, supervisor, cmSeat]
}

export function responsibleNow(row: Grievance, desk?: DeskMap | null) {
  const chain = managerChain(row, desk)
  return chain.find((seat) => seat.current) || chain[chain.length - 1]
}

const MH_PLACE_RE =
  /mumbai|pune|nashik|nagpur|solapur|kolhapur|amravati|nanded|thane|aurangabad|sambhajinagar|satara|sangli|jalgaon|akola|ratnagiri|sindhudurg|palghar|raigad|ahmednagar|beed|latur|osmanabad|chandrapur|gadchiroli|wardha|yavatmal|buldhana|dhule|nandurbar|gondia|bhandara|hingoli|parbhani|washim|kurla|panchavati|swargate|sitabuldi|hotgi|ghati/i

export function inMaharashtraPlace(row: Grievance) {
  if (inMaharashtra(row.latitude, row.longitude)) return true
  return MH_PLACE_RE.test(`${row.district || ''} ${row.village || ''} ${row.street || ''}`)
}

export function mappedIssues(rows: Grievance[]) {
  return rows.filter((row) => inMaharashtra(row.latitude, row.longitude) && !isClosed(row))
}

export function stateIssues(rows: Grievance[]) {
  const local = rows.filter((row) => !isClosed(row) && inMaharashtraPlace(row))
  return local.length ? local : rows.filter((row) => !isClosed(row))
}

export function trendingIssues(rows: Grievance[]) {
  return [...rows].filter((row) => !isClosed(row)).sort((a, b) => trendScore(b) - trendScore(a))
}
