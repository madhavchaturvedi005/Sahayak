import { API_URL } from './utils'

export type User = {
  id: string
  name: string
  mobile: string
  email: string | null
  role?: 'citizen' | 'officer' | 'supervisor' | 'cm' | 'admin' | string
  desk_level?: number | null
  desk_title?: string
  is_verified: boolean
}

export type DeskPerson = {
  id: string
  name: string
  role: string
  desk_title: string
  mobile: string
  open_assigned: number
}

export type DeskLevel = {
  level: number
  key: string
  title: string
  title_hi: string
  blurb: string
  blurb_hi: string
  sla_days: number
  open: number
  people: DeskPerson[]
}

export type DeskMap = {
  sla_days: number
  levels: DeskLevel[]
}

export type AdminOverview = {
  registered: number
  open: number
  under_process: number
  resolved: number
  delayed: number
  appealed: number
  citizens: number
  officers: number
}

export type AdminAppeal = {
  appeal_id: string
  status: string
  reason: string
  created_at: string
  registration_id: string
  subject: string
  ministry: string
}

export type AdminUser = {
  id: string
  name: string
  mobile: string
  email: string | null
  role: string
  desk_level?: number | null
  desk_title?: string
  is_verified: boolean
  created_at: string
}

export type AdminConfig = {
  admin_name: string
  admin_mobile: string
  admin_email: string
  environment: string
}

export type PersonaConfig = {
  display_name: string
  instructions: string
  updated_by_id?: string | null
  updated_by_name?: string
  updated_at?: string | null
}

export const ADMIN_STATUSES = [
  'Registered',
  'Under Process',
  'Forwarded',
  'Escalated',
  'Resolved',
  'Closed',
  'Rejected',
] as const

export type TokenPayload = {
  access_token: string
  token_type: string
  user: User
}

export type EventItem = {
  id: string
  title: string
  detail: string
  created_at: string
}

export type Grievance = {
  id: string
  registration_id: string
  kind: string
  name: string
  mobile: string
  ministry: string
  category: string
  subject: string
  description: string
  playbook_id?: string
  village?: string
  ward?: string
  district?: string
  street?: string
  latitude?: number | null
  longitude?: number | null
  filer_role?: string
  helper_name?: string
  helper_relation?: string
  consent_capture?: string
  impact_scope?: string
  backer_count?: number
  push_count?: number
  pending_raise_count?: number
  verification_radius_m?: number
  onsite_radius_m?: number
  priority_crossed?: boolean
  answers?: Record<string, string>
  evidence?: { kind?: string; name?: string; data_url?: string }[]
  status: string
  expected_days: number
  pendency_pct: number
  routing_reason: string
  rating: number | null
  reminder_count: number
  closed_at?: string | null
  created_at: string
  updated_at?: string
  events: EventItem[]
  assigned_user_id?: string | null
  assigned_name?: string
  assigned_role?: string
  assigned_title?: string
  field_officer_id?: string | null
  field_officer_name?: string
  escalation_level?: number
  escalation_label?: string
  level_assigned_at?: string | null
  sla_days?: number
  sla_due_at?: string | null
  sla_overdue?: boolean
  days_on_desk?: number
}

export type NearbyGrievance = {
  registration_id: string
  subject: string
  playbook_id?: string
  village?: string
  ward?: string
  district?: string
  street?: string
  latitude?: number | null
  longitude?: number | null
  distance_m?: number | null
  backer_count: number
  push_count: number
  pending_raise_count: number
  status: string
  evidence_count?: number
  created_at?: string | null
}

export type Backer = {
  id: string
  grievance_id: string
  name: string
  mobile: string
  latitude?: number | null
  longitude?: number | null
  distance_m?: number | null
  kind: string
  source: string
  status: string
  village?: string
  ward?: string
  has_photo?: boolean
  otp_verified?: boolean
  verified_at?: string | null
  created_at: string
}

