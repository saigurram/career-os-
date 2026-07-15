-- Add rich content columns to curriculum_unit_content.
-- All columns are nullable so existing rows keep working.
ALTER TABLE public.curriculum_unit_content
  ADD COLUMN IF NOT EXISTS learn_why TEXT,
  ADD COLUMN IF NOT EXISTS create_good_looks_like TEXT,
  ADD COLUMN IF NOT EXISTS outreach_message_draft TEXT;
