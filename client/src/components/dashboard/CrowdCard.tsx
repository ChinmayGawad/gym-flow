import React from 'react';
import { OccupancyData } from '@/types/occupancy';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dumbbell, Flame } from 'lucide-react';

interface CrowdCardProps {
  data: OccupancyData;
}

export const CrowdCard: React.FC<CrowdCardProps> = ({ data }) => {
  const { peopleCount, capacity, percentage, status } = data;

  const badgeVariant =
    status === 'LOW' ? 'low' : status === 'HIGH' ? 'high' : 'moderate';

  return (
    <Card className="p-7 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center min-h-[255px] bg-white border-[#dedede]">
      {/* Crowd Info Left Section */}
      <div className="w-full md:w-[58%]">
        <span className="text-[11px] font-bold tracking-wider text-gym-subtle uppercase block">
          CURRENT CROWD
        </span>

        <div className="flex items-baseline mt-1">
          <span className="text-[52px] leading-none font-extrabold tracking-tight text-gym-dark">
            {peopleCount}
          </span>
          <span className="text-2xl font-medium text-[#888] ml-1.5">
            / {capacity}
          </span>
        </div>

        <p className="text-gym-subtle text-sm mt-1 font-medium">
          People in Gym
        </p>

        {/* Status Pill Badge */}
        <div className="mt-3.5">
          <Badge variant={badgeVariant} dot className="px-3 py-1 text-[11px]">
            {status}
          </Badge>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="mt-5 w-full max-w-[300px]">
          <Progress value={percentage} className="h-[9px]" />
          <span className="text-xs text-gym-subtle font-medium block mt-2">
            {percentage}% Occupied
          </span>
        </div>
      </div>

      {/* Decorative Graphics Right Section */}
      <div className="hidden sm:flex w-full md:w-[260px] h-[140px] md:h-[160px] items-center justify-center gap-6 text-[#dddddd] mt-6 md:mt-0 border-t md:border-t-0 border-[#f0f0f0] pt-4 md:pt-0">
        <Flame className="w-16 h-16 sm:w-20 sm:h-20 stroke-[1.2]" />
        <Dumbbell className="w-12 h-12 sm:w-14 sm:h-14 stroke-[1.2]" />
      </div>
    </Card>
  );
};
