-- Sprint 3: Interview Prep Engine tables
-- Questions are generated dynamically by Claude — this table is the dedup/history store.
-- Playbooks are generated dynamically and cached here with a 30-day TTL.

-- Generated questions per session (saved for deduplication across sessions)
CREATE TABLE IF NOT EXISTS interview_questions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
  company       TEXT NOT NULL,
  tier          INT NOT NULL CHECK (tier IN (1, 2, 3)),
  category      TEXT NOT NULL CHECK (category IN ('product_sense', 'execution_metrics', 'behavioral', 'strategy_design')),
  question_text TEXT NOT NULL,
  difficulty    INT NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  lp_map        JSONB NOT NULL DEFAULT '[]',
  tags          TEXT[] NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interview_questions_session ON interview_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_interview_questions_company ON interview_questions(company);

-- Dynamically generated company playbooks, regenerated every 30 days
CREATE TABLE IF NOT EXISTS company_playbooks (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company              TEXT NOT NULL UNIQUE,
  tier                 INT NOT NULL CHECK (tier IN (1, 2, 3)),
  interview_format     TEXT NOT NULL,
  what_they_test       TEXT NOT NULL,
  common_mistakes      TEXT NOT NULL,
  insider_tips         TEXT NOT NULL,
  user_specific_angle  TEXT NOT NULL,
  india_context        JSONB,       -- Tier 2 only
  comp_context_inr     TEXT,        -- Tier 2 only
  generated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Human mock milestone sessions (logged at units 26 and 32)
CREATE TABLE IF NOT EXISTS human_mock_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unit_number      INT NOT NULL CHECK (unit_number IN (26, 32)),
  contact_name     TEXT NOT NULL,
  company_context  TEXT NOT NULL,
  key_learning     TEXT NOT NULL,
  completed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_human_mock_user ON human_mock_sessions(user_id);

-- Add human mock flag to curriculum_units for units 26 and 32
ALTER TABLE curriculum_units ADD COLUMN IF NOT EXISTS is_human_mock BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE curriculum_units SET is_human_mock = TRUE WHERE unit_number IN (26, 32);
