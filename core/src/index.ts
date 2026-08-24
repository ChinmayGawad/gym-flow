import { z } from 'zod';

export enum UserRole {
  ADMIN = 'admin',
  MEMBER = 'user',
}

export type Role = 'admin' | 'user';

export type MembershipPlan = 'basic' | 'pro' | 'elite';

export interface PlanConfig {
  id: MembershipPlan;
  name: string;
  price: string;
  priceNum: number;
  period: string;
  badgeColor: string;
  badgeText: string;
  description: string;
  perks: string[];
}

export const MEMBERSHIP_PLANS: Record<MembershipPlan, PlanConfig> = {
  basic: {
    id: 'basic',
    name: 'Basic Access',
    price: '₹999',
    priceNum: 999,
    period: '/month',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    badgeText: 'Basic · ₹999/mo',
    description: 'Standard gym floor, free weights & cardio machines',
    perks: ['Gym floor & cardio access', 'Standard locker room', 'Fitness mobile app tracking'],
  },
  pro: {
    id: 'pro',
    name: 'Pro Athlete',
    price: '₹1,999',
    priceNum: 1999,
    period: '/month',
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    badgeText: '⭐ Pro · ₹1,999/mo',
    description: 'Full 24/7 access, group classes, sauna & steam bath',
    perks: ['24/7 Unlimited access', 'Yoga, Zumba & HIIT classes', 'Steam & Sauna lounge', 'Locker reservation'],
  },
  elite: {
    id: 'elite',
    name: 'VIP Elite',
    price: '₹3,499',
    priceNum: 3499,
    period: '/month',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    badgeText: '👑 Elite · ₹3,499/mo',
    description: 'All Pro perks + dedicated personal trainer & diet plan',
    perks: ['All Pro Athlete perks', '1-on-1 Dedicated Trainer', 'Custom Nutrition & Diet Chart', 'Monthly Guest Passes'],
  },
};

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const createMemberSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  plan: z.enum(['basic', 'pro', 'elite']).default('basic'),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;

// ================= GYM CAPACITY & OCCUPANCY =================

export const DEFAULT_GYM_CAPACITY = 30;

export const updateCapacitySchema = z.object({
  capacity: z.number().int().min(10, 'Capacity must be at least 10').max(2000, 'Capacity cannot exceed 2000'),
  gymName: z.string().min(2).optional(),
});

export type UpdateCapacityInput = z.infer<typeof updateCapacitySchema>;

export type OccupancyLevel = 'LOW' | 'MODERATE' | 'HIGH';

export interface OccupancyStats {
  peopleCount: number;
  capacity: number;
  totalRegisteredMembers: number;
  occupancyPercentage: number;
  turnoutPercentage: number;
  status: OccupancyLevel;
  waitTime: string;
  isCheckedInSelf?: boolean;
}

export function calculateOccupancyStatus(peopleCount: number, capacity: number): {
  percentage: number;
  status: OccupancyLevel;
  waitTime: string;
} {
  const cap = Math.max(1, capacity || DEFAULT_GYM_CAPACITY);
  const count = Math.max(0, Math.min(peopleCount, cap));
  const percentage = Math.round((count / cap) * 100);

  let status: OccupancyLevel = 'MODERATE';
  let waitTime = '10 min';

  if (percentage < 40) {
    status = 'LOW';
    waitTime = '0–5 min';
  } else if (percentage < 75) {
    status = 'MODERATE';
    waitTime = '10 min';
  } else {
    status = 'HIGH';
    waitTime = '15–25 min';
  }

  return { percentage, status, waitTime };
}

// ================= PLANNED VISITS & FORECASTING =================

export const createPlannedVisitSchema = z.object({
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  timeSlot: z.string().min(3),
  hour24: z.number().int().min(6).max(22),
  workoutFocus: z.string().max(80).optional(),
  notes: z.string().max(200).optional(),
});

export type CreatePlannedVisitInput = z.infer<typeof createPlannedVisitSchema>;

export interface PlannedMemberSummary {
  id: string;
  name: string;
  image?: string | null;
  workoutFocus?: string | null;
}

export interface HourlyForecastSlot {
  id: string;
  time: string;
  hour24: number;
  plannedCount: number;
  predictedCount: number;
  percentage: number;
  status: OccupancyLevel;
  waitTime: string;
  isHigh: boolean;
  isHighest: boolean;
  isOptimal: boolean;
  plannedMembers: PlannedMemberSummary[];
  hasUserBooked?: boolean;
  userVisitId?: string;
}

export interface ForecastResponse {
  success: boolean;
  date: string;
  capacity: number;
  totalPlannedVisits: number;
  optimalWindow: {
    timeRange: string;
    expectedPeople: number;
    plannedCount: number;
    status: OccupancyLevel;
  };
  forecast: HourlyForecastSlot[];
  userPlannedVisit?: {
    id: string;
    scheduledDate: string;
    timeSlot: string;
    hour24: number;
    workoutFocus?: string | null;
    notes?: string | null;
  } | null;
}


