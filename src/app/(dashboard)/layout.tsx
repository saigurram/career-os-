'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  BookOpen,
  Briefcase,
  Award,
  LogOut,
  BarChart3,
  Users,
  BookMarked,
  MessageSquare,
  KanbanSquare,
  FileText,
  HandCoins,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { getPhase, type Phase } from '@/lib/phase'

const PHASE1_NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/curriculum', icon: BookOpen, label: 'Curriculum' },
  { href: '/jobs', icon: Briefcase, label: 'Jobs' },
  { href: '/skill-gap', icon: BarChart3, label: 'Skill Gap' },
  { href: '/outreach', icon: Users, label: 'Outreach' },
  { href: '/story-bank', icon: BookMarked, label: 'Story Bank' },
  { href: '/interview', icon: MessageSquare, label: 'Interview Prep' },
  { href: '/portfolio', icon: Award, label: 'Portfolio' },
]

const PHASE2_NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/jobs', icon: Briefcase, label: 'Jobs' },
  { href: '/tracker', icon: KanbanSquare, label: 'Tracker' },
  { href: '/resume', icon: FileText, label: 'Resume' },
  { href: '/outreach', icon: Users, label: 'Outreach' },
  { href: '/interview', icon: MessageSquare, label: 'Interview Prep' },
  { href: '/portfolio', icon: Award, label: 'Portfolio' },
  { href: '/negotiate', icon: HandCoins, label: 'Negotiate' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('phase1')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('users')
        .select('phase, phase_2_start_date')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (!data) return
          const resolved = getPhase(
            data.phase as Phase,
            data.phase_2_start_date,
          )
          setPhase(resolved)
          // Write phase2 back if it just triggered
          if (resolved === 'phase2' && data.phase !== 'phase2') {
            supabase.from('users').update({ phase: 'phase2' }).eq('id', user.id)
          }
        })
    })
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navItems = phase === 'phase2' ? PHASE2_NAV : PHASE1_NAV
  const phaseLabel = phase === 'phase2' ? 'Phase 2: Active Search' : 'Phase 1: Prep Mode'
  const phaseLabelColor = phase === 'phase2' ? 'text-emerald-400' : 'text-muted-foreground'

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'oklch(0.10 0.02 264)' }}>
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col border-r border-white/8"
        style={{ background: 'oklch(0.11 0.025 264)' }}>
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/8">
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
            CareerOS
          </span>
          <p className={cn('text-xs mt-0.5 font-medium', phaseLabelColor)}>{phaseLabel}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href}>
                <motion.div
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    active
                      ? 'bg-gradient-to-r from-indigo-500/20 to-violet-500/10 text-indigo-300 border border-indigo-500/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  )}
                >
                  <Icon size={17} className={active ? 'text-indigo-400' : ''} />
                  {label}
                </motion.div>
              </Link>
            )
          })}
        </nav>

        {/* Sign out */}
        <div className="px-3 py-4 border-t border-white/8">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors w-full"
          >
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="min-h-full"
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}
