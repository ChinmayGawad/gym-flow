import React, { useState } from 'react';
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
  Flame,
  Clock,
  Calendar,
  Check,
  ArrowRight,
  AlertCircle,
  Dumbbell,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { API_BASE } from '@/lib/api-config';

interface PowerRackBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetHour: number;
  capacity?: number;
  onSuccess?: () => void;
}

const RACK_STATIONS = [
  { id: 'rack-1', name: 'Platform 1', type: 'Eleiko Olympic Power Cage', recommendedFor: 'Squats & Bench' },
  { id: 'rack-2', name: 'Platform 2', type: 'Rogue Monster Barbell Rack', recommendedFor: 'Heavy Squats' },
  { id: 'rack-3', name: 'Platform 3', type: 'Deadlift Wood Platform', recommendedFor: 'Deadlifts & Cleans' },
  { id: 'rack-4', name: 'Platform 4', type: 'Multi-Grip Squat Station', recommendedFor: 'Overhead Press' },
];

const DURATION_OPTIONS = ['30 min', '45 min', '60 min', '75 min'];

export const PowerRackBookingModal: React.FC<PowerRackBookingModalProps> = ({
  isOpen,
  onClose,
  targetHour,
  capacity = 30,
  onSuccess,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedStation, setSelectedStation] = useState<string>(RACK_STATIONS[0].id);
  const [exerciseFocus, setExerciseFocus] = useState<string>('Barbell Back Squats');
  const [duration, setDuration] = useState<string>('45 min');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const timeLabel = targetHour > 12 ? `${targetHour - 12}:00 PM` : `${targetHour}:00 AM`;
  const isPeakHour = targetHour >= 17 && targetHour <= 20;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const stationObj = RACK_STATIONS.find((s) => s.id === selectedStation);

    try {
      const res = await fetch(`${API_BASE}/api/gym/planned-visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          scheduledDate: selectedDate,
          timeSlot: timeLabel,
          hour24: targetHour,
          workoutFocus: `Power Rack (${stationObj?.name}) - ${exerciseFocus}`,
          notes: `Duration: ${duration}. ${notes}`.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to book power rack station.');

      try {
        const bc = new BroadcastChannel('gymflow_realtime_sync');
        bc.postMessage({ type: 'GYM_VISIT_PLANNED', scheduledDate: selectedDate });
        bc.close();
      } catch {}

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while reserving power rack.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[520px] p-6 max-h-[90vh] overflow-y-auto bg-white dark:bg-[#131418] border border-rose-500/20 rounded-2xl shadow-2xl">
        <DialogHeader className="flex flex-col items-center text-center">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs mx-auto mb-2">
            <Flame className="w-6 h-6" />
          </div>
          <DialogTitle className="text-lg sm:text-xl font-black tracking-tight text-zinc-900 dark:text-white">
            Reserve Power Rack / Squat Platform
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Book an Olympic barbell station for {timeLabel} to reserve your compound lifting spot.
          </DialogDescription>
        </DialogHeader>

        {isPeakHour && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center gap-2.5 text-xs text-rose-800 dark:text-rose-300 font-semibold">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>High evening demand window. Booking in advance prioritizes your rack queue.</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* 1. Date Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
              1. Training Date & Time
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  selectedDate === todayStr
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                    : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                }`}
              >
                Today ({timeLabel})
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(tomorrowStr)}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  selectedDate === tomorrowStr
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                    : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                }`}
              >
                Tomorrow ({timeLabel})
              </button>
            </div>
          </div>

          {/* 2. Platform Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
              2. Select Barbell Station
            </label>
            <div className="grid grid-cols-2 gap-2">
              {RACK_STATIONS.map((station) => {
                const isSelected = selectedStation === station.id;
                return (
                  <button
                    key={station.id}
                    type="button"
                    onClick={() => setSelectedStation(station.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/40 ring-1 ring-rose-500 text-zinc-900 dark:text-white'
                        : 'border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">{station.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}
                    </div>
                    <span className="text-[10px] text-zinc-400 font-medium truncate mt-0.5">{station.type}</span>
                    <span className="text-[9px] text-rose-600 dark:text-rose-400 font-semibold mt-1">
                      Best: {station.recommendedFor}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Compound Lift Focus */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
              3. Primary Compound Lift
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {['Barbell Back Squats', 'Conventional Deadlifts', 'Flat Barbell Bench', 'Overhead Strict Press'].map((lift) => (
                <button
                  key={lift}
                  type="button"
                  onClick={() => setExerciseFocus(lift)}
                  className={`p-2 text-xs font-bold rounded-xl border transition-all cursor-pointer text-left ${
                    exerciseFocus === lift
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-xs'
                      : 'bg-zinc-50 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 border-zinc-200/70 dark:border-zinc-800'
                  }`}
                >
                  {lift}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Session Duration */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
              4. Target Rack Time
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {DURATION_OPTIONS.map((dur) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => setDuration(dur)}
                  className={`py-1.5 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                    duration === dur
                      ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                      : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  {dur}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Custom Notes */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
              5. Session Notes (Optional)
            </label>
            <Input
              type="text"
              placeholder="e.g. Aiming for 5x5 heavy sets, need chalk..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-9 text-xs rounded-xl border-zinc-200 dark:border-zinc-700"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>{isSubmitting ? 'Reserving Station...' : `Confirm Power Rack for ${timeLabel}`}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
