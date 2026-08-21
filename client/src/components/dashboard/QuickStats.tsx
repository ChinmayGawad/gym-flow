import React from 'react';
import { Users, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface QuickStatsProps {
  peopleCount: number;
  waitTime: string;
}

export const QuickStats: React.FC<QuickStatsProps> = ({ peopleCount, waitTime }) => {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
      {/* Stat Card 1: People Inside */}
      <Card className="p-5.5 flex items-center gap-4 bg-white border-[#dedede]">
        <div className="w-12 h-12 rounded-full bg-[#f0f0f0] flex items-center justify-center text-gym-dark shrink-0">
          <Users className="w-5 h-5 text-[#444]" />
        </div>
        <div>
          <h2 className="text-[25px] font-extrabold leading-tight text-gym-dark">
            {peopleCount}
          </h2>
          <p className="text-gym-subtle text-xs font-medium mt-0.5">
            People Inside
          </p>
        </div>
      </Card>

      {/* Stat Card 2: Estimated Wait Time */}
      <Card className="p-5.5 flex items-center gap-4 bg-white border-[#dedede]">
        <div className="w-12 h-12 rounded-full bg-[#f0f0f0] flex items-center justify-center text-gym-dark shrink-0">
          <Clock className="w-5 h-5 text-[#444]" />
        </div>
        <div>
          <h2 className="text-[25px] font-extrabold leading-tight text-gym-dark">
            {waitTime}
          </h2>
          <p className="text-gym-subtle text-xs font-medium mt-0.5">
            Estimated Waiting Time
          </p>
        </div>
      </Card>
    </section>
  );
};
