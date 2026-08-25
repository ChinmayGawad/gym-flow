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

describe('PUT /api/admin/gym/capacity', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it.each([
    ['unauthenticated', null],
    ['non-admin member', { id: 'm1', role: 'user' }],
  ])('denies %s with 403', async (_label, who) => {
    session(who);

    const res = await request(app).put('/api/admin/gym/capacity').send({ capacity: 45 });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Unauthorized: Administrator access required.');
    expect(m(prisma.gymSettings.upsert)).not.toHaveBeenCalled();
  });

  it('rejects capacities that are not integers between 10 and 2000', async () => {
    session({ id: 'a1', role: 'admin' });

    for (const bad of [undefined, 'abc', '5', '9.5', '3000']) {
      const res = await request(app).put('/api/admin/gym/capacity').send({ capacity: bad });
      expect(res.status, `capacity ${bad}`).toBe(400);
      expect(res.body.error).toBe('Capacity must be a valid number between 10 and 2000.');
    }
    expect(m(prisma.gymSettings.upsert)).not.toHaveBeenCalled();
  });

  it('persists a valid capacity and logs an occupancy snapshot', async () => {
    session({ id: 'a1', role: 'admin' });
    const updated = { ...defaultSettings, capacity: 120 };
    m(prisma.gymSettings.upsert).mockResolvedValue(updated);
    configureCountMocks(prisma, { total: 20, checkedIn: 7 });

    const res = await request(app)
      .put('/api/admin/gym/capacity')
      .send({ capacity: 120 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Gym capacity updated to 120 occupants.');
    expect(res.body.settings.capacity).toBe(120);
    expect(m(prisma.gymSettings.upsert)).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'default' }, update: { capacity: 120 } })
    );
    expect(m(prisma.occupancyLog.create)).toHaveBeenCalledWith({
      data: { occupantsCount: 7, capacity: 120 },
    });
  });

  it('trims the optional gym name when provided', async () => {
    session({ id: 'a1', role: 'admin' });
    m(prisma.gymSettings.upsert).mockResolvedValue(defaultSettings);
    configureCountMocks(prisma, { total: 1, checkedIn: 0 });

    await request(app)
      .put('/api/admin/gym/capacity')
      .send({ capacity: '80', gymName: '  Iron Paradise  ' });

    expect(m(prisma.gymSettings.upsert)).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { capacity: 80, gymName: 'Iron Paradise' },
      })
    );
  });
});

describe('GET /api/admin/members', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('rejects non-admin sessions with 403', async () => {
    session({ id: 'm1', role: 'user' });

    const res = await request(app).get('/api/admin/members');

    expect(res.status).toBe(403);
    expect(m(prisma.user.findMany)).not.toHaveBeenCalled();
  });

  it('returns the member roster for an admin', async () => {
    session({ id: 'a1', role: 'admin' });
    const members = [
      { id: 'm1', name: 'Ann', isCheckedIn: true },
      { id: 'm2', name: 'Bob', isCheckedIn: false },
    ];
    m(prisma.user.findMany).mockResolvedValue(members);

    const res = await request(app).get('/api/admin/members');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.members).toEqual(members);
    expect(m(prisma.user.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' } })
    );
  });

  it('resolves the admin role from the database when absent on the session', async () => {
    session({ id: 'a1' }); // no role embedded
    m(prisma.user.findUnique).mockResolvedValue({ role: 'admin' });
    m(prisma.user.findMany).mockResolvedValue([]);

    const res = await request(app).get('/api/admin/members');

    expect(res.status).toBe(200);
    expect(m(prisma.user.findUnique)).toHaveBeenCalledWith({
      where: { id: 'a1' },
      select: { role: true },
    });
  });
});

