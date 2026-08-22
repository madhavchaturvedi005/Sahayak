import { GlassCard } from '@/components/ui/GlassCard'
import { ABOUT_CPGRAMS, EXCLUSIONS, NOTE_CSC, NOTE_DPG } from '@/lib/content'

export default function AboutPage() {
  return (
    <div className="page-wrap space-y-6 pb-16">
      <h1 className="text-[32px] font-bold">About Us</h1>
      <GlassCard>
        <h2 className="mb-4 text-[22px] font-semibold">About CPGRAMS</h2>
        <p className="text-base leading-relaxed">{ABOUT_CPGRAMS}</p>
      </GlassCard>
      <GlassCard>
        <h2 className="mb-4 text-[22px] font-semibold">About Sahayak</h2>
        <p className="text-base leading-relaxed">
          Sahayak is an independent companion redesign of the CPGRAMS citizen experience. It keeps every destination
          from the live portal, presents them on glass surfaces, and adds honest expectation-setting plus a resolution
          check. It does not claim to be an official government product and does not file on pgportal.gov.in.
        </p>
      </GlassCard>
      <GlassCard>
        <h2 className="mb-4 text-[22px] font-semibold">Issues which are not taken up for redress</h2>
        <ul className="space-y-2">
          {EXCLUSIONS.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-indigo" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-slate">{NOTE_DPG}</p>
        <p className="mt-3 text-sm text-slate">{NOTE_CSC}</p>
      </GlassCard>
    </div>
  )
}
