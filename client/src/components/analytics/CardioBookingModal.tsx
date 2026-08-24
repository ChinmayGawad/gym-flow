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
  Activity,
  Clock,
  Calendar,
  Check,
  ArrowRight,
  AlertCircle,
  Zap,
  Heart,
} from 'lucide-react';
import { API_BASE } from '@/lib/api-config';

interface CardioBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetHour: number;
  onSuccess?: () => void;
}

const CARDIO_MACHINES = [
  { id: 'treadmill', name: 'Incline Treadmill', type: 'Matrix Incline Runner', rate: '~10 kcal/min' },
  { id: 'stair', name: 'StairMaster Climber', type: 'High Intensity Gauntlet', rate: '~12 kcal/min' },
  { id: 'rower', name: 'Concept2 Hydro Rower', type: 'Full Body Ergometer', rate: '~9 kcal/min' },
  { id: 'bike', name: 'Assault AirBike', type: 'HIIT Aerobic Bike', rate: '~11 kcal/min' },
];

const CARDIO_PROGRAMS = ['Steady State Zone 2', 'HIIT Sprints (30s on / 30s off)', 'Incline Hill Walk (12-3-30)', 'Endurance 5K Pace'];
const DURATION_OPTIONS = ['20 min', '30 min', '45 min', '60 min'];

export const CardioBookingModal: React.FC<CardioBookingModalProps> = ({
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
  const [selectedMachine, setSelectedMachine] = useState<string>(CARDIO_MACHINES[0].id);
  const [selectedProgram, setSelectedProgram] = useState<string>(CARDIO_PROGRAMS[0]);
  const [duration, setDuration] = useState<string>('30 min');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const timeLabel = targetHour > 12 ? `${targetHour - 12}:00 PM` : `${targetHour}:00 AM`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const machineObj = CARDIO_MACHINES.find((m) => m.id === selectedMachine);

    try {
      const res = await fetch(`${API_BASE}/api/gym/planned-visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          scheduledDate: selectedDate,
          timeSlot: timeLabel,
          hour24: targetHour,
          workoutFocus: `Cardio Suite (${machineObj?.name}) - ${selectedProgram}`,
          notes: `Duration: ${duration}. ${notes}`.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to book cardio station.');

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while reserving cardio machine.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[520px] p-6 max-h-[90vh] overflow-y-auto bg-white dark:bg-[#131418] border border-blue-500/20 rounded-2xl shadow-2xl">
        <DialogHeader className="flex flex-col items-center text-center">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs mx-auto mb-2">
            <Activity className="w-6 h-6" />
          </div>
          <DialogTitle className="text-lg sm:text-xl font-black tracking-tight text-zinc-900 dark:text-white">
            Book Cardio Machine & Runner
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Reserve your treadmill, stairmaster, or row station for {timeLabel}.
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
              1. Session Date
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

          {/* 2. Cardio Machine Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
              2. Select Cardio Unit
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CARDIO_MACHINES.map((machine) => {
                const isSelected = selectedMachine === machine.id;
                return (
                  <button
                    key={machine.id}
                    type="button"
                    onClick={() => setSelectedMachine(machine.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 ring-1 ring-blue-500 text-zinc-900 dark:text-white'
                        : 'border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">{machine.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                    </div>
                    <span className="text-[10px] text-zinc-400 font-medium truncate mt-0.5">{machine.type}</span>
                    <span className="text-[9px] text-blue-600 dark:text-blue-400 font-semibold mt-1">
                      Burn: {machine.rate}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Cardio Routine */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
              3. Routine / Cardio Focus
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {CARDIO_PROGRAMS.map((program) => (
                <button
                  key={program}
                  type="button"
                  onClick={() => setSelectedProgram(program)}
                  className={`p-2 text-xs font-bold rounded-xl border transition-all cursor-pointer text-left ${
                    selectedProgram === program
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-xs'
                      : 'bg-zinc-50 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 border-zinc-200/70 dark:border-zinc-800'
                  }`}
                >
                  {program}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Target Duration */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
              4. Target Duration
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {DURATION_OPTIONS.map((dur) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => setDuration(dur)}
                  className={`py-1.5 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                    duration === dur
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
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
              placeholder="e.g. Incline 12, speed 4.5, post-lift cooldown..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-9 text-xs rounded-xl border-zinc-200 dark:border-zinc-700"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>{isSubmitting ? 'Reserving Unit...' : `Confirm Cardio for ${timeLabel}`}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
