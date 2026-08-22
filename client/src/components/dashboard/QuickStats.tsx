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
      <Card className="p-5 flex items-center gap-3.5 bg-white border-[#dedede]">
        <div className="w-11 h-11 rounded-full bg-[#f0f0f0] flex items-center justify-center text-gym-dark shrink-0">
          <Users className="w-5 h-5 text-gym-dark" />
        </div>
        <div>
          <h2 className="text-[22px] font-extrabold leading-tight text-gym-dark">
            {peopleCount} <span className="text-sm font-semibold text-gym-subtle">/ {capacity}</span>
          </h2>
          <p className="text-gym-subtle text-xs font-medium mt-0.5">
            People Inside
          </p>
        </div>
      </Card>

      {/* Stat Card 2: Estimated Wait Time */}
      <Card className="p-5 flex items-center gap-3.5 bg-white border-[#dedede]">
        <div className="w-11 h-11 rounded-full bg-[#f0f0f0] flex items-center justify-center text-gym-dark shrink-0">
          <Clock className="w-5 h-5 text-gym-dark" />
        </div>
        <div>
          <h2 className="text-[22px] font-extrabold leading-tight text-gym-dark">
            {waitTime}
          </h2>
          <p className="text-gym-subtle text-xs font-medium mt-0.5">
            Estimated Waiting
          </p>
        </div>
      </Card>

      {/* Stat Card 3: Total Registered Members */}
      <Card className="p-5 flex items-center gap-3.5 bg-white border-[#dedede]">
        <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-800 flex items-center justify-center shrink-0">
          <UserCheck className="w-5 h-5 text-blue-700" />
        </div>
        <div>
          <h2 className="text-[22px] font-extrabold leading-tight text-gym-dark">
            {totalRegisteredMembers}
          </h2>
          <p className="text-gym-subtle text-xs font-medium mt-0.5">
            Registered Members
          </p>
        </div>
      </Card>

      {/* Stat Card 4: Gym Capacity */}
      <Card className="p-5 flex items-center gap-3.5 bg-white border-[#dedede]">
        <div className="w-11 h-11 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5 text-amber-700" />
        </div>
        <div>
          <h2 className="text-[22px] font-extrabold leading-tight text-gym-dark">
            {capacity} <span className="text-xs font-semibold text-gym-subtle">Max</span>
          </h2>
          <p className="text-gym-subtle text-xs font-medium mt-0.5">
            Facility Capacity
          </p>
        </div>
      </Card>
    </section>
  );
};

