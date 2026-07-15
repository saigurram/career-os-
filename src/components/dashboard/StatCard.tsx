'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  sub: string
  accent: 'orange' | 'indigo' | 'violet' | 'emerald'
}

const accentMap = {
  orange: 'from-orange-500/10 to-orange-500/5 border-orange-500/15',
  indigo: 'from-indigo-500/10 to-indigo-500/5 border-indigo-500/15',
  violet: 'from-violet-500/10 to-violet-500/5 border-violet-500/15',
  emerald: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/15',
}

export function StatCard({ icon, label, value, sub, accent }: StatCardProps) {
  return (
    <motion.div
      data-testid="stat-card"
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'rounded-2xl border p-4 bg-gradient-to-br backdrop-blur-sm',
        accentMap[accent]
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-lg bg-white/5">{icon}</div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      <p className="text-xs text-muted-foreground/60 mt-0.5">{sub}</p>
    </motion.div>
  )
}
