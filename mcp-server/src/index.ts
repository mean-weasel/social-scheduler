#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'

import {
  createPost,
  getPost,
  updatePost,
  deletePost,
  archivePost,
  restorePost,
  listPosts,
  type Platform,
  type PostStatus,
  type Post,
} from './storage.js'

// Create MCP server
const server = new Server(
  {
    name: 'social-scheduler',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

// Tool definitions
const TOOLS = [
  {
    name: 'create_post',
    description: 'Create a new social media post draft or scheduled post',
    inputSchema: {
      type: 'object' as const,
      properties: {
        platforms: {
          type: 'array',
          items: { type: 'string', enum: ['twitter', 'linkedin', 'reddit'] },
          description: 'Platforms to post to',
        },
        content: {
          type: 'object',
          properties: {
            twitter: {
              type: 'object',
              properties: {
                text: { type: 'string', description: 'Tweet text (max 280 chars)' },
                mediaUrls: { type: 'array', items: { type: 'string' }, description: 'Media URLs (up to 4)' },
              },
              required: ['text'],
            },
            linkedin: {
              type: 'object',
              properties: {
                text: { type: 'string', description: 'LinkedIn post text' },
                visibility: { type: 'string', enum: ['public', 'connections'], description: 'Post visibility' },
                mediaUrl: { type: 'string', description: 'Single media URL' },
              },
              required: ['text'],
            },
            reddit: {
              type: 'object',
              properties: {
                subreddit: { type: 'string', description: 'Subreddit name (without r/)' },
                title: { type: 'string', description: 'Post title (max 300 chars)' },
                body: { type: 'string', description: 'Post body text' },
                url: { type: 'string', description: 'Link URL for link posts' },
                flairText: { type: 'string', description: 'Flair text' },
              },
              required: ['subreddit', 'title'],
            },
          },
          description: 'Content for each platform',
        },
        scheduledAt: {
          type: 'string',
          description: 'ISO 8601 datetime for scheduling (optional)',
        },
        status: {
          type: 'string',
          enum: ['draft', 'scheduled'],
          description: 'Post status (default: draft)',
        },
      },
      required: ['platforms'],
    },
  },
  {
    name: 'get_post',
    description: 'Get a single post by ID',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Post ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'update_post',
    description: 'Update an existing post',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Post ID to update' },
        platforms: {
          type: 'array',
          items: { type: 'string', enum: ['twitter', 'linkedin', 'reddit'] },
          description: 'Platforms to post to',
        },
        content: {
          type: 'object',
          description: 'Updated content for each platform',
        },
        scheduledAt: {
          type: 'string',
          description: 'ISO 8601 datetime for scheduling',
        },
        status: {
          type: 'string',
          enum: ['draft', 'scheduled', 'published'],
          description: 'Post status',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_post',
    description: 'Permanently delete a post',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Post ID to delete' },
      },
      required: ['id'],
    },
  },
  {
    name: 'archive_post',
    description: 'Archive a post (soft delete). Archived posts can be restored.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Post ID to archive' },
      },
      required: ['id'],
    },
  },
  {
    name: 'restore_post',
    description: 'Restore an archived post back to draft status',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Post ID to restore' },
      },
      required: ['id'],
    },
  },
  {
    name: 'list_posts',
    description: 'List posts with optional filters',
    inputSchema: {
      type: 'object' as const,
      properties: {
        status: {
          type: 'string',
          enum: ['all', 'draft', 'scheduled', 'published', 'failed', 'archived'],
          description: 'Filter by status (default: all)',
        },
        platform: {
          type: 'string',
          enum: ['twitter', 'linkedin', 'reddit'],
          description: 'Filter by platform',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of posts to return (default: 50)',
        },
      },
    },
  },
]

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS }
})

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    switch (name) {
      case 'create_post': {
        const { platforms, content, scheduledAt, status } = args as {
          platforms: Platform[]
          content: Post['content']
          scheduledAt?: string
          status?: 'draft' | 'scheduled'
        }

        if (!platforms || platforms.length === 0) {
          return {
            content: [{ type: 'text', text: 'Error: At least one platform is required' }],
            isError: true,
          }
        }

        const post = createPost({
          platforms,
          content: content || {},
          scheduledAt: scheduledAt || null,
          status: status || 'draft',
        })

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, post }, null, 2),
            },
          ],
        }
      }

      case 'get_post': {
        const { id } = args as { id: string }
        const post = getPost(id)

        if (!post) {
          return {
            content: [{ type: 'text', text: `Error: Post with ID ${id} not found` }],
            isError: true,
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, post }, null, 2),
            },
          ],
        }
      }

      case 'update_post': {
        const { id, ...updates } = args as { id: string } & Partial<Post>
        const post = updatePost(id, updates)

        if (!post) {
          return {
            content: [{ type: 'text', text: `Error: Post with ID ${id} not found` }],
            isError: true,
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, post }, null, 2),
            },
          ],
        }
      }

      case 'delete_post': {
        const { id } = args as { id: string }
        const success = deletePost(id)

        if (!success) {
          return {
            content: [{ type: 'text', text: `Error: Post with ID ${id} not found` }],
            isError: true,
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: `Post ${id} deleted` }, null, 2),
            },
          ],
        }
      }

      case 'archive_post': {
        const { id } = args as { id: string }
        const post = archivePost(id)

        if (!post) {
          return {
            content: [{ type: 'text', text: `Error: Post with ID ${id} not found` }],
            isError: true,
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, post }, null, 2),
            },
          ],
        }
      }

      case 'restore_post': {
        const { id } = args as { id: string }
        const post = restorePost(id)

        if (!post) {
          return {
            content: [{ type: 'text', text: `Error: Post with ID ${id} not found` }],
            isError: true,
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, post }, null, 2),
            },
          ],
        }
      }

      case 'list_posts': {
        const { status, platform, limit } = args as {
          status?: PostStatus | 'all'
          platform?: Platform
          limit?: number
        }

        const posts = listPosts({
          status,
          platform,
          limit: limit || 50,
        })

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, count: posts.length, posts }, null, 2),
            },
          ],
        }
      }

      default:
        return {
          content: [{ type: 'text', text: `Error: Unknown tool ${name}` }],
          isError: true,
        }
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    }
  }
})

// Start server
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('Social Scheduler MCP Server running on stdio')
}

main().catch(console.error)
