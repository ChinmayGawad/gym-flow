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
  Sparkles,
  ArrowRight,
  AlertCircle,
  Dumbbell,
  Check,
} from 'lucide-react';
import { API_BASE } from '@/lib/api-config';
import { HourlyForecastSlot } from '@/types/occupancy';

interface PlanVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialHour?: number;
  initialExactTime?: string;
  initialDate?: string;
  initialWorkoutFocus?: string;
  onSuccess?: () => void;
  forecastSlots?: HourlyForecastSlot[];
}

const QUICK_TIME_PRESETS = [
  { hour: 7, minute: '00', label: '7:00 AM' },
  { hour: 11, minute: '00', label: '11:00 AM ★' },
  { hour: 17, minute: '30', label: '5:30 PM' },
  { hour: 18, minute: '00', label: '6:00 PM' },
  { hour: 20, minute: '30', label: '8:30 PM' },
];

const WORKOUT_OPTIONS = [
  'General Workout & Conditioning',
  'Chest & Triceps (Push)',
  'Back & Biceps (Pull)',
  'Legs, Squats & Glutes',
  'Shoulders & Arms',
  'HIIT & Cardio Suite',
  'Sauna & Recovery Session',
];

const MINUTE_OPTIONS = ['00', '15', '30', '45'];

export const PlanVisitModal: React.FC<PlanVisitModalProps> = ({
  isOpen,
  onClose,
  initialHour = 11,
  initialExactTime,
  initialDate,
  initialWorkoutFocus,
  onSuccess,
  forecastSlots = [],
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(initialDate || todayStr);
  const [selectedHour, setSelectedHour] = useState<number>(initialHour);
  const [selectedMinute, setSelectedMinute] = useState<string>('00');
  const [workoutFocus, setWorkoutFocus] = useState<string>(
    initialWorkoutFocus || WORKOUT_OPTIONS[0]
  );
  const [showNotes, setShowNotes] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Parse initialExactTime if provided (e.g. "5:30 PM")
  useEffect(() => {
    if (initialExactTime) {
      const match = initialExactTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (match) {
        let h = parseInt(match[1], 10);
        const m = match[2];
        const ampm = match[3].toUpperCase();
        if (ampm === 'PM' && h < 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
        setSelectedHour(h);
        setSelectedMinute(m);
      }
    } else if (initialHour) {
      setSelectedHour(initialHour);
      setSelectedMinute('00');
    }
    if (initialDate) setSelectedDate(initialDate);
    if (initialWorkoutFocus) setWorkoutFocus(initialWorkoutFocus);
  }, [initialHour, initialExactTime, initialDate, initialWorkoutFocus, isOpen]);

  // Derived formatted exact time label (e.g. "5:30 PM")
  const formatTimeLabel = (h: number, m: string) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    return `${displayHour}:${m} ${period}`;
  };

  const exactTimeLabel = formatTimeLabel(selectedHour, selectedMinute);
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
          timeSlot: exactTimeLabel,
          hour24: selectedHour,
          workoutFocus,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to schedule visit.');
      }

      try {
        const bc = new BroadcastChannel('gymflow_realtime_sync');
        bc.postMessage({ type: 'GYM_VISIT_PLANNED', scheduledDate: selectedDate });
        bc.close();
      } catch {}

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

  const isPeak = selectedHour >= 17 && selectedHour <= 19;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[440px] p-6 bg-white dark:bg-[#131418] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl shadow-2xl">
        <DialogHeader className="text-left pb-1">
          <DialogTitle className="text-lg font-black tracking-tight text-zinc-900 dark:text-white">
            Plan Your Gym Visit
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            Declare your arrival time to calibrate live crowd forecasting.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* 1. Date Switcher */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
              Date
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                  selectedDate === todayStr
                    ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white shadow-xs'
                    : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(tomorrowStr)}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                  selectedDate === tomorrowStr
                    ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white shadow-xs'
                    : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                Tomorrow
              </button>
            </div>
          </div>

          {/* 2. Arrival Time: Hour + Minute Dropdowns & Quick Pills */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
              Arrival Time
            </label>

            {/* Hour and Minute Selectors */}
            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedHour}
                onChange={(e) => setSelectedHour(parseInt(e.target.value, 10))}
                className="h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs font-bold text-zinc-900 dark:text-white px-3 cursor-pointer"
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

              <div className="grid grid-cols-4 gap-1">
                {MINUTE_OPTIONS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMinute(m)}
                    className={`h-10 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                      selectedMinute === m
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-xs'
                        : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    :{m}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Time Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5">
              {QUICK_TIME_PRESETS.map((preset) => {
                const isSelected = selectedHour === preset.hour && selectedMinute === preset.minute;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setSelectedHour(preset.hour);
                      setSelectedMinute(preset.minute);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 shadow-2xs'
                        : 'bg-zinc-50 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 border-zinc-200/60 dark:border-zinc-800 hover:border-zinc-400'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Workout Focus (Clean Dropdown) */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
              Workout Focus
            </label>
            <select
              value={workoutFocus}
              onChange={(e) => setWorkoutFocus(e.target.value)}
              className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs font-bold text-zinc-900 dark:text-white px-3 cursor-pointer"
            >
              {WORKOUT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Live Crowd Single-Line Indicator */}
          <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/70 dark:border-zinc-800 flex items-center justify-between text-xs font-medium">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isPeak ? 'bg-rose-500' : 'bg-emerald-500'}`} />
              <span className="text-zinc-800 dark:text-zinc-200 font-bold">
                {exactTimeLabel}:
              </span>
              <span className="text-zinc-500 dark:text-zinc-400">
                ~{currentSlotForecast?.predictedCount || 6} people expected
              </span>
            </div>
            <span className={`font-extrabold ${isPeak ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {currentSlotForecast?.waitTime || '0–5 min wait'}
            </span>
          </div>

          {/* Optional Notes Link */}
          {!showNotes ? (
            <button
              type="button"
              onClick={() => setShowNotes(true)}
              className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer block"
            >
              + Add session note (optional)
            </button>
          ) : (
            <div className="space-y-1">
              <Input
                type="text"
                placeholder="e.g. Heavy squats, aim for 60m session..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-9 text-xs rounded-xl border-zinc-200 dark:border-zinc-700"
              />
            </div>
          )}

          {/* Single Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 font-extrabold text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer mt-1"
          >
            <span>{isSubmitting ? 'Confirming...' : `Confirm Visit for ${exactTimeLabel}`}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
