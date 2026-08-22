import React from 'react';
import { OccupancyData } from '@/types/occupancy';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dumbbell,
  Flame,
  CheckCircle2,
  MapPin,
  Settings,
  Users,
  Loader2,
} from 'lucide-react';

interface CrowdCardProps {
  data: OccupancyData;
  isAdmin?: boolean;
  isLoggedIn?: boolean;
  onToggleSelfCheckIn?: () => Promise<any> | void;
  onOpenCapacityModal?: () => void;
  onOpenAuth?: () => void;
  isLoadingCheckIn?: boolean;
}

export const CrowdCard: React.FC<CrowdCardProps> = ({
  data,
  isAdmin = false,
  isLoggedIn = false,
  onToggleSelfCheckIn,
  onOpenCapacityModal,
  onOpenAuth,
  isLoadingCheckIn = false,
}) => {
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

  return (
    <Card className="p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center min-h-[265px] bg-white border-[#dedede] relative overflow-hidden">
      {/* Crowd Info Left Section */}
      <div className="w-full md:w-[62%]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold tracking-wider text-gym-subtle uppercase block">
            CURRENT CROWD
          </span>

          {/* Admin Owner Capacity Settings Button */}
          {isAdmin && onOpenCapacityModal && (
            <button
              onClick={onOpenCapacityModal}
              className="flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-md border border-amber-200 transition-colors cursor-pointer"
              title="Change Gym Capacity"
            >
              <Settings className="w-3 h-3 text-amber-700" />
              Owner Capacity: {capacity}
            </button>
          )}
        </div>

        {/* Headcount Count */}
        <div className="flex items-baseline mt-1.5">
          <span className="text-[52px] sm:text-[56px] leading-none font-extrabold tracking-tight text-gym-dark">
            {peopleCount}
          </span>
          <span className="text-2xl font-medium text-[#888] ml-2">
            / {capacity}
          </span>
        </div>

        {/* Member Context Description */}
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <p className="text-gym-subtle text-xs font-semibold">
            People inside gym
          </p>
          <span className="text-[#ccc]">•</span>
          <span className="text-[11px] font-medium text-[#777] flex items-center gap-1 bg-[#f5f5f5] px-2 py-0.5 rounded-full">
            <Users className="w-3 h-3 text-[#888]" />
            {totalRegisteredMembers} registered ({turnoutPercentage}% turnout)
          </span>
        </div>

        {/* Status Pill & Actions */}
        <div className="flex flex-wrap items-center gap-3 mt-3.5">
          <Badge variant={badgeVariant} dot className="px-3 py-1 text-[11px] font-bold">
            {status} CROWD
          </Badge>

          {/* Member Self Check-In / Check-Out CTA */}
          <Button
            onClick={handleCheckInClick}
            disabled={isLoadingCheckIn}
            size="sm"
            className={`h-8 px-3 text-xs font-bold rounded-[8px] gap-1.5 transition-all shadow-sm ${
              isCheckedInSelf
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                : 'bg-gym-dark hover:bg-[#383838] text-white'
            }`}
          >
            {isLoadingCheckIn ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isCheckedInSelf ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                Inside Gym (Check Out)
              </>
            ) : (
              <>
                <MapPin className="w-3.5 h-3.5" />
                {isLoggedIn ? 'Check In to Gym' : 'Sign In to Check In'}
              </>
            )}
          </Button>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="mt-5 w-full max-w-[340px]">
          <Progress value={percentage} className="h-[9px]" />
          <div className="flex justify-between items-center text-xs text-gym-subtle font-medium mt-1.5">
            <span>{percentage}% Occupied</span>
            <span>{Math.max(0, capacity - peopleCount)} slots remaining</span>
          </div>
        </div>
      </div>

      {/* Decorative Graphics Right Section */}
      <div className="hidden sm:flex w-full md:w-[240px] h-[140px] md:h-[160px] items-center justify-center gap-6 text-[#dedede] mt-6 md:mt-0 border-t md:border-t-0 border-[#f0f0f0] pt-4 md:pt-0">
        <Flame className="w-16 h-16 sm:w-20 sm:h-20 stroke-[1.2]" />
        <Dumbbell className="w-12 h-12 sm:w-14 sm:h-14 stroke-[1.2]" />
      </div>
    </Card>
  );
};

