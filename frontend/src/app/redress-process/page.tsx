import { GlassCard } from '@/components/ui/GlassCard'

const STEPS = [
  ['Lodge', 'Citizen files a public or pension grievance with a department and category.'],
  ['Acknowledge', 'A registration number is issued on this portal. Keep it for all future correspondence.'],
  ['Forward', 'The nodal officer of the concerned ministry or state takes the case.'],
  ['Examine', 'The department examines the complaint. Typical disposal time is shown from public data.'],
  ['Reply', 'A speaking order or reply is uploaded. The citizen can rate it or send a reminder.'],
  ['Appeal', 'If unsatisfied, the citizen approaches the Directorate of Public Grievances or the nodal appeal authority.'],
]

export default function RedressProcessPage() {
  return (
    <div className="page-wrap space-y-6 pb-16">
      <h1 className="text-[32px] font-bold">Redress Process Flow</h1>
      <div className="space-y-4">
        {STEPS.map(([title, body], i) => (
          <GlassCard key={title} className="flex gap-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber text-sm font-bold text-white">
              {i + 1}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate">{body}</p>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
