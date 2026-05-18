-- Creative Media Analyser: database schema
--
-- Reconstructed from src/types/database.ts. If you find discrepancies after
-- running this against a fresh Supabase project, open an issue on the repo.
--
-- Access model: UUID-gated, single-operator self-host. RLS is enabled on every
-- table but all policies are permissive (service role has full access). There is
-- no per-user auth; see LIMITATIONS.md section 4.

-- ----------------------------------------------------------------------------
-- 1. projects
-- ----------------------------------------------------------------------------

create table if not exists projects (
  id              uuid        primary key default gen_random_uuid(),
  name            text        not null,
  brand_name      text        not null,
  brand_category  text        not null,
  campaign_goal   text,
  target_audience text,
  primary_kpi     text        not null,
  tone            text,
  platform        text        not null,
  pre_registered_variables text[] not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table projects enable row level security;
create policy "service_role_full_access" on projects for all using (true);

-- ----------------------------------------------------------------------------
-- 2. creatives
-- ----------------------------------------------------------------------------

create table if not exists creatives (
  id              uuid        primary key default gen_random_uuid(),
  project_id      uuid        not null references projects(id) on delete cascade,
  filename        text        not null,
  storage_path    text        not null,
  media_type      text        not null,
  file_size_bytes integer,
  width           integer,
  height          integer,
  created_at      timestamptz not null default now()
);

create index idx_creatives_project_id on creatives(project_id);
alter table creatives enable row level security;
create policy "service_role_full_access" on creatives for all using (true);

-- ----------------------------------------------------------------------------
-- 3. performance_uploads
-- ----------------------------------------------------------------------------

create table if not exists performance_uploads (
  id                  uuid        primary key default gen_random_uuid(),
  project_id          uuid        not null references projects(id) on delete cascade,
  original_filename   text        not null,
  row_count           integer     not null default 0,
  columns_detected    text[]      not null default '{}',
  validation_status   text        not null,
  validation_details  jsonb       not null default '{}',
  snapshot_number     integer     not null default 1,
  created_at          timestamptz not null default now()
);

create index idx_performance_uploads_project_id on performance_uploads(project_id);
alter table performance_uploads enable row level security;
create policy "service_role_full_access" on performance_uploads for all using (true);

-- ----------------------------------------------------------------------------
-- 4. performance_rows
-- ----------------------------------------------------------------------------

create table if not exists performance_rows (
  id                    uuid        primary key default gen_random_uuid(),
  upload_id             uuid        not null references performance_uploads(id) on delete cascade,
  project_id            uuid        not null references projects(id) on delete cascade,
  creative_id           uuid        references creatives(id) on delete set null,
  source_filename       text,
  source_creative_id    text,
  source_ad_id          text,
  source_asset_id       text,
  source_ad_name        text,
  source_creative_name  text,
  impressions           numeric,
  clicks                numeric,
  spend                 numeric,
  conversions           numeric,
  revenue               numeric,
  date_start            text,
  date_end              text,
  campaign_name         text,
  adset_name            text,
  platform              text,
  placement             text,
  snapshot_number        integer    not null default 1,
  is_latest             boolean    not null default true,
  extra_columns         jsonb      not null default '{}',
  created_at            timestamptz not null default now()
);

create index idx_performance_rows_project_latest on performance_rows(project_id, is_latest);
create index idx_performance_rows_upload_id on performance_rows(upload_id);
alter table performance_rows enable row level security;
create policy "service_role_full_access" on performance_rows for all using (true);

-- ----------------------------------------------------------------------------
-- 5. creative_mappings
-- ----------------------------------------------------------------------------

create table if not exists creative_mappings (
  id                  uuid        primary key default gen_random_uuid(),
  project_id          uuid        not null references projects(id) on delete cascade,
  creative_id         uuid        not null references creatives(id) on delete cascade,
  performance_row_id  uuid        not null references performance_rows(id) on delete cascade,
  match_method        text        not null,
  match_confidence    numeric     not null default 0,
  status              text        not null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_creative_mappings_project_id on creative_mappings(project_id);
alter table creative_mappings enable row level security;
create policy "service_role_full_access" on creative_mappings for all using (true);

-- ----------------------------------------------------------------------------
-- 6. variable_schemas
-- ----------------------------------------------------------------------------

create table if not exists variable_schemas (
  id          uuid        primary key default gen_random_uuid(),
  project_id  uuid        not null references projects(id) on delete cascade,
  version     integer     not null default 1,
  is_active   boolean     not null default true,
  variables   jsonb       not null default '[]',
  created_at  timestamptz not null default now()
);

create index idx_variable_schemas_project_active on variable_schemas(project_id, is_active);
alter table variable_schemas enable row level security;
create policy "service_role_full_access" on variable_schemas for all using (true);

-- ----------------------------------------------------------------------------
-- 7. analysis_runs
-- ----------------------------------------------------------------------------

create table if not exists analysis_runs (
  id                   uuid        primary key default gen_random_uuid(),
  project_id           uuid        not null references projects(id) on delete cascade,
  schema_id            uuid        not null references variable_schemas(id) on delete cascade,
  status               text        not null,
  total_creatives      integer     not null default 0,
  completed_creatives  integer     not null default 0,
  failed_creatives     integer     not null default 0,
  total_input_tokens   integer     not null default 0,
  total_output_tokens  integer     not null default 0,
  total_cost           numeric     not null default 0,
  started_at           timestamptz,
  completed_at         timestamptz,
  created_at           timestamptz not null default now()
);

create index idx_analysis_runs_project_id on analysis_runs(project_id);
alter table analysis_runs enable row level security;
create policy "service_role_full_access" on analysis_runs for all using (true);

-- ----------------------------------------------------------------------------
-- 8. extraction_results
-- ----------------------------------------------------------------------------

create table if not exists extraction_results (
  id                  uuid        primary key default gen_random_uuid(),
  run_id              uuid        not null references analysis_runs(id) on delete cascade,
  creative_id         uuid        not null references creatives(id) on delete cascade,
  extracted_variables jsonb       not null default '{}',
  input_tokens        integer     not null default 0,
  output_tokens       integer     not null default 0,
  cost                numeric     not null default 0,
  duration_ms         integer,
  status              text        not null,
  error_message       text,
  created_at          timestamptz not null default now()
);

create index idx_extraction_results_run_id on extraction_results(run_id);
alter table extraction_results enable row level security;
create policy "service_role_full_access" on extraction_results for all using (true);

-- ----------------------------------------------------------------------------
-- 9. insights
-- ----------------------------------------------------------------------------

create table if not exists insights (
  id                uuid        primary key default gen_random_uuid(),
  project_id        uuid        not null references projects(id) on delete cascade,
  run_id            uuid        references analysis_runs(id) on delete set null,
  title             text        not null,
  body              text        not null,
  evidence          text,
  sample_size       integer,
  confidence_label  text        not null default 'Low',
  recommended_test  text,
  created_at        timestamptz not null default now()
);

create index idx_insights_project_id on insights(project_id);
alter table insights enable row level security;
create policy "service_role_full_access" on insights for all using (true);

-- ----------------------------------------------------------------------------
-- Storage bucket for creative images
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('creatives', 'creatives', true)
on conflict (id) do nothing;
