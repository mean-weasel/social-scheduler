-- Analytics connections table for tracking OAuth connections to analytics providers
-- (Google Analytics 4)

create table analytics_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Provider type (extensible for future providers)
  provider text not null default 'google_analytics' check (provider in ('google_analytics')),

  -- GA4 property info
  property_id text not null,
  property_name text,

  -- OAuth tokens (encrypted at rest by Supabase)
  access_token text not null,
  refresh_token text not null,
  token_expires_at timestamptz not null,

  -- OAuth scopes granted
  scopes text[] default '{}',

  -- Optional project association
  project_id uuid references projects(id) on delete set null,

  -- Sync status tracking
  last_sync_at timestamptz,
  sync_status text default 'pending' check (sync_status in ('pending', 'syncing', 'success', 'error')),
  sync_error text,

  -- Unique constraint: one connection per user/provider/property combo
  unique(user_id, provider, property_id)
);

-- Indexes for common queries
create index analytics_connections_user_id_idx on analytics_connections(user_id);
create index analytics_connections_provider_idx on analytics_connections(provider);
create index analytics_connections_project_id_idx on analytics_connections(project_id);
create index analytics_connections_sync_status_idx on analytics_connections(sync_status);

-- Updated at trigger (reuse existing function)
create trigger analytics_connections_updated_at
  before update on analytics_connections
  for each row execute function update_updated_at();
