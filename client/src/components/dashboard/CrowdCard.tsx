import React from 'react';
import { OccupancyData } from '@/types/occupancy';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  MapPin,
  Settings,
  Users,
  Loader2,
  Activity,
  ArrowUpRight,
} from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';

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
  if (isLoading) {
    return (
      <Card className="p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center min-h-[260px] bg-white border border-black/[0.06] shadow-card">
        <div className="w-full md:w-[60%] space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-32 rounded-lg" />
            <Skeleton className="h-2 w-2 rounded-full" />
          </div>
          <div className="flex items-baseline gap-2">
            <Skeleton className="h-12 w-28 rounded-xl" />
            <Skeleton className="h-6 w-16 rounded-lg" />
          </div>
          <Skeleton className="h-4 w-48 rounded-lg" />
          <div className="flex items-center gap-3 pt-1">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-32 rounded-xl" />
          </div>
          <div className="pt-2 max-w-[340px] space-y-1.5">
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-20 rounded-md" />
              <Skeleton className="h-3 w-24 rounded-md" />
            </div>
          </div>
        </div>
        <div className="hidden sm:flex flex-col items-center justify-center w-full md:w-[220px] p-6 rounded-2xl bg-zinc-50/70 border border-zinc-200/50 mt-6 md:mt-0">
          <Skeleton className="w-32 h-32 rounded-full" />
          <Skeleton className="h-3 w-24 rounded-md mt-3" />
        </div>
      </Card>
    );
  }

  const {
    peopleCount,
    capacity,
    totalRegisteredMembers = 35,
    turnoutPercentage = 0,
    percentage,
    status,
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
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const ringColor =
    status === 'LOW'
      ? '#059669' // emerald-600
      : status === 'HIGH'
      ? '#e11d48' // rose-600
      : '#3f3f46'; // zinc-700

  return (
    <Card className="p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center min-h-[260px] bg-white border border-black/[0.06] shadow-card relative overflow-hidden">
      {/* Crowd Info Left Section */}
      <div className="w-full md:w-[60%]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
              LIVE GYM OCCUPANCY
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-semibold tracking-normal">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-Time Sync</span>
            </span>
          </div>

          {/* Admin Owner Capacity Settings Button */}
          {isAdmin && onOpenCapacityModal && (
            <button
              onClick={onOpenCapacityModal}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-200/80 transition-colors cursor-pointer"
              title="Change Gym Capacity"
            >
              <Settings className="w-3 h-3 text-amber-700" />
              <span>Max: {capacity}</span>
            </button>
          )}
        </div>

        {/* Headcount Number */}
        <div className="flex items-baseline mt-2">
          <span className="text-5xl sm:text-6xl font-black tracking-tight text-zinc-900 tabular-nums leading-none">
            {peopleCount}
          </span>
          <span className="text-2xl font-medium text-zinc-400 ml-2.5 tabular-nums">
            / {capacity}
          </span>
          <span className="text-xs font-semibold text-zinc-400 ml-3 uppercase tracking-wider">
            occupants
          </span>
        </div>

        {/* Member Context Description */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="text-zinc-500 text-xs font-medium">
            Active in facility
          </span>
          <span className="text-zinc-300">•</span>
          <span className="text-[11px] font-medium text-zinc-500 flex items-center gap-1 bg-zinc-100/80 px-2.5 py-0.5 rounded-full border border-zinc-200/60">
            <Users className="w-3 h-3 text-zinc-400" />
            {totalRegisteredMembers} registered ({turnoutPercentage}% turnout)
          </span>
        </div>

        {/* Status Pill & Actions */}
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <Badge variant={badgeVariant} dot className="px-3 py-1 text-xs font-semibold">
            {status} CROWD
          </Badge>

          {/* Member Self Check-In / Check-Out CTA */}
          <Button
            onClick={handleCheckInClick}
            disabled={isLoadingCheckIn}
            size="sm"
            className={`h-8.5 px-3.5 text-xs font-bold rounded-xl gap-1.5 transition-all shadow-xs ${
              isCheckedInSelf
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-zinc-900 hover:bg-zinc-800 text-white'
            }`}
          >
            {isLoadingCheckIn ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isCheckedInSelf ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                Checked In (Tap to Exit)
              </>
            ) : (
              <>
                <MapPin className="w-3.5 h-3.5" />
                {isLoggedIn ? 'Self Check-In' : 'Sign In to Check In'}
              </>
            )}
          </Button>
        </div>

        {/* Linear Progress Bar Indicator */}
        <div className="mt-5 w-full max-w-[340px]">
          <Progress value={percentage} className="h-2 rounded-full bg-zinc-100" />
          <div className="flex justify-between items-center text-xs text-zinc-500 font-medium mt-1.5 tabular-nums">
            <span className="font-semibold text-zinc-700">{percentage}% Occupied</span>
            <span>{Math.max(0, capacity - peopleCount)} slots available</span>
          </div>
        </div>
      </div>

      {/* Right Section: Minimalist Radial Gauge */}
      <div className="hidden sm:flex flex-col items-center justify-center w-full md:w-[220px] p-4 rounded-2xl bg-zinc-50/70 border border-zinc-200/50 mt-6 md:mt-0">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
            {/* Background Circle */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              className="stroke-zinc-200/70"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Active Foreground Progress Arc */}
            <circle
              cx="64"
              cy="64"
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
            <span className="text-2xl font-black text-zinc-900 tabular-nums leading-none tracking-tight">
              {percentage}%
            </span>
            <span className="text-[9px] font-bold text-zinc-400 tracking-wider uppercase mt-0.5">
              CAPACITY
            </span>
          </div>
        </div>

        <div className="text-center mt-2">
          <span className="text-[11px] font-medium text-zinc-500 flex items-center justify-center gap-1">
            <Activity className="w-3 h-3 text-zinc-400" />
            {status === 'LOW' ? 'Floor is open' : status === 'HIGH' ? 'Floor is busy' : 'Moderate flow'}
          </span>
        </div>
      </div>
    </Card>
  );
};


