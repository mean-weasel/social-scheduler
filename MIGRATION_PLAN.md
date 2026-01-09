# Migration Plan: Next.js + Supabase

## Overview

Migrate from React + Vite + Express + SQLite to Next.js + Supabase while maintaining local development workflow with Make.

**Current Stack:**
- Frontend: React 18 + Vite + Zustand + TailwindCSS
- Backend: Express + SQLite (better-sqlite3)
- MCP: Calls Express API via HTTP
- Deploy: Local only (GitHub Actions for publishing)

**Target Stack:**
- Frontend: Next.js 14 (App Router) + Zustand + TailwindCSS
- Backend: Next.js API Routes + Supabase (PostgreSQL)
- Auth: Supabase Auth (Google OAuth)
- MCP: Calls Supabase directly via JS client
- Deploy: Vercel + Supabase Cloud

---

## Phase 1: Project Setup (Day 1)

### 1.1 Create Supabase Projects

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Login to Supabase
supabase login
```

Create two projects in Supabase Dashboard (https://supabase.com/dashboard):
- `social-scheduler-dev` - Development/staging
- `social-scheduler-prod` - Production

Save the credentials:
- Project URL
- Anon (public) key
- Service role key (keep secret)

### 1.2 Initialize Local Supabase

```bash
# In project root
supabase init

# Start local Supabase (requires Docker)
supabase start
```

This creates:
- `supabase/` directory for migrations and config
- Local PostgreSQL on port 54322
- Local Auth on port 54321
- Local Studio UI on port 54323

### 1.3 Initialize Next.js

Create new Next.js app alongside existing code:

```bash
# Create Next.js app in a new directory
npx create-next-app@latest next-app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# We'll migrate files from src/ and api-server/ into next-app/
```

### 1.4 New Project Structure

```
social-scheduler/
├── src/                    # Next.js app (was next-app/)
│   ├── app/               # App Router pages & API routes
│   │   ├── api/           # API routes (replaces Express)
│   │   ├── (auth)/        # Auth pages (login, callback)
│   │   ├── (dashboard)/   # Protected dashboard pages
│   │   └── layout.tsx     # Root layout
│   ├── components/        # React components (migrated)
│   ├── hooks/             # Custom hooks (migrated)
│   ├── lib/               # Utilities
│   │   ├── supabase/      # Supabase clients
│   │   └── ...            # Other utils (migrated)
│   └── stores/            # Zustand stores (migrated)
├── supabase/
│   ├── migrations/        # Database migrations
│   ├── seed.sql           # Seed data for dev
│   └── config.toml        # Local Supabase config
├── mcp-server/            # MCP server (updated)
├── e2e/                   # Playwright tests (updated)
├── public/                # Static assets
├── Makefile               # Updated commands
└── package.json           # Single package.json
```

### 1.5 New Makefile

```makefile
# ====================
# Development
# ====================

.PHONY: dev
dev: ## Start Next.js + local Supabase
	@make -j2 dev-db dev-web

.PHONY: dev-web
dev-web: ## Start Next.js dev server
	npm run dev

.PHONY: dev-db
dev-db: ## Start local Supabase
	supabase start

.PHONY: dev-studio
dev-studio: ## Open Supabase Studio
	open http://localhost:54323

.PHONY: dev-stop
dev-stop: ## Stop local Supabase
	supabase stop

# ====================
# Database
# ====================

.PHONY: db-reset
db-reset: ## Reset local database
	supabase db reset

.PHONY: db-migrate
db-migrate: ## Run migrations locally
	supabase migration up

.PHONY: db-new
db-new: ## Create new migration (usage: make db-new name=create_users)
	supabase migration new $(name)

.PHONY: db-push
db-push: ## Push migrations to remote (dev)
	supabase db push --linked

.PHONY: db-pull
db-pull: ## Pull remote schema changes
	supabase db pull --linked

.PHONY: db-diff
db-diff: ## Show diff between local and remote
	supabase db diff --linked

.PHONY: db-seed
db-seed: ## Seed local database
	psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/seed.sql

