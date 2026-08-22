import React from 'react';
import { MEMBERSHIP_PLANS, MembershipPlan } from '@/types/plans';
import { Skeleton } from '@/components/ui/skeleton';

interface WelcomeSectionProps {
  userName?: string;
  plan?: string;
  isLoading?: boolean;
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({
  userName = 'Sahil',
  plan,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <section className="mb-6 space-y-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-56 rounded-xl" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-80 rounded-md" />
      </section>
    );
  }

  const planKey = (plan as MembershipPlan) || 'basic';
  const planConfig = MEMBERSHIP_PLANS[planKey] || MEMBERSHIP_PLANS.basic;

  // Contextual dynamic greeting based on hour
  const hour = new Date().getHours();
  const timeGreeting =
    hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <section className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
              {timeGreeting}, {userName}
            </h1>
            {plan && (
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${planConfig.badgeColor}`}
              >
                {planConfig.badgeText}
              </span>
            )}
          </div>
          <p className="text-zinc-500 text-xs sm:text-sm mt-1 font-medium flex items-center gap-1.5">
            <span>Check live crowd density and equipment availability before you visit.</span>
          </p>
        </div>
      </div>
    </section>
  );
};


