import { GlassCard } from '@/components/ui/GlassCard'

export default function MobileAppPage() {
  return (
    <div className="page-wrap pb-16">
      <GlassCard>
        <h1 className="text-[32px] font-bold">Mobile App</h1>
        <p className="mt-3 leading-relaxed">
          CPGRAMS is available as a standalone mobile application on the Google Play Store and through UMANG. Sahayak
          itself is a web companion and works on phones without an extra install.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a className="btn-secondary" href="https://play.google.com/store" target="_blank" rel="noreferrer">
            Google Play
          </a>
          <a className="btn-secondary" href="https://web.umang.gov.in" target="_blank" rel="noreferrer">
            UMANG
          </a>
        </div>
      </GlassCard>
    </div>
  )
}