# ====================
# Supabase Management
# ====================

.PHONY: supabase-link-dev
supabase-link-dev: ## Link to dev Supabase project
	supabase link --project-ref YOUR_DEV_PROJECT_REF

.PHONY: supabase-link-prod
supabase-link-prod: ## Link to prod Supabase project
	supabase link --project-ref YOUR_PROD_PROJECT_REF

.PHONY: supabase-status
supabase-status: ## Check local Supabase status
	supabase status

# ====================
# Build & Deploy
# ====================

.PHONY: build
build: ## Build for production
	npm run build

.PHONY: preview
preview: ## Preview production build locally
	npm run build && npm run start

.PHONY: deploy
deploy: ## Deploy to Vercel (production)
	vercel --prod

.PHONY: deploy-preview
deploy-preview: ## Deploy preview to Vercel
	vercel

# ====================
# Testing
# ====================

.PHONY: test
test: ## Run all tests
	npm run test

.PHONY: test-unit
test-unit: ## Run unit tests
	npm run test:unit

.PHONY: test-e2e
test-e2e: ## Run E2E tests
	npm run test:e2e

.PHONY: test-e2e-ui
test-e2e-ui: ## Run E2E tests with UI
	npm run test:e2e:ui

# ====================
# Code Quality
# ====================

.PHONY: lint
lint: ## Run linter
	npm run lint

.PHONY: typecheck
typecheck: ## Run TypeScript checks
	npm run typecheck

.PHONY: format
format: ## Format code
	npm run format

.PHONY: check
check: lint typecheck test-unit ## Run all checks

# ====================
# MCP Server
# ====================

.PHONY: mcp-dev
mcp-dev: ## Run MCP server (local Supabase)
	cd mcp-server && SUPABASE_URL=http://localhost:54321 npm run dev

.PHONY: mcp-build
mcp-build: ## Build MCP server
	cd mcp-server && npm run build

# ====================
# Utilities
# ====================

.PHONY: clean
clean: ## Clean build artifacts
	rm -rf .next node_modules/.cache

.PHONY: install
install: ## Install dependencies
	npm install
	cd mcp-server && npm install

.PHONY: setup
setup: install ## First-time setup
	supabase start
	make db-reset
	@echo "Setup complete! Run 'make dev' to start developing."

.PHONY: help
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
```

---

## Phase 2: Database Migration (Day 1-2)

### 2.1 Create Database Schema

Create migration file `supabase/migrations/00001_initial_schema.sql`:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Posts table
create table posts (
  id uuid primary key default uuid_generate_v4(),
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
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Blog drafts table
create table blog_drafts (
  id uuid primary key default uuid_generate_v4(),
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
```

### 2.2 Row Level Security (RLS)

Create migration `supabase/migrations/00002_rls_policies.sql`:

```sql
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

-- Service role bypass (for MCP server)
-- The service_role key bypasses RLS automatically
```

### 2.3 Data Migration Script

Create `scripts/migrate-sqlite-to-supabase.ts` to migrate existing data:

