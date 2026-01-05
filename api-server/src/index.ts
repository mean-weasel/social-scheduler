import express from 'express'
import cors from 'cors'
import path from 'path'
import os from 'os'
import { postsRouter } from './routes/posts.js'
import { campaignsRouter } from './routes/campaigns.js'
import { importFromJson } from './storage.js'

const app = express()
const PORT = parseInt(process.env.API_PORT || '3001', 10)
const HOST = process.env.API_HOST || '0.0.0.0'

// Middleware
app.use(cors({ origin: true })) // Allow all origins for home network use
app.use(express.json())

// Routes
app.use('/api/posts', postsRouter)
app.use('/api/campaigns', campaignsRouter)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// One-time migration from JSON file (if exists)
const jsonPath = path.join(os.homedir(), '.social-scheduler', 'posts.json')
const imported = importFromJson(jsonPath)
if (imported > 0) {
  console.log(`Migrated ${imported} posts from JSON file`)
}

// Start server
app.listen(PORT, HOST, () => {
  console.log(`API server running on http://${HOST}:${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/api/health`)
})
