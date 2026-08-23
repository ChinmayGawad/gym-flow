import React from 'react';
import { Users, Clock, UserCheck, Building2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface QuickStatsProps {
  peopleCount: number;
  capacity?: number;
  totalRegisteredMembers?: number;
  waitTime: string;
  isLoading?: boolean;
}

export const QuickStats: React.FC<QuickStatsProps> = ({
  peopleCount,
  capacity = 30,
  totalRegisteredMembers = 35,
  waitTime,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-5 flex items-center gap-4 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card">
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-20 rounded-md" />
              <Skeleton className="h-3 w-28 rounded-sm" />
            </div>
          </Card>
        ))}
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
      {/* Stat Card 1: People Inside */}
      <Card className="p-5 flex items-center gap-4 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card hover:border-black/[0.12] dark:hover:border-white/[0.15] transition-colors">
        <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700 flex items-center justify-center text-zinc-900 dark:text-zinc-100 shrink-0">
          <Users className="w-4.5 h-4.5 text-zinc-800 dark:text-zinc-200" />
        </div>
        <div>
          <h2 className="text-2xl font-black leading-tight text-zinc-900 dark:text-white tabular-nums tracking-tight">
            {peopleCount} <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 font-sans">/ {capacity}</span>
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium mt-0.5">
            People Inside
          </p>
        </div>
      </Card>

      {/* Stat Card 2: Estimated Wait Time */}
      <Card className="p-5 flex items-center gap-4 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card hover:border-black/[0.12] dark:hover:border-white/[0.15] transition-colors">
        <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700 flex items-center justify-center text-zinc-900 dark:text-zinc-100 shrink-0">
          <Clock className="w-4.5 h-4.5 text-zinc-800 dark:text-zinc-200" />
        </div>
        <div>
          <h2 className="text-2xl font-black leading-tight text-zinc-900 dark:text-white tabular-nums tracking-tight">
            {waitTime}
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium mt-0.5">
            Estimated Waiting
          </p>
        </div>
      </Card>

      {/* Stat Card 3: Total Registered Members */}
      <Card className="p-5 flex items-center gap-4 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card hover:border-black/[0.12] dark:hover:border-white/[0.15] transition-colors">
        <div className="w-10 h-10 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
          <UserCheck className="w-4.5 h-4.5 text-blue-700 dark:text-blue-300" />
        </div>
        <div>
          <h2 className="text-2xl font-black leading-tight text-zinc-900 dark:text-white tabular-nums tracking-tight">
            {totalRegisteredMembers}
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium mt-0.5">
            Registered Members
          </p>
        </div>
      </Card>

      {/* Stat Card 4: Gym Capacity */}
      <Card className="p-5 flex items-center gap-4 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card hover:border-black/[0.12] dark:hover:border-white/[0.15] transition-colors">
        <div className="w-10 h-10 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0">
          <Building2 className="w-4.5 h-4.5 text-amber-700 dark:text-amber-300" />
        </div>
        <div>
          <h2 className="text-2xl font-black leading-tight text-zinc-900 dark:text-white tabular-nums tracking-tight">
            {capacity} <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 font-sans">Max</span>
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium mt-0.5">
            Facility Capacity
          </p>
        </div>
      </Card>
    </section>
  );
};
