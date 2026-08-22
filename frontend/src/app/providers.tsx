'use client'

import { AssistantProvider } from '@/context/AssistantContext'
import { AuthProvider } from '@/context/AuthContext'
import { LanguageProvider } from '@/context/LanguageContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AssistantProvider>{children}</AssistantProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}
