import React from 'react';
import { Users, Clock, UserCheck, Building2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface QuickStatsProps {
  peopleCount: number;
  capacity?: number;
  totalRegisteredMembers?: number;
  waitTime: string;
}

export const QuickStats: React.FC<QuickStatsProps> = ({
  peopleCount,
  capacity = 30,
  totalRegisteredMembers = 35,
  waitTime,
}) => {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
      {/* Stat Card 1: People Inside */}
      <Card className="p-5 flex items-center gap-4 bg-white border border-black/[0.06] shadow-card hover:border-black/[0.12] transition-colors">
        <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200/60 flex items-center justify-center text-zinc-900 shrink-0">
          <Users className="w-4.5 h-4.5 text-zinc-800" />
        </div>
        <div>
          <h2 className="text-2xl font-black leading-tight text-zinc-900 tabular-nums tracking-tight">
            {peopleCount} <span className="text-xs font-semibold text-zinc-400 font-sans">/ {capacity}</span>
          </h2>
          <p className="text-zinc-500 text-xs font-medium mt-0.5">
            People Inside
          </p>
        </div>
      </Card>

      {/* Stat Card 2: Estimated Wait Time */}
      <Card className="p-5 flex items-center gap-4 bg-white border border-black/[0.06] shadow-card hover:border-black/[0.12] transition-colors">
        <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200/60 flex items-center justify-center text-zinc-900 shrink-0">
          <Clock className="w-4.5 h-4.5 text-zinc-800" />
        </div>
        <div>
          <h2 className="text-2xl font-black leading-tight text-zinc-900 tabular-nums tracking-tight">
            {waitTime}
          </h2>
          <p className="text-zinc-500 text-xs font-medium mt-0.5">
            Estimated Waiting
          </p>
        </div>
      </Card>

      {/* Stat Card 3: Total Registered Members */}
      <Card className="p-5 flex items-center gap-4 bg-white border border-black/[0.06] shadow-card hover:border-black/[0.12] transition-colors">
        <div className="w-10 h-10 rounded-xl bg-blue-50/70 border border-blue-200/60 text-blue-700 flex items-center justify-center shrink-0">
          <UserCheck className="w-4.5 h-4.5 text-blue-700" />
        </div>
        <div>
          <h2 className="text-2xl font-black leading-tight text-zinc-900 tabular-nums tracking-tight">
            {totalRegisteredMembers}
          </h2>
          <p className="text-zinc-500 text-xs font-medium mt-0.5">
            Registered Members
          </p>
        </div>
      </Card>

      {/* Stat Card 4: Gym Capacity */}
      <Card className="p-5 flex items-center gap-4 bg-white border border-black/[0.06] shadow-card hover:border-black/[0.12] transition-colors">
        <div className="w-10 h-10 rounded-xl bg-amber-50/70 border border-amber-200/60 text-amber-800 flex items-center justify-center shrink-0">
          <Building2 className="w-4.5 h-4.5 text-amber-700" />
        </div>
        <div>
          <h2 className="text-2xl font-black leading-tight text-zinc-900 tabular-nums tracking-tight">
            {capacity} <span className="text-xs font-semibold text-zinc-400 font-sans">Max</span>
          </h2>
          <p className="text-zinc-500 text-xs font-medium mt-0.5">
            Facility Capacity
          </p>
        </div>
      </Card>
    </section>
  );
};


