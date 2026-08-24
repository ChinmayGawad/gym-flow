import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { WelcomeSection } from '@/components/dashboard/WelcomeSection';
import { CrowdCard } from '@/components/dashboard/CrowdCard';
import { PlannedVisitBanner } from '@/components/dashboard/PlannedVisitBanner';
import { TodayRushSparkline } from '@/components/dashboard/TodayRushSparkline';
import { OccupancySimulatorControl } from '@/components/dashboard/OccupancySimulatorControl';
import { CapacitySettingsModal } from '@/components/admin/CapacitySettingsModal';
import { PlanVisitModal } from '@/components/schedule/PlanVisitModal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  Clock,
  Sparkles,
  AlertTriangle,
  Flame,
  TrendingUp,
  ArrowRight,
  PlusCircle,
  Calendar,
} from 'lucide-react';
import { useOccupancy } from '@/hooks/useOccupancy';
import { useForecast } from '@/hooks/useForecast';

interface HomePageProps {
  displayName: string;
  userPlan?: string;
  isAdmin?: boolean;
  isLoggedIn?: boolean;
  occupancy: ReturnType<typeof useOccupancy>;
  onOpenAuth?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  displayName,
  userPlan,
  isAdmin = false,
  isLoggedIn = false,
  occupancy,
  onOpenAuth,
}) => {
  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [targetSlotHour, setTargetSlotHour] = useState(11);

  // Centralized forecast hook sharing live stream updates
  const {
    forecast,
    userPlannedVisit,
    optimalWindow,
    isLoading: isForecastLoading,
    refetch: refetchForecast,
    cancelSlot,
  } = useForecast();

  const handleOpenPlanModal = (hour: number = 11) => {
    setTargetSlotHour(hour);
    setIsPlanModalOpen(true);
  };

  const handleCancelVisit = async (visitId: string) => {
    await cancelSlot(visitId);
  };

  const eveningPeak = forecast.find((s) => s.isHighest) || forecast[12];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* 1. Welcome Greeting with Membership Badge */}
      <WelcomeSection userName={displayName} plan={userPlan} />

      {/* 2. Bento Hero: Live Crowd Pulse & Planned Visit Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 flex flex-col">
          <CrowdCard
            data={occupancy}
            isAdmin={isAdmin}
            isLoggedIn={isLoggedIn}
            onToggleSelfCheckIn={occupancy.toggleSelfCheckIn}
            onOpenCapacityModal={() => setIsCapacityModalOpen(true)}
            onOpenAuth={onOpenAuth}
            isLoadingCheckIn={occupancy.isLoading}
          />
        </div>

        <div className="lg:col-span-5 flex flex-col">
          <PlannedVisitBanner
            userPlannedVisit={userPlannedVisit}
            optimalRange={optimalWindow.timeRange}
            onOpenPlanModal={handleOpenPlanModal}
            onCancelVisit={handleCancelVisit}
            onCheckIn={occupancy.toggleSelfCheckIn}
            isCheckedInSelf={occupancy.isCheckedInSelf}
            isLoading={occupancy.isLoading}
          />
        </div>
      </div>

      {/* 3. Four Glanceable Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Inside Headcount */}
        <Card className="p-4 sm:p-5 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card hover:border-black/[0.12] dark:hover:border-white/[0.15] transition-all">
          <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200 mb-2.5">
            <Users className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          </div>
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">
            Inside Facility
          </span>
          <span className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tabular-nums tracking-tight block mt-0.5">
            {occupancy.peopleCount} <span className="text-xs font-semibold text-zinc-400">/ {occupancy.capacity}</span>
          </span>
          <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                occupancy.percentage >= 75
                  ? 'bg-rose-500'
                  : occupancy.percentage >= 40
                  ? 'bg-zinc-700 dark:bg-zinc-300'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, occupancy.percentage)}%` }}
            />
          </div>
        </Card>

        {/* Card 2: Wait Time */}
        <Card className="p-4 sm:p-5 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card hover:border-black/[0.12] dark:hover:border-white/[0.15] transition-all">
          <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200 mb-2.5">
            <Clock className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          </div>
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">
            Est. Equipment Wait
          </span>
          <span className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tabular-nums tracking-tight block mt-0.5">
            {occupancy.waitTime}
          </span>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 block truncate">
            {occupancy.status === 'LOW' ? 'Immediate availability' : occupancy.status === 'HIGH' ? 'Power racks busy' : 'Moderate rotation'}
          </span>
        </Card>

        {/* Card 3: Today's Quiet Window */}
        <Card className="p-4 sm:p-5 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card hover:border-black/[0.12] dark:hover:border-white/[0.15] transition-all">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest block">
            Quiet Window
          </span>
          <span className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white tracking-tight block mt-0.5 truncate">
            {optimalWindow.timeRange}
          </span>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 block">
            ~{optimalWindow.expectedPeople} expected members
          </span>
        </Card>

        {/* Card 4: Peak Rush Window */}
        <Card className="p-4 sm:p-5 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card hover:border-black/[0.12] dark:hover:border-white/[0.15] transition-all">
          <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-2.5">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-widest block">
            Evening Peak
          </span>
          <span className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white tracking-tight block mt-0.5 truncate">
            5:30 PM – 8:00 PM
          </span>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 block">
            ~{eveningPeak?.predictedCount || 26} expected members
          </span>
        </Card>
      </div>

      {/* 4. Glanceable Today's Crowd Wave Sparkline */}
      <TodayRushSparkline
        forecast={forecast}
        optimalRange={optimalWindow.timeRange}
        optimalPeople={optimalWindow.expectedPeople}
        capacity={occupancy.capacity}
        isLoading={isForecastLoading}
        onOpenPlanModal={handleOpenPlanModal}
      />

      {/* 5. Fast Action Shortcuts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Shortcut 1: Schedule Visit Slot */}
        <Card className="p-5 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card hover:border-black/[0.12] dark:hover:border-white/[0.15] transition-all flex flex-col justify-between group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200 shrink-0">
              <Calendar className="w-4.5 h-4.5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-zinc-900 dark:text-white tracking-tight">
                Schedule Planned Visit
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                1-click slot booking & attendee lists
              </p>
            </div>
          </div>
          <Link
            to="/schedule"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-white hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors pt-1"
          >
            <span>Open Schedule</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </Card>

        {/* Shortcut 2: Crowd Insights & Heatmap */}
        <Card className="p-5 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card hover:border-black/[0.12] dark:hover:border-white/[0.15] transition-all flex flex-col justify-between group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-zinc-900 dark:text-white tracking-tight">
                Crowd Insights & Heatmap
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                7-day hourly density & equipment wait
              </p>
            </div>
          </div>
          <Link
            to="/analytics"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-white hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors pt-1"
          >
            <span>View Analytics</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </Card>

        {/* Shortcut 3: Log Workout */}
        <Card className="p-5 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card hover:border-black/[0.12] dark:hover:border-white/[0.15] transition-all flex flex-col justify-between group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-800/50 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
              <Flame className="w-4.5 h-4.5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-zinc-900 dark:text-white tracking-tight">
                Log Training Session
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Record duration, calories & PRs
              </p>
            </div>
          </div>
          <Link
            to="/log-workout"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-white hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors pt-1"
          >
            <span>Log Session</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </Card>
      </div>

      {/* 6. Floating Progressive-Disclosure Simulator Controls */}
      <OccupancySimulatorControl
        isAutoSimulating={occupancy.isAutoSimulating}
        capacity={occupancy.capacity}
        onToggleAutoSimulating={occupancy.toggleAutoSimulating}
        onIncrement={occupancy.increment}
        onDecrement={occupancy.decrement}
        onSetOccupants={occupancy.setOccupants}
      />

      {/* 7. Gym Owner Capacity Modal */}
      <CapacitySettingsModal
        isOpen={isCapacityModalOpen}
        onClose={() => setIsCapacityModalOpen(false)}
        currentCapacity={occupancy.capacity}
        onSaveCapacity={occupancy.updateCapacity}
        gymName={occupancy.gymName}
      />

      {/* 8. Plan Visit Slot Modal */}
      <PlanVisitModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        initialHour={targetSlotHour}
        forecastSlots={forecast}
        onSuccess={() => {
          refetchForecast();
          occupancy.refreshStatus?.();
        }}
      />
    </div>
  );
};
