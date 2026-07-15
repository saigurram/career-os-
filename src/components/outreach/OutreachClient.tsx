'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Plus, Copy, ExternalLink, AlertCircle, CheckCircle2, Clock, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  STATUS_LABELS, STATUS_COLORS, nextStatus,
  isFollowUpDue, daysSinceSent,
} from '@/lib/outreach'
import type { Tables, OutreachStatus } from '@/types/database'

interface Props {
  contacts: Tables<'outreach_contacts'>[]
  userId: string
  userName: string
  currentCompany: string
  targetLevel: string
  currentUnitNumber: number
}

const stagger = { animate: { transition: { staggerChildren: 0.06 } } }
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

export default function OutreachClient({
  contacts, userId, userName, currentCompany, targetLevel, currentUnitNumber,
}: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any
  const router = useRouter()

  const [localContacts, setLocalContacts] = useState(contacts)
  const [generating, setGenerating] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '', role: '', company: '', linkedin_url: '',
    rationale: '', message_draft: '',
  })

  async function generateContact() {
    setGenerating(true)
    try {
      const res = await fetch('/api/outreach/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUnitNumber, userName, currentCompany, targetLevel }),
      })
      if (res.ok) {
        const generated = await res.json()
        setForm(prev => ({ ...prev, ...generated }))
        setShowAddForm(true)
      }
    } finally {
      setGenerating(false)
    }
  }

  async function saveContact(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.linkedin_url) return

    const { data, error } = await supabase.from('outreach_contacts').insert({
      user_id: userId,
      name: form.name,
      role: form.role,
      company: form.company,
      linkedin_url: form.linkedin_url,
      rationale: form.rationale,
      message_draft: form.message_draft,
      status: 'drafted',
      unit_number: currentUnitNumber,
    }).select().single()

    if (!error && data) {
      setLocalContacts(prev => [data, ...prev])
      setShowAddForm(false)
      setForm({ name: '', role: '', company: '', linkedin_url: '', rationale: '', message_draft: '' })
      router.refresh()
    }
  }

  async function advanceStatus(contact: Tables<'outreach_contacts'>) {
    const next = nextStatus(contact.status)
    if (!next) return

    const updates: Record<string, unknown> = { status: next }
    if (next === 'sent') updates.sent_at = new Date().toISOString()
    if (next === 'replied') updates.replied_at = new Date().toISOString()
    if (next === 'meeting_set') updates.meeting_at = new Date().toISOString()

    await supabase.from('outreach_contacts').update(updates).eq('id', contact.id)
    setLocalContacts(prev =>
      prev.map(c => c.id === contact.id ? { ...c, status: next as OutreachStatus, ...updates } : c)
    )
  }

  async function copyMessage(id: string, message: string) {
    await navigator.clipboard.writeText(message)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const drafted = localContacts.filter(c => c.status === 'drafted')
  const active = localContacts.filter(c => ['sent', 'replied', 'meeting_set'].includes(c.status))
  const closed = localContacts.filter(c => c.status === 'closed')
  const followUpDue = active.filter(c => isFollowUpDue(c.sent_at))

  return (
    <div className="px-8 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div {...fadeUp} initial="initial" animate="animate" className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Users size={22} className="text-indigo-400" />
              <h1 className="text-2xl font-bold text-white">Outreach Engine</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Phase 1: 1 contact per unit · Claude-generated drafts · Owner framing enforced
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={generateContact}
              disabled={generating}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                generating
                  ? 'bg-white/5 border-white/10 text-muted-foreground cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-500/20 to-violet-500/20 border-indigo-500/30 text-indigo-300 hover:from-indigo-500/30 hover:to-violet-500/30 cursor-pointer'
              }`}
            >
              <Sparkles size={15} className={generating ? 'animate-pulse' : ''} />
              {generating ? 'Generating…' : 'Generate Contact'}
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border bg-white/5 border-white/10 text-muted-foreground hover:text-white hover:bg-white/8 transition-all"
            >
              <Plus size={15} />
              Add Manually
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total contacts', value: localContacts.length, color: 'text-white' },
          { label: 'In progress', value: active.length, color: 'text-blue-400' },
          { label: 'Follow-up due', value: followUpDue.length, color: followUpDue.length > 0 ? 'text-amber-400' : 'text-muted-foreground' },
          { label: 'Closed', value: closed.length, color: 'text-emerald-400' },
        ].map(stat => (
          <GlassCard key={stat.label} className="text-center py-4">
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </GlassCard>
        ))}
      </div>

      {/* Add/Generate form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-6"
          >
            <GlassCard className="border-indigo-500/20">
              <h2 className="text-sm font-semibold text-white mb-4">
                {form.name ? 'Review generated contact' : 'Add contact manually'}
              </h2>
              <form onSubmit={saveContact} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Name *</label>
                    <input
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Priya Sharma"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted-foreground/40 focus:outline-none focus:border-indigo-500/40"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Role</label>
                    <input
                      value={form.role}
                      onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                      placeholder="Lead PM"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted-foreground/40 focus:outline-none focus:border-indigo-500/40"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Company</label>
                    <input
                      value={form.company}
                      onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
                      placeholder="Uber India"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted-foreground/40 focus:outline-none focus:border-indigo-500/40"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">LinkedIn URL *</label>
                  <input
                    value={form.linkedin_url}
                    onChange={e => setForm(p => ({ ...p, linkedin_url: e.target.value }))}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted-foreground/40 focus:outline-none focus:border-indigo-500/40"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Why this person</label>
                  <input
                    value={form.rationale}
                    onChange={e => setForm(p => ({ ...p, rationale: e.target.value }))}
                    placeholder="Relevant because..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted-foreground/40 focus:outline-none focus:border-indigo-500/40"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Draft message</label>
                  <textarea
                    value={form.message_draft}
                    onChange={e => setForm(p => ({ ...p, message_draft: e.target.value }))}
                    rows={4}
                    placeholder="Write your message (4 sentences, specific ask, owner framing)..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted-foreground/40 focus:outline-none focus:border-indigo-500/40 resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Save contact
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAddForm(false); setForm({ name: '', role: '', company: '', linkedin_url: '', rationale: '', message_draft: '' }) }}
                    className="px-4 py-2 rounded-lg bg-white/5 text-muted-foreground text-sm hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Follow-up due alert */}
      {followUpDue.length > 0 && (
        <motion.div {...fadeUp} initial="initial" animate="animate" className="mb-6">
          <GlassCard className="border-amber-500/20 bg-amber-500/5">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-400 flex-shrink-0" />
              <p className="text-sm text-amber-300">
                {followUpDue.length} contact{followUpDue.length > 1 ? 's' : ''} sent 7+ days ago without a reply. Follow up today.
              </p>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Contact queue */}
      {localContacts.length === 0 ? (
        <GlassCard className="text-center py-16">
          <Users size={40} className="mx-auto text-muted-foreground/20 mb-3" />
          <p className="text-muted-foreground">No contacts yet</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Generate a contact with Claude or add one manually</p>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {/* Active + drafted */}
          {[...active, ...drafted].length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">Active ({[...active, ...drafted].length})</h2>
              <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-3">
                {[...active, ...drafted].map(contact => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    expanded={expandedId === contact.id}
                    onToggle={() => setExpandedId(p => p === contact.id ? null : contact.id)}
                    onAdvance={() => advanceStatus(contact)}
                    onCopy={() => copyMessage(contact.id, contact.message_draft)}
                    copied={copiedId === contact.id}
                  />
                ))}
              </motion.div>
            </div>
          )}

          {/* Closed */}
          {closed.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">Closed ({closed.length})</h2>
              <div className="space-y-3 opacity-60">
                {closed.map(contact => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    expanded={expandedId === contact.id}
                    onToggle={() => setExpandedId(p => p === contact.id ? null : contact.id)}
                    onAdvance={() => advanceStatus(contact)}
                    onCopy={() => copyMessage(contact.id, contact.message_draft)}
                    copied={copiedId === contact.id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ContactCard({
  contact, expanded, onToggle, onAdvance, onCopy, copied,
}: {
  contact: Tables<'outreach_contacts'>
  expanded: boolean
  onToggle: () => void
  onAdvance: () => void
  onCopy: () => void
  copied: boolean
}) {
  const next = nextStatus(contact.status)
  const days = daysSinceSent(contact.sent_at)
  const followUp = isFollowUpDue(contact.sent_at)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <GlassCard className={`${followUp ? 'border-amber-500/20' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Avatar */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-indigo-300">{contact.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-white">{contact.name}</p>
                {contact.role && <p className="text-xs text-muted-foreground">{contact.role}</p>}
                {contact.company && (
                  <Badge className="text-xs bg-white/5 border-white/10 text-muted-foreground">{contact.company}</Badge>
                )}
                {contact.unit_number && (
                  <Badge className="text-xs bg-indigo-500/10 border-indigo-500/20 text-indigo-300">Unit {contact.unit_number}</Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <Badge className={`text-xs border ${STATUS_COLORS[contact.status]}`}>
                  {STATUS_LABELS[contact.status]}
                </Badge>
                {days !== null && (
                  <span className={`text-xs flex items-center gap-1 ${followUp ? 'text-amber-400' : 'text-muted-foreground'}`}>
                    <Clock size={10} /> {days}d ago
                    {followUp && ' · follow up!'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {next && (
              <button
                onClick={onAdvance}
                className="px-2.5 py-1 rounded-lg text-xs font-medium border bg-white/5 border-white/10 text-muted-foreground hover:text-white hover:border-white/20 transition-all"
              >
                Mark {STATUS_LABELS[next]}
              </button>
            )}
            <a
              href={contact.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors"
            >
              <ExternalLink size={12} />
            </a>
            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-muted-foreground hover:text-white transition-colors text-xs"
            >
              {expanded ? '▲' : '▼'}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-white/8 space-y-3">
                {contact.rationale && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Why this person</p>
                    <p className="text-xs text-white/80">{contact.rationale}</p>
                  </div>
                )}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground">Draft message</p>
                    <button
                      onClick={onCopy}
                      className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      {copied ? <CheckCircle2 size={11} /> : <Copy size={11} />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="bg-white/3 border border-white/8 rounded-lg px-3 py-2.5">
                    <p className="text-xs text-white/80 whitespace-pre-wrap">{contact.message_draft}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  )
}
