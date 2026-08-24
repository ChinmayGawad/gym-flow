import { defineConfig } from '@playwright/test';
import path from 'node:path';

// Playwright may transpile this file to CJS; support both module systems
const here = path.resolve(typeof __dirname === 'undefined' ? '.' : __dirname);
const clientDir = path.resolve(here, '..', 'client');

const API_PORT = Number(process.env.E2E_API_PORT || 3100);
const CLIENT_PORT = Number(process.env.E2E_CLIENT_PORT || 5174);

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${CLIENT_PORT}`,
    viewport: { width: 1366, height: 850 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: [
    {
      command: 'node scripts/run-server.mjs',
      cwd: here,
      url: `http://localhost:${API_PORT}/api/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        E2E_API_PORT: String(API_PORT),
        E2E_CLIENT_PORT: String(CLIENT_PORT),
      },
    },
    {
      command: `bunx vite --port ${CLIENT_PORT} --strictPort`,
      cwd: clientDir,
      url: `http://localhost:${CLIENT_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        VITE_API_PROXY_TARGET: `http://localhost:${API_PORT}`,
      },
    },
  ],
});
