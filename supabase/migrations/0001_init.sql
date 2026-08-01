-- Accuracy Analytics Dashboard - initial schema

create extension if not exists pgcrypto;

-- ROSTER
create table if not exists roster (
  msid text primary key,
  employee_id text,
  employee_name text,
  am_name text,
  site text,
  updated_at timestamptz default now()
);

-- RAW DATA (audit cases)
create table if not exists raw_data (
  id uuid primary key default gen_random_uuid(),
  case_id text unique not null,
  technician_msid text not null,
  business_segment text,
  drug_name text,
  gpi text,
  clinical_decision text,
  auto_insight_decision text,
  auditor_finding text,
  auditor text,
  category text,
  subcategory text,
  comments text,
  priority text,
  case_date date,
  month text,
  score smallint,
  created_at timestamptz default now()
);

create index if not exists idx_raw_data_technician on raw_data (technician_msid);
create index if not exists idx_raw_data_date on raw_data (case_date);
create index if not exists idx_raw_data_auditor on raw_data (auditor);

-- COACHING
create table if not exists coaching (
  id uuid primary key default gen_random_uuid(),
  case_id text,
  technician_msid text not null,
  auditor text,
  case_date date,
  date_added_raw text,
  date_added_parsed date,
  is_estimated boolean default false,
  is_not_added boolean default false,
  compliance_days integer,
  comments text,
  created_at timestamptz default now()
);

create index if not exists idx_coaching_technician on coaching (technician_msid);
create index if not exists idx_coaching_auditor on coaching (auditor);

-- UPLOAD LOG
create table if not exists uploads_log (
  id uuid primary key default gen_random_uuid(),
  file_type text not null check (file_type in ('raw_data','roster','coaching')),
  uploaded_by text,
  row_count integer,
  uploaded_at timestamptz default now()
);

-- RLS
alter table roster enable row level security;
alter table raw_data enable row level security;
alter table coaching enable row level security;
alter table uploads_log enable row level security;

drop policy if exists "Public read roster" on roster;
drop policy if exists "Public read raw_data" on raw_data;
drop policy if exists "Public read coaching" on coaching;
drop policy if exists "Public read uploads_log" on uploads_log;
create policy "Public read roster" on roster for select using (true);
create policy "Public read raw_data" on raw_data for select using (true);
create policy "Public read coaching" on coaching for select using (true);
create policy "Public read uploads_log" on uploads_log for select using (true);

drop policy if exists "Admin write roster" on roster;
drop policy if exists "Admin write raw_data" on raw_data;
drop policy if exists "Admin write coaching" on coaching;
drop policy if exists "Admin write uploads_log" on uploads_log;
create policy "Admin write roster" on roster for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Admin write raw_data" on raw_data for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Admin write coaching" on coaching for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Admin write uploads_log" on uploads_log for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Realtime
alter publication supabase_realtime add table raw_data;
alter publication supabase_realtime add table roster;
alter publication supabase_realtime add table coaching;
alter publication supabase_realtime add table uploads_log;
