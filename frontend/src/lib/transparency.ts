import type { TransparencyStats } from '@/lib/api'

export function share(part: number, total: number) {
  if (!total) return 0
  return Math.round((part / total) * 100)
}

export function daysLabel(value: number | null) {
  if (value == null) return '—'
  if (value < 1) return '< 1 day'
  if (value === 1) return '1 day'
  return `${Number.isInteger(value) ? value : value.toFixed(1)} days`
}

export const TRANSPARENCY_TILES = [
  {
    key: 'registered',
    label: 'Registered so far',
    hint: 'Every grievance saved in this desk.',
    value: (row: TransparencyStats) => String(row.registered),
    tone: 'bg-indigo text-white',
  },
  {
    key: 'open',
    label: 'Still open',
    hint: 'Files that have not been marked resolved or closed.',
    value: (row: TransparencyStats) => String(row.open),
    tone: 'bg-indigo-soft text-white',
  },
  {
    key: 'avg',
    label: 'Average time to resolve',
    hint: 'From the day a file was lodged to the day it was closed.',
    value: (row: TransparencyStats) => daysLabel(row.avg_resolution_days),
    tone: 'bg-indigo-deep text-white',
  },
  {
    key: 'delayed',
    label: 'Delayed',
    hint: 'Still open past the expected days for that case, or closed after that time.',
    value: (row: TransparencyStats) => String(row.delayed),
    tone: 'bg-amber text-white',
  },
  {
    key: 'onTime',
    label: 'Fulfilled on time',
    hint: 'Closed within the expected days for that department.',
    value: (row: TransparencyStats) => String(row.fulfilled_within_days),
    tone: 'bg-success text-white',
  },
  {
    key: 'appealed',
    label: 'Taken to higher authority',
    hint: 'Appeals filed after a closure.',
    value: (row: TransparencyStats) => String(row.appealed),
    tone: 'bg-indigo text-white',
  },
] as const
