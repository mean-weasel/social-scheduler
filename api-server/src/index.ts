import express from 'express'
import cors from 'cors'
import path from 'path'
import os from 'os'
import { postsRouter } from './routes/posts.js'
import { campaignsRouter } from './routes/campaigns.js'
import { mediaRouter } from './routes/media.js'
import { blogDraftsRouter, blogMediaRouter } from './routes/blogDrafts.js'
import { importFromJson } from './storage.js'
import { initMediaDir, initBlogMediaDir } from './media.js'
import { config } from './config.js'

const app = express()
const PORT = parseInt(process.env.API_PORT || String(config.api.port), 10)
const HOST = process.env.API_HOST || config.api.host

// Middleware
app.use(cors({ origin: true })) // Allow all origins for home network use
app.use(express.json())

// Routes
app.use('/api/posts', postsRouter)
app.use('/api/campaigns', campaignsRouter)
app.use('/api/media', mediaRouter)
app.use('/api/blog-drafts', blogDraftsRouter)
app.use('/api/blog-media', blogMediaRouter)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Initialize media directories
initMediaDir()
initBlogMediaDir()

// One-time migration from JSON file (if exists)
const jsonPath = path.join(os.homedir(), '.social-scheduler', 'posts.json')
const imported = importFromJson(jsonPath)
if (imported > 0) {
  console.log(`Migrated ${imported} posts from JSON file`)
}

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log(`API server running on http://${HOST}:${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/api/health`)
})

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Error: Port ${PORT} is already in use.`)
    console.error(`Either stop the other process or set a different port in config.json:`)
    console.error(`  { "api": { "port": <another-port> } }`)
    process.exit(1)
  }
  throw err
})
