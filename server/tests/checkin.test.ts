import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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
      getSession: vi.fn().mockResolvedValue(null),
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

function session(user: Record<string, unknown> | null) {
  m(auth.api.getSession).mockResolvedValue(user ? { user } : null);
}

afterEach(() => {
  vi.useRealTimers();
});

describe('POST /api/gym/checkin-toggle (member self service)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m(prisma.gymSettings.findUnique).mockResolvedValue(defaultSettings);
  });

  it('requires authentication', async () => {
    session(null);

    const res = await request(app).post('/api/gym/checkin-toggle');

    expect(res.status).toBe(401);
    expect(m(prisma.user.update)).not.toHaveBeenCalled();
  });

  it('returns 500 when session resolution throws', async () => {
    m(auth.api.getSession).mockRejectedValue(new Error('boom'));

    const res = await request(app).post('/api/gym/checkin-toggle');

    expect(res.status).toBe(500);
  });

  it('returns 404 when the session user is missing from the database', async () => {
    session({ id: 'ghost' });
    m(prisma.user.findUnique).mockResolvedValue(null);

    const res = await request(app).post('/api/gym/checkin-toggle');

    expect(res.status).toBe(404);
  });

  it('checks a member IN: flips state, opens a visit log and returns metrics', async () => {
    session({ id: 'u1' });
    m(prisma.user.findUnique).mockResolvedValue({
      id: 'u1',
      name: 'Member One',
      isCheckedIn: false,
    });
    m(prisma.user.update).mockResolvedValue({ id: 'u1', isCheckedIn: true });
    configureCountMocks(prisma, { total: 10, checkedIn: 1 });

    const res = await request(app).post('/api/gym/checkin-toggle');

    expect(res.status).toBe(200);
    expect(res.body.isCheckedIn).toBe(true);
    expect(res.body.message).toContain('Welcome');
    expect(res.body.peopleCount).toBe(1);
    expect(res.body.totalRegisteredMembers).toBe(10);
    expect(res.body.percentage).toBe(Math.round((1 / 30) * 100));

    const updateCall = m(prisma.user.update).mock.calls[0][0];
    expect(updateCall.where).toEqual({ id: 'u1' });
    expect(updateCall.data.isCheckedIn).toBe(true);
    expect(updateCall.data.lastCheckInAt).toBeInstanceOf(Date);

    expect(m(prisma.visitLog.create)).toHaveBeenCalledTimes(1);
    expect(m(prisma.visitLog.create)).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: 'u1', caloriesBurned: 300 }),
    });
  });

  it('checks a member OUT: closes the open visit log with duration and calories', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-08-24T18:00:00Z'));

    session({ id: 'u1' });
    m(prisma.user.findUnique).mockResolvedValue({
      id: 'u1',
      name: 'Member One',
      isCheckedIn: true,
    });
    // Open visit started exactly 90 minutes ago
    m(prisma.visitLog.findFirst).mockResolvedValue({
      id: 'log1',
      checkInTime: new Date('2026-08-24T16:30:00Z'),
    });

    const res = await request(app).post('/api/gym/checkin-toggle');

    expect(res.status).toBe(200);
    expect(res.body.isCheckedIn).toBe(false);
    expect(res.body.message).toContain('checked out');

    expect(m(prisma.visitLog.update)).toHaveBeenCalledWith({
      where: { id: 'log1' },
      data: { checkOutTime: expect.any(Date), durationMinutes: 90, caloriesBurned: 540 },
    });
  });
});

