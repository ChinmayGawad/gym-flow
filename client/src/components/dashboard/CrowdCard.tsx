import React from 'react';
import { OccupancyData } from '@/types/occupancy';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  MapPin,
  Settings,
  Users,
  Loader2,
  Activity,
  Clock,
  LogOut,
  Radio,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from '@/context/ThemeContext';

interface CrowdCardProps {
  data: OccupancyData;
  isAdmin?: boolean;
  isLoggedIn?: boolean;
  onToggleSelfCheckIn?: () => Promise<any> | void;
  onOpenCapacityModal?: () => void;
  onOpenAuth?: () => void;
  isLoadingCheckIn?: boolean;
  isLoading?: boolean;
}

export const CrowdCard: React.FC<CrowdCardProps> = ({
  data,
  isAdmin = false,
  isLoggedIn = false,
  onToggleSelfCheckIn,
  onOpenCapacityModal,
  onOpenAuth,
  isLoadingCheckIn = false,
  isLoading = false,
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  if (isLoading) {
    return (
      <Card className="p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center min-h-[220px] bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card">
        <div className="w-full md:w-[60%] space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="flex items-baseline gap-2">
            <Skeleton className="h-14 w-28 rounded-xl" />
            <Skeleton className="h-6 w-16 rounded-lg" />
          </div>
          <Skeleton className="h-4 w-52 rounded-lg" />
          <div className="pt-2">
            <Skeleton className="h-10 w-44 rounded-xl" />
          </div>
        </div>
        <div className="hidden sm:flex flex-col items-center justify-center w-full md:w-[200px] p-6 rounded-2xl bg-zinc-50/70 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800 mt-6 md:mt-0">
          <Skeleton className="w-28 h-28 rounded-full" />
        </div>
      </Card>
    );
  }

  const {
    peopleCount,
    capacity,
    totalRegisteredMembers = 35,
    percentage,
    status,
    waitTime,
    isCheckedInSelf,
  } = data;

  const badgeVariant =
    status === 'LOW' ? 'low' : status === 'HIGH' ? 'high' : 'moderate';

  const handleCheckInClick = () => {
    if (!isLoggedIn && onOpenAuth) {
      onOpenAuth();
      return;
    }
    if (onToggleSelfCheckIn) {
      onToggleSelfCheckIn();
    }
  };

  // SVG Radial Gauge Calculations
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const ringColor =
    status === 'LOW'
      ? isDark ? '#10b981' : '#059669' // emerald
      : status === 'HIGH'
      ? isDark ? '#f43f5e' : '#e11d48' // rose
      : isDark ? '#fbbf24' : '#d97706'; // amber

  const availableSlots = Math.max(0, capacity - peopleCount);

  return (
    <Card className="p-6 sm:p-7 flex flex-col md:flex-row justify-between items-start md:items-center min-h-[220px] bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card relative overflow-hidden min-w-0">
      {/* Left Core Section */}
      <div className="w-full md:w-[64%] flex flex-col justify-between min-w-0">
        {/* Top Status Indicators (Glanceable in 0.5s) */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={badgeVariant} dot className="px-3 py-1 text-xs font-bold tracking-tight">
              {status} CROWD
            </Badge>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100/90 dark:bg-zinc-800/90 text-zinc-800 dark:text-zinc-200 border border-zinc-200/70 dark:border-zinc-700/60 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>{waitTime} wait</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/50 text-[11px] font-semibold">
              <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
              <span>Live</span>
            </span>
          </div>

          {/* Admin Owner Capacity Settings Button */}
          {isAdmin && onOpenCapacityModal && (
            <button
              onClick={onOpenCapacityModal}
              className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 px-2.5 py-1 rounded-xl border border-amber-200/80 dark:border-amber-800/60 transition-colors cursor-pointer"
              title="Change Gym Capacity"
            >
              <Settings className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span>Cap: {capacity}</span>
            </button>
          )}
        </div>

        {/* Big Numeric Display */}
        <div className="mt-4">
          <div className="flex items-baseline">
            <span className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-white tabular-nums leading-none">
              {peopleCount}
            </span>
            <span className="text-xl font-semibold text-zinc-400 dark:text-zinc-500 ml-2 tabular-nums">
              / {capacity}
            </span>
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 ml-3 uppercase tracking-wider">
              members inside
            </span>
          </div>

          {/* Availability & Member Count Context */}
          <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium mt-1.5 flex items-center gap-2">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums">
              {availableSlots} {availableSlots === 1 ? 'slot' : 'slots'} available
            </span>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <span className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
              <Users className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
              {totalRegisteredMembers} registered
            </span>
          </p>
        </div>

        {/* Primary Action Button: Self Check-In */}
        <div className="mt-4 pt-1">
          <Button
            onClick={handleCheckInClick}
            disabled={isLoadingCheckIn}
            className={`h-10 px-5 text-xs font-extrabold rounded-xl gap-2 transition-all active:scale-[0.98] shadow-xs cursor-pointer ${
              isCheckedInSelf
                ? 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white'
                : 'bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100'
            }`}
          >
            {isLoadingCheckIn ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isCheckedInSelf ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-200 dark:text-emerald-100" />
                <span>Checked In (Tap to Exit)</span>
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4" />
                <span>{isLoggedIn ? 'Self Check-In to Gym' : 'Sign In to Check In'}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Right Section: Minimalist Radial Gauge */}
      <div className="w-full md:w-[190px] p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800 mt-5 md:mt-0 flex flex-col items-center justify-center shrink-0">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 112 112">
            {/* Background Track Circle */}
            <circle
              cx="56"
              cy="56"
              r={radius}
              className="stroke-zinc-200/70 dark:stroke-zinc-800"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Active Foreground Progress Arc */}
            <circle
              cx="56"
              cy="56"
              r={radius}
              stroke={ringColor}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          {/* Center Text inside Radial Ring */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-xl font-black text-zinc-900 dark:text-white tabular-nums leading-none tracking-tight">
              {percentage}%
            </span>
            <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 tracking-wider uppercase mt-1">
              OCCUPIED
            </span>
          </div>
        </div>

        <div className="text-center mt-2">
          <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 flex items-center justify-center gap-1">
            <Activity className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
            {status === 'LOW' ? 'Floor is open' : status === 'HIGH' ? 'Peak rush' : 'Moderate flow'}
          </span>
        </div>
      </div>
    </Card>
  );
};
