/**
 * Migrate data from local SQLite to Supabase
 *
 * Usage:
 *   npx tsx scripts/migrate-sqlite-to-supabase.ts
 *
 * Required environment variables:
 *   SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key (bypasses RLS)
 *
 * Optional:
 *   TARGET_USER_ID - UUID of the user to assign data to (null if not set)
 *   SQLITE_PATH - Path to SQLite database (default: ~/.social-scheduler/posts.db)
 *   DRY_RUN - Set to 'true' to preview without inserting
 *
 * Examples:
 *
 * 1. Migrate to local Supabase (development):
 *    SUPABASE_URL=http://127.0.0.1:54321 \
 *    SUPABASE_SERVICE_ROLE_KEY=$(supabase status --output json | jq -r '.service_role_key') \
 *    npx tsx scripts/migrate-sqlite-to-supabase.ts
 *
 * 2. Migrate to Supabase Cloud (production):
 *    SUPABASE_URL=https://your-project.supabase.co \
 *    SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
 *    TARGET_USER_ID=your-user-uuid \
 *    npx tsx scripts/migrate-sqlite-to-supabase.ts
 *
 * 3. Dry run (preview only):
 *    DRY_RUN=true npx tsx scripts/migrate-sqlite-to-supabase.ts
 */

import { createClient } from '@supabase/supabase-js'
import { execSync } from 'child_process'
import * as path from 'path'
import * as os from 'os'

// Configuration
const SQLITE_PATH =
  process.env.SQLITE_PATH ||
  path.join(os.homedir(), '.social-scheduler', 'posts.db')
const DRY_RUN = process.env.DRY_RUN === 'true'

// Validate environment
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const TARGET_USER_ID = process.env.TARGET_USER_ID

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
  console.error('')
  console.error('For local Supabase, run:')
  console.error('  supabase status')
  console.error('')
  console.error('Then set:')
  console.error('  export SUPABASE_URL=http://127.0.0.1:54321')
  console.error('  export SUPABASE_SERVICE_ROLE_KEY=<service_role_key from above>')
  console.error('  export TARGET_USER_ID=<uuid of target user>')
  process.exit(1)
}

