import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('getApiBaseUrl', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('prefixes https:// to bare production hosts', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'gymflow-api.up.railway.app');
    const { getApiBaseUrl } = await import('@/lib/api-config');
    expect(getApiBaseUrl()).toBe('https://gymflow-api.up.railway.app');
  });

  it('keeps explicit https URLs untouched', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com');
    const { getApiBaseUrl } = await import('@/lib/api-config');
    expect(getApiBaseUrl()).toBe('https://api.example.com');
  });

  it('ignores localhost overrides so the dev proxy is used', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3000');
    const { getApiBaseUrl } = await import('@/lib/api-config');
    expect(getApiBaseUrl()).toBe(window.location.origin);
  });

  it('falls back to window.location.origin when env is unset or blank', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '   ');
    const { getApiBaseUrl } = await import('@/lib/api-config');
    expect(getApiBaseUrl()).toBe(window.location.origin);
  });
});
