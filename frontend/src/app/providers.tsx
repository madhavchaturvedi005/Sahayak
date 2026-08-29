'use client'

import { AssistantProvider } from '@/context/AssistantContext'
import { AuthProvider } from '@/context/AuthContext'
import { LanguageProvider } from '@/context/LanguageContext'
import { LocationProvider } from '@/context/LocationContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <LocationProvider>
          <AssistantProvider>{children}</AssistantProvider>
        </LocationProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}
