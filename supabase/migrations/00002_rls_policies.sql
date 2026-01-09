-- Enable RLS on all tables
alter table posts enable row level security;
alter table campaigns enable row level security;
alter table blog_drafts enable row level security;

-- Posts policies
create policy "Users can view own posts"
  on posts for select
  using (auth.uid() = user_id);

create policy "Users can create own posts"
  on posts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own posts"
  on posts for update
  using (auth.uid() = user_id);

create policy "Users can delete own posts"
  on posts for delete
  using (auth.uid() = user_id);

-- Campaigns policies
create policy "Users can view own campaigns"
  on campaigns for select
  using (auth.uid() = user_id);

create policy "Users can create own campaigns"
  on campaigns for insert
  with check (auth.uid() = user_id);

create policy "Users can update own campaigns"
  on campaigns for update
  using (auth.uid() = user_id);

create policy "Users can delete own campaigns"
  on campaigns for delete
  using (auth.uid() = user_id);

-- Blog drafts policies
create policy "Users can view own blog drafts"
  on blog_drafts for select
  using (auth.uid() = user_id);

create policy "Users can create own blog drafts"
  on blog_drafts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own blog drafts"
  on blog_drafts for update
  using (auth.uid() = user_id);

create policy "Users can delete own blog drafts"
  on blog_drafts for delete
  using (auth.uid() = user_id);

-- Note: Service role key bypasses RLS automatically (for MCP server)
