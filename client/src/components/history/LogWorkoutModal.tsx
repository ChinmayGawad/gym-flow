import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dumbbell,
  Flame,
  Clock,
  Check,
  X,
  Zap,
  Heart,
  Activity,
  Sparkles,
} from 'lucide-react';

export interface WorkoutLogData {
  workoutType: string;
  durationMinutes: number;
  calories: number;
  notes?: string;
}

interface LogWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: WorkoutLogData) => void;
}

interface WorkoutCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  calorieRatePerMin: number;
  description: string;
}

const WORKOUT_PRESETS: { category: string; items: WorkoutCategory[] }[] = [
  {
    category: 'Strength & Hypertrophy',
    items: [
      {
        id: 'push',
        name: 'Push Day (Chest, Shoulders & Triceps)',
        icon: <Dumbbell className="w-4 h-4 text-emerald-600" />,
        calorieRatePerMin: 6.2,
        description: 'Bench press, incline dumbbells, lateral raises, dips',
      },
      {
        id: 'pull',
        name: 'Pull Day (Back, Traps & Biceps)',
        icon: <Dumbbell className="w-4 h-4 text-blue-600" />,
        calorieRatePerMin: 6.0,
        description: 'Deadlifts, lat pulldowns, barbell rows, curls',
      },
      {
        id: 'legs',
        name: 'Legs & Calves (Quads & Hamstrings)',
        icon: <Zap className="w-4 h-4 text-orange-600" />,
        calorieRatePerMin: 7.5,
        description: 'Squats, leg press, Romanian deadlifts, lunges',
      },
      {
        id: 'upper',
        name: 'Upper Body Power & Arms',
        icon: <Dumbbell className="w-4 h-4 text-purple-600" />,
        calorieRatePerMin: 5.8,
        description: 'Overhead press, pull-ups, arm supersets',
      },
      {
        id: 'fullbody',
        name: 'Full Body Compound Strength',
        icon: <Activity className="w-4 h-4 text-indigo-600" />,
        calorieRatePerMin: 6.8,
        description: 'Squat, bench, row, clean & press circuit',
      },
      {
        id: 'core',
        name: 'Core & Abs Conditioning',
        icon: <Flame className="w-4 h-4 text-amber-600" />,
        calorieRatePerMin: 5.0,
        description: 'Hanging leg raises, planks, ab rollout, cables',
      },
    ],
  },
  {
    category: 'Cardio & Conditioning',
    items: [
      {
        id: 'cardio',
        name: 'Treadmill & Cardio Endurance',
        icon: <Heart className="w-4 h-4 text-rose-600" />,
        calorieRatePerMin: 8.5,
        description: 'Incline treadmill, stairmaster, rowing machine',
      },
      {
        id: 'hiit',
        name: 'HIIT & Functional Circuit',
        icon: <Flame className="w-4 h-4 text-red-600" />,
        calorieRatePerMin: 9.5,
        description: 'Kettlebells, battle ropes, box jumps, burpees',
      },
      {
        id: 'cycling',
        name: 'Spinning & Stationary Bike',
        icon: <Zap className="w-4 h-4 text-cyan-600" />,
        calorieRatePerMin: 8.0,
        description: 'High-resistance interval spin session',
      },
    ],
  },
  {
    category: 'Mobility & Others',
    items: [
      {
        id: 'yoga',
        name: 'Mobility, Yoga & Active Recovery',
        icon: <Sparkles className="w-4 h-4 text-teal-600" />,
        calorieRatePerMin: 3.5,
        description: 'Dynamic stretching, foam rolling, yoga flow',
      },
      {
        id: 'custom',
        name: 'Custom Workout Routine',
        icon: <Activity className="w-4 h-4 text-gray-700" />,
        calorieRatePerMin: 6.0,
        description: 'Specify your own custom routine title below',
      },
    ],
  },
];

const DURATION_OPTIONS = [30, 45, 60, 75, 90, 120];

