-- Launch posts table for tracking submissions to launch platforms
-- (Hacker News, Product Hunt, Dev Hunt, BetaList, Indie Hackers)

create table launch_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Platform type
  platform text not null check (platform in (
    'hacker_news_show',
    'hacker_news_ask',
    'hacker_news_link',
    'product_hunt',
    'dev_hunt',
    'beta_list',
    'indie_hackers'
  )),

  -- Status tracking
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'posted')),
  scheduled_at timestamptz,
  posted_at timestamptz,

  -- Common fields across all platforms
  title text not null,
  url text,
  description text,

  -- Platform-specific fields stored as JSONB for flexibility
  -- This allows each platform to have different fields without schema changes
  -- See docs/launch-platform-data-model.md for field specifications
  platform_fields jsonb default '{}',

  -- Campaign association (optional)
  campaign_id uuid references campaigns(id) on delete set null,

  -- Internal notes
  notes text
);

-- Indexes for common queries
create index launch_posts_user_id_idx on launch_posts(user_id);
create index launch_posts_platform_idx on launch_posts(platform);
create index launch_posts_status_idx on launch_posts(status);
create index launch_posts_scheduled_at_idx on launch_posts(scheduled_at);
create index launch_posts_campaign_id_idx on launch_posts(campaign_id);

-- Updated at trigger (reuse existing function)
create trigger launch_posts_updated_at
  before update on launch_posts
  for each row execute function update_updated_at();

-- Enable RLS
alter table launch_posts enable row level security;

-- RLS policies
create policy "Users can view own launch posts"
  on launch_posts for select
  using (auth.uid() = user_id);

create policy "Users can create own launch posts"
  on launch_posts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own launch posts"
  on launch_posts for update
  using (auth.uid() = user_id);

create policy "Users can delete own launch posts"
  on launch_posts for delete
  using (auth.uid() = user_id);