describe('PUT /api/admin/members/:id', () => {
  const existingUser = { id: 'm1', name: 'Old Name', email: 'old@x.com' };

  function arrangeTarget(target: Record<string, unknown> | null) {
    m(prisma.user.findUnique).mockImplementation((args?: any) => {
      if (args?.where?.email) return Promise.resolve(null); // email availability check
      return Promise.resolve(target); // existence check
    });
  }

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('rejects non-admin sessions with 403', async () => {
    session({ id: 'x', role: 'user' });

    const res = await request(app).put('/api/admin/members/m1').send({ name: 'X Y' });

    expect(res.status).toBe(403);
  });

  it('returns 404 for unknown members', async () => {
    session({ id: 'a1', role: 'admin' });
    arrangeTarget(null);

    const res = await request(app).put('/api/admin/members/ghost').send({ name: 'X Y' });

    expect(res.status).toBe(404);
  });

  it('blocks email changes to an address already in use', async () => {
    session({ id: 'a1', role: 'admin' });
    m(prisma.user.findUnique).mockImplementation((args?: any) => {
      if (args?.where?.email === 'taken@x.com') return Promise.resolve({ id: 'someone-else' });
      return Promise.resolve(existingUser);
    });

    const res = await request(app)
      .put('/api/admin/members/m1')
      .send({ email: 'taken@x.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('already in use');
    expect(m(prisma.user.update)).not.toHaveBeenCalled();
  });

  it('updates profile fields with normalization', async () => {
    session({ id: 'a1', role: 'admin' });
    arrangeTarget(existingUser);
    const saved = { ...existingUser, name: 'New Name', email: 'new@x.com' };
    m(prisma.user.update).mockResolvedValue(saved);

    const res = await request(app)
      .put('/api/admin/members/m1')
      .send({
        name: ' New Name ',
        email: 'New@X.com',
        role: 'admin',
        plan: 'elite',
        planStatus: 'active',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Member "New Name" updated successfully.');
    expect(m(prisma.user.update)).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: {
        name: 'New Name',
        email: 'new@x.com',
        role: 'admin',
        plan: 'elite',
        planStatus: 'active',
      },
    });
  });

  it('ignores invalid role/plan values instead of persisting them', async () => {
    session({ id: 'a1', role: 'admin' });
    arrangeTarget(existingUser);
    m(prisma.user.update).mockResolvedValue(existingUser);

    await request(app)
      .put('/api/admin/members/m1')
      .send({ role: 'superuser', plan: 'gold' });

    expect(m(prisma.user.update)).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: {},
    });
  });

  it('delegates password changes to Better Auth only for passwords of 8+ chars', async () => {
    session({ id: 'a1', role: 'admin' });
    arrangeTarget(existingUser);
    m(prisma.user.update).mockResolvedValue(existingUser);

    await request(app).put('/api/admin/members/m1').send({ password: 'NewPass123' });

    expect(m(auth.api.setUserPassword)).toHaveBeenCalledWith({
      body: { userId: 'm1', newPassword: 'NewPass123' },
      headers: expect.anything(),
    });

    m(auth.api.setUserPassword).mockClear();
    await request(app).put('/api/admin/members/m1').send({ password: 'short' });
    expect(m(auth.api.setUserPassword)).not.toHaveBeenCalled();
  });
});

describe('POST /api/user/visits (manual workout log)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    session(null);
  });

  it('requires authentication when no users exist to fall back on', async () => {
    m(prisma.user.findFirst).mockResolvedValue(null);

    const res = await request(app).post('/api/user/visits').send({});

    expect(res.status).toBe(401);
  });

  it('persists a workout log for the authenticated user with defaults applied', async () => {
    session({ id: 'u1' });
    const created = { id: 'log42' };
    m(prisma.visitLog.create).mockResolvedValue(created);

    const res = await request(app).post('/api/user/visits').send({
      workoutType: 'Push Day',
      durationMinutes: '45',
      calories: '270',
      notes: 'Felt strong',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.visit).toEqual(created);

    const call = m(prisma.visitLog.create).mock.calls[0][0];
    expect(call.data).toMatchObject({
      userId: 'u1',
      durationMinutes: 45,
      caloriesBurned: 270,
      workoutType: 'Push Day',
      notes: 'Felt strong',
    });
    // checkOutTime should be exactly 45 minutes after checkInTime
    const elapsed =
      (new Date(call.data.checkOutTime).getTime() - new Date(call.data.checkInTime).getTime()) /
      60000;
    expect(elapsed).toBe(45);
  });

  it('falls back to the first user for anonymous requests (demo mode)', async () => {
    m(prisma.user.findFirst).mockResolvedValue({ id: 'demo-user' });
    m(prisma.visitLog.create).mockResolvedValue({ id: 'log43' });

    const res = await request(app).post('/api/user/visits').send({});

    expect(res.status).toBe(200);
    expect(m(prisma.visitLog.create)).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'demo-user',
        durationMinutes: 60,
        caloriesBurned: 300,
        workoutType: 'General Strength & Conditioning',
      }),
    });
  });
});

describe('DELETE /api/user/visits/:id', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('deletes a workout log successfully', async () => {
    m(prisma.visitLog.delete).mockResolvedValue({ id: 'log1' });

    const res = await request(app).delete('/api/user/visits/log1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'Workout log deleted.' });
    expect(m(prisma.visitLog.delete)).toHaveBeenCalledWith({ where: { id: 'log1' } });
  });

  it('returns 500 when deletion fails', async () => {
    m(prisma.visitLog.delete).mockRejectedValue(new Error('record not found'));

    const res = await request(app).delete('/api/user/visits/log1');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to delete workout log.');
  });
});