export type BackerStats = {
  registration_id: string
  backer_count: number
  push_count: number
  pending_raise_count: number
  verified_count: number
  pending_count: number
  onsite_count: number
  distinct_mobiles: number
  sources: Record<string, number>
  avg_distance_m: number | null
  collection_span_days: number
  verification_radius_m: number
  onsite_radius_m: number
  priority_threshold_backers: number
  priority_threshold_pushes: number
  priority_crossed: boolean
  backers: Backer[]
}

export type RaiseResult = {
  ok: boolean
  message: string
  reason?: string
  verified?: boolean
  already_verified?: boolean
  error?: string
  backer?: Backer | null
  stats?: BackerStats | null
  grievance?: Grievance | null
}

export type ResolutionCheck = {
  addressed: boolean
  missing: string[]
  missing_tokens: string[]
  reason: string
  appeal_draft: string
  generic: boolean
}

export type AppealWindow = {
  applicable: boolean
  closed_at: string | null
  deadline: string | null
  days_left: number | null
  expired: boolean
  message: string
}

export type ResolutionReview = {
  grievance: Grievance
  reply: { title: string; detail: string; created_at: string } | null
  check: ResolutionCheck | null
  appeal_window: AppealWindow
}

export type NewsItem = {
  id: string
  published_on: string
  title: string
  href: string
  size_label: string
}

export type Officer = {
  id: string
  scope: string
  organisation: string
  name: string
  designation: string
  email: string
  phone: string
  address?: string
  state: string
}

export type OfficerInput = {
  scope: string
  organisation: string
  name: string
  designation: string
  email?: string
  phone?: string
  address?: string
  state?: string
}

export type Department = {
  ministry: string
  avg_days: number
  pendency_pct: number
  notes: string
}

export type TransparencyStats = {
  registered: number
  open: number
  resolved: number
  delayed: number
  fulfilled_within_days: number
  appealed: number
  avg_resolution_days: number | null
  ministries: {
    ministry: string
    count: number
    open: number
    delayed: number
    fulfilled: number
    avg_resolution_days: number | null
  }[]
  updated_at: string
}

export type ClassifyResult = {
  ministry: string
  category: string
  reason: string
  expected_days: number
  pendency_pct: number
  playbook_id?: string
}

export type PlaybookQuestion = {
  id: string
  label: string
  label_hi?: string
  type: 'choice' | 'text'
  options?: string[]
  options_hi?: string[]
  hint?: string
  hint_hi?: string
}

export type Playbook = {
  id: string
  title: string
  title_hi?: string
  blurb: string
  blurb_hi?: string
  ministry: string
  category: string
  needs_photo: boolean
  photo_prompt: string
  photo_prompt_hi?: string
  doc_prompt: string
  doc_prompt_hi?: string
  questions: PlaybookQuestion[]
}

function token() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('sahayak_token')
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  const auth = token()
  if (auth) headers.set('Authorization', `Bearer ${auth}`)
  const res = await fetch(`${API_URL}${path}`, { ...init, headers })
  if (!res.ok) {
    let detail = `Request failed (${res.status})`
    try {
      const body = await res.json()
      detail = body.detail || detail
    } catch {
      /* ignore */
    }
    throw new Error(detail)
  }
  return res.json()
}

