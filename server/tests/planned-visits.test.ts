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
import { m, defaultSettings } from './helpers';

const validBody = {
  scheduledDate: '2026-08-25',
  timeSlot: '7:00 AM',
  hour24: 7,
  workoutFocus: ' Cardio ',
  notes: ' bring towel ',
};

function session(user: Record<string, unknown> | null) {
  m(auth.api.getSession).mockResolvedValue(user ? { user } : null);
}

describe('POST /api/gym/planned-visits', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m(prisma.gymSettings.findUnique).mockResolvedValue(defaultSettings);
  });

  it('returns 401 when unauthenticated and no demo member exists', async () => {
    m(prisma.user.findFirst).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/gym/planned-visits')
      .send({ scheduledDate: '2026-08-25', timeSlot: '6 PM', hour24: 18 });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Authentication required to schedule a visit.');
    expect(m(prisma.plannedVisit.create)).not.toHaveBeenCalled();
  });

  it('falls back to the first demo member for unauthenticated requests', async () => {
    m(prisma.user.findFirst).mockResolvedValue({ id: 'demo-user', role: 'user' });
    m(prisma.plannedVisit.findFirst).mockResolvedValue(null);
    const created = { id: 'new-visit' };
    m(prisma.plannedVisit.create).mockResolvedValue(created);

    const res = await request(app).post('/api/gym/planned-visits').send(validBody);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Visit scheduled for 7:00 AM on 2026-08-25.');
    expect(res.body.plannedVisit).toEqual(created);
    expect(m(prisma.plannedVisit.create)).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: 'demo-user' }),
    });
  });

  it('rejects payloads missing required fields with 400', async () => {
    session({ id: 'u1' });

    for (const bad of [
      {},
      { scheduledDate: '2026-08-25' },
      { scheduledDate: '2026-08-25', hour24: 7 },
      { timeSlot: '6 PM', hour24: 18 },
      { scheduledDate: '2026-08-25', timeSlot: '6 PM', hour24: '18' }, // string not allowed
    ]) {
      const res = await request(app).post('/api/gym/planned-visits').send(bad);
      expect(res.status, `payload ${JSON.stringify(bad)}`).toBe(400);
    }
    expect(m(prisma.plannedVisit.create)).not.toHaveBeenCalled();
  });

  it('replaces an existing visit for the same date via update path', async () => {
    session({ id: 'u1' });
    m(prisma.plannedVisit.findFirst).mockResolvedValue({ id: 'v9', userId: 'u1' });
    const updated = { id: 'v9' };
    m(prisma.plannedVisit.update).mockResolvedValue(updated);

    const res = await request(app).post('/api/gym/planned-visits').send(validBody);

    expect(res.status).toBe(200);
    expect(m(prisma.plannedVisit.update)).toHaveBeenCalledWith({
      where: { id: 'v9' },
      data: {
        timeSlot: '7:00 AM',
        hour24: 7,
        workoutFocus: 'Cardio',
        notes: 'bring towel',
        status: 'planned',
      },
    });
    expect(m(prisma.plannedVisit.create)).not.toHaveBeenCalled();
  });

  it('applies default workout focus and null notes when omitted', async () => {
    session({ id: 'u1' });
    m(prisma.plannedVisit.findFirst).mockResolvedValue(null);
    m(prisma.plannedVisit.create).mockResolvedValue({ id: 'v10' });

    await request(app)
      .post('/api/gym/planned-visits')
      .send({ scheduledDate: '2026-08-25', timeSlot: '6 PM', hour24: 18 });

    expect(m(prisma.plannedVisit.create)).toHaveBeenCalledWith({
      data: expect.objectContaining({
        workoutFocus: 'General Strength & Conditioning',
        notes: null,
      }),
    });
  });

  it.each([
    [99, 22],
    [0, 6],
    [-5, 6],
  ])('clamps out-of-range hour24 %i to %i', async (raw, clamped) => {
    session({ id: 'u1' });
    m(prisma.plannedVisit.findFirst).mockResolvedValue(null);
    m(prisma.plannedVisit.create).mockResolvedValue({ id: 'v11' });

    await request(app)
      .post('/api/gym/planned-visits')
      .send({ scheduledDate: '2026-08-25', timeSlot: '6 PM', hour24: raw });

    expect(m(prisma.plannedVisit.create)).toHaveBeenCalledWith({
      data: expect.objectContaining({ hour24: clamped }),
    });
  });
});

describe('DELETE /api/gym/planned-visits/:id', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns 404 when the visit does not exist', async () => {
    m(prisma.plannedVisit.findUnique).mockResolvedValue(null);

    const res = await request(app).delete('/api/gym/planned-visits/nope');

    expect(res.status).toBe(404);
    expect(m(prisma.plannedVisit.delete)).not.toHaveBeenCalled();
  });

  it('cancels an existing visit successfully', async () => {
    m(prisma.plannedVisit.findUnique).mockResolvedValue({
      id: 'v1',
      scheduledDate: '2026-08-25',
    });
    m(prisma.plannedVisit.delete).mockResolvedValue({ id: 'v1' });

    const res = await request(app).delete('/api/gym/planned-visits/v1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Scheduled visit cancelled successfully.');
    expect(m(prisma.plannedVisit.delete)).toHaveBeenCalledWith({ where: { id: 'v1' } });
  });
});

describe('GET /api/user/planned-visits', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns upcoming visits for the authenticated user', async () => {
    session({ id: 'u1' });
    const visits = [{ id: 'a' }, { id: 'b' }];
    m(prisma.plannedVisit.findMany).mockResolvedValue(visits);

    const res = await request(app).get('/api/user/planned-visits');

    expect(res.status).toBe(200);
    expect(res.body.visits).toEqual(visits);
    expect(m(prisma.plannedVisit.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'u1', status: 'planned' }),
      })
    );
  });

  it('returns an empty list for anonymous users when no demo member exists', async () => {
    session(null);
    m(prisma.user.findFirst).mockResolvedValue(null);

    const res = await request(app).get('/api/user/planned-visits');

    expect(res.body).toEqual({ success: true, visits: [] });
  });

  it('falls back to the demo member for anonymous users', async () => {
    session(null);
    m(prisma.user.findFirst).mockResolvedValue({ id: 'demo-user', role: 'user' });
    m(prisma.plannedVisit.findMany).mockResolvedValue([{ id: 'demo-visit' }]);

    const res = await request(app).get('/api/user/planned-visits');

    expect(res.body.visits).toEqual([{ id: 'demo-visit' }]);
    expect(m(prisma.plannedVisit.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: 'demo-user' }) })
    );
  });
});