```typescript
import Database from 'better-sqlite3';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as os from 'os';

const SQLITE_PATH = path.join(os.homedir(), '.social-scheduler', 'posts.db');

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role to bypass RLS
);

async function migrate() {
  const db = new Database(SQLITE_PATH, { readonly: true });

  // Get the user ID to assign data to (you'll need to create a user first)
  const userId = process.env.TARGET_USER_ID;
  if (!userId) {
    console.error('Set TARGET_USER_ID env var');
    process.exit(1);
  }

  // Migrate campaigns first (posts reference them)
  console.log('Migrating campaigns...');
  const campaigns = db.prepare('SELECT * FROM campaigns').all();
  const campaignIdMap = new Map<string, string>();

  for (const campaign of campaigns) {
    const newId = uuidv4();
    campaignIdMap.set(campaign.id, newId);

    const { error } = await supabase.from('campaigns').insert({
      id: newId,
      user_id: userId,
      name: campaign.name,
      description: campaign.description,
      status: campaign.status,
      created_at: campaign.created_at,
      updated_at: campaign.updated_at,
    });

    if (error) console.error('Campaign error:', error);
  }
  console.log(`Migrated ${campaigns.length} campaigns`);

  // Migrate posts
  console.log('Migrating posts...');
  const posts = db.prepare('SELECT * FROM posts').all();

  for (const post of posts) {
    const { error } = await supabase.from('posts').insert({
      id: uuidv4(),
      user_id: userId,
      created_at: post.created_at,
      updated_at: post.updated_at,
      scheduled_at: post.scheduled_at,
      status: post.status,
      platform: post.platform,
      content: JSON.parse(post.content || '{}'),
      notes: post.notes,
      publish_result: post.publish_result ? JSON.parse(post.publish_result) : null,
      campaign_id: post.campaign_id ? campaignIdMap.get(post.campaign_id) : null,
      group_id: post.group_id,
      group_type: post.group_type,
    });

    if (error) console.error('Post error:', error);
  }
  console.log(`Migrated ${posts.length} posts`);

  // Migrate blog drafts
  console.log('Migrating blog drafts...');
  const drafts = db.prepare('SELECT * FROM blog_drafts').all();

  for (const draft of drafts) {
    const { error } = await supabase.from('blog_drafts').insert({
      id: uuidv4(),
      user_id: userId,
      created_at: draft.created_at,
      updated_at: draft.updated_at,
      scheduled_at: draft.scheduled_at,
      status: draft.status,
      title: draft.title,
      date: draft.date,
      content: draft.content,
      notes: draft.notes,
      word_count: draft.word_count,
      campaign_id: draft.campaign_id ? campaignIdMap.get(draft.campaign_id) : null,
      images: JSON.parse(draft.images || '[]'),
    });

    if (error) console.error('Blog draft error:', error);
  }
  console.log(`Migrated ${drafts.length} blog drafts`);

  db.close();
  console.log('Migration complete!');
}

migrate().catch(console.error);
```

---

## Phase 3: Supabase Client Setup (Day 2)

### 3.1 Install Dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### 3.2 Create Supabase Clients

`src/lib/supabase/client.ts` (browser client):

```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

`src/lib/supabase/server.ts` (server client):

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component
          }
        },
      },
    }
  );
}
```

`src/lib/supabase/middleware.ts`:

```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to login if not authenticated and trying to access protected routes
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

`src/middleware.ts`:

```typescript
import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

### 3.3 Environment Variables

`.env.local` (local development):

```bash
# Supabase - Local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key

# Supabase - Service Role (server-side only, for MCP)
SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key

# Get these from `supabase status` after running `supabase start`
```

`.env.production` (Vercel):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-role-key
```

---

## Phase 4: Auth Setup (Day 2-3)

### 4.1 Enable Google OAuth in Supabase

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google
3. Add Google OAuth credentials (from Google Cloud Console)
4. Set redirect URL: `https://your-project.supabase.co/auth/v1/callback`

### 4.2 Create Auth Pages

`src/app/login/page.tsx`:

```typescript
'use client';

import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Social Scheduler</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Sign in to manage your social posts
          </p>
        </div>
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white hover:bg-gray-50 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            {/* Google icon SVG */}
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
}
```

`src/app/auth/callback/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
```

---

## Phase 5: API Routes Migration (Day 3-4)

### 5.1 API Route Structure

```
src/app/api/
├── posts/
│   ├── route.ts           # GET (list), POST (create)
│   └── [id]/
│       └── route.ts       # GET, PUT, DELETE
├── campaigns/
│   ├── route.ts
│   └── [id]/
│       └── route.ts
├── blog-drafts/
│   ├── route.ts
│   └── [id]/
│       └── route.ts
└── media/
    └── upload/
        └── route.ts
```

### 5.2 Example API Route

`src/app/api/posts/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const status = searchParams.get('status');
  const platform = searchParams.get('platform');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  let query = supabase
    .from('posts')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }
  if (platform) {
    query = query.eq('platform', platform);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ posts: data, total: count });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: user.id,
      platform: body.platform,
      content: body.content,
      status: body.status || 'draft',
      scheduled_at: body.scheduled_at,
      notes: body.notes,
      campaign_id: body.campaign_id,
      group_id: body.group_id,
      group_type: body.group_type,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
```

