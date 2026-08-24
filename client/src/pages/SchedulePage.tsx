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
  Check,
  X,
  Radio,
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
    capacity: forecastCapacity,
    isLoading,
    refetch,
    cancelSlot,
  } = useForecast({ date: targetDateStr });

  // Modal states
  const [isPlanModalOpen, setIsPlanModalOpen] = useState<boolean>(false);
  const [targetSlotHour, setTargetSlotHour] = useState<number>(11);

  const handleOpenPlanModal = (hour: number = 11) => {
    setTargetSlotHour(hour);
    setIsPlanModalOpen(true);
  };

  const handleCancelSlot = async (visitId: string) => {
    await cancelSlot(visitId);
  };

  const effectiveCapacity = forecastCapacity || propCapacity;

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

        {/* Action Controls: Day Switcher & Plan Visit */}
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
            onClick={() => handleOpenPlanModal(11)}
            className="h-9 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 text-xs font-bold gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Plan Visit Slot</span>
          </Button>
        </div>
      </div>

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
                Avg. ~{morningSlot?.predictedCount || 5} people ({morningSlot?.plannedCount || 0} planned). 0–5 min wait time.
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
                {optimalWindow?.timeRange || '10:00 AM – 11:30 AM'}
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Lowest planned attendance (~{optimalWindow?.expectedPeople || 6} expected). Immediate power rack availability.
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
                5:30 PM – 8:00 PM
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                ~{eveningPeakSlot?.predictedCount || 26} members expected ({eveningPeakSlot?.plannedCount || 0} planned). Expected wait: 15–25 mins.
              </p>
            </Card>
          </>
        )}
      </div>

      {/* Main Chart Container Card */}
      <Card className="p-6 md:p-8 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card rounded-2xl">
        {/* Header */}
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

      {/* Hourly Slot Detail Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">
              Hourly Slot Breakdown & Member Intents
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              Click "+ I'm Going" on any time slot to declare your visit note and calibrate the forecast.
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-bold">
            {filteredSchedule.length} Slots
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredSchedule.map((slot) => {
            const hasUserBooked = slot.hasUserBooked;
            const badgeVariant =
              slot.status === 'LOW' ? 'low' : slot.status === 'HIGH' ? 'high' : 'moderate';

            return (
              <Card
                key={slot.id}
                className={`p-4.5 rounded-2xl border transition-all ${
                  hasUserBooked
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 ring-1 ring-emerald-400 dark:ring-emerald-700 shadow-sm'
                    : 'bg-white dark:bg-[#131418] border-black/[0.06] dark:border-white/[0.08] shadow-card hover:border-black/[0.12] dark:hover:border-white/[0.15]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-zinc-500" />
                      <span className="text-base font-extrabold text-zinc-900 dark:text-white tabular-nums">
                        {slot.time}
                      </span>
                      <Badge variant={badgeVariant as any} dot className="text-[10px] px-2 py-0.2">
                        {slot.status} · {slot.waitTime} wait
                      </Badge>
                      {slot.isOptimal && (
                        <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 px-1.5 py-0.2 rounded-md">
                          Best Slot
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-300 pt-1">
                      <span className="font-bold tabular-nums">
                        ~{slot.predictedCount} people expected
                      </span>
                      <span className="text-zinc-300 dark:text-zinc-700">•</span>
                      <span className="inline-flex items-center gap-1 font-medium text-zinc-500 dark:text-zinc-400">
                        <Users className="w-3 h-3 text-zinc-400" />
                        {slot.plannedCount} declared visits
                      </span>
                    </div>

                    {/* Member Attendee Chips if any */}
                    {slot.plannedMembers && slot.plannedMembers.length > 0 && (
                      <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                        {slot.plannedMembers.map((m) => (
                          <span
                            key={m.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700"
                            title={m.workoutFocus || 'General Workout'}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="truncate max-w-[90px]">{m.name}</span>
                            {m.workoutFocus && (
                              <span className="text-zinc-400 font-normal text-[9px] truncate max-w-[70px]">
                                ({m.workoutFocus.split(' ')[0]})
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Slot Action Button */}
                  <div className="shrink-0">
                    {hasUserBooked ? (
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Attending</span>
                        </span>
                        {slot.userVisitId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelSlot(slot.userVisitId!)}
                            className="h-8 w-8 p-0 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                            title="Cancel your visit"
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleOpenPlanModal(slot.hour24)}
                        className="h-8 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 text-xs font-bold gap-1 shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>I'm Going</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-3">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      slot.percentage >= 75
                        ? 'bg-rose-500'
                        : slot.percentage >= 40
                        ? 'bg-zinc-700 dark:bg-zinc-300'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${slot.percentage}%` }}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Plan Visit Modal */}
      <PlanVisitModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        initialHour={targetSlotHour}
        initialDate={targetDateStr}
        forecastSlots={rawSlots}
        onSuccess={() => refetch()}
      />
    </div>
  );
};
