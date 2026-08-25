import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  Clock,
  Sparkles,
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
  Moon,
  Sun,
  Dumbbell,
  Check,
} from 'lucide-react';
import { useOccupancy } from '@/hooks/useOccupancy';
import { useForecast } from '@/hooks/useForecast';
import { PlanVisitModal } from '@/components/schedule/PlanVisitModal';
import { API_BASE } from '@/lib/api-config';

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

const EQUIPMENT_ZONES = [
  { id: 'squat', name: 'Power Racks & Squats', icon: Flame, color: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/40' },
  { id: 'cardio', name: 'Cardio & Treadmills', icon: Activity, color: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/40' },
  { id: 'freeweights', name: 'Dumbbells & Cables', icon: Zap, color: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
  { id: 'sauna', name: 'Sauna & Recovery', icon: Sparkles, color: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/40' },
];

const POPULAR_EXACT_TIMES = [
  { hour: 7, minute: '00', label: '7:00 AM', tag: 'Early' },
  { hour: 11, minute: '00', label: '11:00 AM', tag: 'Quiet ★' },
  { hour: 17, minute: '30', label: '5:30 PM', tag: 'Evening' },
  { hour: 18, minute: '00', label: '6:00 PM', tag: 'Peak Rush' },
  { hour: 20, minute: '30', label: '8:30 PM', tag: 'Calm' },
];

const MINUTE_OPTIONS = ['00', '15', '30', '45'];

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ occupancy }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'matrix' | 'equipment'>('overview');
  const [selectedDayKey, setSelectedDayKey] = useState<string>('Mon');
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [weeklyData, setWeeklyData] = useState<{
    heatmapCounts: Record<string, number[]>;
    heatmapPercentages: Record<string, number[]>;
  } | null>(null);

  // Simplified Quick Slot Booking State
  const [selectedZone, setSelectedZone] = useState<string>(EQUIPMENT_ZONES[0].name);
  const [slotHour, setSlotHour] = useState<number>(17); // Default 5 PM
  const [slotMinute, setSlotMinute] = useState<string>('30'); // Default :30 (5:30 PM)
  const [isExactCustomOpen, setIsExactCustomOpen] = useState<boolean>(false);

  // Plan Visit Modal State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState<boolean>(false);
  const [planModalHour, setPlanModalHour] = useState<number>(17);
  const [planModalExactTime, setPlanModalExactTime] = useState<string>('5:30 PM');
  const [planModalWorkoutFocus, setPlanModalWorkoutFocus] = useState<string>('Power Racks & Squats');

  const forecastState = useForecast();
  const capacity = occupancy?.capacity || forecastState.capacity || 30;
  const currentHour = new Date().getHours();

  const fetchWeeklyAnalytics = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/gym/analytics/weekly`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.heatmapCounts) {
          setWeeklyData(data);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchWeeklyAnalytics();
  }, [fetchWeeklyAnalytics]);

  // Selected Day Hourly Array
  const dayHourlyCounts = weeklyData?.heatmapCounts?.[selectedDayKey] || new Array(17).fill(0);
  const dayHourlyPcts = weeklyData?.heatmapPercentages?.[selectedDayKey] || new Array(17).fill(0);
  const totalDayHeadcount = dayHourlyCounts.reduce((a, b) => a + b, 0);
  const dayAverageHeadcount = Math.round(totalDayHeadcount / Math.max(1, dayHourlyCounts.length));

  // Live vs Historical comparison
  const currentHourIdx = Math.max(0, Math.min(HOURS_RANGE.length - 1, currentHour - 6));
  const currentDayIndex = new Date().getDay();
  const currentDayKey = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][currentDayIndex];
  const typicalHeadcountForNow = weeklyData?.heatmapCounts?.[currentDayKey]?.[currentHourIdx] || 0;
  const typicalPctForNow = weeklyData?.heatmapPercentages?.[currentDayKey]?.[currentHourIdx] || 0;
  const livePeople = occupancy?.peopleCount || 0;
  const livePct = Math.round((livePeople / Math.max(1, capacity)) * 100);
  const diffFromTypical = livePct - typicalPctForNow;

  // Format exact time string e.g. "5:30 PM"
  const formatTime = (h: number, m: string) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    return `${displayHour}:${m} ${period}`;
  };

  const currentExactTimeStr = formatTime(slotHour, slotMinute);

  const handleOpenPlanModal = (hour: number, exactTimeStr?: string, focus?: string) => {
    setPlanModalHour(hour);
    setPlanModalExactTime(exactTimeStr || `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`);
    setPlanModalWorkoutFocus(focus || selectedZone);
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

  const getWaitTimeFromPct = (pct: number): string => {
    if (pct >= 75) return '15–25 min';
    if (pct >= 40) return '10 min';
    return '0–5 min';
  };

  // Forecast for selected quick slot hour
  const targetHourIdx = Math.max(0, Math.min(HOURS_RANGE.length - 1, slotHour - 6));
  const targetPct = dayHourlyPcts[targetHourIdx] || 45;
  const targetHeadcount = Math.round((targetPct / 100) * capacity);
  const targetWait = getWaitTimeFromPct(targetPct);

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
            Analyze facility headcount curves, inspect quiet windows, and select your exact visit slot.
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
            <span>Quick Slot Booking</span>
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
          onClick={() => handleOpenPlanModal(11, '11:00 AM')}
          className="w-full sm:w-auto h-9 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 text-xs font-bold gap-1.5 shrink-0 cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Plan Visit</span>
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
              const dayCounts = weeklyData?.heatmapCounts?.[d.key] || [];
              const dayHeadcountTotal = dayCounts.reduce((a, b) => a + b, 0);
              const dayHeadcount = Math.round(dayHeadcountTotal / Math.max(1, dayCounts.length));

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
                {dayHourlyCounts.map((expPeople, idx) => {
                  const hour24 = HOURS_RANGE[idx];
                  const timeLabel = hour24 > 12 ? `${hour24 - 12}:00 PM` : `${hour24}:00 AM`;
                  const pct = dayHourlyPcts[idx] || 0;
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
                      onClick={() => handleOpenPlanModal(hour24, timeLabel)}
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
                        style={{ height: `${pct > 0 ? Math.max(14, pct) : 4}%` }}
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
                <span>11 AM</span>
                <span>2 PM</span>
                <span>6 PM</span>
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
                  ~{dayHourlyCounts[1] || 0} members inside. Instant treadmill and cardio machine access. 0 min wait.
                </p>
              </div>
              <Button
                onClick={() => handleOpenPlanModal(7, '7:00 AM', 'Cardio & Treadmills')}
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
                  Lowest daily attendance (~{dayHourlyCounts[5] || 0} members). Immediate power rack and bench availability.
                </p>
              </div>
              <Button
                onClick={() => handleOpenPlanModal(11, '11:00 AM', 'Power Racks & Squats')}
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
                  Evening rush subsides (~{dayHourlyCounts[14] || 0} members). Relaxed workout floor & sauna access.
                </p>
              </div>
              <Button
                onClick={() => handleOpenPlanModal(20, '8:30 PM', 'Sauna & Recovery')}
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
              const rowCounts = weeklyData?.heatmapCounts?.[d.key] || new Array(17).fill(0);
              const rowPcts = weeklyData?.heatmapPercentages?.[d.key] || new Array(17).fill(0);
              const isToday = currentDayKey === d.key;

              // Split into brackets
              const morningCounts = rowCounts.slice(0, 6);
              const morningPcts = rowPcts.slice(0, 6);
              const afternoonCounts = rowCounts.slice(6, 11);
              const afternoonPcts = rowPcts.slice(6, 11);
              const eveningCounts = rowCounts.slice(11);
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
                    {morningCounts.map((headcount, i) => {
                      const hour24 = 6 + i;
                      const pct = morningPcts[i] || 0;
                      return (
                        <button
                          key={hour24}
                          onClick={() => handleOpenPlanModal(hour24, `${hour24}:00 AM`)}
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
                    {afternoonCounts.map((headcount, i) => {
                      const hour24 = 12 + i;
                      const pct = afternoonPcts[i] || 0;
                      return (
                        <button
                          key={hour24}
                          onClick={() => handleOpenPlanModal(hour24, `${hour24 > 12 ? hour24 - 12 : hour24}:00 PM`)}
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
                    {eveningCounts.map((headcount, i) => {
                      const hour24 = 17 + i;
                      const pct = eveningPcts[i] || 0;
                      return (
                        <button
                          key={hour24}
                          onClick={() => handleOpenPlanModal(hour24, `${hour24 - 12}:00 PM`)}
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

      {/* ================= TAB 3: STREAMLINED QUICK SLOT BOOKING (CLEAN & SINGLE BUTTON) ================= */}
      {activeTab === 'equipment' && (
        <Card className="p-6 md:p-8 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card rounded-2xl space-y-6 animate-in fade-in duration-200 max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shadow-xs shrink-0">
                <Timer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">
                  Quick Workout Slot Booking
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Select your workout area and exact arrival time (e.g. 5:30 PM) to book in 1 tap.
                </p>
              </div>
            </div>

            <Badge variant="low" className="text-xs font-bold self-start sm:self-auto">
              Real-Time Sync
            </Badge>
          </div>

          {/* 1. Select Training Category */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
              1. Select Training Area / Focus
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {EQUIPMENT_ZONES.map((zone) => {
                const Icon = zone.icon;
                const isSelected = selectedZone === zone.name;
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => setSelectedZone(zone.name)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? `${zone.border} ${zone.bg} ring-2 ring-zinc-900 dark:ring-white shadow-xs`
                        : 'border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon className={`w-4 h-4 ${zone.color}`} />
                      {isSelected && <Check className="w-3.5 h-3.5 text-zinc-900 dark:text-white stroke-[3]" />}
                    </div>
                    <span className="text-xs font-extrabold text-zinc-900 dark:text-white leading-tight">
                      {zone.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Select Arrival Time (Popular Presets + Exact Minute Picker) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                2. Select Arrival Time
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-zinc-900 dark:text-white flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-xl">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  {currentExactTimeStr}
                </span>
                <button
                  type="button"
                  onClick={() => setIsExactCustomOpen(!isExactCustomOpen)}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Sliders className="w-3 h-3" />
                  <span>{isExactCustomOpen ? 'Show Quick Chips' : 'Exact Custom Time'}</span>
                </button>
              </div>
            </div>

            {/* Popular Presets Chips */}
            {!isExactCustomOpen ? (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {POPULAR_EXACT_TIMES.map((preset) => {
                  const isSelected = slotHour === preset.hour && slotMinute === preset.minute;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setSlotHour(preset.hour);
                        setSlotMinute(preset.minute);
                      }}
                      className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-zinc-900 dark:border-white bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                          : 'border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black tabular-nums">{preset.label}</span>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className={`text-[9px] font-bold mt-0.5 ${isSelected ? 'opacity-80' : 'text-zinc-400'}`}>
                        {preset.tag}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Custom Exact Hour & Minute Selection (e.g. 5:30 PM) */
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  <span>Pick Exact Hour & Minute:</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    {currentExactTimeStr}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Hour Selector */}
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Hour (6 AM – 10 PM)
                    </label>
                    <select
                      value={slotHour}
                      onChange={(e) => setSlotHour(parseInt(e.target.value, 10))}
                      className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold text-zinc-900 dark:text-white px-3 cursor-pointer"
                    >
                      {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22].map((h) => {
                        const label = h > 12 ? `${h - 12} PM` : h === 12 ? '12 PM' : `${h} AM`;
                        return (
                          <option key={h} value={h}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Minute Selector */}
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Minute
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {MINUTE_OPTIONS.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setSlotMinute(m)}
                          className={`h-10 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                            slotMinute === m
                              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-xs'
                              : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50'
                          }`}
                        >
                          :{m}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live Crowd & Wait Time Indicator Box */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/70 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${targetPct >= 75 ? 'bg-rose-500' : targetPct >= 40 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">
                    {currentExactTimeStr} Arrival Status
                  </span>
                  <Badge variant={targetPct >= 75 ? 'high' : targetPct >= 40 ? 'moderate' : 'low'} className="text-[10px] font-bold py-0">
                    {targetPct >= 75 ? 'Peak Rush' : targetPct >= 40 ? 'Moderate' : 'Low Crowd'}
                  </Badge>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Expected crowd: ~{targetHeadcount} members inside ({targetPct}% cap) · Est. wait: {targetWait}
                </p>
              </div>
            </div>

            <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 shrink-0">
              {targetPct < 40 ? '★ Optimal Time' : 'Reserve Ahead'}
            </span>
          </div>

          {/* Single Prominent Booking Action Button */}
          <Button
            onClick={() => handleOpenPlanModal(slotHour, currentExactTimeStr, selectedZone)}
            className="w-full h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 font-extrabold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <span>Confirm & Book Slot for {currentExactTimeStr}</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Card>
      )}

      {/* Plan Visit Modal (Handles both general & exact equipment slot bookings) */}
      <PlanVisitModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        initialHour={planModalHour}
        initialExactTime={planModalExactTime}
        initialWorkoutFocus={planModalWorkoutFocus}
        forecastSlots={forecastState.forecast}
        onSuccess={() => {
          handleRefresh();
          fetchWeeklyAnalytics();
        }}
      />
    </div>
  );
};
