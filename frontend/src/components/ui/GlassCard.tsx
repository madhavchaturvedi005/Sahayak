import { cn } from '@/lib/utils'

export function GlassCard({
  children,
  className,
  hover = true,
}: {
  children: React.ReactNode
  className?: string
  hover?: boolean
}) {
  return (
    <div className={cn('glass-panel rounded-panel p-6 md:p-8', hover && 'glass-hover', className)}>
      {children}
    </div>
  )
}
