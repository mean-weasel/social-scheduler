var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { defineConfig, devices } from '@playwright/test';
import { config } from './config/index.js';
var PORT = process.env.TEST_PORT || config.test.port;
var API_PORT = config.api.port;
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
        baseURL: "http://localhost:".concat(PORT),
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: __assign({}, devices['Desktop Chrome']),
        },
    ],
    webServer: [
        {
            command: 'npm run api:start',
            url: "http://localhost:".concat(API_PORT, "/api/posts"),
            reuseExistingServer: !process.env.CI,
            timeout: 30 * 1000,
        },
        {
            command: "npm run dev -- --port ".concat(PORT),
            url: "http://localhost:".concat(PORT),
            reuseExistingServer: !process.env.CI,
            timeout: 120 * 1000,
        },
    ],
});
