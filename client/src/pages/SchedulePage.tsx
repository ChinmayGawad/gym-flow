import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Zap,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { HourlyPrediction } from '@/types/occupancy';
import { AttendanceWaveChart } from '@/components/schedule/AttendanceWaveChart';
import { Skeleton } from '@/components/ui/skeleton';


interface SchedulePageProps {
  capacity?: number;
  isLoading?: boolean;
}

const SCHEDULE_CURVE = [
  { id: '1', time: '6 AM', factor: 0.30 },
  { id: '2', time: '7 AM', factor: 0.37 },
  { id: '3', time: '8 AM', factor: 0.53 },
  { id: '4', time: '9 AM', factor: 0.43 },
  { id: '5', time: '10 AM', factor: 0.33 },
  { id: '6', time: '11 AM', factor: 0.37 },
  { id: '7', time: '12 PM', factor: 0.47 },
  { id: '8', time: '1 PM', factor: 0.40 },
  { id: '9', time: '2 PM', factor: 0.32 },
  { id: '10', time: '3 PM', factor: 0.38 },
  { id: '11', time: '4 PM', factor: 0.63 },
  { id: '12', time: '5 PM', factor: 0.82, isHigh: true },
  { id: '13', time: '6 PM', factor: 0.90, isHigh: true },
  { id: '14', time: '7 PM', factor: 0.97, isHighest: true },
  { id: '15', time: '8 PM', factor: 0.73 },
  { id: '16', time: '9 PM', factor: 0.50 },
  { id: '17', time: '10 PM', factor: 0.25 },
];