export const LogWorkoutModal: React.FC<LogWorkoutModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [selectedId, setSelectedId] = useState<string>('push');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [duration, setDuration] = useState<number>(60);
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  // Find active preset
  let activePreset: WorkoutCategory | undefined;
  for (const group of WORKOUT_PRESETS) {
    const found = group.items.find((i) => i.id === selectedId);
    if (found) {
      activePreset = found;
      break;
    }
  }

  // Calculate estimated calories
  const calorieRate = activePreset?.calorieRatePerMin || 6.0;
  const estimatedCalories = Math.round(duration * calorieRate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalTitle = activePreset?.name || 'General Strength Workout';
    if (selectedId === 'custom' && customTitle.trim()) {
      finalTitle = customTitle.trim();
    }

    onSave({
      workoutType: finalTitle,
      durationMinutes: duration,
      calories: estimatedCalories,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#dedede] overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-[#eeeeee] flex items-center justify-between bg-[#fafafa]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gym-dark text-white flex items-center justify-center shadow-sm">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-gym-dark">
                Log Workout Check-In
              </h3>
              <p className="text-xs text-gym-subtle font-medium">
                Select your workout routine, duration, and estimated calories burned.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gym-subtle hover:text-gym-dark hover:bg-[#eaeaea] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {/* 1. Workout Routine Split Selection */}
          <div className="space-y-3">
            <label className="text-xs font-extrabold text-gym-dark uppercase tracking-wider block">
              1. Select Workout Routine Split
            </label>

            <div className="space-y-4">
              {WORKOUT_PRESETS.map((group) => (
                <div key={group.category} className="space-y-2">
                  <span className="text-[11px] font-bold text-gym-subtle uppercase tracking-wider block">
                    {group.category}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.items.map((item) => {
                      const isSelected = selectedId === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedId(item.id)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-150 relative ${
                            isSelected
                              ? 'border-gym-dark bg-[#f5f5f5] shadow-xs ring-1 ring-gym-dark'
                              : 'border-[#e5e5e5] bg-white hover:border-[#ccc] hover:bg-[#fafafa]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {item.icon}
                              <span className="text-xs font-bold text-gym-dark leading-tight">
                                {item.name.split(' (')[0]}
                              </span>
                            </div>
                            {isSelected && (
                              <span className="w-4 h-4 rounded-full bg-gym-dark text-white flex items-center justify-center shrink-0">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </span>
                            )}
                          </div>
                          <p className="text-[10.5px] text-gym-subtle mt-1 leading-snug">
                            {item.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Custom routine text input if custom selected */}
            {selectedId === 'custom' && (
              <div className="pt-2 animate-in fade-in">
                <input
                  type="text"
                  placeholder="Enter custom routine name (e.g., Kettlebell Complex)"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-[#dedede] focus:outline-hidden focus:border-gym-dark font-medium"
                  required
                />
              </div>
            )}
          </div>

          {/* 2. Duration Selector */}
          <div className="space-y-2.5 pt-2 border-t border-[#f0f0f0]">
            <label className="text-xs font-extrabold text-gym-dark uppercase tracking-wider block">
              2. Workout Session Duration
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {DURATION_OPTIONS.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDuration(mins)}
                  className={`py-2 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    duration === mins
                      ? 'bg-gym-dark text-white shadow-sm'
                      : 'bg-[#f0f0f0] text-gym-dark hover:bg-[#e4e4e4]'
                  }`}
                >
                  {mins} mins
                </button>
              ))}
            </div>
          </div>

          {/* 3. Estimated Calorie Calculation Banner */}
          <div className="p-4 rounded-xl bg-[#fafafa] border border-[#e8e8e8] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gym-subtle uppercase tracking-wider block">
                  ESTIMATED BURN
                </span>
                <span className="text-lg font-black text-gym-dark leading-tight">
                  ~{estimatedCalories} kcal
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-gym-subtle uppercase tracking-wider block">
                DURATION
              </span>
              <span className="text-xs font-bold text-gym-dark flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {Math.floor(duration / 60) > 0 ? `${Math.floor(duration / 60)}h ` : ''}
                {duration % 60 > 0 ? `${duration % 60}m` : ''}
              </span>
            </div>
          </div>

          {/* 4. Optional Workout Notes */}
          <div className="space-y-1.5 pt-2 border-t border-[#f0f0f0]">
            <label className="text-xs font-extrabold text-gym-dark uppercase tracking-wider block">
              3. Session Notes & PRs <span className="text-gym-subtle font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Hit 100kg Bench PR, 4x10 Barbell Squats"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-[#dedede] focus:outline-hidden focus:border-gym-dark font-medium"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-[#eeeeee] flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 px-4 rounded-lg text-xs font-bold border-[#dedede] text-gym-dark hover:bg-[#f0f0f0]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-10 px-6 rounded-lg bg-gym-dark hover:bg-[#333333] text-white text-xs font-bold shadow-sm"
            >
              Save Workout Log
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
