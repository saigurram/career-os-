-- Add new curriculum content columns for v3 prompt schema.
-- All nullable so existing rows keep working.
ALTER TABLE public.curriculum_unit_content
  ADD COLUMN IF NOT EXISTS learn_resource_format TEXT,
  ADD COLUMN IF NOT EXISTS learn_resource_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS create_opening_line TEXT,
  ADD COLUMN IF NOT EXISTS create_nda_note TEXT,
  ADD COLUMN IF NOT EXISTS outreach_linkedin_search TEXT;
-- Note: outreach_who maps to existing outreach_criteria column (no rename needed).
