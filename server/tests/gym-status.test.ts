import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/lib/db', () => ({
  prisma: {
    user: {
      count: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    gymSettings: { findUnique: vi.fn(), create: vi.fn(), upsert: vi.fn() },
    plannedVisit: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    visitLog: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    occupancyLog: { create: vi.fn() },
  },
}));

vi.mock('../src/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
      signUpEmail: vi.fn(),
      setUserPassword: vi.fn(),
    },
  },
}));

import request from 'supertest';
import { app } from '../src/index';
import { prisma } from '../src/lib/db';
import { auth } from '../src/lib/auth';
import { m, defaultSettings, configureCountMocks } from './helpers';

describe('GET /api/gym/status', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m(prisma.gymSettings.findUnique).mockResolvedValue(defaultSettings);
  });

  it.each([
    { checkedIn: 9, total: 10, expectedStatus: 'LOW', expectedWait: '0–5 min', expectedPct: 30 },
    { checkedIn: 12, total: 10, expectedStatus: 'MODERATE', expectedWait: '10 min', expectedPct: 40 },
    { checkedIn: 25, total: 10, expectedStatus: 'HIGH', expectedWait: '15–25 min', expectedPct: 83 },
  ])(
    'classifies $expectedStatus at $checkedIn/$total checked in',
    async ({ checkedIn, total, expectedStatus, expectedWait, expectedPct }) => {
      configureCountMocks(prisma, { total, checkedIn });

      const res = await request(app).get('/api/gym/status');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.peopleCount).toBe(checkedIn);
      expect(res.body.totalRegisteredMembers).toBe(total);
      expect(res.body.percentage).toBe(expectedPct);
      expect(res.body.turnoutPercentage).toBe(Math.round((checkedIn / total) * 100));
      expect(res.body.status).toBe(expectedStatus);
      expect(res.body.waitTime).toBe(expectedWait);
      expect(res.body.gymName).toBe(defaultSettings.gymName);
    }
  );

  it('reports zero turnout when no members are registered (no division errors)', async () => {
    configureCountMocks(prisma, { total: 0, checkedIn: 0 });

    const res = await request(app).get('/api/gym/status');

    expect(res.status).toBe(200);
    expect(res.body.turnoutPercentage).toBe(0);
    expect(Number.isFinite(res.body.percentage)).toBe(true);
  });

  it('marks isCheckedInSelf=true for an authenticated, checked-in member', async () => {
    configureCountMocks(prisma, { total: 5, checkedIn: 1 });
    m(auth.api.getSession).mockResolvedValue({ user: { id: 'u1' } });
    m(prisma.user.findUnique).mockResolvedValue({ isCheckedIn: true });

    const res = await request(app).get('/api/gym/status');

    expect(res.body.isCheckedInSelf).toBe(true);
    expect(m(prisma.user.findUnique)).toHaveBeenCalledWith({
      where: { id: 'u1' },
      select: { isCheckedIn: true },
    });
  });

  it('marks isCheckedInSelf=false for an authenticated, checked-out member', async () => {
    configureCountMocks(prisma, { total: 5, checkedIn: 1 });
    m(auth.api.getSession).mockResolvedValue({ user: { id: 'u2' } });
    m(prisma.user.findUnique).mockResolvedValue({ isCheckedIn: false });

    const res = await request(app).get('/api/gym/status');
    expect(res.body.isCheckedInSelf).toBe(false);
  });

  it('treats anonymous visitors as not checked in even when getSession throws', async () => {
    configureCountMocks(prisma, { total: 5, checkedIn: 2 });
    m(auth.api.getSession).mockRejectedValue(new Error('no session'));

    const res = await request(app).get('/api/gym/status');

    expect(res.status).toBe(200);
    expect(res.body.isCheckedInSelf).toBe(false);
  });

  it('creates default gym settings when none exist yet', async () => {
    m(prisma.gymSettings.findUnique).mockResolvedValue(null);
    m(prisma.gymSettings.create).mockResolvedValue(defaultSettings);
    configureCountMocks(prisma, { total: 3, checkedIn: 3 });

    const res = await request(app).get('/api/gym/status');

    expect(res.status).toBe(200);
    expect(m(prisma.gymSettings.create)).toHaveBeenCalledWith({
      data: { id: 'default', capacity: 30, gymName: 'GymFlow Fitness' },
    });
    expect(res.body.capacity).toBe(30);
  });

  it('returns 500 when the settings lookup explodes', async () => {
    m(prisma.gymSettings.findUnique).mockRejectedValue(new Error('db down'));

    const res = await request(app).get('/api/gym/status');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to fetch gym status.');
  });
});
