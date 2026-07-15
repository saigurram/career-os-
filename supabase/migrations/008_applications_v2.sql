-- Sprint 4: Application tracker columns and stage constraint

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS company TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT,
  ADD COLUMN IF NOT EXISTS fit_score NUMERIC,
  ADD COLUMN IF NOT EXISTS key_contact TEXT;

-- Replace open-ended status with a strict stage check
ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_status_check CHECK (
    status IN (
      'spotted', 'interested', 'applied', 'recruiter_screen',
      'hm_round', 'loop', 'offer', 'negotiating', 'closed'
    )
  );
