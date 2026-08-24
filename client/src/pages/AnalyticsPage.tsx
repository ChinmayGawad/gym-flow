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
} from 'lucide-react';
import { useOccupancy } from '@/hooks/useOccupancy';
import { useForecast } from '@/hooks/useForecast';
import { PlanVisitModal } from '@/components/schedule/PlanVisitModal';

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
  const [equipmentTargetHour, setEquipmentTargetHour] = useState<number>(18);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState<boolean>(false);
  const [planModalHour, setPlanModalHour] = useState<number>(11);

  const forecastState = useForecast();
  const capacity = occupancy?.capacity || forecastState.capacity || 30;
  const currentHour = new Date().getHours();

  // Selected Day Hourly Array
  const dayHourlyPcts = WEEKLY_HEATMAP_DATA[selectedDayKey] || WEEKLY_HEATMAP_DATA.Mon;
  const dayAveragePct = Math.round(
    dayHourlyPcts.reduce((a, b) => a + b, 0) / dayHourlyPcts.length
  );

  // Live vs Historical comparison
  const currentHourIdx = Math.max(0, Math.min(HOURS_RANGE.length - 1, currentHour - 6));
  const currentDayIndex = new Date().getDay(); // 0 is Sun, 1 is Mon...
  const currentDayKey = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][currentDayIndex];
  const typicalPctForNow = WEEKLY_HEATMAP_DATA[currentDayKey]?.[currentHourIdx] || 45;
  const livePeople = occupancy?.peopleCount || 14;
  const livePct = Math.round((livePeople / capacity) * 100);
  const diffFromTypical = livePct - typicalPctForNow;

  const handleOpenPlanModal = (hour: number) => {
    setPlanModalHour(hour);
    setIsPlanModalOpen(true);
  };

  const getHeatmapColorClass = (pct: number) => {
    if (pct >= 75) return 'bg-rose-500 text-white';
    if (pct >= 50) return 'bg-amber-500 text-zinc-950';
    if (pct >= 30) return 'bg-emerald-500 text-zinc-950';
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
            Analyze facility rush curves, explore quiet windows, inspect equipment availability, and plan workouts.
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
              Currently {livePeople} members inside ({livePct}% capacity)
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              {diffFromTypical <= -10 ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  🔥 {Math.abs(diffFromTypical)}% quieter than typical {currentDayKey} at this hour. Great time to train!
                </span>
              ) : diffFromTypical >= 10 ? (
                <span className="text-rose-600 dark:text-rose-400 font-bold">
                  ⚡ {diffFromTypical}% busier than average {currentDayKey}. Expect minor rack queues.
                </span>
              ) : (
                <span className="text-zinc-600 dark:text-zinc-300 font-medium">
                  Matches standard baseline attendance for {currentDayKey} (~{typicalPctForNow}% expected).
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
          <span>Plan Visit Slot</span>
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
                      Avg Load
                    </span>
                    <span className={`text-xs font-black tabular-nums ${isSelected ? 'text-white dark:text-zinc-900' : 'text-zinc-900 dark:text-white'}`}>
                      {dayAvg}%
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
                    {DAYS_OF_WEEK.find((d) => d.key === selectedDayKey)?.label} Hourly Rush Curve
                  </h3>
                  <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 tabular-nums">
                    (6:00 AM – 10:00 PM)
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Hover or tap on any hour to inspect wait times and book your declared slot.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/50 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  &lt;40% Low
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                  40–74% Mod
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200/70 dark:border-rose-800/50 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  &ge;75% Peak
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
                  const status = getStatusFromPct(pct);

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
                            <span className="text-zinc-200">~{expPeople} members</span>
                            <span className={`px-1 py-0.2 rounded text-[9px] ${
                              pct >= 75 ? 'bg-rose-950 text-rose-300' : pct >= 40 ? 'bg-zinc-800 text-zinc-300' : 'bg-emerald-950 text-emerald-300'
                            }`}>
                              {pct}%
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

                      {/* Current Hour Pill Indicator */}
                      {isCurrent && (
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-white mt-1.5" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* X Axis Time Labels */}
              <div className="flex justify-between text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mt-3 px-1 tabular-nums">
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
                onClick={() => handleOpenPlanModal(7)}
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs font-bold rounded-xl border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <span>Book 7:00 AM Slot</span>
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
                onClick={() => handleOpenPlanModal(11)}
                size="sm"
                className="w-full h-8 text-xs font-bold rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 cursor-pointer shadow-xs"
              >
                <span>Book 11:00 AM Slot</span>
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
                onClick={() => handleOpenPlanModal(20)}
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs font-bold rounded-xl border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <span>Book 8:30 PM Slot</span>
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* ================= TAB 2: 7-DAY HEATMAP MATRIX ================= */}
      {activeTab === 'matrix' && (
        <Card className="p-6 md:p-8 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card rounded-2xl space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-zinc-900 dark:text-white" />
                <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">
                  Full 7-Day Density Matrix
                </h3>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Grouped by workout time brackets. Click on any slot to inspect details or plan a visit.
              </p>
            </div>

            {/* Matrix Legend */}
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/80 p-2 rounded-xl border border-zinc-200/60 dark:border-zinc-800">
              <span className="text-[10px] text-zinc-400 uppercase font-bold">Density:</span>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-md bg-emerald-400/40 inline-block" />
                <span className="text-[11px]">&lt;30%</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block" />
                <span className="text-[11px]">30–50%</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-md bg-amber-500 inline-block" />
                <span className="text-[11px]">50–75%</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-md bg-rose-500 inline-block" />
                <span className="text-[11px]">&gt;75% Peak</span>
              </div>
            </div>
          </div>

          {/* Time Bracket Headers */}
          <div className="grid grid-cols-12 gap-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 text-center">
            <div className="col-span-2 text-left pl-1">Day</div>
            <div className="col-span-3 p-1 rounded-lg bg-zinc-100/70 dark:bg-zinc-800/70 text-emerald-800 dark:text-emerald-300">
              Morning (6a – 11a)
            </div>
            <div className="col-span-3 p-1 rounded-lg bg-zinc-100/70 dark:bg-zinc-800/70 text-zinc-700 dark:text-zinc-300">
              Afternoon (12p – 4p)
            </div>
            <div className="col-span-4 p-1 rounded-lg bg-zinc-100/70 dark:bg-zinc-800/70 text-rose-800 dark:text-rose-300">
              Evening Rush (5p – 10p)
            </div>
          </div>

          {/* 7 Days Matrix Rows */}
          <div className="space-y-2">
            {DAYS_OF_WEEK.map((d) => {
              const rowPcts = WEEKLY_HEATMAP_DATA[d.key] || [];
              const isToday = currentDayKey === d.key;

              // Split into brackets
              const morningPcts = rowPcts.slice(0, 6); // 6,7,8,9,10,11
              const afternoonPcts = rowPcts.slice(6, 11); // 12,13,14,15,16
              const eveningPcts = rowPcts.slice(11); // 17,18,19,20,21,22

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
                      return (
                        <button
                          key={hour24}
                          onClick={() => handleOpenPlanModal(hour24)}
                          className={`h-7 rounded-md text-[10px] font-bold flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${getHeatmapColorClass(
                            pct
                          )}`}
                          title={`${d.label} ${hour24}:00 AM: ${pct}% (~${Math.round((pct / 100) * capacity)} people)`}
                        >
                          {pct}
                        </button>
                      );
                    })}
                  </div>

                  {/* Afternoon Bracket Pills */}
                  <div className="col-span-3 grid grid-cols-5 gap-1">
                    {afternoonPcts.map((pct, i) => {
                      const hour24 = 12 + i;
                      return (
                        <button
                          key={hour24}
                          onClick={() => handleOpenPlanModal(hour24)}
                          className={`h-7 rounded-md text-[10px] font-bold flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${getHeatmapColorClass(
                            pct
                          )}`}
                          title={`${d.label} ${hour24 > 12 ? hour24 - 12 : hour24}:00 PM: ${pct}% (~${Math.round((pct / 100) * capacity)} people)`}
                        >
                          {pct}
                        </button>
                      );
                    })}
                  </div>

                  {/* Evening Bracket Pills */}
                  <div className="col-span-4 grid grid-cols-6 gap-1">
                    {eveningPcts.map((pct, i) => {
                      const hour24 = 17 + i;
                      return (
                        <button
                          key={hour24}
                          onClick={() => handleOpenPlanModal(hour24)}
                          className={`h-7 rounded-md text-[10px] font-bold flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${getHeatmapColorClass(
                            pct
                          )}`}
                          title={`${d.label} ${hour24 - 12}:00 PM: ${pct}% (~${Math.round((pct / 100) * capacity)} people)`}
                        >
                          {pct}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500 border-t border-zinc-100 dark:border-zinc-800">
            <span>Numbers in cells represent percentage capacity load.</span>
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">Tap any cell to plan a visit</span>
          </div>
        </Card>
      )}

      {/* ================= TAB 3: EQUIPMENT & ZONES ================= */}
      {activeTab === 'equipment' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Interactive Hour Target Slider Card */}
          <Card className="p-6 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200">
                  <Sliders className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-zinc-900 dark:text-white tracking-tight">
                    Equipment Availability Calculator
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Slide to your planned workout hour to see estimated queue times by gym zone.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Selected Hour:</span>
                <span className="px-3 py-1 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-black tabular-nums shadow-xs">
                  {equipmentTargetHour > 12 ? `${equipmentTargetHour - 12}:00 PM` : `${equipmentTargetHour}:00 AM`}
                </span>
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

          {/* 4 Equipment Zones Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Zone 1: Power Racks & Squat Platforms */}
            <Card className="p-5 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card rounded-2xl space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                    <Flame className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                      Power Racks & Squat Platforms
                    </h4>
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                      4 Olympic Barbells & Platforms
                    </span>
                  </div>
                </div>

                <Badge
                  variant={targetPct >= 75 ? 'high' : targetPct >= 40 ? 'moderate' : 'low'}
                  className="text-xs font-bold"
                >
                  {targetPct >= 75 ? '15–20 min wait' : targetPct >= 40 ? '5–10 min wait' : '0 min (Open)'}
                </Badge>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                {targetPct >= 75
                  ? 'Heavy peak load. Most members are performing compound squat and bench sets.'
                  : targetPct >= 40
                  ? 'Moderate usage. 1-2 platforms open with quick set turnaround.'
                  : 'Full immediate availability. All squat racks and platforms open.'}
              </p>
            </Card>

            {/* Zone 2: Cardio & Treadmill Suite */}
            <Card className="p-5 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card rounded-2xl space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                    <Activity className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                      Treadmills & Cardio Rowers
                    </h4>
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                      12 Incline Treadmills, Bikes & Rowers
                    </span>
                  </div>
                </div>

                <Badge variant={targetPct >= 85 ? 'moderate' : 'low'} className="text-xs font-bold">
                  {targetPct >= 85 ? '0–5 min wait' : 'Immediate Open'}
                </Badge>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                High turnover rate allows continuous availability across morning and evening sessions.
              </p>
            </Card>

            {/* Zone 3: Dumbbells & Cable Stations */}
            <Card className="p-5 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card rounded-2xl space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Zap className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                      Dumbbells & Cable Crossover
                    </h4>
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                      2.5kg – 50kg Pairs & 4 Cable Stacks
                    </span>
                  </div>
                </div>

                <Badge
                  variant={targetPct >= 75 ? 'moderate' : 'low'}
                  className="text-xs font-bold"
                >
                  {targetPct >= 75 ? '0–5 min wait' : '0 min wait'}
                </Badge>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                Multiple adjustable benches and dual cable towers ensure minimal waiting time for accessory work.
              </p>
            </Card>

            {/* Zone 4: Sauna & Recovery Lounge */}
            <Card className="p-5 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card rounded-2xl space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                    <Sparkles className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                      Sauna & Recovery Lounge (Pro/Elite)
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

              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                Comfortable capacity throughout the day. Best enjoyed right after morning or post-peak workouts.
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* Plan Visit Modal integration */}
      <PlanVisitModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        initialHour={planModalHour}
        forecastSlots={forecastState.forecast}
        onSuccess={() => {
          forecastState.refetch();
          occupancy?.refreshStatus?.();
        }}
      />
    </div>
  );
};
