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
import { app, generateForecastData } from '../src/index';
import { prisma } from '../src/lib/db';
import { auth } from '../src/lib/auth';
import { m } from './helpers';

const CAPACITY = 50;
const settings = { id: 'default', capacity: CAPACITY, gymName: 'GymFlow Fitness' };

const plannedVisits = [
  {
    id: 'v1',
    userId: 'u1',
    hour24: 18,
    workoutFocus: 'Back & Biceps',
    user: { id: 'u1', name: 'Ann', image: null },
  },
  {
    id: 'v2',
    userId: 'u2',
    hour24: 18,
    workoutFocus: 'Legs',
    user: { id: 'u2', name: 'Bob', image: null },
  },
  {
    id: 'v3',
    userId: 'u3',
    hour24: 8,
    workoutFocus: 'HIIT',
    user: { id: 'u3', name: 'Cara', image: null },
  },
];

function arrangeHappyPath() {
  m(prisma.gymSettings.findUnique).mockResolvedValue(settings);
  m(prisma.plannedVisit.findMany).mockResolvedValue(plannedVisits);
  m(prisma.user.count).mockResolvedValue(0);
}

describe('generateForecastData', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    arrangeHappyPath();
  });

  it('produces one slot per operating hour (6 AM – 10 PM)', async () => {
    const data = await generateForecastData('2026-08-24');

    expect(data.success).toBe(true);
    expect(data.date).toBe('2026-08-24');
    expect(data.capacity).toBe(CAPACITY);
    expect(data.forecast).toHaveLength(17);
    expect(data.forecast[0]).toMatchObject({ id: '1', hour24: 6, time: '6 AM' });
    expect(data.forecast[16]).toMatchObject({ id: '17', hour24: 22, time: '10 PM' });
  });

  it('strictly derives forecast from planned visits in database', async () => {
    const data = await generateForecastData('2026-08-24');

    // 6 PM slot: 2 planned -> 2 predicted (4% -> LOW)
    const slot18 = data.forecast.find((s) => s.hour24 === 18)!;
    expect(slot18.plannedCount).toBe(2);
    expect(slot18.predictedCount).toBe(2);
    expect(slot18.percentage).toBe(4);
    expect(slot18.status).toBe('LOW');
    expect(slot18.isHighest).toBe(true); // highest planned count of the day

    // 7 PM slot: 0 planned -> 0 predicted (0%)
    const slot19 = data.forecast.find((s) => s.hour24 === 19)!;
    expect(slot19.plannedCount).toBe(0);
    expect(slot19.predictedCount).toBe(0);
    expect(slot19.percentage).toBe(0);
    expect(slot19.isHighest).toBe(false);

    // 8 AM slot has Cara's planned visit attached
    const slot8 = data.forecast.find((s) => s.hour24 === 8)!;
    expect(slot8.plannedMembers).toEqual([
      { id: 'u3', name: 'Cara', image: null, workoutFocus: 'HIIT' },
    ]);
    expect(slot8.hasUserBooked).toBe(false);

    expect(data.totalPlannedVisits).toBe(3);
  });

  it('flags optimal window for quietest daytime hour', async () => {
    const data = await generateForecastData('2026-08-24');

    const optimalSlots = data.forecast.filter((s) => s.isOptimal);
    expect(optimalSlots).toHaveLength(1);
    expect(optimalSlots[0].plannedCount).toBe(0);
    expect(data.optimalWindow.status).toBe('LOW');
  });

  it('marks booking state and visit id for the current user', async () => {
    const data = await generateForecastData('2026-08-24', 'u1');

    const slot18 = data.forecast.find((s) => s.hour24 === 18)!;
    expect(slot18.hasUserBooked).toBe(true);
    expect(slot18.userVisitId).toBe('v1');
    expect(data.forecast.find((s) => s.hour24 === 8)!.hasUserBooked).toBe(false);
  });

  it('includes the user’s own planned visit when they have one', async () => {
    const record = {
      id: 'v1',
      scheduledDate: '2026-08-24',
      timeSlot: '6 PM',
      hour24: 18,
      workoutFocus: 'Back & Biceps',
      notes: null,
    };
    m(prisma.plannedVisit.findFirst).mockResolvedValue(record);

    const data = await generateForecastData('2026-08-24', 'u1');

    expect(m(prisma.plannedVisit.findFirst)).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: 'u1' }) })
    );
    expect(data.userPlannedVisit).toEqual(record);
  });

  it('skips the personal-visit lookup for anonymous callers', async () => {
    await generateForecastData('2026-08-24', null);
    expect(m(prisma.plannedVisit.findFirst)).not.toHaveBeenCalled();
    expect(await (await import('../src/index')).generateForecastData('2026-08-24')).toMatchObject({
      userPlannedVisit: null,
    });
  });
});

describe('GET /api/gym/forecast', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    arrangeHappyPath();
    m(prisma.plannedVisit.findFirst).mockResolvedValue(null);
  });

  it('passes the requested date through and works anonymously', async () => {
    const res = await request(app).get('/api/gym/forecast?date=2026-08-24');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.date).toBe('2026-08-24');
    expect(res.body.forecast).toHaveLength(17);
  });

  it('defaults to today when no date query is provided', async () => {
    const res = await request(app).get('/api/gym/forecast');
    expect(res.body.date).toBe(new Date().toISOString().split('T')[0]);
  });

  it('still serves forecast data when session resolution throws', async () => {
    m(auth.api.getSession).mockRejectedValue(new Error('boom'));

    const res = await request(app).get('/api/gym/forecast?date=2026-08-24');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.userPlannedVisit).toBeNull();
  });

  it('returns 500 when forecast generation fails', async () => {
    m(prisma.gymSettings.findUnique).mockRejectedValue(new Error('db down'));

    const res = await request(app).get('/api/gym/forecast?date=2026-08-24');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to generate crowd forecast.');
  });
});
