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
  Zap,
  Clock,
  Calendar,
  Check,
  ArrowRight,
  AlertCircle,
  Dumbbell,
  Layers,
} from 'lucide-react';
import { API_BASE } from '@/lib/api-config';

interface DumbbellCableBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetHour: number;
  onSuccess?: () => void;
}

const FREEWEIGHT_STATIONS = [
  { id: 'cable-tower', name: 'Dual Cable Station', type: 'Adjustable Pulleys & Attachments', bestFor: 'Flyes, Curls & Triceps' },
  { id: 'incline-bench', name: 'Adjustable DB Bench 1', type: 'Commercial Flat / Incline Bench', bestFor: 'DB Presses & Rows' },
  { id: 'preacher-bench', name: 'Preacher Curl Bench', type: 'Isolated Arm Station', bestFor: 'Bicep Concentration' },
  { id: 'lat-pulldown', name: 'Lat Pulldown & Low Row', type: 'Cable Back Station', bestFor: 'Back & Scapular Rows' },
];

const WEIGHT_TARGETS = ['Light / Hypertrophy (5–15 kg)', 'Moderate Compound (17.5–30 kg)', 'Heavy DB Volume (32.5–50 kg)', 'Bodyweight + Cable'];
const DURATION_OPTIONS = ['30 min', '45 min', '60 min', '75 min'];

export const DumbbellCableBookingModal: React.FC<DumbbellCableBookingModalProps> = ({
  isOpen,
  onClose,
  targetHour,
  onSuccess,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedStation, setSelectedStation] = useState<string>(FREEWEIGHT_STATIONS[0].id);
  const [selectedWeight, setSelectedWeight] = useState<string>(WEIGHT_TARGETS[1]);
  const [duration, setDuration] = useState<string>('45 min');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const timeLabel = targetHour > 12 ? `${targetHour - 12}:00 PM` : `${targetHour}:00 AM`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const stationObj = FREEWEIGHT_STATIONS.find((s) => s.id === selectedStation);

    try {
      const res = await fetch(`${API_BASE}/api/gym/planned-visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          scheduledDate: selectedDate,
          timeSlot: timeLabel,
          hour24: targetHour,
          workoutFocus: `Free Weights & Cables (${stationObj?.name}) - ${selectedWeight}`,
          notes: `Duration: ${duration}. ${notes}`.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to book free weight station.');

      try {
        const bc = new BroadcastChannel('gymflow_realtime_sync');
        bc.postMessage({ type: 'GYM_VISIT_PLANNED', scheduledDate: selectedDate });
        bc.close();
      } catch {}

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while reserving equipment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[520px] p-6 max-h-[90vh] overflow-y-auto bg-white dark:bg-[#131418] border border-emerald-500/20 rounded-2xl shadow-2xl">
        <DialogHeader className="flex flex-col items-center text-center">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs mx-auto mb-2">
            <Zap className="w-6 h-6" />
          </div>
          <DialogTitle className="text-lg sm:text-xl font-black tracking-tight text-zinc-900 dark:text-white">
            Book Dumbbells & Cable Station
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Reserve adjustable benches, cable cross towers, or free weight stations for {timeLabel}.
          </DialogDescription>
        </DialogHeader>

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

          {/* 2. Free Weight Station Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
              2. Select Free Weight / Cable Station
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FREEWEIGHT_STATIONS.map((station) => {
                const isSelected = selectedStation === station.id;
                return (
                  <button
                    key={station.id}
                    type="button"
                    onClick={() => setSelectedStation(station.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 ring-1 ring-emerald-500 text-zinc-900 dark:text-white'
                        : 'border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">{station.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                    </div>
                    <span className="text-[10px] text-zinc-400 font-medium truncate mt-0.5">{station.type}</span>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                      {station.bestFor}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Weight Bracket Target */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
              3. Weight & Training Split
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {WEIGHT_TARGETS.map((target) => (
                <button
                  key={target}
                  type="button"
                  onClick={() => setSelectedWeight(target)}
                  className={`p-2 text-xs font-bold rounded-xl border transition-all cursor-pointer text-left ${
                    selectedWeight === target
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-xs'
                      : 'bg-zinc-50 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 border-zinc-200/70 dark:border-zinc-800'
                  }`}
                >
                  {target}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Target Duration */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
              4. Session Duration
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {DURATION_OPTIONS.map((dur) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => setDuration(dur)}
                  className={`py-1.5 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                    duration === dur
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
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
              placeholder="e.g. Chest DB flyes, tricep pushdowns, drop sets..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-9 text-xs rounded-xl border-zinc-200 dark:border-zinc-700"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>{isSubmitting ? 'Reserving Station...' : `Confirm Station for ${timeLabel}`}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
