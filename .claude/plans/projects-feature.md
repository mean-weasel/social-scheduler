# Feature: Projects

> A higher-level organizational unit above Campaigns, enabling users to group related marketing efforts by product, brand, or client.

## Summary

Projects introduce a new layer in Bullhorn's content hierarchy: **Projects → Campaigns → Posts**. A Project represents a product, brand, or client and serves as a container for related campaigns, brand assets, and analytics.

The primary value is threefold:
1. **Organization** - Group campaigns by product/brand instead of a flat list
2. **Brand consistency** - Store hashtags, logos, colors, and preferred social accounts at the project level for one-click insertion
3. **Aggregate analytics** - See how an entire product's marketing is performing across all its campaigns

Projects integrate fully with the existing MCP server, enabling AI assistants to create and manage projects programmatically. A soft limit (3 projects) with upgrade prompts establishes the foundation for future monetization tiers.

## Requirements

### Must Have
- [ ] Create, read, update, delete projects
- [ ] Project detail page with campaigns list and rolled-up analytics
- [ ] Associate social accounts with projects (shared across projects, but project marks "preferred")
- [ ] Pre-select project's accounts when creating posts within that project's campaigns
- [ ] Project brand kit: name, description, hashtags, brand colors, logo
- [ ] Logo: display in UI, insertable in posts, downloadable
- [ ] Sidebar panel showing project context when editing posts (one-click insert for hashtags, logo)
- [ ] Move campaigns between projects (with warning about defaults)
- [ ] Cascading delete (deleting project deletes all campaigns and posts)
- [ ] Unified dashboard with campaigns grouped/filtered by project
- [ ] MCP tools: full CRUD for projects
- [ ] Soft limit: upgrade prompt after 3 projects

### Should Have
- [ ] Campaigns can exist without a project (unassigned)
- [ ] Project-level analytics rollup on detail page
- [ ] Search/filter projects on dashboard

