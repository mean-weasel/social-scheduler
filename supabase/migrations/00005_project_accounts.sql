-- Project-Account associations (many-to-many)
-- Note: account_id will reference social_accounts table when that is created.
-- For now, it stores the account identifier without a foreign key constraint.
create table project_accounts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  account_id uuid not null,
  created_at timestamptz not null default now(),

  -- Prevent duplicate associations
  unique(project_id, account_id)
);

-- Indexes for efficient lookups
create index project_accounts_project_id_idx on project_accounts(project_id);
create index project_accounts_account_id_idx on project_accounts(account_id);

-- TODO: When social_accounts table is created, add foreign key:
-- alter table project_accounts
--   add constraint project_accounts_account_id_fkey
--   foreign key (account_id) references social_accounts(id) on delete cascade;
