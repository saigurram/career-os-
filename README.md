# CareerOS

AI career transition platform. Built for senior professionals making a major move (relocation + level up) who need more than a job board and a resume template.

## Why this exists

Career transitions for senior people fail because everything is disconnected. You build skills on Coursera, track jobs on LinkedIn, prep interviews on Interviewing.io, manage applications in a spreadsheet, and get strategy from a $500/hr coach. No tool holds the full context. Your skill gaps should inform your job targeting, which should inform your interview prep, which should inform your outreach. Today these are separate. CareerOS connects them.

## How it works

Two phases. Phase 1 is a 34 week prep mode: Claude API generates a fresh curriculum every week based on 5 live inputs (your skill gaps, target roles, market data, proof of work portfolio, and interview readiness score). Nothing is hardcoded. Every unit adapts as you close gaps.

Phase 2 flips to active search mode: live job feed with fit scoring per listing, application pipeline, AI drafted outreach personalized to each company, interview simulation with real time language analysis, and negotiation coaching with market comp benchmarks.

The phase boundary is a deliberate product choice. "You're not ready to apply yet" is more valuable than letting people spray premature applications. The system enforces readiness before activating job search.

## Key architecture decisions

The intelligence layer uses Claude API with guardrails baked in at the system prompt level. There's a blocklist that prevents any AI output from leaking employer context (users will paste this into LinkedIn posts and cover letters, so the guardrail must be architectural, not behavioral).

The interview simulator flags "contributor language" in real time. Senior ICs get rejected because they say "I helped" and "I supported" instead of owning outcomes. The simulator catches this and forces reframing. Single highest leverage intervention for senior PM interviews.

Multi tenant from day one (full Row Level Security, user scoped data). Building it later means rewriting auth, data access, and AI context isolation. 2 extra days now saves 2 months of migration later.

## Tech

Next.js 14, React, TypeScript, Tailwind, shadcn/ui, Claude API (Sonnet), Supabase (PostgreSQL + Auth + Realtime + RLS + Cron), Vercel, Recharts, Adzuna API for job data.

## What I'd change

Should have shipped the interview simulator first as a standalone product. It's the highest anxiety moment, the clearest 10x improvement over current options, and the easiest to charge for. Built the curriculum engine first because it felt more "complete" but nobody pays for a curriculum. They pay to stop being terrified of interviews.