export const api = {
  health: () => request<{ status: string }>('/api/health'),
  register: (body: { name: string; mobile: string; email?: string; password: string }) =>
    request<TokenPayload>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: { mobile: string; password: string }) =>
    request<TokenPayload>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  requestOtp: (mobile: string, name?: string) =>
    request<{ ok: boolean; message: string }>('/api/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ mobile, name }),
    }),
  verifyOtp: (mobile: string, otp: string, name?: string) =>
    request<TokenPayload>('/api/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ mobile, otp, name }),
    }),
  me: () => request<User>('/api/auth/me'),
  news: () => request<NewsItem[]>('/api/news'),
  officers: (scope?: string) =>
    request<Officer[]>(scope ? `/api/nodal-officers?scope=${scope}` : '/api/nodal-officers'),
  deskMap: () => request<DeskMap>('/api/desk-map'),
  departments: () => request<Department[]>('/api/departments'),
  playbooks: () => request<Playbook[]>('/api/grievances/playbooks'),
  transparency: () => request<TransparencyStats>('/api/grievances/transparency'),
  reversePlace: (lat: number, lon: number) =>
    request<{ village: string; ward: string; district: string; street: string }>(
      `/api/grievances/geo/reverse?lat=${lat}&lon=${lon}`
    ),
  classify: (text: string) =>
    request<ClassifyResult>('/api/ai/classify', { method: 'POST', body: JSON.stringify({ text }) }),
  aiStatus: () => request<{ openai: boolean; voice: boolean; message: string }>('/api/ai/status'),
  chat: (text: string, history: { role: string; text: string }[] = [], language = '') =>
    request<{
      reply: string
      language: string
      provider: string
      action: { type: string; href?: string }
      routing: ClassifyResult | null
    }>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ text, history, language }),
    }),
  transcribe: async (blob: Blob) => {
    const auth = token()
    const body = new FormData()
    const ext = blob.type.includes('mp4') ? 'mp4' : blob.type.includes('ogg') ? 'ogg' : 'webm'
    body.append('file', blob, `speech.${ext}`)
    const res = await fetch(`${API_URL}/api/ai/transcribe`, {
      method: 'POST',
      headers: auth ? { Authorization: `Bearer ${auth}` } : undefined,
      body,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Transcribe failed' }))
      throw new Error(err.detail || 'Transcribe failed')
    }
    return res.json() as Promise<{ text: string; language: string }>
  },
  speak: async (text: string, language = 'en') => {
    const auth = token()
    const res = await fetch(`${API_URL}/api/ai/speak`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
      },
      body: JSON.stringify({ text, language }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Speak failed' }))
      throw new Error(err.detail || 'Speak failed')
    }
    return res.blob()
  },
  activity: () =>
    request<{ id: string; action: string; ip_address: string; created_at: string }[]>('/api/auth/activity'),
  updateProfile: (body: { name: string; email?: string }) =>
    request<User>('/api/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),
  changePassword: (old_password: string, new_password: string) =>
    request<{ ok: boolean }>('/api/auth/password', {
      method: 'POST',
      body: JSON.stringify({ old_password, new_password }),
    }),
  resolutionCheck: (complaint: string, reply: string) =>
    request<ResolutionCheck>('/api/ai/resolution-check', {
      method: 'POST',
      body: JSON.stringify({ complaint, reply }),
    }),
  reviewGrievance: (id: string) =>
    request<ResolutionReview>(`/api/grievances/review?registration_id=${encodeURIComponent(id)}`),
  createGrievance: (body: Record<string, unknown>) =>
    request<Grievance>('/api/grievances', { method: 'POST', body: JSON.stringify(body) }),
  getGrievance: (id: string) => request<Grievance>(`/api/grievances/${encodeURIComponent(id)}`),
  listGrievances: () => request<Grievance[]>('/api/grievances'),
  nearby: (params?: {
    lat?: number | null
    lon?: number | null
    playbook_id?: string
    village?: string
    ward?: string
    radius_m?: number
  }) => {
    const query = new URLSearchParams()
    if (params?.lat != null) query.set('lat', String(params.lat))
    if (params?.lon != null) query.set('lon', String(params.lon))
    if (params?.playbook_id) query.set('playbook_id', params.playbook_id)
    if (params?.village) query.set('village', params.village)
    if (params?.ward) query.set('ward', params.ward)
    if (params?.radius_m != null) query.set('radius_m', String(params.radius_m))
    const qs = query.toString()
    return request<NearbyGrievance[]>(`/api/grievances/nearby${qs ? `?${qs}` : ''}`)
  },
  raiseGrievance: (
    registration_id: string,
    body: {
      name?: string
      mobile: string
      otp?: string
      latitude?: number | null
      longitude?: number | null
      village?: string
      ward?: string
      photo_data_url?: string
      source?: string
      prefer_onsite?: boolean
    }
  ) =>
    request<RaiseResult>(`/api/grievances/${encodeURIComponent(registration_id)}/raise`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  onsiteVerify: (
    registration_id: string,
    body: {
      name?: string
      mobile: string
      otp?: string
      latitude: number
      longitude: number
      photo_data_url?: string
    }
  ) =>
    request<RaiseResult>(`/api/grievances/${encodeURIComponent(registration_id)}/onsite-verify`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  verifyRaise: (
    registration_id: string,
    body: {
      mobile: string
      otp?: string
      latitude?: number | null
      longitude?: number | null
      village?: string
      ward?: string
      photo_data_url?: string
      prefer_onsite?: boolean
    }
  ) =>
    request<RaiseResult>(`/api/grievances/${encodeURIComponent(registration_id)}/verify-raise`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  backers: (registration_id: string) =>
    request<BackerStats>(`/api/grievances/${encodeURIComponent(registration_id)}/backers`),
  reminder: (registration_id: string, message: string) =>
    request<Grievance>('/api/grievances/reminder', {
      method: 'POST',
      body: JSON.stringify({ registration_id, message }),
    }),
  rate: (registration_id: string, rating: number, comment: string) =>
    request<Grievance>('/api/grievances/rate', {
      method: 'POST',
      body: JSON.stringify({ registration_id, rating, comment }),
    }),
  appeal: (registration_id: string, reason: string) =>
    request<{ appeal_id: string; status: string }>('/api/grievances/appeal', {
      method: 'POST',
      body: JSON.stringify({ registration_id, reason }),
    }),
  adminOverview: () => request<AdminOverview>('/api/admin/overview'),
  adminConfig: () => request<AdminConfig>('/api/admin/config'),
  adminPersona: () => request<PersonaConfig>('/api/admin/persona'),
  adminSavePersona: (body: { display_name: string; instructions: string }) =>
    request<PersonaConfig>('/api/admin/persona', { method: 'PUT', body: JSON.stringify(body) }),
  adminGrievances: (params?: { status?: string; q?: string }) => {
    const query = new URLSearchParams()
    if (params?.status) query.set('status', params.status)
    if (params?.q) query.set('q', params.q)
    const suffix = query.toString() ? `?${query.toString()}` : ''
    return request<Grievance[]>(`/api/admin/grievances${suffix}`)
  },
  adminGrievance: (id: string) => request<Grievance>(`/api/admin/grievances/${encodeURIComponent(id)}`),
  adminAction: (id: string, body: { status: string; title?: string; detail: string }) =>
    request<Grievance>(`/api/admin/grievances/${encodeURIComponent(id)}/action`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  adminAppeals: () => request<AdminAppeal[]>('/api/admin/appeals'),
  adminUsers: () => request<AdminUser[]>('/api/admin/users'),
  adminSetRole: (userId: string, role: string) =>
    request<AdminUser>(`/api/admin/users/${encodeURIComponent(userId)}/role`, {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),
  adminOfficers: (scope?: string) =>
    request<Officer[]>(scope ? `/api/admin/nodal-officers?scope=${scope}` : '/api/admin/nodal-officers'),
  adminCreateOfficer: (body: OfficerInput) =>
    request<Officer>('/api/admin/nodal-officers', { method: 'POST', body: JSON.stringify(body) }),
  adminUpdateOfficer: (id: string, body: OfficerInput) =>
    request<Officer>(`/api/admin/nodal-officers/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  adminDeleteOfficer: (id: string) =>
    request<{ ok: boolean }>(`/api/admin/nodal-officers/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  adminDeskMap: () => request<DeskMap>('/api/admin/desk-map'),
  adminEscalate: (id: string) =>
    request<Grievance>(`/api/admin/grievances/${encodeURIComponent(id)}/escalate`, { method: 'POST' }),
}
