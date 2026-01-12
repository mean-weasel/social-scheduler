# Social Scheduler MCP Server

MCP (Model Context Protocol) server for managing Social Scheduler posts programmatically through Claude Desktop or Claude Code.

## Features

- Create, edit, and manage social media posts for Twitter, LinkedIn, and Reddit
- Organize posts into campaigns
- Create and manage blog drafts with markdown content
- Schedule posts for future publishing
- Cross-post to multiple Reddit subreddits

## Prerequisites

- Node.js 18+
- A Supabase project (local or cloud)
- Supabase service role key (for direct database access)

## Installation

```bash
cd mcp-server
npm install
npm run build
```

## Configuration

The MCP server connects directly to Supabase. You need to provide your Supabase credentials.

### Option 1: Environment Variables

Set these environment variables before running:

```bash
export SUPABASE_URL="https://your-project.supabase.co"  # or http://127.0.0.1:54321 for local
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### Option 2: .env.local File

Create a `.env.local` file in the project root (not mcp-server directory):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Getting Your Supabase Credentials

#### For Local Development

1. Start local Supabase: `supabase start`
2. Get credentials: `supabase status`
3. Use the `API URL` and `service_role key` from the output

#### For Supabase Cloud

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** (under "Project API keys") → `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ **Security Note**: The service role key bypasses Row Level Security. Never expose it in client-side code or commit it to version control.

## Usage with Claude Desktop

Add to your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "social-scheduler": {
      "command": "node",
      "args": ["/absolute/path/to/social-scheduler/mcp-server/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

## Usage with Claude Code

Add to your Claude Code MCP settings (`~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "social-scheduler": {
      "command": "node",
      "args": ["/absolute/path/to/social-scheduler/mcp-server/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

## Available Tools

### Post Management

| Tool | Description |
|------|-------------|
| `create_post` | Create a new social media post for Twitter, LinkedIn, or Reddit |
| `get_post` | Get a single post by ID |
| `update_post` | Update an existing post |
| `delete_post` | Permanently delete a post (requires confirmation) |
| `archive_post` | Soft-delete a post (can be restored) |
| `restore_post` | Restore an archived post |
| `list_posts` | List posts with optional filters (status, platform, campaign) |
| `search_posts` | Search posts by content, notes, or campaign name |

### Campaign Management

| Tool | Description |
|------|-------------|
| `create_campaign` | Create a new campaign to organize posts |
| `get_campaign` | Get a campaign with its associated posts |
| `update_campaign` | Update campaign details |
| `delete_campaign` | Delete a campaign (posts are preserved) |
| `list_campaigns` | List all campaigns |
| `add_post_to_campaign` | Link a post to a campaign |
| `remove_post_from_campaign` | Unlink a post from a campaign |

### Blog Draft Management

| Tool | Description |
|------|-------------|
| `create_blog_draft` | Create a new blog post draft with markdown |
| `get_blog_draft` | Get a draft with full content |
| `update_blog_draft` | Update draft content, title, or status |
| `delete_blog_draft` | Permanently delete a draft |
| `archive_blog_draft` | Archive a draft |
| `restore_blog_draft` | Restore an archived draft |
| `list_blog_drafts` | List drafts with filters |
| `search_blog_drafts` | Search drafts by content or title |
| `add_image_to_draft` | Attach an image to a draft |
| `get_draft_images` | List images attached to a draft |

### Reddit Cross-Posting

| Tool | Description |
|------|-------------|
| `create_reddit_crossposts` | Create multiple Reddit posts to different subreddits with a shared group ID |

## Examples

### Create a Twitter Post

```
Create a Twitter post with the text "Excited to announce our new feature! 🚀"
```

### Create a Campaign with Posts

```
Create a campaign called "Product Launch" and add 3 posts:
1. Twitter announcement
2. LinkedIn detailed post
3. Reddit post to r/startups
```

### Schedule a Post

```
Update post [id] to be scheduled for tomorrow at 10am EST
```

### Search Posts

```
Search for all posts mentioning "feature launch"
```

## Development

```bash
npm run dev    # Run with tsx for development (auto-reload)
npm run build  # Build for production
npm start      # Run built version
npm test       # Run tests
```

## Troubleshooting

### "Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"

Make sure you've set the environment variables either in:
- The `env` section of your MCP config
- Or exported them in your shell before running

### Posts not appearing in the web app

The MCP server uses the service role key which bypasses RLS. If you want posts to appear for a specific user in the web app, you may need to set the `user_id` field on the posts, or query posts with the service role in the app as well.

### Connection refused to localhost:54321

Make sure local Supabase is running: `supabase start`
