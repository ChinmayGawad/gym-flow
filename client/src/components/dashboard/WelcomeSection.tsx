import React from 'react';
import { MEMBERSHIP_PLANS, MembershipPlan } from '@/types/plans';

interface WelcomeSectionProps {
  userName?: string;
  plan?: string;
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({
  userName = 'Sahil',
  plan,
}) => {
  const planKey = (plan as MembershipPlan) || 'basic';
  const planConfig = MEMBERSHIP_PLANS[planKey] || MEMBERSHIP_PLANS.basic;

  return (
    <section className="mb-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gym-dark">
              Good Evening, {userName} 👋
            </h1>
            {plan && (
              <span
                className={`px-3 py-0.5 rounded-full text-[10px] font-bold border ${planConfig.badgeColor}`}
              >
                {planConfig.badgeText}
              </span>
            )}
          </div>
          <p className="text-gym-subtle text-sm sm:text-base mt-1 font-medium">
            Check the crowd before you visit.
          </p>
        </div>
      </div>
    </section>
  );
};
