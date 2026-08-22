import React from 'react';
import { CalendarDays, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BestTimeCardProps {
  capacity?: number;
}

export const BestTimeCard: React.FC<BestTimeCardProps> = ({ capacity = 30 }) => {
  const expectedPeople = Math.max(1, Math.round(capacity * 0.3));

  return (
    <Card className="mt-4 p-6 sm:p-7 flex items-center justify-between bg-white border border-black/[0.06] shadow-card hover:border-black/[0.12] transition-all">
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
            OPTIMAL TIME WINDOW
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 mt-0.5">
          10:00 AM – 11:30 AM
        </h2>
        <p className="text-zinc-500 text-xs sm:text-sm mt-1 flex items-center gap-2">
          <span>Expected occupancy:</span>
          <strong className="text-zinc-900 font-bold tabular-nums">~{expectedPeople} people</strong>
          <Badge variant="low" dot className="px-2.5 py-0.5 text-[10px]">
            LOW CROWD
          </Badge>
        </p>
      </div>

      <div className="w-12 h-12 rounded-2xl bg-zinc-100/80 border border-zinc-200/60 flex items-center justify-center text-zinc-600 shrink-0">
        <CalendarDays className="w-6 h-6 stroke-[1.75]" />
      </div>
    </Card>
  );
};

