import { GlassCard } from '@/components/ui/GlassCard'

export default function ContactPage() {
  return (
    <div className="page-wrap space-y-6 pb-16">
      <h1 className="text-[32px] font-bold">Contact Us</h1>
      <GlassCard>
        <h2 className="text-[22px] font-semibold">Department of Administrative Reforms & Public Grievances</h2>
        <p className="mt-3 leading-relaxed text-slate">
          5th Floor, Sardar Patel Bhawan, Sansad Marg, New Delhi – 110001
        </p>
        <p className="mt-4 text-sm">
          Phone: 011-23360331
          <br />
          Email for portal issues is not used for grievances. Lodge on this portal instead.
        </p>
      </GlassCard>
      <GlassCard>
        <h2 className="text-[22px] font-semibold">Technical support (NIC)</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate">
          This site is designed, developed and hosted by National Informatics Centre. Browser support: Chrome, Firefox,
          Edge, Safari. Recommended resolution 1440 × 900.
        </p>
      </GlassCard>
    </div>
  )
}
