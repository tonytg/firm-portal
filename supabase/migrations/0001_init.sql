-- IMPACT Portal - initial schema + row-level security
-- Run this in the Supabase SQL editor (or via `supabase db push`).
--
-- Security model:
--   profiles.role = 'admin' | 'client'; admins see everything, clients are
--   scoped to their own organisation (profiles.client_id). Enforced by RLS so
--   the rules hold even against hand-crafted requests. Advisor-only data
--   (risk_items) is never exposed to clients. Advisor-controlled fields
--   (scheduling, releases, activation) are admin-only writes.

-- ── Enums ────────────────────────────────────────────────────────────────
create type user_role as enum ('admin', 'client');
create type pillar as enum ('pillar_1', 'pillar_2');
create type stage_status as enum (
  'not_started', 'in_progress', 'under_analysis', 'scheduled', 'completed', 'locked'
);
create type deliverable_gate as enum (
  'executive_first', 'after_validation', 'after_walkthrough'
);

-- ── Core tables ──────────────────────────────────────────────────────────
create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  sector text check (sector in ('Hospital', 'F&B', 'Construction', 'Other')),
  created_at timestamptz not null default now()
);

-- One row per auth user, linking it to a role and (for clients) an org.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'client',
  client_id uuid references clients(id) on delete set null,
  full_name text,
  email text,
  created_at timestamptz not null default now()
);

create table engagements (
  id text primary key,
  client_id uuid not null references clients(id) on delete cascade,
  pillar pillar not null,
  title text not null,
  advisor_name text,
  industry text,
  sector text,
  loe_signed boolean not null default false,
  phase1_payment_received boolean not null default false,
  final_payment_received boolean not null default false,
  activation_override boolean not null default false,
  activated_at timestamptz,
  created_at timestamptz not null default now()
);

create table stage_states (
  engagement_id text not null references engagements(id) on delete cascade,
  key text not null,
  status stage_status not null default 'not_started',
  internal_note text,
  completed_at timestamptz,
  primary key (engagement_id, key)
);

create table meetings (
  id uuid primary key default gen_random_uuid(),
  engagement_id text not null references engagements(id) on delete cascade,
  stage_key text not null,
  title text not null,
  session_type text not null,
  scheduled_at timestamptz,
  location text,
  duration_minutes int,
  participants jsonb not null default '[]',
  agenda jsonb not null default '[]',
  attendance_confirmed boolean not null default false,
  sign_off_uploaded boolean not null default false
);

create table deliverables (
  id text primary key,
  engagement_id text not null references engagements(id) on delete cascade,
  title text not null,
  format text not null default 'PDF',
  release_gate deliverable_gate not null,
  released boolean not null default false,
  file_path text
);

-- Advisor-only working notes (Pillar 1). Never exposed to clients.
create table risk_items (
  id uuid primary key default gen_random_uuid(),
  engagement_id text not null references engagements(id) on delete cascade,
  cause text,
  event text,
  impact text
);

create table questionnaire_responses (
  engagement_id text not null references engagements(id) on delete cascade,
  stage text not null,
  question_id text not null,
  answer text,
  updated_at timestamptz not null default now(),
  primary key (engagement_id, stage, question_id)
);

create table questionnaire_submissions (
  engagement_id text not null references engagements(id) on delete cascade,
  stage text not null,
  submitted_at timestamptz,
  primary key (engagement_id, stage)
);

create index on engagements (client_id);
create index on meetings (engagement_id);
create index on deliverables (engagement_id);
create index on questionnaire_responses (engagement_id, stage);

-- ── Helper functions (SECURITY DEFINER: read profile without RLS recursion) ─
create or replace function auth_role() returns user_role
  language sql stable security definer set search_path = public as
$$ select role from profiles where id = auth.uid() $$;

create or replace function auth_client_id() returns uuid
  language sql stable security definer set search_path = public as
$$ select client_id from profiles where id = auth.uid() $$;

create or replace function is_admin() returns boolean
  language sql stable security definer set search_path = public as
$$ select coalesce(auth_role() = 'admin', false) $$;

create or replace function can_access_engagement(eid text) returns boolean
  language sql stable security definer set search_path = public as
$$
  select is_admin() or exists (
    select 1 from engagements e
    where e.id = eid and e.client_id = auth_client_id()
  )
$$;

-- ── Enable RLS ───────────────────────────────────────────────────────────
alter table clients enable row level security;
alter table profiles enable row level security;
alter table engagements enable row level security;
alter table stage_states enable row level security;
alter table meetings enable row level security;
alter table deliverables enable row level security;
alter table risk_items enable row level security;
alter table questionnaire_responses enable row level security;
alter table questionnaire_submissions enable row level security;

-- profiles: a user sees their own; admins manage all.
create policy profiles_select on profiles for select
  using (id = auth.uid() or is_admin());
create policy profiles_admin_write on profiles for all
  using (is_admin()) with check (is_admin());

-- clients: admin all; client reads own org.
create policy clients_select on clients for select
  using (is_admin() or id = auth_client_id());
create policy clients_admin_write on clients for all
  using (is_admin()) with check (is_admin());

-- engagements: admin all; client reads own org.
create policy engagements_select on engagements for select
  using (is_admin() or client_id = auth_client_id());
create policy engagements_admin_write on engagements for all
  using (is_admin()) with check (is_admin());

-- stage_states / deliverables: admin all; client read-only within org.
create policy stage_states_select on stage_states for select
  using (can_access_engagement(engagement_id));
create policy stage_states_admin_write on stage_states for all
  using (is_admin()) with check (is_admin());

create policy deliverables_select on deliverables for select
  using (can_access_engagement(engagement_id));
create policy deliverables_admin_write on deliverables for all
  using (is_admin()) with check (is_admin());

-- meetings: client reads within org; writes are admin-only
-- (attendance confirmation goes through confirm_attendance() below).
create policy meetings_select on meetings for select
  using (can_access_engagement(engagement_id));
create policy meetings_admin_write on meetings for all
  using (is_admin()) with check (is_admin());

-- risk_items: advisor-only, no client access at all.
create policy risk_items_admin_all on risk_items for all
  using (is_admin()) with check (is_admin());

-- questionnaire responses + submissions: admin all; client read/write own org.
create policy responses_select on questionnaire_responses for select
  using (can_access_engagement(engagement_id));
create policy responses_write on questionnaire_responses for all
  using (can_access_engagement(engagement_id))
  with check (can_access_engagement(engagement_id));

create policy submissions_select on questionnaire_submissions for select
  using (can_access_engagement(engagement_id));
create policy submissions_write on questionnaire_submissions for all
  using (can_access_engagement(engagement_id))
  with check (can_access_engagement(engagement_id));

-- ── Client attendance confirmation (only field a client may change on a meeting) ─
create or replace function confirm_attendance(meeting_id uuid, confirmed boolean)
  returns void language plpgsql security definer set search_path = public as
$$
begin
  update meetings m
     set attendance_confirmed = confirmed
   where m.id = meeting_id
     and can_access_engagement(m.engagement_id);
end;
$$;
