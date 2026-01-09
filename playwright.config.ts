import { defineConfig, devices } from '@playwright/test'
import { config } from './config/index.js'

const PORT = process.env.TEST_PORT || config.test.port
const API_PORT = config.api.port

export default defineConfig({
  testDir: './e2e',
  // Disable parallel tests within files - tests share SQLite database
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Use 1 worker to avoid database race conditions with shared SQLite
  // Sharding still provides parallelism across CI jobs
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run api:start',
      url: `http://localhost:${API_PORT}/api/posts`,
      reuseExistingServer: !process.env.CI,
      timeout: 30 * 1000,
    },
    {
      command: `npm run dev -- --port ${PORT}`,
      url: `http://localhost:${PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
})
