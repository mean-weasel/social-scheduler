-- Posts table
create table posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  scheduled_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'published', 'failed', 'archived')),
  platform text not null check (platform in ('twitter', 'linkedin', 'reddit')),
  content jsonb not null default '{}',
  notes text,
  publish_result jsonb,
  campaign_id uuid,
  group_id text,
  group_type text
);

-- Campaigns table
create table campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Blog drafts table
create table blog_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  scheduled_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'published', 'archived')),
  title text not null,
  date date,
  content text,
  notes text,
  word_count integer default 0,
  campaign_id uuid references campaigns(id) on delete set null,
  images jsonb default '[]'
);

-- Add foreign key for posts -> campaigns
alter table posts
  add constraint posts_campaign_id_fkey
  foreign key (campaign_id) references campaigns(id) on delete set null;

-- Indexes
create index posts_user_id_idx on posts(user_id);
create index posts_status_idx on posts(status);
create index posts_scheduled_at_idx on posts(scheduled_at);
create index posts_platform_idx on posts(platform);
create index posts_campaign_id_idx on posts(campaign_id);
create index posts_group_id_idx on posts(group_id);

create index campaigns_user_id_idx on campaigns(user_id);
create index campaigns_status_idx on campaigns(status);

create index blog_drafts_user_id_idx on blog_drafts(user_id);
create index blog_drafts_status_idx on blog_drafts(status);
create index blog_drafts_campaign_id_idx on blog_drafts(campaign_id);

-- Updated at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger posts_updated_at
  before update on posts
  for each row execute function update_updated_at();

create trigger campaigns_updated_at
  before update on campaigns
  for each row execute function update_updated_at();

create trigger blog_drafts_updated_at
  before update on blog_drafts
  for each row execute function update_updated_at();
