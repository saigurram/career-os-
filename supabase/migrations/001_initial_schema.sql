-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  job_title text not null default 'Senior Product Manager',
  current_level text not null default 'L6',
  current_company text not null default 'Amazon',
  target_level text not null default 'Principal PM',
  target_location text not null default 'Hyderabad',
  relocation_date date,
  offer_deadline date not null default '2027-06-30',
  phase text not null default 'phase1' check (phase in ('phase1', 'phase2')),
  phase_2_start_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;
create policy "Users can read/write own record" on public.users
  using (auth.uid() = id) with check (auth.uid() = id);

-- ============================================================
-- USER PROFILE
-- ============================================================
create table public.user_profile (
  user_id uuid primary key references public.users(id) on delete cascade,
  total_impact_usd numeric,
  years_experience integer not null default 0,
  skill_scores jsonb not null default '{}',
  genai_baseline_score numeric not null default 0,
  last_reassessed_at timestamptz
);

alter table public.user_profile enable row level security;
create policy "Users can read/write own profile" on public.user_profile
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- INTAKE RESPONSES
-- ============================================================
create table public.intake_responses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  dimension text not null,
  question text not null,
  response text not null,
  score numeric not null,
  assessed_at timestamptz not null default now()
);

alter table public.intake_responses enable row level security;
create policy "Users can read/write own intake" on public.intake_responses
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- BLOCKED NAMES (NDA REGISTRY)
-- ============================================================
create table public.blocked_names (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  internal_name text not null,
  generic_replacement text not null,
  safe_for_external boolean not null default false,
  notes text,
  added_at timestamptz not null default now()
);

alter table public.blocked_names enable row level security;
create policy "Users can read/write own blocked names" on public.blocked_names
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- CURRICULUM UNITS
-- ============================================================
create table public.curriculum_units (
  id uuid primary key default uuid_generate_v4(),
  unit_number integer not null unique,
  phase text not null default 'phase1' check (phase in ('phase1', 'phase2')),
  primary_theme text not null,
  required_ai_concept_tier integer not null default 1,
  pow_type_constraint text,
  feature_gate text,
  is_interview_heavy boolean not null default false,
  is_materials_heavy boolean not null default false
);

alter table public.curriculum_units enable row level security;
create policy "All authenticated users can read curriculum" on public.curriculum_units
  for select using (auth.role() = 'authenticated');

-- ============================================================
-- CURRICULUM UNIT CONTENT (Claude-generated)
-- ============================================================
create table public.curriculum_unit_content (
  id uuid primary key default uuid_generate_v4(),
  unit_id uuid not null references public.curriculum_units(id) on delete cascade,
  generated_at timestamptz not null default now(),
  learn_resource_title text not null,
  learn_resource_url text not null,
  learn_prompt text not null,
  create_task text not null,
  create_type text not null,
  outreach_criteria text not null,
  ai_concept_id uuid,
  reflect_question text not null
);

alter table public.curriculum_unit_content enable row level security;
create policy "All authenticated users can read unit content" on public.curriculum_unit_content
  for select using (auth.role() = 'authenticated');

-- ============================================================
-- USER UNIT PROGRESS
-- ============================================================
create table public.user_unit_progress (
  user_id uuid not null references public.users(id) on delete cascade,
  unit_id uuid not null references public.curriculum_units(id) on delete cascade,
  learn_done boolean not null default false,
  create_done boolean not null default false,
  outreach_done boolean not null default false,
  reflect_done boolean not null default false,
  pow_artifact_id uuid,
  notes text,
  completed_at timestamptz,
  primary key (user_id, unit_id)
);

alter table public.user_unit_progress enable row level security;
create policy "Users can read/write own progress" on public.user_unit_progress
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- AI CONCEPTS (42 total)
-- ============================================================
create table public.ai_concepts (
  id uuid primary key default uuid_generate_v4(),
  concept_number integer not null unique,
  name text not null,
  tier integer not null check (tier between 1 and 4),
  description text not null,
  why_pm_needs_it text not null,
  covered boolean not null default false
);

alter table public.ai_concepts enable row level security;
create policy "All authenticated users can read ai concepts" on public.ai_concepts
  for select using (auth.role() = 'authenticated');

-- ============================================================
-- USER AI CONCEPT COVERAGE
-- ============================================================
create table public.user_ai_concept_coverage (
  user_id uuid not null references public.users(id) on delete cascade,
  concept_id uuid not null references public.ai_concepts(id) on delete cascade,
  covered_in_unit integer not null,
  covered_at timestamptz not null default now(),
  primary key (user_id, concept_id)
);

