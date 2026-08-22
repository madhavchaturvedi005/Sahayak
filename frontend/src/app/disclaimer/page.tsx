import { GlassCard } from '@/components/ui/GlassCard'
import { EMAIL_DISCLAIMER, NOTE_CSC } from '@/lib/content'

export default function DisclaimerPage() {
  return (
    <div className="page-wrap pb-16">
      <GlassCard>
        <h1 className="text-[32px] font-bold">Disclaimer</h1>
        <p className="mt-4 leading-relaxed">{EMAIL_DISCLAIMER}</p>
        <p className="mt-4 leading-relaxed">{NOTE_CSC}</p>
        <p className="mt-4 leading-relaxed text-slate">
          Information on this companion site is provided for citizen convenience. Official records remain on
          pgportal.gov.in. Sahayak does not verify Aadhaar, PAN, or any government identity document.
        </p>
      </GlassCard>
    </div>
  )
}