describe('POST /api/admin/members/:id/checkin-toggle', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('rejects non-admin sessions with 403', async () => {
    session({ id: 'm2', role: 'user' });

    const res = await request(app).post('/api/admin/members/m1/checkin-toggle');

    expect(res.status).toBe(403);
    expect(m(prisma.user.findUnique)).not.toHaveBeenCalled();
  });

  it('falls back to the database for the caller role when session lacks one', async () => {
    session({ id: 'a1' }); // no role on session
    m(prisma.user.findUnique).mockImplementation((args?: any) => {
      if (args?.select?.role) return Promise.resolve({ role: 'admin' });
      return Promise.resolve(null); // target member lookup
    });

    const res = await request(app).post('/api/admin/members/missing/checkin-toggle');

    expect(res.status).toBe(404); // got past authorization
    expect(res.body.error).toBe('Member not found.');
  });

  it('returns 404 when target member does not exist', async () => {
    session({ id: 'a1', role: 'admin' });
    m(prisma.user.findUnique).mockResolvedValue(null);

    const res = await request(app).post('/api/admin/members/ghost/checkin-toggle');

    expect(res.status).toBe(404);
  });

  it('checks a member IN on their behalf', async () => {
    session({ id: 'a1', role: 'admin' });
    m(prisma.user.findUnique).mockResolvedValue({
      id: 'm1',
      name: 'Jane Doe',
      isCheckedIn: false,
    });
    configureCountMocks(prisma, { total: 8, checkedIn: 5 });

    const res = await request(app).post('/api/admin/members/m1/checkin-toggle');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.userId).toBe('m1');
    expect(res.body.isCheckedIn).toBe(true);
    expect(res.body.message).toBe('Jane Doe is now checked in.');
    expect(res.body.checkedInCount).toBe(5);
    expect(m(prisma.visitLog.create)).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: 'm1' }),
    });
  });

  it('checks a member OUT and clamps short visits to a 15-minute minimum', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-08-24T12:00:00Z'));

    session({ id: 'a1', role: 'admin' });
    m(prisma.user.findUnique).mockResolvedValue({
      id: 'm1',
      name: 'Jane Doe',
      isCheckedIn: true,
    });
    // Visit opened only 1 minute ago -> duration must clamp to 15
    m(prisma.visitLog.findFirst).mockResolvedValue({
      id: 'log9',
      checkInTime: new Date('2026-08-24T11:59:00Z'),
    });

    const res = await request(app).post('/api/admin/members/m1/checkin-toggle');

    expect(res.status).toBe(200);
    expect(res.body.isCheckedIn).toBe(false);
    expect(res.body.message).toBe('Jane Doe is now checked out.');
    expect(m(prisma.visitLog.update)).toHaveBeenCalledWith({
      where: { id: 'log9' },
      data: expect.objectContaining({ durationMinutes: 15, caloriesBurned: 90 }),
    });
  });
});

describe('POST /api/gym/simulation-step', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m(prisma.gymSettings.findUnique).mockResolvedValue(defaultSettings);
    configureCountMocks(prisma, { total: 3, checkedIn: 0 });
  });

  it('sets exact occupancy by flipping only the members required', async () => {
    m(prisma.user.findMany).mockResolvedValue([
      { id: 'A', isCheckedIn: true },
      { id: 'B', isCheckedIn: false },
      { id: 'C', isCheckedIn: false },
    ]);

    const res = await request(app)
      .post('/api/gym/simulation-step')
      .send({ exactCount: 2 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, peopleCount: 0, capacity: 30 }); // count mocked to 0

    // Only B needs flipping; A stays in, C stays out.
    expect(m(prisma.user.update)).toHaveBeenCalledTimes(1);
    expect(m(prisma.user.update)).toHaveBeenCalledWith({
      where: { id: 'B' },
      data: expect.objectContaining({ isCheckedIn: true }),
    });
  });

  it('clamps exactCount to the number of registered members', async () => {
    m(prisma.user.findMany).mockResolvedValue([
      { id: 'A', isCheckedIn: false },
      { id: 'B', isCheckedIn: false },
    ]);
    configureCountMocks(prisma, { total: 2, checkedIn: 2 });

    await request(app).post('/api/gym/simulation-step').send({ exactCount: 99 });

    expect(m(prisma.user.update)).toHaveBeenCalledTimes(2);
  });

  it('applies negative delta by checking out the first checked-in member', async () => {
    m(prisma.user.findMany).mockResolvedValue([
      { id: 'A', isCheckedIn: true },
      { id: 'B', isCheckedIn: true },
    ]);

    const res = await request(app).post('/api/gym/simulation-step').send({ delta: -1 });

    expect(res.status).toBe(200);
    expect(m(prisma.user.update)).toHaveBeenCalledTimes(1);
    expect(m(prisma.user.update)).toHaveBeenCalledWith({
      where: { id: 'A' },
      data: expect.objectContaining({ isCheckedIn: false }),
    });
  });

  it('is a no-op success when there are no registered users', async () => {
    m(prisma.user.findMany).mockResolvedValue([]);

    const res = await request(app).post('/api/gym/simulation-step').send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(m(prisma.user.update)).not.toHaveBeenCalled();
  });

  it('returns 500 when the simulation crashes', async () => {
    m(prisma.user.findMany).mockRejectedValue(new Error('db down'));

    const res = await request(app).post('/api/gym/simulation-step').send({});

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to simulate step');
  });
});
