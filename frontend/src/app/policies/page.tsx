import { GlassCard } from '@/components/ui/GlassCard'

export default function PoliciesPage() {
  return (
    <div className="page-wrap pb-16">
      <GlassCard>
        <h1 className="text-[32px] font-bold">Website Policies</h1>
        <ul className="mt-4 list-disc space-y-3 pl-5 leading-relaxed">
          <li>Content is owned by the Department of Administrative Reforms & Public Grievances.</li>
          <li>Hosting and development of the official portal is by NIC. Sahayak is a separate companion interface.</li>
          <li>No fee is charged by Government for lodging a grievance on CPGRAMS.</li>
          <li>Personal data entered here is stored only in the local Sahayak database for this demo.</li>
          <li>Copyright in official marks remains with the Government of India.</li>
        </ul>
      </GlassCard>
    </div>
  )
}
