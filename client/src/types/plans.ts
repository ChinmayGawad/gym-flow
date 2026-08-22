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
