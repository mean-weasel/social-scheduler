-- Enable RLS on projects table
alter table projects enable row level security;

-- Projects policies
create policy "Users can view own projects"
  on projects for select
  using (auth.uid() = user_id);

create policy "Users can create own projects"
  on projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on projects for update
  using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on projects for delete
  using (auth.uid() = user_id);

-- Enable RLS on project_accounts table
alter table project_accounts enable row level security;

-- Project_accounts policies (user must own the project to manage its accounts)
create policy "Users can view own project accounts"
  on project_accounts for select
  using (
    exists (
      select 1 from projects
      where projects.id = project_accounts.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can create own project accounts"
  on project_accounts for insert
  with check (
    exists (
      select 1 from projects
      where projects.id = project_accounts.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete own project accounts"
  on project_accounts for delete
  using (
    exists (
      select 1 from projects
      where projects.id = project_accounts.project_id
      and projects.user_id = auth.uid()
    )
  );

-- Note: No update policy for project_accounts as it's a junction table
-- (entries are created or deleted, not updated)
