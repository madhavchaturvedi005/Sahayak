import type { User } from './api'

export const STAFF_ROLES = ['officer', 'supervisor', 'cm', 'admin'] as const

export function isStaff(user?: Pick<User, 'role'> | null) {
  return STAFF_ROLES.includes((user?.role || '') as (typeof STAFF_ROLES)[number])
}

export function isAdmin(user?: Pick<User, 'role'> | null) {
  return user?.role === 'admin'
}

export function homeForUser(user?: Pick<User, 'role'> | null) {
  return isStaff(user) ? '/admin' : '/desk'
}

export function roleLabel(role?: string | null) {
  if (role === 'officer') return 'Field officer'
  if (role === 'supervisor') return 'Supervisor'
  if (role === 'cm') return 'CM office'
  if (role === 'admin') return 'Administrator'
  return 'Citizen'
}
