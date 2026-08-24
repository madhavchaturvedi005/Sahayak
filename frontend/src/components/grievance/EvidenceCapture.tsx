'use client'

import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { Camera, ImagePlus, X } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

export type EvidenceFile = {
  kind: 'photo' | 'document'
  name: string
  data_url: string
}

async function compressImage(file: File): Promise<EvidenceFile> {
  const bitmap = await createImageBitmap(file)
  const max = 1280
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not read the photo')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return {
    kind: 'photo',
    name: file.name || 'photo.jpg',
    data_url: canvas.toDataURL('image/jpeg', 0.72),
  }
}

export type EvidenceCaptureHandle = {
  openCamera: () => void
  openLibrary: () => void
}

export const EvidenceCapture = forwardRef<
  EvidenceCaptureHandle,
  {
    items: EvidenceFile[]
    onChange: (items: EvidenceFile[]) => void
    photoPrompt: string
    docPrompt: string
    needPhoto: boolean
  }
>(function EvidenceCapture({ items, onChange, photoPrompt, docPrompt, needPhoto }, ref) {
  const { t } = useLanguage()
  const cameraRef = useRef<HTMLInputElement | null>(null)
  const libraryRef = useRef<HTMLInputElement | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useImperativeHandle(ref, () => ({
    openCamera: () => cameraRef.current?.click(),
    openLibrary: () => libraryRef.current?.click(),
  }))

  async function addFiles(files: FileList | null) {
    if (!files?.length) return
    setBusy(true)
    setError('')
    try {
      const next = [...items]
      for (const file of Array.from(files)) {
        if (next.length >= 3) break
        if (!file.type.startsWith('image/')) {
          setError(t('photoUploadError'))
          continue
        }
        next.push(await compressImage(file))
      }
      onChange(next)
    } catch {
      setError(t('photoReadError'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-slate">{photoPrompt}</p>
      <p className="rounded-card bg-attention/10 px-4 py-3 text-sm leading-relaxed text-ink">
        {t('noAadhaar')}
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn-primary" disabled={busy || items.length >= 3} onClick={() => cameraRef.current?.click()}>
          <Camera className="h-4 w-4" />
          {t('openCamera')}
        </button>
        <button type="button" className="btn-secondary" disabled={busy || items.length >= 3} onClick={() => libraryRef.current?.click()}>
          <ImagePlus className="h-4 w-4" />
          {t('uploadPhoto')}
        </button>
      </div>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          void addFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <input
        ref={libraryRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          void addFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <p className="text-xs leading-relaxed text-slate">{docPrompt}</p>
      {needPhoto && items.length === 0 && (
        <p className="text-sm text-attention">{t('needPhoto')}</p>
      )}
      {error && <p className="text-sm text-attention">{error}</p>}
      {items.length > 0 && (
        <ul className="grid grid-cols-3 gap-3">
          {items.map((item, index) => (
            <li key={`${item.name}-${index}`} className="relative overflow-hidden rounded-card bg-indigo/5">
              <img src={item.data_url} alt="" className="h-28 w-full object-cover" />
              <button
                type="button"
                className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-indigo"
                aria-label={t('removePhoto')}
                onClick={() => onChange(items.filter((_, i) => i !== index))}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
})
