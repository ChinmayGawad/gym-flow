import React from 'react';
import { CalendarDays } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const BestTimeCard: React.FC = () => {
  return (
    <Card className="mt-4 p-6 sm:p-7 flex items-center justify-between bg-white border-[#dedede]">
      <div>
        <span className="text-[11px] font-bold tracking-wider text-gym-subtle uppercase block">
          BEST TIME TO VISIT TODAY
        </span>
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gym-dark mt-1">
          10:00 AM – 11:00 AM
        </h2>
        <p className="text-gym-subtle text-xs sm:text-sm mt-1 flex items-center gap-2">
          Expected crowd: <strong className="text-[#333]">25 people</strong>
          <Badge variant="low" className="px-2.5 py-0.5 text-[10px]">
            LOW
          </Badge>
        </p>
      </div>

      <div className="w-14 h-14 rounded-xl flex items-center justify-center text-[#666] shrink-0">
        <CalendarDays className="w-8 h-8 stroke-[1.5]" />
      </div>
    </Card>
  );
};
