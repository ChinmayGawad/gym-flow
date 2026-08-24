import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  Clock,
  Sparkles,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Activity,
  Zap,
  CheckCircle2,
  Users,
  Timer,
  Layers,
  ChevronRight,
  Radio,
  Plus,
  Sliders,
  Flame,
  Shield,
  Moon,
  Sun,
  Dumbbell,
  Heart,
} from 'lucide-react';
import { useOccupancy } from '@/hooks/useOccupancy';
import { useForecast } from '@/hooks/useForecast';
import { PlanVisitModal } from '@/components/schedule/PlanVisitModal';
import { PowerRackBookingModal } from '@/components/analytics/PowerRackBookingModal';
import { CardioBookingModal } from '@/components/analytics/CardioBookingModal';
import { DumbbellCableBookingModal } from '@/components/analytics/DumbbellCableBookingModal';
import { SaunaRecoveryBookingModal } from '@/components/analytics/SaunaRecoveryBookingModal';

interface AnalyticsPageProps {
  occupancy?: ReturnType<typeof useOccupancy>;
}

// 7-day representative hourly attendance percentage matrix (6 AM to 10 PM)
const DAYS_OF_WEEK = [
  { key: 'Mon', label: 'Monday', short: 'Mon' },
  { key: 'Tue', label: 'Tuesday', short: 'Tue' },
  { key: 'Wed', label: 'Wednesday', short: 'Wed' },
  { key: 'Thu', label: 'Thursday', short: 'Thu' },
  { key: 'Fri', label: 'Friday', short: 'Fri' },
  { key: 'Sat', label: 'Saturday', short: 'Sat' },
  { key: 'Sun', label: 'Sunday', short: 'Sun' },
];

const HOURS_RANGE = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

