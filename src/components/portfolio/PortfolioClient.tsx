'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, ExternalLink, CheckCircle2, AlertCircle, FileText,
  Video, FileCode, BookOpen, X, Link2, GitBranch
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Tables, PowType } from '@/types/database'

interface Props {
  artifacts: Tables<'pow_artifacts'>[]
  units: Pick<Tables<'curriculum_units'>, 'id' | 'unit_number' | 'primary_theme'>[]
  userId: string
}

const TYPE_META: Record<PowType, { label: string; icon: React.ElementType; color: string }> = {
  linkedin_post: { label: 'LinkedIn post', icon: Link2, color: 'text-blue-400' },
  github_repo: { label: 'GitHub repo', icon: GitBranch, color: 'text-zinc-400' },
  notion_doc: { label: 'Notion doc', icon: BookOpen, color: 'text-orange-400' },
  demo_video: { label: 'Demo video', icon: Video, color: 'text-red-400' },
  product_spec: { label: 'Product spec', icon: FileCode, color: 'text-violet-400' },
}

const SKILL_DIMENSIONS = [
  'GenAI PM fluency', 'Platform product thinking', 'Executive communication',
  'Stakeholder influence', 'Data & analytics', 'Domain depth', 'External visibility',
]

export default function PortfolioClient({ artifacts, units, userId }: Props) {
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any
  const [localArtifacts, setLocalArtifacts] = useState(artifacts)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    type: 'linkedin_post' as PowType,
    url: '',
    skill_dimensions: [] as string[],
    unit_id: '',
  })

  const published = localArtifacts.filter(a => a.published_at)
  const drafts = localArtifacts.filter(a => !a.published_at)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { data, error } = await supabase.from('pow_artifacts').insert({
      user_id: userId,
      title: form.title,
      type: form.type,
      url: form.url || null,
      skill_dimensions: form.skill_dimensions,
      unit_id: form.unit_id || null,
      nda_review_passed: false,
      authenticity_review_passed: false,
    }).select().single()

    if (!error && data) {
      setLocalArtifacts(prev => [data, ...prev])
      setShowForm(false)
      setForm({ title: '', type: 'linkedin_post', url: '', skill_dimensions: [], unit_id: '' })
    }

    setSaving(false)
    router.refresh()
  }

  async function markPublished(id: string) {
    const now = new Date().toISOString()
    await supabase.from('pow_artifacts').update({ published_at: now }).eq('id', id)
    setLocalArtifacts(prev => prev.map(a => a.id === id ? { ...a, published_at: now } : a))
    router.refresh()
  }

  function toggleDimension(dim: string) {
    setForm(prev => ({
      ...prev,
      skill_dimensions: prev.skill_dimensions.includes(dim)
        ? prev.skill_dimensions.filter(d => d !== dim)
        : [...prev.skill_dimensions, dim],
    }))
  }

  return (
    <div className="px-8 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Proof-of-Work Portfolio</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {published.length} published · {drafts.length} in progress · Target: 12 by Jan 2027
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 border-0"
        >
          <Plus size={16} className="mr-1" /> Add artifact
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <GlassCard className="text-center">
          <p className="text-3xl font-bold text-white">{published.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Published</p>
        </GlassCard>
        <GlassCard className="text-center">
          <p className="text-3xl font-bold text-white">{drafts.length}</p>
          <p className="text-xs text-muted-foreground mt-1">In progress</p>
        </GlassCard>
        <GlassCard className="text-center border-indigo-500/20">
          <p className="text-3xl font-bold text-indigo-400">{Math.max(0, 12 - published.length)}</p>
          <p className="text-xs text-muted-foreground mt-1">Needed for target</p>
        </GlassCard>
      </div>

      {/* Add form dialog */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && setShowForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="w-full max-w-lg"
            >
              <GlassCard className="border-white/15">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">Add artifact</h2>
                  <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-white">
                    <X size={18} />
                  </button>
                </div>
                <form onSubmit={handleAdd} className="space-y-4">
                  <div>
                    <Label className="text-zinc-300">Title</Label>
                    <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                      placeholder="How I built a cost optimizer using LLMs"
                      required className="mt-1.5 bg-white/5 border-white/10 text-white" />
                  </div>
                  <div>
                    <Label className="text-zinc-300">Type</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1.5">
                      {(Object.entries(TYPE_META) as [PowType, typeof TYPE_META[PowType]][]).map(([type, meta]) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setForm(p => ({ ...p, type }))}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${
                            form.type === type
                              ? 'bg-indigo-500/15 border-indigo-500/30 text-white'
                              : 'border-white/10 text-muted-foreground hover:bg-white/5'
                          }`}
                        >
                          <meta.icon size={14} className={form.type === type ? meta.color : ''} />
                          {meta.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-zinc-300">URL (optional)</Label>
                    <Input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
                      placeholder="https://linkedin.com/posts/..."
                      className="mt-1.5 bg-white/5 border-white/10 text-white" />
                  </div>
                  <div>
                    <Label className="text-zinc-300 mb-2 block">Skill dimensions</Label>
                    <div className="flex flex-wrap gap-2">
                      {SKILL_DIMENSIONS.map(dim => (
                        <button
                          key={dim}
                          type="button"
                          onClick={() => toggleDimension(dim)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                            form.skill_dimensions.includes(dim)
                              ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300'
                              : 'border-white/10 text-muted-foreground hover:border-white/20'
                          }`}
                        >
                          {dim}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-zinc-300">Linked unit (optional)</Label>
                    <select
                      value={form.unit_id}
                      onChange={e => setForm(p => ({ ...p, unit_id: e.target.value }))}
                      className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-300"
                    >
                      <option value="">None</option>
                      {units.map(u => (
                        <option key={u.id} value={u.id}>Unit {u.unit_number}: {u.primary_theme}</option>
                      ))}
                    </select>
                  </div>
                  <Button type="submit" disabled={saving} className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 border-0">
                    {saving ? 'Saving…' : 'Add artifact'}
                  </Button>
                </form>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Artifact grid */}
      {localArtifacts.length === 0 ? (
        <GlassCard className="text-center py-16">
          <FileText size={40} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No artifacts yet. Every Create task produces a publishable output.</p>
          <Button onClick={() => setShowForm(true)} variant="ghost" className="mt-3 text-indigo-400">
            Add your first artifact
          </Button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {localArtifacts.map((artifact, i) => {
            const meta = TYPE_META[artifact.type as PowType]
            const Icon = meta?.icon ?? FileText
            return (
              <motion.div
                key={artifact.id}
                data-testid="artifact-card"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <GlassCard className="h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-white/5">
                        <Icon size={16} className={meta?.color ?? 'text-zinc-400'} />
                      </div>
                      <Badge variant="secondary" className="text-xs bg-white/5 border-white/10 text-muted-foreground">
                        {meta?.label}
                      </Badge>
                    </div>
                    {artifact.published_at ? (
                      <Badge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-xs">
                        <CheckCircle2 size={10} className="mr-1" /> Published
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/10 border-amber-500/20 text-amber-400 text-xs">
                        <AlertCircle size={10} className="mr-1" /> Draft
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-white mb-2 line-clamp-2">{artifact.title}</h3>

                  {artifact.skill_dimensions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {artifact.skill_dimensions.map(dim => (
                        <span key={dim} className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/15">
                          {dim}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* NDA + authenticity badges */}
                  <div className="flex gap-2 mb-3">
                    <span className={`text-xs flex items-center gap-1 ${artifact.nda_review_passed ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                      {artifact.nda_review_passed ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />} NDA
                    </span>
                    <span className={`text-xs flex items-center gap-1 ${artifact.authenticity_review_passed ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                      {artifact.authenticity_review_passed ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />} Authentic
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-auto pt-2">
                    {artifact.url && (
                      <a href={artifact.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                        <ExternalLink size={11} /> View
                      </a>
                    )}
                    {!artifact.published_at && (
                      <button
                        onClick={() => markPublished(artifact.id)}
                        className="text-xs text-emerald-400 hover:text-emerald-300 ml-auto"
                      >
                        Mark published
                      </button>
                    )}
                    {artifact.published_at && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(artifact.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