export const SchedulePage: React.FC<SchedulePageProps> = ({ capacity = 30, isLoading = false }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');

  const fullHourlySchedule: HourlyPrediction[] = SCHEDULE_CURVE.map((item) => {
    const peopleCount = Math.max(1, Math.round(capacity * item.factor));
    const percentage = Math.round((peopleCount / capacity) * 100);
    return {
      id: item.id,
      time: item.time,
      peopleCount,
      percentage,
      isHigh: item.isHigh,
      isHighest: item.isHighest,
    };
  });

  const filteredSchedule = fullHourlySchedule.filter((item) => {
    const [numStr, period] = item.time.split(' ');
    const num = parseInt(numStr, 10);
    const hour24 = period === 'AM' ? (num === 12 ? 0 : num) : (num === 12 ? 12 : num + 12);

    if (activeFilter === 'morning') {
      return hour24 >= 6 && hour24 <= 11;
    }
    if (activeFilter === 'afternoon') {
      return hour24 >= 12 && hour24 <= 16;
    }
    if (activeFilter === 'evening') {
      return hour24 >= 17 && hour24 <= 22;
    }
    return true;
  });

  const morningLowAvg = Math.max(1, Math.round(capacity * 0.33));
  const afternoonLowAvg = Math.max(1, Math.round(capacity * 0.35));
  const eveningPeakAvg = Math.max(1, Math.round(capacity * 0.92));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Link
              to="/"
              className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
            <span className="text-zinc-300">/</span>
            <span className="text-xs font-semibold text-zinc-900">Schedule</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            Attendance Predictions & Schedule
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 font-medium">
            AI-assisted hourly crowd predictions calibrated to {capacity} facility capacity benchmark.
          </p>
        </div>

        {/* Date / Capacity Badge */}
        <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-black/[0.06] shadow-card self-start md:self-auto">
          <Calendar className="w-4 h-4 text-zinc-700" />
          <span className="text-xs font-bold text-zinc-900 tabular-nums">Live Benchmark: {capacity} Max</span>
        </div>
      </div>

      {/* Recommended Time Highlights (3 Bento Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <Card key={i} className="p-5 bg-white border border-black/[0.06] shadow-card space-y-3">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-36 rounded-lg" />
              <Skeleton className="h-3 w-full rounded-sm" />
              <Skeleton className="h-3 w-4/5 rounded-sm" />
            </Card>
          ))
        ) : (
          <>
            {/* Morning Quiet Window */}
            <Card className="p-5 bg-white border border-black/[0.06] shadow-card hover:border-black/[0.12] transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-widest text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80 uppercase">
                  Morning Window
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <h4 className="text-base font-extrabold text-zinc-900 mt-3 tracking-tight">
                6:00 AM – 7:30 AM
              </h4>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Avg. ~{morningLowAvg} people. Ideal for power racks and cardio with 0–5 min wait times.
              </p>
            </Card>

            {/* Afternoon Quiet Window */}
            <Card className="p-5 bg-white border border-black/[0.06] shadow-card hover:border-black/[0.12] transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-widest text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80 uppercase">
                  Afternoon Window
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <h4 className="text-base font-extrabold text-zinc-900 mt-3 tracking-tight">
                1:30 PM – 3:30 PM
              </h4>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Avg. ~{afternoonLowAvg} people. Lowest floor traffic and quiet equipment availability.
              </p>
            </Card>

            {/* Peak Rush Warning */}
            <Card className="p-5 bg-white border border-black/[0.06] shadow-card hover:border-black/[0.12] transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-widest text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/80 uppercase">
                  Peak Rush Hours
                </span>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <h4 className="text-base font-extrabold text-zinc-900 mt-3 tracking-tight">
                5:30 PM – 8:00 PM
              </h4>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Capacity reaches 85%–97% (~{eveningPeakAvg} people). Expected equipment wait 15–25 mins.
              </p>
            </Card>
          </>
        )}
      </div>


      {/* Main Chart Container Card */}
      <Card className="p-6 md:p-8 bg-white border border-black/[0.06] shadow-card rounded-2xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 pb-4 border-b border-zinc-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4.5 h-4.5 text-zinc-900" />
              <h3 className="text-lg font-black text-zinc-900 tracking-tight">
                Crowd Volume Forecast
              </h3>
            </div>
            <div className="flex items-center gap-2 pt-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                AI PREDICTED
              </span>
              <span className="text-[11px] font-medium text-zinc-400">
                Hourly headcount progression
              </span>
            </div>
          </div>

          {/* Time of Day Segmented Filter Tabs */}
          <div className="flex items-center gap-1 bg-zinc-100/90 p-1 rounded-xl self-start sm:self-center border border-black/[0.04]">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              All Day
            </button>
            <button
              onClick={() => setActiveFilter('morning')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeFilter === 'morning'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Morning (6-11)
            </button>
            <button
              onClick={() => setActiveFilter('afternoon')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeFilter === 'afternoon'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Afternoon (12-4)
            </button>
            <button
              onClick={() => setActiveFilter('evening')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeFilter === 'evening'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Evening (5-10)
            </button>
          </div>
        </div>

        {/* Clean Bar Chart */}
        <div className="py-2">
          <AttendanceWaveChart
            data={filteredSchedule}
            capacity={capacity}
            activeFilter={activeFilter}
          />
        </div>

        {/* Daily Attendance Summary Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-zinc-100">
          <div className="p-3 bg-zinc-50/70 rounded-xl border border-zinc-200/50">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              Early Morning (6–8 AM)
            </span>
            <span className="text-sm font-black text-zinc-900 mt-1 block tabular-nums">
              ~{Math.round(capacity * 0.35)} People
            </span>
            <Badge variant="low" dot className="text-[9px] px-2 py-0 mt-1.5">
              Low Crowd
            </Badge>
          </div>

          <div className="p-3 bg-zinc-50/70 rounded-xl border border-zinc-200/50">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              Lunch Wave (12–2 PM)
            </span>
            <span className="text-sm font-black text-zinc-900 mt-1 block tabular-nums">
              ~{Math.round(capacity * 0.45)} People
            </span>
            <Badge variant="moderate" dot className="text-[9px] px-2 py-0 mt-1.5">
              Moderate
            </Badge>
          </div>

          <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
              Peak Surge (5–8 PM)
            </span>
            <span className="text-sm font-black text-rose-950 mt-1 block tabular-nums">
              ~{Math.round(capacity * 0.90)} People
            </span>
            <Badge variant="high" dot className="text-[9px] px-2 py-0 mt-1.5">
              High Surge
            </Badge>
          </div>

          <div className="p-3 bg-zinc-50/70 rounded-xl border border-zinc-200/50">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              Late Night (9–10 PM)
            </span>
            <span className="text-sm font-black text-zinc-900 mt-1 block tabular-nums">
              ~{Math.round(capacity * 0.30)} People
            </span>
            <Badge variant="low" dot className="text-[9px] px-2 py-0 mt-1.5">
              Low Crowd
            </Badge>
          </div>
        </div>
      </Card>

      {/* Recommended Strategy Callout */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-black/[0.06] shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-xs shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase block">
              BEST WORKOUT WINDOW
            </span>
            <h3 className="text-base font-black text-zinc-900 mt-0.5">
              10:00 AM – 11:30 AM or 1:30 PM – 3:30 PM
            </h3>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              Estimated &lt;{Math.round(capacity * 0.4)} members present. Minimum equipment wait time.
            </p>
          </div>
        </div>

        <Button
          asChild
          className="h-9 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold gap-2 shrink-0 shadow-xs"
        >
          <Link to="/">
            Live Dashboard
            <TrendingUp className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
};


