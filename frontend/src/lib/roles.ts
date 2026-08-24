import type { User } from './api'

export function isStaff(user?: Pick<User, 'role'> | null) {
  return user?.role === 'admin' || user?.role === 'officer'
}

export function isAdmin(user?: Pick<User, 'role'> | null) {
  return user?.role === 'admin'
}

export function homeForUser(user?: Pick<User, 'role'> | null) {
  return isStaff(user) ? '/admin' : '/desk'
}
