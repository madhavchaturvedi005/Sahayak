'use client'

import { useEffect, useMemo, useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { useLanguage } from '@/context/LanguageContext'
import { api, type Officer, type OfficerInput } from '@/lib/api'

const SCOPES = [
  { id: 'appeal', labelKey: 'scopeAppeal' },
  { id: 'central', labelKey: 'scopeCentral' },
  { id: 'state', labelKey: 'scopeState' },
] as const

const EMPTY: OfficerInput = {
  scope: 'appeal',
  organisation: '',
  name: '',
  designation: '',
  email: '',
  phone: '',
  address: '',
  state: '',
}

export default function AdminNodalOfficersPage() {
  const { t } = useLanguage()
  const [scope, setScope] = useState<(typeof SCOPES)[number]['id']>('appeal')
  const [rows, setRows] = useState<Officer[]>([])
  const [q, setQ] = useState('')
  const [form, setForm] = useState<OfficerInput>(EMPTY)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api
      .adminOfficers(scope)
      .then(setRows)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load directory'))
  }, [scope])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((row) =>
      [row.organisation, row.name, row.designation, row.address, row.email, row.phone, row.state]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(needle))
    )
  }, [q, rows])

  function setField<K extends keyof OfficerInput>(key: K, value: OfficerInput[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function startEdit(row: Officer) {
    setEditingId(row.id)
    setForm({
      scope: row.scope,
      organisation: row.organisation,
      name: row.name,
      designation: row.designation,
      email: row.email,
      phone: row.phone,
      address: row.address || '',
      state: row.state,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setEditingId(null)
    setForm({ ...EMPTY, scope })
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const body = { ...form, scope: form.scope || scope }
      if (editingId) {
        const updated = await api.adminUpdateOfficer(editingId, body)
        setRows((current) => current.map((row) => (row.id === updated.id ? updated : row)))
      } else {
        const created = await api.adminCreateOfficer(body)
        setRows((current) => [...current, created].sort((a, b) => a.organisation.localeCompare(b.organisation)))
      }
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    if (!window.confirm(t('confirmDeleteOfficer'))) return
    setError('')
    try {
      await api.adminDeleteOfficer(id)
      setRows((current) => current.filter((row) => row.id !== id))
      if (editingId === id) resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-bold">{t('nodalDirectory')}</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate">{t('nodalDirectoryLead')}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {SCOPES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={scope === item.id ? 'btn-primary' : 'btn-secondary'}
            onClick={() => {
              setScope(item.id)
              setForm((current) => ({ ...current, scope: item.id }))
              if (!editingId) setForm({ ...EMPTY, scope: item.id })
            }}
          >
            {t(item.labelKey)}
          </button>
        ))}
      </div>

      <GlassCard>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={save}>
          <label className="md:col-span-2">
            <span className="label">{t('organisation')}</span>
            <input className="field" required value={form.organisation} onChange={(e) => setField('organisation', e.target.value)} />
          </label>
          <label>
            <span className="label">{t('officerName')}</span>
            <input className="field" required value={form.name} onChange={(e) => setField('name', e.target.value)} />
          </label>
          <label>
            <span className="label">{t('designation')}</span>
            <input className="field" required value={form.designation} onChange={(e) => setField('designation', e.target.value)} />
          </label>
          <label className="md:col-span-2">
            <span className="label">{t('officeAddress')}</span>
            <input className="field" value={form.address} onChange={(e) => setField('address', e.target.value)} />
          </label>
          <label>
            <span className="label">Email</span>
            <input className="field" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} />
          </label>
          <label>
            <span className="label">Phone</span>
            <input className="field" value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
          </label>
          {scope === 'state' || form.scope === 'state' ? (
            <label className="md:col-span-2">
              <span className="label">{t('state')}</span>
              <input className="field" value={form.state} onChange={(e) => setField('state', e.target.value)} />
            </label>
          ) : null}
          <div className="flex flex-wrap gap-3 md:col-span-2">
            <button className="btn-primary" disabled={busy} type="submit">
              {editingId ? t('saveOfficer') : t('addOfficer')}
            </button>
            {editingId ? (
              <button className="btn-secondary" type="button" onClick={resetForm}>
                {t('cancelEdit')}
              </button>
            ) : null}
          </div>
        </form>
      </GlassCard>

      <GlassCard>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <input className="field max-w-xs" placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
          <p className="text-sm text-slate">{t('showingAuthorities', { n: filtered.length })}</p>
        </div>
        {error && <p className="mb-4 text-sm text-attention">{error}</p>}
        <div className="grid gap-4">
          {filtered.map((row) => (
            <div key={row.id} className="rounded-2xl border border-white/40 bg-white/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-amber">{row.designation}</p>
                  <h2 className="text-lg font-semibold">{row.organisation}</h2>
                  <p className="text-slate">{row.name}</p>
                  {row.address ? <p className="mt-2 text-sm text-slate">{row.address}</p> : null}
                  <p className="mt-1 text-sm">
                    {row.phone}
                    {row.phone && row.email ? ' · ' : ''}
                    {row.email}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="btn-secondary" onClick={() => startEdit(row)}>
                    {t('editOfficer')}
                  </button>
                  <button type="button" className="btn-secondary text-attention" onClick={() => remove(row.id)}>
                    {t('deleteOfficer')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
