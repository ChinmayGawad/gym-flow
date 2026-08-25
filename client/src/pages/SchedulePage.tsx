import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Clock,
  Users,
  Plus,
  Radio,
  UserCheck,
} from 'lucide-react';
import { HourlyForecastSlot } from '@/types/occupancy';
import { AttendanceWaveChart } from '@/components/schedule/AttendanceWaveChart';
import { PlanVisitModal } from '@/components/schedule/PlanVisitModal';
import { Skeleton } from '@/components/ui/skeleton';
import { useForecast } from '@/hooks/useForecast';

interface SchedulePageProps {
  capacity?: number;
  isLoading?: boolean;
}

export const SchedulePage: React.FC<SchedulePageProps> = ({
  capacity: propCapacity = 30,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');
  const [selectedDateOffset, setSelectedDateOffset] = useState<number>(0);

  // Compute selected date string
  const targetDateObj = new Date();
  targetDateObj.setDate(targetDateObj.getDate() + selectedDateOffset);
  const targetDateStr = targetDateObj.toISOString().split('T')[0];

  const {
    forecast: rawSlots,
    optimalWindow,
    totalPlannedVisits,
    userPlannedVisit,
    capacity: forecastCapacity,
    isLoading,
    refetch,
    cancelSlot,
  } = useForecast({ date: targetDateStr });

  // Modal states
  const [isPlanModalOpen, setIsPlanModalOpen] = useState<boolean>(false);
  const [modalInitialHour, setModalInitialHour] = useState<number>(11);
  const [modalInitialExactTime, setModalInitialExactTime] = useState<string>('11:00 AM');

  const effectiveCapacity = forecastCapacity || propCapacity;

  const handleOpenPlanModal = (hour: number = 11, exactTime: string = '11:00 AM') => {
    setModalInitialHour(hour);
    setModalInitialExactTime(exactTime);
    setIsPlanModalOpen(true);
  };

  const handleCancelSlot = async (visitId: string) => {
    await cancelSlot(visitId);
  };

  const filteredSchedule = rawSlots.filter((item) => {
    const hour24 = item.hour24;
    if (activeFilter === 'morning') return hour24 >= 6 && hour24 <= 11;
    if (activeFilter === 'afternoon') return hour24 >= 12 && hour24 <= 16;
    if (activeFilter === 'evening') return hour24 >= 17 && hour24 <= 22;
    return true;
  });

  const morningSlot = rawSlots.find((s) => s.hour24 === 7) || rawSlots[1];
  const eveningPeakSlot = rawSlots.find((s) => s.isHighest) || rawSlots[12];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Link
              to="/"
              className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <span className="text-xs font-semibold text-zinc-900 dark:text-white">Schedule</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Planned Visits & Crowd Forecast
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
            Hourly crowd predictions dynamically computed from {totalPlannedVisits} member declarations ({effectiveCapacity} max capacity).
          </p>
        </div>

        {/* Action Controls: Day Switcher & Primary Plan Visit Button */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          {/* Quick Date Pills */}
          <div className="flex items-center gap-1 bg-zinc-100/90 dark:bg-zinc-900/90 p-1 rounded-xl border border-black/[0.04] dark:border-white/[0.06]">
            <button
              onClick={() => setSelectedDateOffset(0)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                selectedDateOffset === 0
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs font-bold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setSelectedDateOffset(1)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                selectedDateOffset === 1
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs font-bold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Tomorrow
            </button>
            <button
              onClick={() => setSelectedDateOffset(2)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                selectedDateOffset === 2
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs font-bold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Day After
            </button>
          </div>

          <Button
            onClick={() => handleOpenPlanModal(11, '11:00 AM')}
            className="h-9 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 text-xs font-bold gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Plan Visit</span>
          </Button>
        </div>
      </div>

      {/* User's Active Declared Visit Banner (if any for this date) */}
      {userPlannedVisit && (
        <Card className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Your Scheduled Visit
                </span>
                <Badge variant="low" className="text-[10px] px-1.5 py-0">
                  Confirmed
                </Badge>
              </div>
              <h4 className="text-sm font-black text-zinc-900 dark:text-white">
                {userPlannedVisit.timeSlot} · {userPlannedVisit.workoutFocus || 'General Workout'}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenPlanModal(userPlannedVisit.hour24, userPlannedVisit.timeSlot)}
              className="h-8 text-xs font-bold rounded-xl border-zinc-300 dark:border-zinc-700"
            >
              Change Time
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleCancelSlot(userPlannedVisit.id)}
              className="h-8 text-xs font-bold rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Recommended Time Highlights (3 Bento Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <Card key={i} className="p-5 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card space-y-3">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-36 rounded-lg" />
              <Skeleton className="h-3 w-full rounded-sm" />
            </Card>
          ))
        ) : (
          <>
            {/* Morning Quiet Window */}
            <Card className="p-5 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card hover:border-black/[0.12] dark:hover:border-white/[0.15] transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-widest text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/50 uppercase">
                  Morning Window
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h4 className="text-base font-extrabold text-zinc-900 dark:text-white mt-3 tracking-tight">
                6:00 AM – 8:00 AM
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Avg. ~{morningSlot?.predictedCount ?? 0} people ({morningSlot?.plannedCount ?? 0} planned). 0–5 min wait time.
              </p>
            </Card>

            {/* Optimal Window */}
            <Card className="p-5 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card hover:border-black/[0.12] dark:hover:border-white/[0.15] transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-widest text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/50 uppercase">
                  Optimal Quiet Window
                </span>
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h4 className="text-base font-extrabold text-zinc-900 dark:text-white mt-3 tracking-tight">
                {optimalWindow?.timeRange || 'All Day Quiet'}
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Lowest planned attendance (~{optimalWindow?.expectedPeople ?? 0} expected). Immediate power rack availability.
              </p>
            </Card>

            {/* Peak Rush Warning */}
            <Card className="p-5 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card hover:border-black/[0.12] dark:hover:border-white/[0.15] transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-widest text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-200/80 dark:border-rose-800/50 uppercase">
                  Peak Rush Hours
                </span>
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              </div>
              <h4 className="text-base font-extrabold text-zinc-900 dark:text-white mt-3 tracking-tight">
                {eveningPeakSlot && eveningPeakSlot.predictedCount > 0 ? `${eveningPeakSlot.time} Rush` : 'No Rush Expected'}
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                {eveningPeakSlot && eveningPeakSlot.predictedCount > 0
                  ? `~${eveningPeakSlot.predictedCount} members expected (${eveningPeakSlot.plannedCount} planned). Expected wait: ${eveningPeakSlot.waitTime}.`
                  : 'No high-density rush slots planned for this day. Immediate equipment availability.'}
              </p>
            </Card>
          </>
        )}
      </div>

      {/* Main Attendance Wave Chart Card */}
      <Card className="p-6 md:p-8 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4.5 h-4.5 text-zinc-900 dark:text-white" />
              <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">
                Hourly Attendance Wave & Planned Visitations
              </h3>
            </div>
            <div className="flex items-center gap-2 pt-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50">
                <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                DYNAMIC VISITATION FORECAST
              </span>
              <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                Derived from member intent notes
              </span>
            </div>
          </div>

          {/* Time of Day Segmented Filter Tabs */}
          <div className="flex items-center gap-1 bg-zinc-100/90 dark:bg-zinc-900/90 p-1 rounded-xl self-start sm:self-center border border-black/[0.04] dark:border-white/[0.06]">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              All Day (6-22)
            </button>
            <button
              onClick={() => setActiveFilter('morning')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeFilter === 'morning'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Morning (6-11)
            </button>
            <button
              onClick={() => setActiveFilter('afternoon')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeFilter === 'afternoon'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Afternoon (12-4)
            </button>
            <button
              onClick={() => setActiveFilter('evening')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeFilter === 'evening'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Evening (5-10)
            </button>
          </div>
        </div>

        {/* Attendance Wave Chart */}
        <div className="py-2">
          <AttendanceWaveChart
            data={filteredSchedule}
            capacity={effectiveCapacity}
            activeFilter={activeFilter}
            isLoading={isLoading}
          />
        </div>
      </Card>

      {/* Plan Visit Modal */}
      <PlanVisitModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        initialHour={modalInitialHour}
        initialExactTime={modalInitialExactTime}
        initialDate={targetDateStr}
        forecastSlots={rawSlots}
        onSuccess={() => refetch()}
      />
    </div>
  );
};