### 5.3 Migration Mapping

| Express Route | Next.js API Route |
|--------------|-------------------|
| GET /api/posts | GET /api/posts |
| POST /api/posts | POST /api/posts |
| GET /api/posts/:id | GET /api/posts/[id] |
| PUT /api/posts/:id | PUT /api/posts/[id] |
| DELETE /api/posts/:id | DELETE /api/posts/[id] |
| POST /api/posts/:id/archive | POST /api/posts/[id]/archive |
| POST /api/posts/:id/restore | POST /api/posts/[id]/restore |
| GET /api/campaigns | GET /api/campaigns |
| ... | ... |

---

## Phase 6: Frontend Migration (Day 4-6)

### 6.1 Page Migration

| Current (Vite) | Next.js (App Router) |
|----------------|---------------------|
| src/pages/Dashboard.tsx | src/app/(dashboard)/page.tsx |
| src/pages/Posts.tsx | src/app/(dashboard)/posts/page.tsx |
| src/pages/Editor.tsx | src/app/(dashboard)/posts/new/page.tsx |
| src/pages/Editor.tsx (edit) | src/app/(dashboard)/posts/[id]/edit/page.tsx |
| src/pages/Campaigns.tsx | src/app/(dashboard)/campaigns/page.tsx |
| src/pages/CampaignDetail.tsx | src/app/(dashboard)/campaigns/[id]/page.tsx |
| src/pages/BlogDrafts.tsx | src/app/(dashboard)/blog/page.tsx |
| src/pages/BlogEditor.tsx | src/app/(dashboard)/blog/[id]/page.tsx |
| src/pages/Settings.tsx | src/app/(dashboard)/settings/page.tsx |

### 6.2 Layout Structure

`src/app/(dashboard)/layout.tsx`:

```typescript
import { AppLayout } from '@/components/AppLayout';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <AppLayout user={user}>{children}</AppLayout>;
}
```

### 6.3 Component Migration

Most components migrate directly:
- Keep all components in `src/components/`
- Update imports from `@/lib/...` paths
- Replace `useNavigate()` with `useRouter()` from `next/navigation`
- Replace `<Link to="">` with `<Link href="">` from `next/link`

### 6.4 Zustand Store Updates

Update stores to use new API endpoints (same paths, just different base URL):

```typescript
// src/stores/posts.ts
import { create } from 'zustand';

interface PostsState {
  posts: Post[];
  loading: boolean;
  fetchPosts: (filters?: PostFilters) => Promise<void>;
  // ...
}

export const usePostsStore = create<PostsState>((set, get) => ({
  posts: [],
  loading: false,

  fetchPosts: async (filters) => {
    set({ loading: true });
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.platform) params.set('platform', filters.platform);

    const res = await fetch(`/api/posts?${params}`);
    const { posts } = await res.json();
    set({ posts, loading: false });
  },

  // ... rest of store
}));
```

---

## Phase 7: MCP Server Migration (Day 6-7)

### 7.1 Update Dependencies

```bash
cd mcp-server
npm install @supabase/supabase-js
npm uninstall node-fetch  # No longer needed
```

### 7.2 Update Storage Layer

`mcp-server/src/storage.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role bypasses RLS
);

export async function getPosts(filters?: {
  status?: string;
  platform?: string;
  limit?: number;
}) {
  let query = supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters?.platform) {
    query = query.eq('platform', filters.platform);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getPost(id: string) {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createPost(post: CreatePostInput) {
  const { data, error } = await supabase
    .from('posts')
    .insert(post)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePost(id: string, updates: UpdatePostInput) {
  const { data, error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePost(id: string) {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return { success: true };
}

// Similar functions for campaigns and blog_drafts...
```

### 7.3 MCP Environment Configuration

Update MCP config to use environment variables:

