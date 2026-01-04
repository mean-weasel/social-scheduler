# Social Scheduler MCP Server

MCP (Model Context Protocol) server for managing Social Scheduler posts programmatically.

## Installation

```bash
cd mcp-server
npm install
npm run build
```

## Usage with Claude Code

Add to your Claude Code MCP settings (`~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "social-scheduler": {
      "command": "node",
      "args": ["/path/to/social-next/mcp-server/dist/index.js"]
    }
  }
}
```

## Available Tools

### create_post
Create a new social media post.

```json
{
  "platforms": ["twitter", "linkedin"],
  "content": {
    "twitter": { "text": "Hello Twitter!" },
    "linkedin": { "text": "Hello LinkedIn!", "visibility": "public" }
  },
  "status": "draft"
}
```

### get_post
Get a single post by ID.

```json
{
  "id": "post-uuid-here"
}
```

### update_post
Update an existing post.

```json
{
  "id": "post-uuid-here",
  "content": {
    "twitter": { "text": "Updated tweet!" }
  },
  "status": "scheduled",
  "scheduledAt": "2024-01-15T10:00:00Z"
}
```

### delete_post
Permanently delete a post.

```json
{
  "id": "post-uuid-here"
}
```

### archive_post
Soft-delete a post (can be restored).

```json
{
  "id": "post-uuid-here"
}
```

### restore_post
Restore an archived post to draft.

```json
{
  "id": "post-uuid-here"
}
```

### list_posts
List posts with optional filters.

```json
{
  "status": "draft",
  "platform": "twitter",
  "limit": 10
}
```

## Storage

Posts are stored in `~/.social-scheduler/posts.json` and synced with the web app's localStorage.

## Development

```bash
npm run dev  # Run with tsx for development
npm run build  # Build for production
npm start  # Run built version
```
