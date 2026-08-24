import type { Mock } from 'vitest';

export const m = (fn: unknown): Mock => fn as Mock;

export const defaultSettings = {
  id: 'default',
  capacity: 30,
  gymName: 'GymFlow Fitness',
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

export function configureCountMocks(
  prisma: any,
  { total, checkedIn }: { total: number; checkedIn: number }
) {
  m(prisma.user.count).mockImplementation((args?: any) => {
    if (args?.where?.isCheckedIn === true) return Promise.resolve(checkedIn);
    return Promise.resolve(total);
  });
}