```json
{
  "mcpServers": {
    "social-scheduler": {
      "command": "node",
      "args": ["/path/to/social-scheduler/mcp-server/dist/index.js"],
      "env": {
        "SUPABASE_URL": "http://localhost:54321",
        "SUPABASE_SERVICE_ROLE_KEY": "your-local-service-role-key"
      }
    }
  }
}
```

For production data, use cloud Supabase credentials instead.

---

## Phase 8: E2E Tests Migration (Day 7)

### 8.1 Update Playwright Config

`playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Keep sequential for DB consistency
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

### 8.2 Test Auth Helper

`e2e/helpers/auth.ts`:

```typescript
import { Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function loginAsTestUser(page: Page) {
  // Create test user session
  const { data: { session } } = await supabase.auth.admin.createUser({
    email: 'test@example.com',
    password: 'testpassword',
    email_confirm: true,
  });

  // Set auth cookies in browser
  await page.context().addCookies([
    {
      name: 'sb-access-token',
      value: session!.access_token,
      domain: 'localhost',
      path: '/',
    },
    // ... other auth cookies
  ]);
}

export async function cleanupTestData() {
  // Delete all test user data
  await supabase.from('posts').delete().eq('user_id', TEST_USER_ID);
  await supabase.from('campaigns').delete().eq('user_id', TEST_USER_ID);
  await supabase.from('blog_drafts').delete().eq('user_id', TEST_USER_ID);
}
```

---

## Phase 9: Deployment (Day 7-8)

### 9.1 Vercel Setup

```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

### 9.2 Update GitHub Actions

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:unit

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - uses: supabase/setup-cli@v1
        with:
          version: latest
      - run: supabase start
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
        env:
          NEXT_PUBLIC_SUPABASE_URL: http://localhost:54321
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.LOCAL_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.LOCAL_SERVICE_ROLE_KEY }}
```

### 9.3 Publish Workflow Update

`.github/workflows/publish.yml`:

```yaml
name: Publish Scheduled Posts

on:
  schedule:
    - cron: '*/15 * * * *'
  workflow_dispatch:

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run publish-posts
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          TWITTER_API_KEY: ${{ secrets.TWITTER_API_KEY }}
          # ... other secrets
```

---

## Phase 10: Cleanup & Finalization (Day 8)

### 10.1 Remove Old Code

```bash
# Remove old directories
rm -rf api-server/
rm -rf src/pages/  # Old Vite pages if not overwritten

# Remove old dependencies
npm uninstall better-sqlite3 express cors multer
```

### 10.2 Update Package Scripts

`package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test:unit": "vitest run",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "format": "prettier --write .",
    "publish-posts": "tsx scripts/publish-posts.ts"
  }
}
```

### 10.3 Final Testing Checklist

- [ ] `make setup` creates local environment
- [ ] `make dev` starts Next.js + local Supabase
- [ ] Login with Google works locally
- [ ] All CRUD operations work (posts, campaigns, drafts)
- [ ] MCP tools work with local Supabase
- [ ] E2E tests pass
- [ ] Vercel preview deployment works
- [ ] Production deployment works
- [ ] MCP works with production Supabase

---

## Timeline Summary

| Phase | Days | Description |
|-------|------|-------------|
| 1 | 1 | Project setup, Supabase init, new structure |
| 2 | 1-2 | Database schema, RLS, data migration |
| 3 | 0.5 | Supabase client setup |
| 4 | 0.5-1 | Auth setup (Google OAuth) |
| 5 | 1-2 | API routes migration |
| 6 | 2-3 | Frontend migration |
| 7 | 1 | MCP server migration |
| 8 | 0.5 | E2E tests update |
| 9 | 0.5-1 | Deployment setup |
| 10 | 0.5 | Cleanup and testing |

**Total: ~8-12 days of focused work**

---

## Rollback Plan

Keep the old code in a branch until migration is verified:

```bash
git checkout -b pre-migration-backup
git push origin pre-migration-backup
```

If issues arise, you can always:
1. Revert to the backup branch
2. Keep using local SQLite
3. The old system remains fully functional
