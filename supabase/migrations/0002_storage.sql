-- IMPACT Portal - storage metadata (run after 0001, in the Supabase SQL editor)
-- The two private buckets ('evidence','deliverables') are created by
-- scripts/setup-storage.mjs. Files are accessed only through service-role
-- server actions that authorize the caller first, so no storage.objects RLS is
-- needed for end users. This table tracks uploaded evidence per question.

create table evidence_files (
  id uuid primary key default gen_random_uuid(),
  engagement_id text not null references engagements(id) on delete cascade,
  stage text not null,
  question_id text not null,
  path text not null,
  filename text not null,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index on evidence_files (engagement_id, stage);

alter table evidence_files enable row level security;

create policy evidence_files_select on evidence_files for select
  using (can_access_engagement(engagement_id));
create policy evidence_files_write on evidence_files for all
  using (can_access_engagement(engagement_id))
  with check (can_access_engagement(engagement_id));
