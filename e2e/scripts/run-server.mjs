import { execSync, spawn } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(here, '..', '..', 'server');

const API_PORT = process.env.E2E_API_PORT || '3100';
const CLIENT_PORT = process.env.E2E_CLIENT_PORT || '5174';
const CLIENT_ORIGIN = `http://localhost:${CLIENT_PORT}`;

// Isolated SQLite database, recreated from scratch on every boot
for (const rel of ['prisma/e2e-test.db', 'prisma/e2e-test.db-journal']) {
  const abs = path.join(serverDir, rel);
  if (existsSync(abs)) rmSync(abs);
}

const env = {
  ...process.env,
  PORT: API_PORT,
  DATABASE_URL: 'file:./e2e-test.db',
  BETTER_AUTH_URL: CLIENT_ORIGIN,
  BETTER_AUTH_SECRET: 'e2e-playwright-secret-0123456789abcdef',
  CLIENT_URL: CLIENT_ORIGIN,
  NODE_ENV: 'development',
};

console.log('[e2e-api] pushing Prisma schema to fresh e2e database...');
execSync('bunx prisma db push --skip-generate', { cwd: serverDir, env, stdio: 'inherit' });

console.log(`[e2e-api] starting GymFlow server on port ${API_PORT}`);
const child = spawn('bun', ['src/index.ts'], {
  cwd: serverDir,
  env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

child.on('exit', (code) => process.exit(code ?? 0));
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    child.kill();
    process.exit(0);
  });
}
