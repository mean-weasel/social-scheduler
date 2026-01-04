import { defineConfig, devices } from '@playwright/test'

const PORT = process.env.TEST_PORT || 5176
const API_PORT = 3001

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Use 1 worker locally to avoid database race conditions with shared SQLite
  // CI can use parallelism via sharding (separate database per shard)
  workers: process.env.CI ? undefined : 1,
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
