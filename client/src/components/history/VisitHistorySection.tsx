import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { VisitHistoryItem } from '@/types/occupancy';

const HISTORY_DATA: VisitHistoryItem[] = [
  {
    id: 'h1',
    date: '21 August 2026',
    timeRange: '7:15 PM → 8:40 PM',
    duration: '1h 25m',
  },
  {
    id: 'h2',
    date: '20 August 2026',
    timeRange: '10:20 AM → 11:35 AM',
    duration: '1h 15m',
  },
  {
    id: 'h3',
    date: '19 August 2026',
    timeRange: '7:00 PM → 8:10 PM',
    duration: '1h 10m',
  },
];

export const VisitHistorySection: React.FC = () => {
  return (
    <section id="history" className="mt-16 scroll-mt-24">
      {/* Section Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <span className="text-[11px] font-bold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase block">
            YOUR ACTIVITY
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white mt-0.5">
            Recent Gym Visits
          </h2>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-[11px] border-zinc-200 dark:border-zinc-700 rounded-md font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          View All
        </Button>
      </div>

      {/* History Items Container */}
      <Card className="overflow-hidden bg-white dark:bg-[#131418] border-black/[0.06] dark:border-white/[0.08] divide-y divide-zinc-100 dark:divide-zinc-800 shadow-card">
        {HISTORY_DATA.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 px-6 py-4.5 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <div className="w-10.5 h-10.5 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 shrink-0">
              <Calendar className="w-4.5 h-4.5" />
            </div>

            <div className="flex-1 min-w-0">
              <strong className="text-xs font-bold text-zinc-900 dark:text-white block">
                {item.date}
              </strong>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                {item.timeRange}
              </p>
            </div>

            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-700">
              {item.duration}
            </span>
          </div>
        ))}
      </Card>
    </section>
  );
};
