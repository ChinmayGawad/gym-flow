import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Calendar,
  Clock,
  Dumbbell,
  Sparkles,
  Check,
  Zap,
  ArrowRight,
  Flame,
  FileText,
  AlertCircle,
  Users,
} from 'lucide-react';
import { API_BASE } from '@/lib/api-config';
import { HourlyForecastSlot } from '@/types/occupancy';

interface PlanVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialHour?: number;
  initialDate?: string;
  onSuccess?: () => void;
  forecastSlots?: HourlyForecastSlot[];
}

const WORKOUT_SPLITS = [
  { id: 'chest_tri', label: 'Chest & Triceps', icon: Dumbbell },
  { id: 'back_bi', label: 'Back & Biceps', icon: Zap },
  { id: 'legs', label: 'Legs & Glutes', icon: Flame },
  { id: 'shoulders', label: 'Shoulders & Arms', icon: Dumbbell },
  { id: 'fullbody', label: 'Full Body Strength', icon: Sparkles },
  { id: 'cardio', label: 'HIIT & Cardio', icon: Flame },
  { id: 'mobility', label: 'Mobility & Core', icon: Sparkles },
  { id: 'general', label: 'General Workout', icon: Dumbbell },
];

const TIME_SLOTS = [
  { hour: 6, label: '6:00 AM' },
  { hour: 7, label: '7:00 AM' },
  { hour: 8, label: '8:00 AM' },
  { hour: 9, label: '9:00 AM' },
  { hour: 10, label: '10:00 AM' },
  { hour: 11, label: '11:00 AM' },
  { hour: 12, label: '12:00 PM' },
  { hour: 13, label: '1:00 PM' },
  { hour: 14, label: '2:00 PM' },
  { hour: 15, label: '3:00 PM' },
  { hour: 16, label: '4:00 PM' },
  { hour: 17, label: '5:00 PM' },
  { hour: 18, label: '6:00 PM' },
  { hour: 19, label: '7:00 PM' },
  { hour: 20, label: '8:00 PM' },
  { hour: 21, label: '9:00 PM' },
  { hour: 22, label: '10:00 PM' },
];

export const PlanVisitModal: React.FC<PlanVisitModalProps> = ({
  isOpen,
  onClose,
  initialHour = 11,
  initialDate,
  onSuccess,
  forecastSlots = [],
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(initialDate || todayStr);
  const [selectedHour, setSelectedHour] = useState<number>(initialHour);
  const [workoutFocus, setWorkoutFocus] = useState<string>('Chest & Triceps');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialHour) setSelectedHour(initialHour);
    if (initialDate) setSelectedDate(initialDate);
  }, [initialHour, initialDate, isOpen]);

  const selectedSlot = TIME_SLOTS.find((s) => s.hour === selectedHour) || TIME_SLOTS[5];
  const currentSlotForecast = forecastSlots.find((s) => s.hour24 === selectedHour);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${API_BASE}/api/gym/planned-visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          scheduledDate: selectedDate,
          timeSlot: selectedSlot.label,
          hour24: selectedHour,
          workoutFocus,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to schedule visit.');
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while scheduling your visit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[540px] p-6 max-h-[90vh] overflow-y-auto bg-white dark:bg-[#131418] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl shadow-2xl">
        <DialogHeader className="flex flex-col items-center text-center">
          <div className="w-11 h-11 rounded-2xl bg-zinc-900 dark:bg-zinc-800 text-white flex items-center justify-center shadow-xs mx-auto mb-2">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <DialogTitle className="text-lg sm:text-xl font-black tracking-tight text-zinc-900 dark:text-white">
            Plan Your Gym Visit
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Declare your workout time slot to calibrate crowd forecasting and check wait times.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* 1. Date Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">
              1. Select Date
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                  selectedDate === todayStr
                    ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white shadow-xs'
                    : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                Today ({new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })})
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(tomorrowStr)}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                  selectedDate === tomorrowStr
                    ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white shadow-xs'
                    : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                Tomorrow ({tomorrow.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })})
              </button>
            </div>
          </div>

          {/* 2. Hourly Time Slot Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">
                2. Target Time Slot
              </label>
              <span className="text-xs font-extrabold text-zinc-900 dark:text-white flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                {selectedSlot.label}
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
              {TIME_SLOTS.map((slot) => {
                const isSelected = selectedHour === slot.hour;
                const slotData = forecastSlots.find((s) => s.hour24 === slot.hour);
                const plannedCount = slotData?.plannedCount || 0;

                return (
                  <button
                    key={slot.hour}
                    type="button"
                    onClick={() => setSelectedHour(slot.hour)}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-zinc-900 dark:border-white bg-zinc-900/[0.05] dark:bg-white/[0.08] ring-1 ring-zinc-900 dark:ring-white'
                        : 'border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-zinc-900 dark:text-white tabular-nums">
                        {slot.label}
                      </span>
                      {isSelected && (
                        <Check className="w-3 h-3 text-zinc-900 dark:text-white stroke-[3]" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-zinc-400 dark:text-zinc-500">
                      <Users className="w-2.5 h-2.5" />
                      <span>{plannedCount} planned</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slot Forecast Preview Pill */}
          {currentSlotForecast && (
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900/80 rounded-xl border border-zinc-200/70 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-zinc-900 dark:text-white">
                  {selectedSlot.label} Forecast
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                <span>~{currentSlotForecast.predictedCount} people expected</span>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  {currentSlotForecast.waitTime} wait
                </span>
              </div>
            </div>
          )}

          {/* 3. Workout Focus Tags */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">
              3. Workout Focus
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {WORKOUT_SPLITS.map((split) => {
                const Icon = split.icon;
                const isSelected = workoutFocus === split.label;
                return (
                  <button
                    key={split.id}
                    type="button"
                    onClick={() => setWorkoutFocus(split.label)}
                    className={`p-2 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer flex items-center gap-2 ${
                      isSelected
                        ? 'border-zinc-900 dark:border-white bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                        : 'border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{split.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Notes (Optional) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">
                4. Session Notes (Optional)
              </label>
            </div>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="e.g. Heavy squats, aim for 60 min session..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl border-zinc-200 dark:border-zinc-700"
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 font-bold text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>{isSubmitting ? 'Scheduling...' : `Confirm Visit for ${selectedSlot.label}`}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
