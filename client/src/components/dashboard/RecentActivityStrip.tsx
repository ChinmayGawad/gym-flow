import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Dumbbell, PlusCircle, ArrowRight, Flame } from 'lucide-react';

interface RecentActivityStripProps {
  isLoggedIn?: boolean;
}

export const RecentActivityStrip: React.FC<RecentActivityStripProps> = ({ isLoggedIn = false }) => {
  return (
    <Card className="p-4 sm:p-5 bg-white border border-black/[0.06] shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-800 shrink-0">
          <Flame className="w-4.5 h-4.5 text-amber-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-900">Training Activity</span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200/60">
              Active Streak
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5 font-medium">
            Keep track of your training frequency, check-in history, and session logs.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
        <Link
          to="/history"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          <span>View Logs</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </Card>
  );
};
