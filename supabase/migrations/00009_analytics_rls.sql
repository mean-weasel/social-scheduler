-- RLS policies for analytics_connections table

-- Enable RLS
alter table analytics_connections enable row level security;

-- Users can view their own analytics connections
create policy "Users can view own analytics connections"
  on analytics_connections for select
  using (auth.uid() = user_id);

-- Users can create their own analytics connections
create policy "Users can create own analytics connections"
  on analytics_connections for insert
  with check (auth.uid() = user_id);

-- Users can update their own analytics connections
create policy "Users can update own analytics connections"
  on analytics_connections for update
  using (auth.uid() = user_id);

-- Users can delete their own analytics connections
create policy "Users can delete own analytics connections"
  on analytics_connections for delete
  using (auth.uid() = user_id);
