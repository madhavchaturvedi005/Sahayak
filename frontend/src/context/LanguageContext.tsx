'use client'

import { createContext, useContext, useMemo, useState } from 'react'

type Lang = 'en' | 'hi'

const COPY: Record<Lang, Record<string, string>> = {
  en: {
    home: 'Home',
    contact: 'Contact Us',
    about: 'About Us',
    help: 'FAQs/Help',
    sitemap: 'Site Map',
    viewStatus: 'View Status',
    grievanceStatus: 'Grievance Status',
    appealStatus: 'Appeal Status',
    nodalOfficers: 'Nodal PG Officers',
    central: 'Central Government',
    state: 'State Government',
    redress: 'Redress Process',
    redressFlow: 'Redress Process Flow',
    grievance: 'Grievance',
    lodgePublic: 'Lodge Public Grievance',
    lodgePension: 'Lodge Pension Grievance',
    reminder: 'Reminder Clarification',
    rate: 'Rate Grievance',
    appealAuthority: 'Nodal Authority for Appeal',
    mobileApp: 'Mobile App',
    signIn: 'Sign In',
    signOut: 'Sign Out',
    language: 'Language',
  },
  hi: {
    home: 'होम',
    contact: 'संपर्क करें',
    about: 'हमारे बारे में',
    help: 'सहायता / प्रश्न',
    sitemap: 'साइट मैप',
    viewStatus: 'स्थिति देखें',
    grievanceStatus: 'शिकायत स्थिति',
    appealStatus: 'अपील स्थिति',
    nodalOfficers: 'नोडल पीजी अधिकारी',
    central: 'केंद्र सरकार',
    state: 'राज्य सरकार',
    redress: 'निवारण प्रक्रिया',
    redressFlow: 'निवारण प्रक्रिया प्रवाह',
    grievance: 'शिकायत',
    lodgePublic: 'सार्वजनिक शिकायत दर्ज करें',
    lodgePension: 'पेंशन शिकायत दर्ज करें',
    reminder: 'अनुस्मारक / स्पष्टीकरण',
    rate: 'शिकायत का मूल्यांकन',
    appealAuthority: 'अपील हेतु नोडल प्राधिकारी',
    mobileApp: 'मोबाइल ऐप',
    signIn: 'साइन इन',
    signOut: 'साइन आउट',
    language: 'भाषा',
  },
}

type LanguageContextValue = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('en')
  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: (key: string) => COPY[lang][key] || key,
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
