import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Sparkles, ArrowRight, Clock } from 'lucide-react';
import { HourlyForecastSlot } from '@/types/occupancy';

interface TodayRushSparklineProps {
  forecast?: HourlyForecastSlot[];
  optimalRange?: string;
  optimalPeople?: number;
  capacity?: number;
  isLoading?: boolean;
  onOpenPlanModal?: (hour?: number) => void;
}

export const TodayRushSparkline: React.FC<TodayRushSparklineProps> = ({
  forecast = [],
  optimalRange = '10:00 AM – 11:30 AM',
  optimalPeople = 6,
  capacity = 30,
  isLoading = false,
  onOpenPlanModal,
}) => {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const currentHour = new Date().getHours();

  return (
    <Card className="p-5 sm:p-6 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card rounded-2xl">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200 shrink-0">
            <Clock className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white tracking-tight">
              Today's Crowd Wave & Hourly Rush
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1.5 mt-0.5">
              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                Quiet window: {optimalRange}
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span>Floor ~{optimalPeople} people</span>
            </p>
          </div>
        </div>

        <Link
          to="/schedule"
          className="text-xs font-bold text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white flex items-center gap-1 transition-colors self-start sm:self-center group"
        >
          <span>Full Forecast Schedule</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Glanceable Hourly Sparkline Bar Chart */}
      <div className="pt-5 pb-2">
        <div className="flex items-end justify-between gap-1.5 sm:gap-2 h-24 sm:h-28 w-full relative">
          {isLoading || forecast.length === 0
            ? Array.from({ length: 17 }).map((_, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                  <div
                    className="w-full max-w-[18px] rounded-t-md bg-zinc-200 dark:bg-zinc-800 animate-pulse"
                    style={{ height: `${20 + (i % 5) * 15}%` }}
                  />
                </div>
              ))
            : forecast.map((item, idx) => {
                const people = item.predictedCount;
                const pct = item.percentage;
                const isNow = currentHour === item.hour24;
                const isHovered = hoveredHour === idx;

                const barBg = item.isHigh
                  ? isHovered
                    ? 'bg-rose-500 dark:bg-rose-400'
                    : 'bg-rose-400 dark:bg-rose-500/80'
                  : pct >= 40
                  ? isHovered
                    ? 'bg-zinc-800 dark:bg-zinc-300'
                    : 'bg-zinc-300 dark:bg-zinc-700'
                  : isHovered
                  ? 'bg-emerald-600 dark:bg-emerald-400'
                  : 'bg-emerald-400 dark:bg-emerald-600/80';

                return (
                  <div
                    key={item.id || item.time}
                    className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                    onMouseEnter={() => setHoveredHour(idx)}
                    onMouseLeave={() => setHoveredHour(null)}
                    onClick={() => onOpenPlanModal?.(item.hour24)}
                  >
                    {/* Tooltip on Hover */}
                    {isHovered && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-20 pointer-events-none bg-zinc-900 dark:bg-zinc-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-xl border border-zinc-800 dark:border-zinc-700 whitespace-nowrap flex items-center gap-2 animate-in fade-in">
                        <span>{item.time}:</span>
                        <span className="text-emerald-400 font-extrabold">~{people} people expected</span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            item.isHigh
                              ? 'text-rose-300 bg-rose-950/80 border border-rose-800/60'
                              : pct >= 40
                              ? 'text-zinc-300 bg-zinc-800 dark:bg-zinc-700'
                              : 'text-emerald-300 bg-emerald-950/80 border border-emerald-800/60'
                          }`}
                        >
                          {pct}% full
                        </span>
                        {item.plannedCount > 0 && (
                          <span className="text-zinc-400 font-normal">
                            ({item.plannedCount} member{item.plannedCount > 1 ? 's' : ''} booked)
                          </span>
                        )}
                      </div>
                    )}

                    {/* Top Tag (Best, Peak) */}
                    {item.isOptimal && !isHovered && (
                      <span className="text-[8px] font-extrabold uppercase tracking-wider mb-1 hidden sm:block text-emerald-700 dark:text-emerald-400">
                        Best
                      </span>
                    )}
                    {item.isHighest && !item.isOptimal && !isHovered && (
                      <span className="text-[8px] font-extrabold uppercase tracking-wider mb-1 hidden sm:block text-rose-600 dark:text-rose-400">
                        Peak
                      </span>
                    )}

                    {/* Animated Vertical Bar */}
                    <div
                      className={`w-full max-w-[18px] sm:max-w-[22px] rounded-t-md transition-all duration-200 ${barBg} ${
                        isNow ? 'ring-2 ring-zinc-900 dark:ring-white ring-offset-1 ring-offset-white dark:ring-offset-zinc-900' : ''
                      } ${item.hasUserBooked ? 'ring-2 ring-emerald-500' : ''}`}
                      style={{ height: `${Math.max(12, pct)}%` }}
                    />

                    {/* Current Hour Indicator Dot */}
                    {isNow && (
                      <div
                        className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-white mt-1"
                        title="Current Hour"
                      />
                    )}
                  </div>
                );
              })}
        </div>

        {/* X-Axis Labels */}
        <div className="flex justify-between text-[10px] font-medium text-zinc-400 dark:text-zinc-500 mt-2 px-1 tabular-nums">
          <span>6 AM</span>
          <span>9 AM</span>
          <span className="text-emerald-700 dark:text-emerald-400 font-bold">11 AM (Quiet)</span>
          <span>2 PM</span>
          <span className="text-rose-600 dark:text-rose-400 font-bold">6 PM (Rush)</span>
          <span>9 PM</span>
          <span>10 PM</span>
        </div>
      </div>
    </Card>
  );
};
