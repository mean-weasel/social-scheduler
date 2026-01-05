import Database, { Database as DatabaseType } from 'better-sqlite3'
import path from 'path'
import os from 'os'
import fs from 'fs'

// Use in-memory database for tests, file-based for production
const isTest = process.env.CI === 'true' || process.env.NODE_ENV === 'test'

let DB_PATH: string

if (isTest) {
  // Use temp directory for test database
  const tmpDir = os.tmpdir()
  DB_PATH = path.join(tmpDir, `social-scheduler-test-${process.pid}.db`)
} else {
  // Storage directory for production
  const STORAGE_DIR = process.env.STORAGE_DIR || path.join(os.homedir(), '.social-scheduler')
  DB_PATH = path.join(STORAGE_DIR, 'posts.db')

  // Ensure storage directory exists
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true })
  }
}

// Initialize database
export const db: DatabaseType = new Database(DB_PATH)

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL')

// Create tables (without new columns - they'll be added via migration if needed)
db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    scheduled_at TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    platforms TEXT NOT NULL,
    notes TEXT,
    content TEXT NOT NULL,
    publish_results TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
  CREATE INDEX IF NOT EXISTS idx_posts_scheduled_at ON posts(scheduled_at);
  CREATE INDEX IF NOT EXISTS idx_posts_updated_at ON posts(updated_at);

  CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
  CREATE INDEX IF NOT EXISTS idx_campaigns_updated_at ON campaigns(updated_at);
`)

// Migration: Add new columns to existing posts table if they don't exist
try {
  const tableInfo = db.prepare('PRAGMA table_info(posts)').all() as { name: string }[]
  const columnNames = tableInfo.map((col) => col.name)

  if (!columnNames.includes('campaign_id')) {
    db.exec('ALTER TABLE posts ADD COLUMN campaign_id TEXT')
    console.log('Migration: Added campaign_id column to posts table')
  }

  if (!columnNames.includes('group_id')) {
    db.exec('ALTER TABLE posts ADD COLUMN group_id TEXT')
    console.log('Migration: Added group_id column to posts table')
  }

  if (!columnNames.includes('group_type')) {
    db.exec('ALTER TABLE posts ADD COLUMN group_type TEXT')
    console.log('Migration: Added group_type column to posts table')
  }

  // Create indexes on new columns after migration
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_posts_campaign_id ON posts(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_posts_group_id ON posts(group_id);
  `)
} catch {
  // Columns might already exist or table doesn't exist yet
}

console.log(`Database initialized at: ${DB_PATH}`)
