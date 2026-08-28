import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

export function assistantSocketUrl() {
  const base = API_URL.replace(/^http/i, (match) => (match.toLowerCase() === 'https' ? 'wss' : 'ws'))
  return `${base.replace(/\/$/, '')}/api/ai/ws`
}

export function realtimeSocketUrl(options?: {
  registrationId?: string
  signedIn?: boolean
  path?: string
  lang?: string
  justSignedIn?: boolean
  citizenName?: string
}) {
  const url = new URL(assistantSocketUrl().replace(/\/ws$/, '/realtime'))
  if (options?.registrationId) url.searchParams.set('registration_id', options.registrationId)
  if (options?.signedIn) url.searchParams.set('signed_in', '1')
  if (options?.path) url.searchParams.set('path', options.path)
  url.searchParams.set('lang', options?.lang || 'hi')
  if (options?.justSignedIn) url.searchParams.set('just_signed_in', '1')
  if (options?.citizenName) url.searchParams.set('citizen_name', options.citizenName)
  return url.toString()
}

export function formatDate(value: string | Date, locale = 'en-IN') {
  const date = typeof value === 'string' ? new Date(value) : value
  return date.toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
