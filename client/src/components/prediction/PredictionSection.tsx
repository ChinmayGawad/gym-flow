import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { HourlyPrediction } from '@/types/occupancy';

interface PredictionSectionProps {
  capacity?: number;
}

const PREDICTION_CURVE = [
  { id: '1', time: '6 AM', factor: 0.30 },
  { id: '2', time: '8 AM', factor: 0.52 },
  { id: '3', time: '10 AM', factor: 0.42 },
  { id: '4', time: '12 PM', factor: 0.47 },
  { id: '5', time: '2 PM', factor: 0.33 },
  { id: '6', time: '5 PM', factor: 0.83, isHigh: true },
  { id: '7', time: '7 PM', factor: 0.96, isHighest: true },
  { id: '8', time: '9 PM', factor: 0.53 },
];

export const PredictionSection: React.FC<PredictionSectionProps> = ({ capacity = 30 }) => {
  const predictionData: HourlyPrediction[] = PREDICTION_CURVE.map((row) => {
    const peopleCount = Math.max(1, Math.round(capacity * row.factor));
    const percentage = Math.round((peopleCount / capacity) * 100);
    return {
      id: row.id,
      time: row.time,
      peopleCount,
      percentage,
      isHigh: row.isHigh,
      isHighest: row.isHighest,
    };
  });

  const expectedBestTime = Math.max(1, Math.round(capacity * 0.35));

  return (
    <section id="prediction" className="pt-8 scroll-mt-24">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-2">
        <div>
          <span className="text-[11px] font-bold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase block">
            CROWD PREDICTION
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white mt-0.5">
            Today's Gym Crowd
          </h2>
        </div>
        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
          Capacity Benchmark: {capacity} Max
        </span>
      </div>

      {/* Hourly Prediction List Container */}
      <Card className="p-6 sm:p-7 bg-white dark:bg-[#131418] border-black/[0.06] dark:border-white/[0.08] shadow-card">
        <div className="space-y-4.5">
          {predictionData.map((row) => {
            const isRush = row.isHigh || row.isHighest;
            const barFillColor = isRush ? 'bg-rose-500 dark:bg-rose-400' : 'bg-zinc-800 dark:bg-zinc-200';

            return (
              <div
                key={row.id}
                className="grid grid-cols-[55px_1fr_90px] items-center gap-4 text-xs"
              >
                <span className="font-semibold text-zinc-600 dark:text-zinc-300">{row.time}</span>

                {/* Progress track */}
                <div className="h-[9px] w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barFillColor}`}
                    style={{ width: `${row.percentage}%` }}
                  />
                </div>

                <span className="text-right text-zinc-500 dark:text-zinc-400 font-medium">
                  {row.peopleCount} people
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Recommendation Banner */}
      <div className="mt-5 p-5 rounded-[13px] bg-zinc-100 dark:bg-[#131418] border border-black/[0.04] dark:border-white/[0.08] flex items-center gap-4">
        <div className="w-11 h-11 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white shadow-xs shrink-0">
          <Star className="w-5 h-5 fill-zinc-900 text-zinc-900 dark:fill-white dark:text-white" />
        </div>

        <div className="flex-1">
          <span className="text-[10px] font-bold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase block">
            RECOMMENDED TIME
          </span>
          <h3 className="text-base font-extrabold text-zinc-900 dark:text-white leading-tight mt-0.5">
            10:00 AM – 11:00 AM
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
            Expected crowd: ~{expectedBestTime} people
          </p>
        </div>

        <Badge variant="low" className="px-3 py-1 text-[10px]">
          LOW
        </Badge>
      </div>
    </section>
  );
};