### Out of Scope
- Archiving projects (delete only for v1)
- Templates/inheritance system
- Cross-project campaigns
- Enforced paid tiers (just soft prompt)
- Detailed analytics metric selection (defer which metrics to roll up)

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                              │
│  Dashboard (grouped by project) │ Project Detail │ Sidebar   │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     State Management                         │
│              Zustand stores (projects, campaigns, posts)     │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                       API Layer                              │
│  /api/projects/* │ /api/campaigns/* │ /api/posts/*          │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      MCP Server                              │
│           Project tools │ Campaign tools │ Post tools        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Database (Supabase)                       │
│   projects │ project_accounts │ campaigns │ posts            │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Creating a post within a project's campaign:**
   - User navigates to campaign (which belongs to a project)
   - Post composer loads, sidebar shows project context
   - Project's preferred accounts are pre-selected
   - User can one-click insert project hashtags/logo
   - Post saved with campaign_id (project association is implicit via campaign)

2. **Moving a campaign between projects:**
   - User edits campaign, changes project_id
   - Warning shown: "Project defaults won't apply to existing posts"
   - Campaign's project_id updated
   - Existing posts unchanged

3. **Deleting a project:**
   - Confirmation required
   - Cascading delete: all campaigns → all posts within those campaigns
   - Project-account associations cleaned up

### Key Components

**Database:**
- `projects` table - Core project data + brand kit
- `project_accounts` junction table - Many-to-many between projects and social accounts
- `campaigns.project_id` - Foreign key to projects (nullable for unassigned)

**API Routes:**
- `GET/POST /api/projects` - List and create
- `GET/PATCH/DELETE /api/projects/[id]` - Single project operations
- `GET /api/projects/[id]/campaigns` - List campaigns in project
- `POST/DELETE /api/projects/[id]/accounts` - Manage account associations
- `GET /api/projects/[id]/analytics` - Rolled-up analytics

**MCP Tools:**
- `create_project`, `get_project`, `update_project`, `delete_project`
- `list_projects`
- `add_account_to_project`, `remove_account_from_project`
- `move_campaign_to_project`

**UI Components:**
- `ProjectCard` - Display project in list/grid
- `ProjectDetailPage` - Campaigns + analytics
- `ProjectSidebar` - Context panel when editing posts
- `ProjectSelector` - Dropdown for filtering/assigning
- `BrandKitEditor` - Edit hashtags, colors, logo
- `AccountPicker` - Associate accounts with project

**State (Zustand):**
- `useProjectsStore` - Projects state and actions
- Extend `useCampaignsStore` - Add project filtering
- Extend `usePostsStore` - Add project-aware account defaults

### Data Model

**New: projects table**
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Core fields
  name TEXT NOT NULL,
  description TEXT,

  -- Brand kit
  hashtags TEXT[] DEFAULT '{}',        -- Array of default hashtags
  brand_colors JSONB DEFAULT '{}',     -- { primary: '#hex', secondary: '#hex', ... }
  logo_url TEXT,                        -- Supabase storage URL

  -- Constraints
  CONSTRAINT projects_name_not_empty CHECK (char_length(trim(name)) > 0)
);

-- Indexes
CREATE INDEX projects_user_id_idx ON projects(user_id);
CREATE INDEX projects_created_at_idx ON projects(created_at DESC);

-- Updated_at trigger
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

**New: project_accounts junction table**
```sql
CREATE TABLE project_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Prevent duplicates
  UNIQUE(project_id, account_id)
);

CREATE INDEX project_accounts_project_id_idx ON project_accounts(project_id);
CREATE INDEX project_accounts_account_id_idx ON project_accounts(account_id);
```

**Modified: campaigns table**
```sql
-- Add column
ALTER TABLE campaigns
  ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Add index
CREATE INDEX campaigns_project_id_idx ON campaigns(project_id);
```

**RLS Policies (projects)**
```sql
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);
```

**TypeScript Types**
```typescript
// src/lib/projects.ts

export interface Project {
  id: string
  name: string
  description?: string
  hashtags: string[]
  brandColors: {
    primary?: string
    secondary?: string
    accent?: string
  }
  logoUrl?: string
  createdAt: string
  updatedAt: string
}

export interface ProjectWithCampaigns extends Project {
  campaigns: Campaign[]
}

export interface ProjectWithAnalytics extends Project {
  analytics: {
    totalCampaigns: number
    totalPosts: number
    scheduledPosts: number
    publishedPosts: number
    // Add engagement metrics as needed
  }
}

export interface ProjectAccount {
  id: string
  projectId: string
  accountId: string
  createdAt: string
}
```

## Implementation Plan

### Phase 1: Database Foundation
1. Create migration for `projects` table
2. Create migration for `project_accounts` junction table
3. Create migration to add `project_id` to campaigns
4. Add RLS policies for new tables
5. Test migrations locally with Supabase CLI

### Phase 2: API Layer
1. Create `/api/projects/route.ts` (GET list, POST create)
2. Create `/api/projects/[id]/route.ts` (GET, PATCH, DELETE)
3. Create `/api/projects/[id]/campaigns/route.ts` (GET campaigns)
4. Create `/api/projects/[id]/accounts/route.ts` (POST add, DELETE remove)
5. Create `/api/projects/[id]/analytics/route.ts` (GET rollup)
6. Modify `/api/campaigns/route.ts` to support `?projectId=` filter
7. Add project ownership validation helpers

### Phase 3: MCP Integration
1. Add project types to MCP storage layer
2. Implement `createProject`, `getProject`, `updateProject`, `deleteProject`
3. Implement `listProjects` with filtering
4. Implement `addAccountToProject`, `removeAccountFromProject`
5. Implement `moveCampaignToProject`
6. Register all new tools in MCP server
7. Test via Claude Code

### Phase 4: State Management
1. Create `useProjectsStore` Zustand store
2. Add project filtering to `useCampaignsStore`
3. Add project context to post creation flow
4. Implement soft limit check (3 projects) with upgrade prompt state

### Phase 5: Core UI
1. Create `ProjectCard` component
2. Create `ProjectSelector` dropdown component
3. Modify dashboard to group campaigns by project
4. Add "Unassigned" section for campaigns without projects
5. Create project creation modal
6. Add project filter/switcher to dashboard header

### Phase 6: Project Detail Page
1. Create `/projects/[id]/page.tsx`
2. Display project info and brand kit
3. List campaigns within project
4. Show rolled-up analytics
5. Add "New Campaign" action scoped to project

### Phase 7: Brand Kit & Sidebar
1. Create `BrandKitEditor` component (hashtags, colors, logo upload)
2. Implement logo upload to Supabase Storage
3. Create `ProjectSidebar` component for post editing
4. Add one-click insert for hashtags
5. Add logo insertion as media attachment
6. Add logo download button

### Phase 8: Account Association
1. Create `AccountPicker` component for project settings
2. Implement account-project linking UI
3. Modify post composer to pre-select project's accounts
4. Show project account badges in composer

### Phase 9: Polish & Edge Cases
1. Implement campaign move between projects (with warning)
2. Add cascading delete confirmation
3. Implement soft limit upgrade prompts
4. Add empty states for projects
5. Responsive design pass
6. Loading states and error handling

## Edge Cases & Error Handling

| Scenario | Handling |
|----------|----------|
| Delete project with campaigns | Confirmation modal listing campaign/post counts. Cascading delete all. |
| Move campaign to different project | Warning that project defaults won't retroactively apply to existing posts |
| Upload invalid logo format | Validate file type (PNG, JPG, SVG), show error toast |
| Logo upload fails | Show error, allow retry, don't save partial state |
| User hits 3 project soft limit | Show upgrade prompt modal, allow dismissal, still permit creation |
| Create post in unassigned campaign | No project sidebar, no account pre-selection, normal flow |
| Delete social account linked to projects | Junction table CASCADE handles cleanup automatically |
| View project with 0 campaigns | Empty state with "Create Campaign" CTA |
| API error during project creation | Toast error, keep modal open with form data preserved |

## Testing Strategy

**Unit Tests:**
- Project Zustand store actions
- Type transformations (snake_case ↔ camelCase)
- Soft limit calculation logic
- Brand color validation

**Integration Tests:**
- API routes with authenticated requests
- RLS policy enforcement
- Cascading delete behavior
- Project-campaign-post relationships

**E2E Tests:**
- Create project flow
- Add campaign to project
- Create post with project defaults
- Move campaign between projects
- Delete project with confirmation
- Upgrade prompt at soft limit

**Manual Testing:**
- Logo upload/download across browsers
- Mobile responsive behavior
- MCP tool integration via Claude Code
- Account pre-selection UX

## Open Questions

- [ ] Which specific analytics metrics to roll up at project level? (defer to implementation)
- [ ] Should brand colors affect UI theming or just be stored for reference?
- [ ] Logo size/dimension requirements?

## Design Decisions Log

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Soft intro (campaigns can be unassigned) | Reduces friction for users who don't need projects | Require project for all campaigns |
| Cascading delete | Cleaner than orphaning campaigns, matches mental model | Orphan campaigns, block delete |
| Shared accounts with project preferences | Flexible for users with one account across products | Exclusive account-project binding |
| Full brand kit in v1 | Delivers complete value prop, differentiates from competitors | Hashtags only, iterate later |
| Soft limit at 3 | Establishes monetization foundation without blocking | Unlimited, hard limit |
| Junction table for accounts | Many-to-many is more flexible, accounts aren't project-exclusive | Array column on projects |
| project_id nullable on campaigns | Supports soft intro pattern | NOT NULL with default project |
