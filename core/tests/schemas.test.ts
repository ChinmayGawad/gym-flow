import { describe, it, expect } from 'vitest';
import {
  signInSchema,
  createMemberSchema,
  updateCapacitySchema,
  createPlannedVisitSchema,
  MEMBERSHIP_PLANS,
} from '../src/index';

describe('signInSchema', () => {
  it('accepts valid credentials', () => {
    const result = signInSchema.safeParse({
      email: 'member@gymflow.com',
      password: 'secret123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email address', () => {
    const result = signInSchema.safeParse({ email: 'not-an-email', password: 'x' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty password', () => {
    const result = signInSchema.safeParse({ email: 'a@b.com', password: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Password is required');
    }
  });
});

describe('createMemberSchema', () => {
  const valid = {
    name: 'Chinmay Gawad',
    email: 'chinmay@gymflow.com',
    password: 'Password123',
  };

  it('accepts a valid member payload and defaults plan to basic', () => {
    const result = createMemberSchema.parse(valid);
    expect(result.plan).toBe('basic');
  });

  it.each(['basic', 'pro', 'elite'])('accepts explicit plan %s', (plan) => {
    const result = createMemberSchema.safeParse({ ...valid, plan });
    expect(result.success).toBe(true);
  });

  it('rejects names shorter than 2 characters', () => {
    const result = createMemberSchema.safeParse({ ...valid, name: 'J' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Name must be at least 2 characters');
    }
  });

  it('rejects passwords shorter than 8 characters', () => {
    const result = createMemberSchema.safeParse({ ...valid, password: 'short1!' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Password must be at least 8 characters');
    }
  });

  it('rejects invalid emails and unknown plans', () => {
    expect(createMemberSchema.safeParse({ ...valid, email: 'nope' }).success).toBe(false);
    expect(createMemberSchema.safeParse({ ...valid, plan: 'gold' }).success).toBe(false);
  });
});

describe('updateCapacitySchema', () => {
  it('accepts a capacity within bounds without gymName', () => {
    const result = updateCapacitySchema.parse({ capacity: 45 });
    expect(result).toEqual({ capacity: 45 });
  });

  it('accepts the exact lower and upper bounds (10 and 2000)', () => {
    expect(updateCapacitySchema.safeParse({ capacity: 10 }).success).toBe(true);
    expect(updateCapacitySchema.safeParse({ capacity: 2000 }).success).toBe(true);
  });

  it('rejects capacities below 10 with the schema message', () => {
    const result = updateCapacitySchema.safeParse({ capacity: 9 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Capacity must be at least 10');
    }
  });

  it('rejects capacities above 2000', () => {
    const result = updateCapacitySchema.safeParse({ capacity: 2001 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Capacity cannot exceed 2000');
    }
  });

  it('rejects non-integer capacities', () => {
    expect(updateCapacitySchema.safeParse({ capacity: 30.5 }).success).toBe(false);
  });

  it('rejects gymName shorter than 2 characters but accepts valid ones', () => {
    expect(updateCapacitySchema.safeParse({ capacity: 30, gymName: 'G' }).success).toBe(false);
    expect(
      updateCapacitySchema.safeParse({ capacity: 30, gymName: 'GymFlow Fitness' }).success
    ).toBe(true);
  });
});

describe('createPlannedVisitSchema', () => {
  const valid = {
    scheduledDate: '2026-08-24',
    timeSlot: '6:00 PM',
    hour24: 18,
  };

  it('accepts a minimal valid visit', () => {
    const result = createPlannedVisitSchema.parse(valid);
    expect(result.scheduledDate).toBe('2026-08-24');
    expect(result.workoutFocus).toBeUndefined();
    expect(result.notes).toBeUndefined();
  });

  it('rejects malformed dates', () => {
    for (const bad of ['24-08-2026', '2026/08/24', '2026-8-24', 'tomorrow']) {
      expect(createPlannedVisitSchema.safeParse({ ...valid, scheduledDate: bad }).success).toBe(
        false
      );
    }
  });

  it.each([5, 6, 22, 23])(
    'enforces hour24 bounds of 6 to 22 (input: %i)',
    (hour24) => {
      const result = createPlannedVisitSchema.safeParse({ ...valid, hour24 });
      expect(result.success).toBe(hour24 >= 6 && hour24 <= 22);
    }
  );

  it('rejects short timeSlots', () => {
    expect(createPlannedVisitSchema.safeParse({ ...valid, timeSlot: '6P' }).success).toBe(false);
  });

  it('rejects workoutFocus over 80 characters and notes over 200 characters', () => {
    expect(
      createPlannedVisitSchema.safeParse({ ...valid, workoutFocus: 'x'.repeat(81) }).success
    ).toBe(false);
    expect(createPlannedVisitSchema.safeParse({ ...valid, notes: 'x'.repeat(201) }).success).toBe(
      false
    );
  });

  it('accepts optional fields at their exact limits', () => {
    expect(
      createPlannedVisitSchema.safeParse({
        ...valid,
        workoutFocus: 'x'.repeat(80),
        notes: 'x'.repeat(200),
      }).success
    ).toBe(true);
  });
});

describe('MEMBERSHIP_PLANS', () => {
  it('contains all three plans in ascending price order', () => {
    const plans = Object.values(MEMBERSHIP_PLANS);
    expect(plans.map((p) => p.id)).toEqual(['basic', 'pro', 'elite']);
    expect(plans[0].priceNum).toBeLessThan(plans[1].priceNum);
    expect(plans[1].priceNum).toBeLessThan(plans[2].priceNum);
  });

  it('every plan has non-empty name, perks and badge text', () => {
    for (const plan of Object.values(MEMBERSHIP_PLANS)) {
      expect(plan.name.length).toBeGreaterThan(0);
      expect(plan.badgeText.length).toBeGreaterThan(0);
      expect(plan.perks.length).toBeGreaterThan(0);
    }
  });
});