const WEEKLY_HEATMAP_DATA: Record<string, number[]> = {
  Mon: [20, 35, 50, 30, 22, 18, 25, 30, 28, 45, 65, 88, 92, 85, 60, 35, 15],
  Tue: [22, 38, 48, 28, 20, 15, 22, 28, 25, 42, 68, 90, 95, 82, 55, 30, 12],
  Wed: [25, 40, 52, 32, 24, 18, 26, 32, 30, 48, 70, 92, 90, 80, 52, 28, 14],
  Thu: [20, 36, 45, 26, 18, 14, 20, 25, 24, 40, 62, 86, 88, 78, 50, 25, 10],
  Fri: [18, 30, 42, 25, 18, 12, 22, 28, 32, 50, 72, 82, 75, 60, 38, 20, 8],
  Sat: [10, 25, 45, 65, 75, 80, 70, 55, 40, 35, 38, 42, 35, 25, 18, 12, 5],
  Sun: [8, 18, 35, 55, 68, 72, 60, 45, 32, 28, 30, 32, 28, 20, 15, 10, 5],
};

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ occupancy }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'matrix' | 'equipment'>('overview');
  const [selectedDayKey, setSelectedDayKey] = useState<string>('Mon');
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [equipmentTargetHour, setEquipmentTargetHour] = useState<number>(11);

  // Separate Booking Modals State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState<boolean>(false);
  const [planModalHour, setPlanModalHour] = useState<number>(11);
  const [isRackModalOpen, setIsRackModalOpen] = useState<boolean>(false);
  const [isCardioModalOpen, setIsCardioModalOpen] = useState<boolean>(false);
  const [isDumbbellModalOpen, setIsDumbbellModalOpen] = useState<boolean>(false);
  const [isSaunaModalOpen, setIsSaunaModalOpen] = useState<boolean>(false);

  const forecastState = useForecast();
  const capacity = occupancy?.capacity || forecastState.capacity || 30;
  const currentHour = new Date().getHours();

  // Selected Day Hourly Array
  const dayHourlyPcts = WEEKLY_HEATMAP_DATA[selectedDayKey] || WEEKLY_HEATMAP_DATA.Mon;
  const dayAveragePct = Math.round(
    dayHourlyPcts.reduce((a, b) => a + b, 0) / dayHourlyPcts.length
  );
  const dayAverageHeadcount = Math.round((dayAveragePct / 100) * capacity);

  // Live vs Historical comparison
  const currentHourIdx = Math.max(0, Math.min(HOURS_RANGE.length - 1, currentHour - 6));
  const currentDayIndex = new Date().getDay();
  const currentDayKey = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][currentDayIndex];
  const typicalPctForNow = WEEKLY_HEATMAP_DATA[currentDayKey]?.[currentHourIdx] || 45;
  const typicalHeadcountForNow = Math.round((typicalPctForNow / 100) * capacity);
  const livePeople = occupancy?.peopleCount || 14;
  const livePct = Math.round((livePeople / capacity) * 100);
  const diffFromTypical = livePct - typicalPctForNow;

  const handleOpenPlanModal = (hour: number) => {
    setPlanModalHour(hour);
    setIsPlanModalOpen(true);
  };

  const handleRefresh = () => {
    forecastState.refetch();
    occupancy?.refreshStatus?.();
  };

  const getHeatmapColorClass = (pct: number) => {
    if (pct >= 75) return 'bg-rose-500 text-white shadow-xs';
    if (pct >= 50) return 'bg-amber-500 text-zinc-950 font-black';
    if (pct >= 30) return 'bg-emerald-500 text-zinc-950 font-black';
    return 'bg-emerald-400/40 text-zinc-800 dark:text-zinc-200';
  };

  const getStatusFromPct = (pct: number): 'LOW' | 'MODERATE' | 'HIGH' => {
    if (pct >= 75) return 'HIGH';
    if (pct >= 40) return 'MODERATE';
    return 'LOW';
  };

  const getWaitTimeFromPct = (pct: number): string => {
    if (pct >= 75) return '15–25 min';
    if (pct >= 40) return '10 min';
    return '0–5 min';
  };

  // Equipment zone availability calculation based on hour
  const targetHourIdx = Math.max(0, Math.min(HOURS_RANGE.length - 1, equipmentTargetHour - 6));
  const targetPct = dayHourlyPcts[targetHourIdx] || 45;
  const targetHeadcount = Math.round((targetPct / 100) * capacity);

  // Station availability metrics
  const powerRacksFree = Math.max(0, 4 - Math.round((targetPct / 100) * 4));
  const cardioFree = Math.max(1, 12 - Math.round((targetPct / 100) * 11));
  const dumbbellsFree = Math.max(0, 8 - Math.round((targetPct / 100) * 8));
  const saunaFree = Math.max(0, 6 - Math.round((targetPct / 100) * 5));

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Top Breadcrumb & Page Header */}
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
            <span className="text-xs font-semibold text-zinc-900 dark:text-white">Crowd Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Crowd Insights & Flow Analytics
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
            Analyze facility headcount curves, inspect equipment availability, and reserve specialized stations.
          </p>
        </div>

        {/* View Mode Segmented Controls */}
        <div className="flex items-center gap-1 bg-zinc-100/90 dark:bg-zinc-900/90 p-1 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] self-start md:self-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs font-bold'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Weekly Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs font-bold'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>7-Day Heatmap</span>
          </button>

          <button
            onClick={() => setActiveTab('equipment')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'equipment'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs font-bold'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>Equipment & Zones</span>
          </button>
        </div>
      </div>

      {/* Live vs. Historical Benchmark Card (Always Visible) */}
      <Card className="p-4 sm:p-5 bg-gradient-to-br from-white to-zinc-50 dark:from-[#131418] dark:to-[#171920] border border-black/[0.06] dark:border-white/[0.08] shadow-card rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shadow-xs shrink-0">
            <Radio className="w-5 h-5 text-emerald-400 dark:text-emerald-600 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                LIVE CROWD BENCHMARK
              </span>
              <Badge variant="low" dot className="text-[9px] px-1.5 py-0">
                Synchronized
              </Badge>
            </div>
            <h3 className="text-base font-black text-zinc-900 dark:text-white mt-0.5 tracking-tight">
              Currently {livePeople} members inside ({livePct}% of {capacity} cap)
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              {diffFromTypical <= -10 ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  🔥 {Math.abs(diffFromTypical)}% quieter than typical {currentDayKey} (~{typicalHeadcountForNow} expected). Great time to train!
                </span>
              ) : diffFromTypical >= 10 ? (
                <span className="text-rose-600 dark:text-rose-400 font-bold">
                  ⚡ {diffFromTypical}% busier than average {currentDayKey} (~{typicalHeadcountForNow} expected). Expect minor rack queues.
                </span>
              ) : (
                <span className="text-zinc-600 dark:text-zinc-300 font-medium">
                  Matches standard baseline attendance for {currentDayKey} (~{typicalHeadcountForNow} members expected).
                </span>
              )}
            </p>
          </div>
        </div>

        <Button
          onClick={() => handleOpenPlanModal(11)}
          className="w-full sm:w-auto h-9 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 text-xs font-bold gap-1.5 shrink-0 cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Plan General Visit</span>
        </Button>
      </Card>

      {/* ================= TAB 1: WEEKLY OVERVIEW ================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Day Selector Pills Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {DAYS_OF_WEEK.map((d) => {
              const isSelected = selectedDayKey === d.key;
              const isToday = currentDayKey === d.key;
              const dayPcts = WEEKLY_HEATMAP_DATA[d.key] || [];
              const dayAvg = Math.round(dayPcts.reduce((a, b) => a + b, 0) / dayPcts.length);
              const dayHeadcount = Math.round((dayAvg / 100) * capacity);

              return (
                <button
                  key={d.key}
                  onClick={() => setSelectedDayKey(d.key)}
                  className={`flex-1 min-w-[100px] p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-card'
                      : 'bg-white dark:bg-[#131418] text-zinc-800 dark:text-zinc-200 border-black/[0.06] dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{d.short}</span>
                    {isToday && (
                      <span className={`text-[8px] font-extrabold uppercase px-1 py-0.2 rounded ${
                        isSelected ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}>
                        Today
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className={`text-[11px] font-medium ${isSelected ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400 dark:text-zinc-500'}`}>
                      Avg Headcount
                    </span>
                    <span className={`text-xs font-black tabular-nums ${isSelected ? 'text-white dark:text-zinc-900' : 'text-zinc-900 dark:text-white'}`}>
                      {dayHeadcount} <span className="text-[10px] font-normal opacity-75">ppl</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Day Hourly Flow Chart Card */}
          <Card className="p-6 md:p-8 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card rounded-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">
                    {DAYS_OF_WEEK.find((d) => d.key === selectedDayKey)?.label} Expected Headcount Curve
                  </h3>
                  <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 tabular-nums">
                    (6:00 AM – 10:00 PM)
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Hover or tap on any hour to inspect exact headcounts, wait times, and book your declared slot.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/50 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  &lt;12 ppl Low
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                  12–22 ppl Mod
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200/70 dark:border-rose-800/50 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  &gt;22 ppl Peak
                </span>
              </div>
            </div>

            {/* Interactive Rush Bars */}
            <div className="pt-4 pb-2">
              <div className="flex items-end justify-between gap-1.5 sm:gap-2.5 h-44 w-full relative">
                {dayHourlyPcts.map((pct, idx) => {
                  const hour24 = HOURS_RANGE[idx];
                  const timeLabel = hour24 > 12 ? `${hour24 - 12}:00 PM` : `${hour24}:00 AM`;
                  const expPeople = Math.round((pct / 100) * capacity);
                  const isCurrent = currentDayKey === selectedDayKey && currentHour === hour24;
                  const isHovered = hoveredHour === hour24;

                  const barBg =
                    pct >= 75
                      ? isHovered
                        ? 'bg-rose-600 dark:bg-rose-400'
                        : 'bg-rose-500 dark:bg-rose-500/85'
                      : pct >= 40
                      ? isHovered
                        ? 'bg-zinc-800 dark:bg-zinc-300'
                        : 'bg-zinc-300 dark:bg-zinc-700'
                      : isHovered
                      ? 'bg-emerald-600 dark:bg-emerald-400'
                      : 'bg-emerald-400 dark:bg-emerald-600/80';

                  return (
                    <div
                      key={hour24}
                      className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                      onMouseEnter={() => setHoveredHour(hour24)}
                      onMouseLeave={() => setHoveredHour(null)}
                      onClick={() => handleOpenPlanModal(hour24)}
                    >
                      {/* Tooltip on Hover */}
                      {isHovered && (
                        <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-20 pointer-events-none bg-zinc-900 dark:bg-zinc-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-2xl border border-zinc-700 whitespace-nowrap flex flex-col items-center gap-0.5 animate-in fade-in">
                          <div className="flex items-center gap-1.5">
                            <span>{timeLabel}:</span>
                            <span className="text-emerald-400 font-extrabold">{expPeople} members</span>
                            <span className={`px-1 py-0.2 rounded text-[9px] ${
                              pct >= 75 ? 'bg-rose-950 text-rose-300' : pct >= 40 ? 'bg-zinc-800 text-zinc-300' : 'bg-emerald-950 text-emerald-300'
                            }`}>
                              {pct}% cap
                            </span>
                          </div>
                          <span className="text-[9px] font-normal text-zinc-400">
                            Wait: {getWaitTimeFromPct(pct)} · Tap to book slot
                          </span>
                        </div>
                      )}

                      {/* Bar Pillar */}
                      <div
                        className={`w-full max-w-[24px] sm:max-w-[32px] rounded-t-lg transition-all duration-200 ${barBg} ${
                          isCurrent ? 'ring-2 ring-zinc-900 dark:ring-white ring-offset-2 ring-offset-white dark:ring-offset-zinc-900' : ''
                        }`}
                        style={{ height: `${Math.max(14, pct)}%` }}
                      />

                      {/* Headcount Number */}
                      <span className="text-[10px] font-bold tabular-nums text-zinc-700 dark:text-zinc-300 mt-1">
                        {expPeople}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* X Axis Time Labels */}
              <div className="flex justify-between text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mt-3 px-1 tabular-nums border-t border-zinc-100 dark:border-zinc-800 pt-2">
                <span>6 AM</span>
                <span>8 AM</span>
                <span className="text-emerald-700 dark:text-emerald-400">11 AM (Quiet)</span>
                <span>2 PM</span>
                <span className="text-rose-600 dark:text-rose-400">6 PM (Peak)</span>
                <span>8 PM</span>
                <span>10 PM</span>
              </div>
            </div>
          </Card>

          {/* 3 Best-Time Window Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Early Morning Window */}
            <Card className="p-5 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card hover:border-black/[0.12] dark:hover:border-white/[0.15] transition-all flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-widest text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-200/80 dark:border-blue-800/50 uppercase">
                    Early Birds
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="text-base font-extrabold text-zinc-900 dark:text-white mt-2.5 tracking-tight">
                  6:00 AM – 8:00 AM
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  ~{Math.round(capacity * 0.25)} members inside. Instant treadmill and cardio machine access. 0 min wait.
                </p>
              </div>
              <Button
                onClick={() => setIsCardioModalOpen(true)}
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs font-bold rounded-xl border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <span>Book 7:00 AM Cardio Slot</span>
              </Button>
            </Card>

            {/* Optimal Midday Window */}
            <Card className="p-5 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card hover:border-black/[0.12] dark:hover:border-white/[0.15] transition-all flex flex-col justify-between space-y-4 ring-1 ring-emerald-500/30">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-widest text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/50 uppercase">
                    Optimal Sweet Spot
                  </span>
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h4 className="text-base font-extrabold text-zinc-900 dark:text-white mt-2.5 tracking-tight">
                  10:00 AM – 11:30 AM
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  Lowest daily attendance (~{Math.round(capacity * 0.2)} members). Immediate power rack and bench availability.
                </p>
              </div>
              <Button
                onClick={() => setIsRackModalOpen(true)}
                size="sm"
                className="w-full h-8 text-xs font-bold rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 cursor-pointer shadow-xs"
              >
                <span>Book 11:00 AM Squat Platform</span>
              </Button>
            </Card>

            {/* Late Night Calm Window */}
            <Card className="p-5 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card hover:border-black/[0.12] dark:hover:border-white/[0.15] transition-all flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-widest text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-full border border-purple-200/80 dark:border-purple-800/50 uppercase">
                    Late Night Flow
                  </span>
                  <Moon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="text-base font-extrabold text-zinc-900 dark:text-white mt-2.5 tracking-tight">
                  8:30 PM – 10:00 PM
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  Evening rush subsides (~{Math.round(capacity * 0.25)} members). Relaxed workout floor & sauna access.
                </p>
              </div>
              <Button
                onClick={() => setIsSaunaModalOpen(true)}
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs font-bold rounded-xl border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <span>Book 8:30 PM Recovery Slot</span>
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* ================= TAB 2: 7-DAY HEATMAP MATRIX (HEADCOUNT DISPLAY) ================= */}
      {activeTab === 'matrix' && (
        <Card className="p-6 md:p-8 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card rounded-2xl space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-zinc-900 dark:text-white" />
                <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">
                  7-Day Expected Headcount Matrix
                </h3>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Displays the expected number of people inside the gym per hour (out of {capacity} cap). Tap any cell to plan a visit.
              </p>
            </div>

            {/* Matrix Headcount Legend */}
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/80 p-2 rounded-xl border border-zinc-200/60 dark:border-zinc-800">
              <span className="text-[10px] text-zinc-400 uppercase font-bold">Headcount:</span>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-md bg-emerald-400/40 inline-block" />
                <span className="text-[11px]">&lt;{Math.round(capacity * 0.3)} ppl</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block" />
                <span className="text-[11px]">{Math.round(capacity * 0.3)}–{Math.round(capacity * 0.5)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-md bg-amber-500 inline-block" />
                <span className="text-[11px]">{Math.round(capacity * 0.5)}–{Math.round(capacity * 0.75)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-md bg-rose-500 inline-block" />
                <span className="text-[11px]">&gt;{Math.round(capacity * 0.75)} Peak</span>
              </div>
            </div>
          </div>

          {/* Time Bracket Headers */}
          <div className="grid grid-cols-12 gap-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 text-center">
            <div className="col-span-2 text-left pl-1">Day</div>
            <div className="col-span-3 p-1.5 rounded-lg bg-zinc-100/80 dark:bg-zinc-800/80 text-emerald-800 dark:text-emerald-300">
              Morning (6a – 11a)
            </div>
            <div className="col-span-3 p-1.5 rounded-lg bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300">
              Afternoon (12p – 4p)
            </div>
            <div className="col-span-4 p-1.5 rounded-lg bg-zinc-100/80 dark:bg-zinc-800/80 text-rose-800 dark:text-rose-300">
              Evening Rush (5p – 10p)
            </div>
          </div>

          {/* 7 Days Matrix Rows showing Headcounts */}
          <div className="space-y-2">
            {DAYS_OF_WEEK.map((d) => {
              const rowPcts = WEEKLY_HEATMAP_DATA[d.key] || [];
              const isToday = currentDayKey === d.key;

              // Split into brackets
              const morningPcts = rowPcts.slice(0, 6);
              const afternoonPcts = rowPcts.slice(6, 11);
              const eveningPcts = rowPcts.slice(11);

              return (
                <div
                  key={d.key}
                  className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl transition-colors ${
                    isToday ? 'bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800' : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30'
                  }`}
                >
                  <div className="col-span-2 flex items-center gap-1.5 pl-1">
                    <span className="text-xs font-bold text-zinc-900 dark:text-white">
                      {d.label}
                    </span>
                    {isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                  </div>

                  {/* Morning Bracket Pills */}
                  <div className="col-span-3 grid grid-cols-6 gap-1">
                    {morningPcts.map((pct, i) => {
                      const hour24 = 6 + i;
                      const headcount = Math.round((pct / 100) * capacity);
                      return (
                        <button
                          key={hour24}
                          onClick={() => handleOpenPlanModal(hour24)}
                          className={`h-7 rounded-md text-[11px] font-black flex items-center justify-center transition-transform hover:scale-110 cursor-pointer tabular-nums ${getHeatmapColorClass(
                            pct
                          )}`}
                          title={`${d.label} ${hour24}:00 AM: ~${headcount} members inside (${pct}% load) · Wait: ${getWaitTimeFromPct(pct)} · Click to book`}
                        >
                          {headcount}
                        </button>
                      );
                    })}
                  </div>

                  {/* Afternoon Bracket Pills */}
                  <div className="col-span-3 grid grid-cols-5 gap-1">
                    {afternoonPcts.map((pct, i) => {
                      const hour24 = 12 + i;
                      const headcount = Math.round((pct / 100) * capacity);
                      return (
                        <button
                          key={hour24}
                          onClick={() => handleOpenPlanModal(hour24)}
                          className={`h-7 rounded-md text-[11px] font-black flex items-center justify-center transition-transform hover:scale-110 cursor-pointer tabular-nums ${getHeatmapColorClass(
                            pct
                          )}`}
                          title={`${d.label} ${hour24 > 12 ? hour24 - 12 : hour24}:00 PM: ~${headcount} members inside (${pct}% load) · Wait: ${getWaitTimeFromPct(pct)} · Click to book`}
                        >
                          {headcount}
                        </button>
                      );
                    })}
                  </div>

                  {/* Evening Bracket Pills */}
                  <div className="col-span-4 grid grid-cols-6 gap-1">
                    {eveningPcts.map((pct, i) => {
                      const hour24 = 17 + i;
                      const headcount = Math.round((pct / 100) * capacity);
                      return (
                        <button
                          key={hour24}
                          onClick={() => handleOpenPlanModal(hour24)}
                          className={`h-7 rounded-md text-[11px] font-black flex items-center justify-center transition-transform hover:scale-110 cursor-pointer tabular-nums ${getHeatmapColorClass(
                            pct
                          )}`}
                          title={`${d.label} ${hour24 - 12}:00 PM: ~${headcount} members inside (${pct}% load) · Wait: ${getWaitTimeFromPct(pct)} · Click to book`}
                        >
                          {headcount}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500 border-t border-zinc-100 dark:border-zinc-800">
            <span>Numbers inside cells represent estimated head count of members.</span>
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">Tap any cell to plan a visit</span>
          </div>
        </Card>
      )}

      {/* ================= TAB 3: EQUIPMENT & ZONES (VISUAL & SEPARATE BOOKING MODULES) ================= */}
      {activeTab === 'equipment' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Interactive Hour Target Card with Quick Preset Chips */}
          <Card className="p-6 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200">
                  <Sliders className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-zinc-900 dark:text-white tracking-tight">
                    Equipment Availability & Station Booking
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Select a time preset or scrub the slider to instantly inspect station queues and launch dedicated equipment booking modules.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Time:</span>
                <span className="px-3 py-1 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-black tabular-nums shadow-xs">
                  {equipmentTargetHour > 12 ? `${equipmentTargetHour - 12}:00 PM` : `${equipmentTargetHour}:00 AM`}
                </span>
                <span className="text-xs text-zinc-400 font-bold tabular-nums">
                  (~{targetHeadcount} ppl)
                </span>
              </div>
            </div>

            {/* Quick 1-Tap Time Preset Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                Quick Time Presets:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => setEquipmentTargetHour(7)}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer flex items-center justify-between ${
                    equipmentTargetHour === 7
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 border-blue-400 dark:border-blue-700 shadow-xs'
                      : 'bg-zinc-50 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 border-zinc-200/60 dark:border-zinc-800 hover:border-zinc-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>7:00 AM</span>
                  </div>
                  <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400">Early</span>
                </button>

                <button
                  onClick={() => setEquipmentTargetHour(11)}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer flex items-center justify-between ${
                    equipmentTargetHour === 11
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-400 dark:border-emerald-700 shadow-xs'
                      : 'bg-zinc-50 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 border-zinc-200/60 dark:border-zinc-800 hover:border-zinc-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>11:00 AM</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Quiet ★</span>
                </button>

                <button
                  onClick={() => setEquipmentTargetHour(18)}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer flex items-center justify-between ${
                    equipmentTargetHour === 18
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border-rose-400 dark:border-rose-700 shadow-xs'
                      : 'bg-zinc-50 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 border-zinc-200/60 dark:border-zinc-800 hover:border-zinc-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    <span>6:00 PM</span>
                  </div>
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">Peak</span>
                </button>

                <button
                  onClick={() => setEquipmentTargetHour(20)}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer flex items-center justify-between ${
                    equipmentTargetHour === 20
                      ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 border-purple-400 dark:border-purple-700 shadow-xs'
                      : 'bg-zinc-50 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 border-zinc-200/60 dark:border-zinc-800 hover:border-zinc-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Moon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>8:30 PM</span>
                  </div>
                  <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400">Calm</span>
                </button>
              </div>
            </div>

            {/* Slider Input */}
            <div className="pt-2 px-1">
              <input
                type="range"
                min="6"
                max="22"
                step="1"
                value={equipmentTargetHour}
                onChange={(e) => setEquipmentTargetHour(parseInt(e.target.value, 10))}
                className="w-full accent-zinc-900 dark:accent-white h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mt-2 tabular-nums">
                <span>6 AM</span>
                <span>9 AM</span>
                <span>12 PM</span>
                <span>3 PM</span>
                <span>6 PM</span>
                <span>8 PM</span>
                <span>10 PM</span>
              </div>
            </div>
          </Card>

          {/* 4 Separate Equipment Zones Cards triggering Dedicated Booking Modals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Zone 1: Power Racks & Squat Platforms */}
            <Card className="p-5 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card rounded-2xl space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-zinc-900 dark:text-white tracking-tight">
                      Power Racks & Squat Platforms
                    </h4>
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                      4 Heavy Olympic Barbell Stations
                    </span>
                  </div>
                </div>

                <Badge
                  variant={targetPct >= 75 ? 'high' : targetPct >= 40 ? 'moderate' : 'low'}
                  className="text-xs font-bold"
                >
                  {targetPct >= 75 ? '15–20m wait' : targetPct >= 40 ? '5–10m wait' : '0m (Open)'}
                </Badge>
              </div>

              {/* Visual Segmented Meter for 4 Stations */}
              <div className="space-y-1.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-zinc-700 dark:text-zinc-300">Station Availability:</span>
                  <span className={`tabular-nums ${powerRacksFree > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {powerRacksFree} / 4 Free
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {[1, 2, 3, 4].map((stationNum) => {
                    const isAvailable = stationNum <= powerRacksFree;
                    return (
                      <div
                        key={stationNum}
                        className={`h-3.5 rounded-md transition-all ${
                          isAvailable
                            ? 'bg-emerald-500 dark:bg-emerald-400 shadow-xs'
                            : 'bg-rose-400/80 dark:bg-rose-600/80'
                        }`}
                        title={`Rack #${stationNum}: ${isAvailable ? 'Available' : 'Occupied'}`}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {targetPct >= 75 ? 'Heavy compound lift rush' : 'Quick set turnaround'}
                </span>
                <Button
                  onClick={() => setIsRackModalOpen(true)}
                  size="sm"
                  className="h-8 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold gap-1 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>Book Leg/Squat Slot</span>
                </Button>
              </div>
            </Card>

            {/* Zone 2: Cardio & Treadmill Suite */}
            <Card className="p-5 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card rounded-2xl space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-zinc-900 dark:text-white tracking-tight">
                      Treadmills & Cardio Rowers
                    </h4>
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                      12 Incline Runners & Rowers
                    </span>
                  </div>
                </div>

                <Badge variant={targetPct >= 85 ? 'moderate' : 'low'} className="text-xs font-bold">
                  {targetPct >= 85 ? '0–5m wait' : 'Immediate Open'}
                </Badge>
              </div>

              {/* Visual Segmented Meter for 12 Cardio Units */}
              <div className="space-y-1.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-zinc-700 dark:text-zinc-300">Treadmill Units:</span>
                  <span className="tabular-nums text-emerald-700 dark:text-emerald-400">
                    {cardioFree} / 12 Free
                  </span>
                </div>
                <div className="grid grid-cols-12 gap-1 pt-1">
                  {[...Array(12)].map((_, i) => {
                    const isAvailable = i + 1 <= cardioFree;
                    return (
                      <div
                        key={i}
                        className={`h-3.5 rounded-sm transition-all ${
                          isAvailable
                            ? 'bg-emerald-500 dark:bg-emerald-400 shadow-xs'
                            : 'bg-zinc-300 dark:bg-zinc-700'
                        }`}
                        title={`Treadmill #${i + 1}: ${isAvailable ? 'Available' : 'Occupied'}`}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Continuous high rotation flow
                </span>
                <Button
                  onClick={() => setIsCardioModalOpen(true)}
                  size="sm"
                  className="h-8 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold gap-1 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>Book Cardio Slot</span>
                </Button>
              </div>
            </Card>

            {/* Zone 3: Dumbbells & Cable Stations */}
            <Card className="p-5 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card rounded-2xl space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-zinc-900 dark:text-white tracking-tight">
                      Dumbbells & Cable Crossover
                    </h4>
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                      8 Adjustable Benches & Cable Towers
                    </span>
                  </div>
                </div>

                <Badge
                  variant={targetPct >= 75 ? 'moderate' : 'low'}
                  className="text-xs font-bold"
                >
                  {targetPct >= 75 ? '0–5m wait' : '0m wait'}
                </Badge>
              </div>

              {/* Visual Segmented Meter for 8 Benches */}
              <div className="space-y-1.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-zinc-700 dark:text-zinc-300">Free Benches & Cables:</span>
                  <span className="tabular-nums text-emerald-700 dark:text-emerald-400">
                    {dumbbellsFree} / 8 Free
                  </span>
                </div>
                <div className="grid grid-cols-8 gap-1 pt-1">
                  {[...Array(8)].map((_, i) => {
                    const isAvailable = i + 1 <= dumbbellsFree;
                    return (
                      <div
                        key={i}
                        className={`h-3.5 rounded-sm transition-all ${
                          isAvailable
                            ? 'bg-emerald-500 dark:bg-emerald-400 shadow-xs'
                            : 'bg-amber-400/80 dark:bg-amber-600/80'
                        }`}
                        title={`Bench #${i + 1}: ${isAvailable ? 'Available' : 'Occupied'}`}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Multiple paired stations open
                </span>
                <Button
                  onClick={() => setIsDumbbellModalOpen(true)}
                  size="sm"
                  className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold gap-1 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>Book Upper/Arms Slot</span>
                </Button>
              </div>
            </Card>

            {/* Zone 4: Sauna & Recovery Lounge */}
            <Card className="p-5 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card rounded-2xl space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-zinc-900 dark:text-white tracking-tight">
                      Sauna & Recovery Lounge
                    </h4>
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                      Steam Room & Hydro Space (Cap: 6)
                    </span>
                  </div>
                </div>

                <Badge variant="low" className="text-xs font-bold">
                  Open Access
                </Badge>
              </div>

              {/* Visual Segmented Meter for 6 Sauna spots */}
              <div className="space-y-1.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-zinc-700 dark:text-zinc-300">Recovery Capacity:</span>
                  <span className="tabular-nums text-emerald-700 dark:text-emerald-400">
                    {saunaFree} / 6 Open Spots
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-1 pt-1">
                  {[...Array(6)].map((_, i) => {
                    const isAvailable = i + 1 <= saunaFree;
                    return (
                      <div
                        key={i}
                        className={`h-3.5 rounded-sm transition-all ${
                          isAvailable
                            ? 'bg-emerald-500 dark:bg-emerald-400 shadow-xs'
                            : 'bg-zinc-300 dark:bg-zinc-700'
                        }`}
                        title={`Spot #${i + 1}: ${isAvailable ? 'Available' : 'Occupied'}`}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Comfortable, clean temperature
                </span>
                <Button
                  onClick={() => setIsSaunaModalOpen(true)}
                  size="sm"
                  className="h-8 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold gap-1 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>Book Recovery Slot</span>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 1. General Visit Planner Modal */}
      <PlanVisitModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        initialHour={planModalHour}
        forecastSlots={forecastState.forecast}
        onSuccess={handleRefresh}
      />

      {/* 2. Power Rack & Platform Booking Modal */}
      <PowerRackBookingModal
        isOpen={isRackModalOpen}
        onClose={() => setIsRackModalOpen(false)}
        targetHour={equipmentTargetHour}
        capacity={capacity}
        onSuccess={handleRefresh}
      />

      {/* 3. Cardio Machine Booking Modal */}
      <CardioBookingModal
        isOpen={isCardioModalOpen}
        onClose={() => setIsCardioModalOpen(false)}
        targetHour={equipmentTargetHour}
        onSuccess={handleRefresh}
      />

      {/* 4. Dumbbell & Cable Booking Modal */}
      <DumbbellCableBookingModal
        isOpen={isDumbbellModalOpen}
        onClose={() => setIsDumbbellModalOpen(false)}
        targetHour={equipmentTargetHour}
        onSuccess={handleRefresh}
      />

      {/* 5. Sauna & Recovery Lounge Booking Modal */}
      <SaunaRecoveryBookingModal
        isOpen={isSaunaModalOpen}
        onClose={() => setIsSaunaModalOpen(false)}
        targetHour={equipmentTargetHour}
        onSuccess={handleRefresh}
      />
    </div>
  );
};
