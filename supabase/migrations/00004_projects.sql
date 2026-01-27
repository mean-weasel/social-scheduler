-- Projects table - organizational unit above campaigns
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Core fields
  name text not null,
  description text,

  -- Brand kit
  hashtags text[] default '{}',
  brand_colors jsonb default '{}',
  logo_url text,

  -- Constraints
  constraint projects_name_not_empty check (char_length(trim(name)) > 0)
);

-- Indexes
create index projects_user_id_idx on projects(user_id);
create index projects_created_at_idx on projects(created_at desc);

-- Updated_at trigger (reuses existing function from 00001)
create trigger projects_updated_at
  before update on projects
  for each row execute function update_updated_at();

-- Add project_id to campaigns table
alter table campaigns
  add column project_id uuid references projects(id) on delete set null;

-- Index for campaign-project relationship
create index campaigns_project_id_idx on campaigns(project_id);
