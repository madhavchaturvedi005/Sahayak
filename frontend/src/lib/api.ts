import { API_URL } from './utils'

export type User = {
  id: string
  name: string
  mobile: string
  email: string | null
  is_verified: boolean
}

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
  state: string
}

export type Department = {
  ministry: string
  avg_days: number
  pendency_pct: number
  notes: string
}

export type ClassifyResult = {
  ministry: string
  category: string
  reason: string
  expected_days: number
  pendency_pct: number
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
  departments: () => request<Department[]>('/api/departments'),
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
  createGrievance: (body: Record<string, string>) =>
    request<Grievance>('/api/grievances', { method: 'POST', body: JSON.stringify(body) }),
  getGrievance: (id: string) => request<Grievance>(`/api/grievances/${encodeURIComponent(id)}`),
  listGrievances: () => request<Grievance[]>('/api/grievances'),
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
}
