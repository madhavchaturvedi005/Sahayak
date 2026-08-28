'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { COPY, interpolate, type Lang } from '@/lib/i18n'

type Translate = (key: string, vars?: Record<string, string | number>) => string

type LanguageContextValue = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: Translate
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

const STORAGE_KEY = 'sahayak_lang'
const CHOSEN_KEY = 'sahayak_lang_chosen'

function applyHtmlLang(lang: Lang) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = lang === 'hi' ? 'hi' : 'en'
}

function readStoredLang(): Lang {
  if (typeof window === 'undefined') return 'en'
  if (localStorage.getItem(CHOSEN_KEY) === '1') {
    return localStorage.getItem(STORAGE_KEY) === 'hi' ? 'hi' : 'en'
  }
  return 'en'
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang)

  useEffect(() => {
    applyHtmlLang(lang)
  }, [lang])

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang: (next) => {
        setLangState(next)
        localStorage.setItem(STORAGE_KEY, next)
        localStorage.setItem(CHOSEN_KEY, '1')
        applyHtmlLang(next)
      },
      t: (key, vars) => interpolate(COPY[lang][key] || COPY.en[key] || key, vars),
    }),
    [lang]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
