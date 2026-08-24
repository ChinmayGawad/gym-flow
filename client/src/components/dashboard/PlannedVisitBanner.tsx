import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  Dumbbell,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  X,
  RotateCcw,
} from 'lucide-react';
import { PlannedVisit } from '@/types/occupancy';

interface PlannedVisitBannerProps {
  userPlannedVisit?: PlannedVisit | null;
  optimalRange?: string;
  onOpenPlanModal: (hour?: number) => void;
  onCancelVisit?: (id: string) => Promise<void | boolean>;
  onCheckIn?: () => Promise<any>;
  isCheckedInSelf?: boolean;
  isLoading?: boolean;
}

export const PlannedVisitBanner: React.FC<PlannedVisitBannerProps> = ({
  userPlannedVisit,
  optimalRange = '10:00 AM – 11:30 AM',
  onOpenPlanModal,
  onCancelVisit,
  onCheckIn,
  isCheckedInSelf = false,
  isLoading = false,
}) => {
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    if (!userPlannedVisit?.id || !onCancelVisit) return;
    setIsCancelling(true);
    try {
      await onCancelVisit(userPlannedVisit.id);
    } finally {
      setIsCancelling(false);
    }
  };

  if (userPlannedVisit) {
    return (
      <Card className="p-5 sm:p-6 bg-gradient-to-br from-white to-zinc-50 dark:from-[#131418] dark:to-[#171920] border border-black/[0.08] dark:border-white/[0.08] shadow-card rounded-2xl relative overflow-hidden flex flex-col justify-between">
        {/* Subtle accent corner glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shadow-xs shrink-0 mt-0.5">
              <Calendar className="w-5 h-5 stroke-[2.25]" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold tracking-widest text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60 uppercase">
                  Confirmed Session
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                  {userPlannedVisit.scheduledDate}
                </span>
              </div>

              <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">
                Scheduled for {userPlannedVisit.timeSlot}
              </h3>

              <div className="flex items-center gap-2 flex-wrap text-xs text-zinc-600 dark:text-zinc-300 font-medium pt-0.5">
                <span className="inline-flex items-center gap-1.5 font-bold text-zinc-900 dark:text-white">
                  <Dumbbell className="w-3.5 h-3.5 text-zinc-500" />
                  {userPlannedVisit.workoutFocus || 'General Workout'}
                </span>
                {userPlannedVisit.notes && (
                  <>
                    <span className="text-zinc-300 dark:text-zinc-700">•</span>
                    <span className="text-zinc-500 italic max-w-[200px] sm:max-w-xs truncate">
                      "{userPlannedVisit.notes}"
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end pt-2 sm:pt-0">
            {!isCheckedInSelf && onCheckIn && (
              <Button
                onClick={onCheckIn}
                disabled={isLoading}
                className="h-9 px-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 font-bold text-xs shadow-xs gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                <span>Check In</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenPlanModal(userPlannedVisit.hour24)}
              className="h-9 px-3 rounded-xl border-zinc-200 dark:border-zinc-700 text-xs font-bold gap-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reschedule</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isCancelling}
              className="h-9 w-9 p-0 rounded-xl text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
              title="Cancel visit schedule"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // State B: Prompt to schedule a visit slot
  return (
    <Card className="p-5 sm:p-6 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-black/[0.12] dark:hover:border-white/[0.15] transition-all">
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white flex items-center justify-center shadow-xs shrink-0">
          <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase">
              PLANNED VISIT INTENT
            </span>
            <Badge variant="low" dot className="text-[9px] px-1.5 py-0">
              Forecasting
            </Badge>
          </div>
          <h3 className="text-base font-black text-zinc-900 dark:text-white mt-0.5 tracking-tight">
            Planning to workout today?
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
            Declare your time slot to calibrate crowd forecast. Recommended: <span className="font-bold text-emerald-700 dark:text-emerald-400">{optimalRange}</span>.
          </p>
        </div>
      </div>

      <Button
        onClick={() => onOpenPlanModal(11)}
        className="w-full sm:w-auto h-9.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 font-bold text-xs shadow-xs gap-2 shrink-0 cursor-pointer"
      >
        <span>Plan Today's Visit</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Button>
    </Card>
  );
};
