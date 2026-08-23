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
    <Card className="mt-4 p-6 sm:p-7 flex items-center justify-between bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card hover:border-black/[0.12] dark:hover:border-white/[0.15] transition-all">
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-[10px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase">
            OPTIMAL TIME WINDOW
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-white mt-0.5">
          10:00 AM – 11:30 AM
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm mt-1 flex items-center gap-2">
          <span>Expected occupancy:</span>
          <strong className="text-zinc-900 dark:text-white font-bold tabular-nums">~{expectedPeople} people</strong>
          <Badge variant="low" dot className="px-2.5 py-0.5 text-[10px]">
            LOW CROWD
          </Badge>
        </p>
      </div>

      <div className="w-12 h-12 rounded-2xl bg-zinc-100/80 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 shrink-0">
        <CalendarDays className="w-6 h-6 stroke-[1.75]" />
      </div>
    </Card>
  );
};