alter table public.user_ai_concept_coverage enable row level security;
create policy "Users can read/write own concept coverage" on public.user_ai_concept_coverage
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- PROOF-OF-WORK ARTIFACTS
-- ============================================================
create table public.pow_artifacts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  unit_id uuid references public.curriculum_units(id),
  title text not null,
  type text not null,
  url text,
  published_at timestamptz,
  skill_dimensions text[] not null default '{}',
  recruiter_description text,
  nda_review_passed boolean not null default false,
  authenticity_review_passed boolean not null default false
);

alter table public.pow_artifacts enable row level security;
create policy "Users can read/write own artifacts" on public.pow_artifacts
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- JOBS
-- ============================================================
create table public.jobs (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  company text not null,
  location text not null,
  level_estimate text,
  comp_estimate_inr numeric,
  jd_text text not null default '',
  source_url text not null,
  posted_at timestamptz,
  fetched_at timestamptz not null default now(),
  fit_score numeric,
  fit_analysis jsonb,
  is_active boolean not null default true,
  is_remote boolean not null default false
);

alter table public.jobs enable row level security;
create policy "All authenticated users can read jobs" on public.jobs
  for select using (auth.role() = 'authenticated');
create policy "Service role can insert jobs" on public.jobs
  for insert with check (true);
create policy "Service role can update jobs" on public.jobs
  for update using (true);

-- ============================================================
-- USER JOB ACTIONS
-- ============================================================
create table public.user_job_actions (
  user_id uuid not null references public.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  action text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, job_id, action)
);

alter table public.user_job_actions enable row level security;
create policy "Users can read/write own job actions" on public.user_job_actions
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- APPLICATIONS
-- ============================================================
create table public.applications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id),
  status text not null default 'spotted',
  applied_at timestamptz not null default now(),
  resume_version_id uuid,
  next_action text,
  next_action_due date,
  notes text
);

alter table public.applications enable row level security;
create policy "Users can read/write own applications" on public.applications
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- OUTREACH CONTACTS
-- ============================================================
create table public.outreach_contacts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  role text not null,
  company text not null,
  linkedin_url text not null,
  rationale text not null,
  message_draft text not null,
  status text not null default 'drafted',
  sent_at timestamptz,
  replied_at timestamptz,
  meeting_at timestamptz,
  unit_number integer
);

alter table public.outreach_contacts enable row level security;
create policy "Users can read/write own outreach" on public.outreach_contacts
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- STORY BANK
-- ============================================================
create table public.story_bank (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  situation text not null,
  what_i_drove text not null,
  outcome text not null,
  impact_number text,
  lp_map jsonb not null default '{}',
  company_map jsonb not null default '{}',
  owner_framing_score numeric
);

alter table public.story_bank enable row level security;
create policy "Users can read/write own stories" on public.story_bank
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- RESUMES
-- ============================================================
create table public.resumes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  version_name text not null,
  track text not null,
  content jsonb not null default '{}',
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

alter table public.resumes enable row level security;
create policy "Users can read/write own resumes" on public.resumes
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- INTERVIEW SESSIONS
-- ============================================================
create table public.interview_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  company text not null,
  round_type text not null,
  pressure_mode boolean not null default false,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  overall_score numeric,
  debrief jsonb,
  pattern_analysis jsonb
);

alter table public.interview_sessions enable row level security;
create policy "Users can read/write own sessions" on public.interview_sessions
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- INTERVIEW ANSWERS
-- ============================================================
create table public.interview_answers (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  question_text text not null,
  answer_text text not null,
  score numeric,
  feedback jsonb,
  created_at timestamptz not null default now()
);

alter table public.interview_answers enable row level security;
create policy "Users can read/write own answers" on public.interview_answers
  using (auth.uid() = (select user_id from public.interview_sessions where id = session_id));

-- ============================================================
-- OFFERS
-- ============================================================
create table public.offers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  application_id uuid references public.applications(id),
  company text not null,
  role text not null,
  base_inr numeric not null,
  bonus_inr numeric,
  rsu_inr numeric,
  joining_bonus_inr numeric,
  offered_at timestamptz not null default now(),
  deadline date,
  benchmark_data jsonb,
  counter_recommendation jsonb,
  counter_email_draft text,
  call_script text
);

alter table public.offers enable row level security;
create policy "Users can read/write own offers" on public.offers
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger handle_users_updated_at
  before update on public.users
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- NEW USER TRIGGER (auto-create users row on signup)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  insert into public.user_profile (user_id, years_experience, skill_scores, genai_baseline_score)
  values (new.id, 0, '{}', 0);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
