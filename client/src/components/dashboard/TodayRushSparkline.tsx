import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Sparkles, ArrowRight, Clock } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface TodayRushSparklineProps {
  capacity?: number;
}

const HOURLY_FACTORS = [
  { time: '6 AM', hour: 6, factor: 0.30, label: 'Early' },
  { time: '7 AM', hour: 7, factor: 0.37 },
  { time: '8 AM', hour: 8, factor: 0.52 },
  { time: '9 AM', hour: 9, factor: 0.42 },
  { time: '10 AM', hour: 10, factor: 0.33, isOptimal: true, label: 'Best' },
  { time: '11 AM', hour: 11, factor: 0.36, isOptimal: true },
  { time: '12 PM', hour: 12, factor: 0.46 },
  { time: '1 PM', hour: 13, factor: 0.38 },
  { time: '2 PM', hour: 14, factor: 0.32, isOptimal: true },
  { time: '3 PM', hour: 15, factor: 0.37 },
  { time: '4 PM', hour: 16, factor: 0.60 },
  { time: '5 PM', hour: 17, factor: 0.82, isPeak: true },
  { time: '6 PM', hour: 18, factor: 0.90, isPeak: true, label: 'Peak' },
  { time: '7 PM', hour: 19, factor: 0.96, isPeak: true },
  { time: '8 PM', hour: 20, factor: 0.72 },
  { time: '9 PM', hour: 21, factor: 0.48 },
  { time: '10 PM', hour: 22, factor: 0.24 },
];

export const TodayRushSparkline: React.FC<TodayRushSparklineProps> = ({ capacity = 30 }) => {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const currentHour = new Date().getHours();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <Card className="p-5 sm:p-6 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200 shrink-0">
            <Clock className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white tracking-tight">
              Today's Crowd Wave
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1.5 mt-0.5">
              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                Best window: 10:00 AM – 11:30 AM
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span>Quiet floor (~{Math.max(1, Math.round(capacity * 0.33))} people)</span>
            </p>
          </div>
        </div>

        <Link
          to="/schedule"
          className="text-xs font-bold text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white flex items-center gap-1 transition-colors self-start sm:self-center group"
        >
          <span>Full Forecast</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Glanceable Hourly Sparkline Bar Chart */}
      <div className="pt-5 pb-2">
        <div className="flex items-end justify-between gap-1.5 sm:gap-2 h-24 sm:h-28 w-full relative">
          {HOURLY_FACTORS.map((item, idx) => {
            const people = Math.max(1, Math.round(capacity * item.factor));
            const pct = Math.round(item.factor * 100);
            const isNow = currentHour === item.hour;
            const isHovered = hoveredHour === idx;

            // Bar background color based on status and dark mode
            const barBg = item.isPeak
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
                key={item.time}
                className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                onMouseEnter={() => setHoveredHour(idx)}
                onMouseLeave={() => setHoveredHour(null)}
              >
                {/* Tooltip on Hover */}
                {isHovered && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 pointer-events-none bg-zinc-900 dark:bg-zinc-800 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-card border border-zinc-800 dark:border-zinc-700 whitespace-nowrap flex items-center gap-1.5">
                    <span>{item.time}:</span>
                    <span className="text-zinc-200 dark:text-zinc-300">~{people} people</span>
                    <span
                      className={`px-1 py-0.2 rounded text-[9px] ${
                        item.isPeak
                          ? 'text-rose-300 bg-rose-950/80'
                          : pct >= 40
                          ? 'text-zinc-300 bg-zinc-800 dark:bg-zinc-700'
                          : 'text-emerald-300 bg-emerald-950/80'
                      }`}
                    >
                      {pct}%
                    </span>
                  </div>
                )}

                {/* Optional Top Tag (Early, Best, Peak) */}
                {item.label && !isHovered && (
                  <span
                    className={`text-[8px] font-bold uppercase tracking-wider mb-1 hidden sm:block ${
                      item.isPeak
                        ? 'text-rose-600 dark:text-rose-400 font-extrabold'
                        : item.isOptimal
                        ? 'text-emerald-700 dark:text-emerald-400 font-extrabold'
                        : 'text-zinc-400 dark:text-zinc-500'
                    }`}
                  >
                    {item.label}
                  </span>
                )}

                {/* Animated Vertical Bar */}
                <div
                  className={`w-full max-w-[18px] sm:max-w-[22px] rounded-t-md transition-all duration-200 ${barBg} ${
                    isNow ? 'ring-2 ring-zinc-900 dark:ring-white ring-offset-1 ring-offset-white dark:ring-offset-zinc-900' : ''
                  }`}
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

        {/* X-Axis Labels (Sampled for clean legibility) */}
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
