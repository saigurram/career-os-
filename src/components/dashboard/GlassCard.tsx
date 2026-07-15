import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
}

export function GlassCard({ children, className }: GlassCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/8 p-5 backdrop-blur-sm',
        'bg-white/3 shadow-lg',
        className
      )}
    >
      {children}
    </div>
  )
}
