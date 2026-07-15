-- Sprint 3 pending items: curriculum on-demand generation history
-- Stores replaced content so users can review what changed and why

CREATE TABLE IF NOT EXISTS curriculum_unit_content_history (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id          UUID NOT NULL REFERENCES curriculum_units(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content          JSONB NOT NULL,
  replaced_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  replaced_because TEXT NOT NULL CHECK (replaced_because IN ('manual', 'smart_refresh', 'stale'))
);

CREATE INDEX IF NOT EXISTS idx_content_history_unit ON curriculum_unit_content_history(unit_id);
CREATE INDEX IF NOT EXISTS idx_content_history_user ON curriculum_unit_content_history(user_id);