// TARGET_USER_ID is optional - if not set, user_id will be null
// This works for development but should be set for production migrations
if (!TARGET_USER_ID) {
  console.warn('Warning: TARGET_USER_ID not set - posts will have null user_id')
  console.warn('Set TARGET_USER_ID to assign posts to a specific user')
  console.warn('')
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Helper to run SQLite query and return JSON
function querySqlite(sql: string): unknown[] {
  try {
    const result = execSync(`sqlite3 -json "${SQLITE_PATH}" "${sql}"`, {
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer
    })
    return result.trim() ? JSON.parse(result) : []
  } catch (error) {
    console.error('SQLite query failed:', error)
    return []
  }
}

interface SqliteCampaign {
  id: string
  name: string
  description: string | null
  status: string
  created_at: string
  updated_at: string
}

interface SqlitePost {
  id: string
  created_at: string
  updated_at: string
  scheduled_at: string | null
  status: string
  platform: string
  notes: string | null
  content: string
  publish_result: string | null
  campaign_id: string | null
  group_id: string | null
  group_type: string | null
}

interface SqliteBlogDraft {
  id: string
  created_at: string
  updated_at: string
  scheduled_at: string | null
  status: string
  title: string
  date: string | null
  content: string
  notes: string | null
  word_count: number
  campaign_id: string | null
  images: string | null
}

async function migrate() {
  console.log('='.repeat(60))
  console.log('SQLite to Supabase Migration')
  console.log('='.repeat(60))
  console.log('')
  console.log(`SQLite Path: ${SQLITE_PATH}`)
  console.log(`Supabase URL: ${SUPABASE_URL}`)
  console.log(`Target User: ${TARGET_USER_ID}`)
  console.log(`Dry Run: ${DRY_RUN}`)
  console.log('')

  // Check if SQLite file exists
  try {
    execSync(`test -f "${SQLITE_PATH}"`)
  } catch {
    console.error(`Error: SQLite database not found at ${SQLITE_PATH}`)
    process.exit(1)
  }

  // Migrate campaigns first (posts reference them)
  console.log('Migrating campaigns...')
  const campaigns = querySqlite('SELECT * FROM campaigns') as SqliteCampaign[]
  console.log(`  Found ${campaigns.length} campaigns`)

  const campaignIdMap = new Map<string, string>()

  for (const campaign of campaigns) {
    // Keep the same ID if it's a valid UUID, otherwise generate new one
    const newId = campaign.id
    campaignIdMap.set(campaign.id, newId)

    const campaignData = {
      id: newId,
      user_id: TARGET_USER_ID || null,
      name: campaign.name,
      description: campaign.description,
      status: campaign.status === 'draft' ? 'active' : campaign.status, // Map 'draft' to 'active'
      created_at: campaign.created_at,
      updated_at: campaign.updated_at,
    }

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would insert campaign: ${campaign.name}`)
    } else {
      const { error } = await supabase.from('campaigns').upsert(campaignData)
      if (error) {
        console.error(`  Error inserting campaign ${campaign.name}:`, error.message)
      } else {
        console.log(`  ✓ Migrated campaign: ${campaign.name}`)
      }
    }
  }

  // Migrate posts
  console.log('')
  console.log('Migrating posts...')
  const posts = querySqlite('SELECT * FROM posts') as SqlitePost[]
  console.log(`  Found ${posts.length} posts`)

  for (const post of posts) {
    const postData = {
      id: post.id,
      user_id: TARGET_USER_ID || null,
      created_at: post.created_at,
      updated_at: post.updated_at,
      scheduled_at: post.scheduled_at,
      status: post.status,
      platform: post.platform,
      content: JSON.parse(post.content || '{}'),
      notes: post.notes,
      publish_result: post.publish_result ? JSON.parse(post.publish_result) : null,
      campaign_id: post.campaign_id ? campaignIdMap.get(post.campaign_id) || null : null,
      group_id: post.group_id,
      group_type: post.group_type,
    }

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would insert ${post.platform} post: ${post.id}`)
    } else {
      const { error } = await supabase.from('posts').upsert(postData)
      if (error) {
        console.error(`  Error inserting post ${post.id}:`, error.message)
      } else {
        const contentPreview = JSON.stringify(postData.content).slice(0, 50)
        console.log(`  ✓ Migrated ${post.platform} post: ${contentPreview}...`)
      }
    }
  }

  // Migrate blog drafts
  console.log('')
  console.log('Migrating blog drafts...')
  const blogDrafts = querySqlite('SELECT * FROM blog_drafts') as SqliteBlogDraft[]
  console.log(`  Found ${blogDrafts.length} blog drafts`)

  for (const draft of blogDrafts) {
    const draftData = {
      id: draft.id,
      user_id: TARGET_USER_ID || null,
      created_at: draft.created_at,
      updated_at: draft.updated_at,
      scheduled_at: draft.scheduled_at,
      status: draft.status,
      title: draft.title,
      date: draft.date,
      content: draft.content,
      notes: draft.notes,
      word_count: draft.word_count,
      campaign_id: draft.campaign_id ? campaignIdMap.get(draft.campaign_id) || null : null,
      images: draft.images ? JSON.parse(draft.images) : [],
    }

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would insert blog draft: ${draft.title}`)
    } else {
      const { error } = await supabase.from('blog_drafts').upsert(draftData)
      if (error) {
        console.error(`  Error inserting blog draft ${draft.title}:`, error.message)
      } else {
        console.log(`  ✓ Migrated blog draft: ${draft.title}`)
      }
    }
  }

  // Summary
  console.log('')
  console.log('='.repeat(60))
  console.log('Migration Summary')
  console.log('='.repeat(60))
  console.log(`  Campaigns: ${campaigns.length}`)
  console.log(`  Posts: ${posts.length}`)
  console.log(`  Blog Drafts: ${blogDrafts.length}`)
  console.log('')

  if (DRY_RUN) {
    console.log('This was a DRY RUN. No data was actually migrated.')
    console.log('Remove DRY_RUN=true to perform the actual migration.')
  } else {
    console.log('Migration complete!')
  }
}

migrate().catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})
