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
  Dumbbell,
  Flame,
  Clock,
  Check,
  Zap,
  Heart,
  Activity,
  Sparkles,
  FileText,
  Layers,
  ArrowRight,
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

interface WorkoutCategoryItem {
  id: string;
  name: string;
  shortName: string;
  category: 'strength' | 'cardio' | 'mobility';
  icon: React.ReactNode;
  iconBg: string;
  calorieRatePerMin: number;
  description: string;
  intensity: 'High' | 'Moderate' | 'Recovery';
}

const WORKOUT_ITEMS: WorkoutCategoryItem[] = [
  // Strength & Hypertrophy
  {
    id: 'push',
    name: 'Push Day (Chest, Shoulders & Triceps)',
    shortName: 'Push Day',
    category: 'strength',
    icon: <Dumbbell className="w-4 h-4 text-emerald-600" />,
    iconBg: 'bg-emerald-50 border-emerald-100',
    calorieRatePerMin: 6.2,
    description: 'Bench press, incline dumbbells, lateral raises, dips',
    intensity: 'Moderate',
  },
  {
    id: 'pull',
    name: 'Pull Day (Back, Traps & Biceps)',
    shortName: 'Pull Day',
    category: 'strength',
    icon: <Dumbbell className="w-4 h-4 text-blue-600" />,
    iconBg: 'bg-blue-50 border-blue-100',
    calorieRatePerMin: 6.0,
    description: 'Deadlifts, lat pulldowns, barbell rows, curls',
    intensity: 'Moderate',
  },
  {
    id: 'legs',
    name: 'Legs & Calves (Quads & Hamstrings)',
    shortName: 'Legs & Calves',
    category: 'strength',
    icon: <Zap className="w-4 h-4 text-orange-600" />,
    iconBg: 'bg-orange-50 border-orange-100',
    calorieRatePerMin: 7.5,
    description: 'Barbell squats, leg press, Romanian deadlifts',
    intensity: 'High',
  },
  {
    id: 'upper',
    name: 'Upper Body Power & Arms',
    shortName: 'Upper Body Power',
    category: 'strength',
    icon: <Dumbbell className="w-4 h-4 text-purple-600" />,
    iconBg: 'bg-purple-50 border-purple-100',
    calorieRatePerMin: 5.8,
    description: 'Overhead press, pull-ups, supersets',
    intensity: 'Moderate',
  },
  {
    id: 'fullbody',
    name: 'Full Body Compound Strength',
    shortName: 'Full Body Compound',
    category: 'strength',
    icon: <Activity className="w-4 h-4 text-indigo-600" />,
    iconBg: 'bg-indigo-50 border-indigo-100',
    calorieRatePerMin: 6.8,
    description: 'Squat, bench, row, clean & press circuit',
    intensity: 'High',
  },
  {
    id: 'core',
    name: 'Core & Abs Conditioning',
    shortName: 'Core & Abs',
    category: 'strength',
    icon: <Flame className="w-4 h-4 text-amber-600" />,
    iconBg: 'bg-amber-50 border-amber-100',
    calorieRatePerMin: 5.0,
    description: 'Hanging leg raises, planks, ab rollout',
    intensity: 'Moderate',
  },

  // Cardio & Conditioning
  {
    id: 'cardio',
    name: 'Treadmill & Cardio Endurance',
    shortName: 'Treadmill & Cardio',
    category: 'cardio',
    icon: <Heart className="w-4 h-4 text-rose-600" />,
    iconBg: 'bg-rose-50 border-rose-100',
    calorieRatePerMin: 8.5,
    description: 'Incline treadmill, stairmaster, rowing',
    intensity: 'High',
  },
  {
    id: 'hiit',
    name: 'HIIT & Functional Circuit',
    shortName: 'HIIT Circuit',
    category: 'cardio',
    icon: <Flame className="w-4 h-4 text-red-600" />,
    iconBg: 'bg-red-50 border-red-100',
    calorieRatePerMin: 9.5,
    description: 'Kettlebells, battle ropes, box jumps',
    intensity: 'High',
  },
  {
    id: 'cycling',
    name: 'Spinning & Stationary Bike',
    shortName: 'Spinning / Cycling',
    category: 'cardio',
    icon: <Zap className="w-4 h-4 text-cyan-600" />,
    iconBg: 'bg-cyan-50 border-cyan-100',
    calorieRatePerMin: 8.0,
    description: 'High-resistance interval spin session, sprints',
    intensity: 'High',
  },

  // Mobility & Custom
  {
    id: 'yoga',
    name: 'Mobility, Yoga & Active Recovery',
    shortName: 'Yoga & Mobility',
    category: 'mobility',
    icon: <Sparkles className="w-4 h-4 text-teal-600" />,
    iconBg: 'bg-teal-50 border-teal-100',
    calorieRatePerMin: 3.5,
    description: 'Dynamic stretching, foam rolling, yoga flow',
    intensity: 'Recovery',
  },
  {
    id: 'custom',
    name: 'Custom Workout Routine',
    shortName: 'Custom Routine',
    category: 'mobility',
    icon: <Activity className="w-4 h-4 text-zinc-700" />,
    iconBg: 'bg-zinc-100 border-zinc-200',
    calorieRatePerMin: 6.0,
    description: 'Specify your own custom routine title & notes',
    intensity: 'Moderate',
  },
];

const CATEGORY_TABS = [
  { id: 'all', label: 'All Splits', icon: Layers },
  { id: 'strength', label: 'Strength', icon: Dumbbell },
  { id: 'cardio', label: 'Cardio', icon: Flame },
  { id: 'mobility', label: 'Mobility', icon: Sparkles },
] as const;

const DURATION_OPTIONS = [30, 45, 60, 75, 90, 120];

export const LogWorkoutModal: React.FC<LogWorkoutModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'strength' | 'cardio' | 'mobility'>('all');
  const [selectedSplitId, setSelectedSplitId] = useState<string>('push');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [duration, setDuration] = useState<number>(60);
  const [notes, setNotes] = useState<string>('');

  const activePreset = WORKOUT_ITEMS.find((i) => i.id === selectedSplitId) || WORKOUT_ITEMS[0];
  const calorieRate = activePreset.calorieRatePerMin;
  const estimatedCalories = Math.round(duration * calorieRate);

  const filteredSplits = activeCategory === 'all'
    ? WORKOUT_ITEMS
    : WORKOUT_ITEMS.filter((item) => item.category === activeCategory);

  const resetForm = () => {
    setActiveCategory('all');
    setSelectedSplitId('push');
    setCustomTitle('');
    setDuration(60);
    setNotes('');
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalTitle = activePreset.name;
    if (selectedSplitId === 'custom' && customTitle.trim()) {
      finalTitle = customTitle.trim();
    }

    onSave({
      workoutType: finalTitle,
      durationMinutes: duration,
      calories: estimatedCalories,
      notes: notes.trim() || undefined,
    });

    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[540px] p-6 max-h-[88vh] overflow-y-auto bg-white border border-black/[0.08] rounded-2xl shadow-2xl">
        <DialogHeader className="flex flex-col items-center text-center">
          <div className="w-11 h-11 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-xs mx-auto mb-2">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <DialogTitle className="text-lg sm:text-xl font-black tracking-tight text-zinc-900">
            Log Workout Session
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 mt-0.5">
            Record your training routine, duration, and estimated calorie burn.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* 1. Category Filter Tabs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                1. Select Training Split
              </label>
              <div className="flex items-center gap-1 bg-zinc-100/90 p-0.5 rounded-lg border border-black/[0.04]">
                {CATEGORY_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeCategory === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveCategory(tab.id as any)}
                      className={`flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                        isActive
                          ? 'bg-white text-zinc-900 shadow-xs'
                          : 'text-zinc-500 hover:text-zinc-900'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Split Presets Grid */}
            <div className="grid grid-cols-2 gap-2 max-h-[175px] overflow-y-auto pr-1">
              {filteredSplits.map((item) => {
                const isSelected = selectedSplitId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedSplitId(item.id)}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all duration-150 relative ${
                      isSelected
                        ? 'border-zinc-900 bg-zinc-900/[0.04] ring-1 ring-zinc-900'
                        : 'border-zinc-200/80 bg-white hover:border-zinc-300 hover:bg-zinc-50/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 ${item.iconBg}`}>
                          {item.icon}
                        </div>
                        <span className="text-xs font-bold text-zinc-900 truncate">
                          {item.shortName}
                        </span>
                      </div>
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 text-zinc-900 stroke-[3] shrink-0" />
                      ) : null}
                    </div>
                    <p className="text-[10px] text-zinc-400 font-medium mt-1 truncate">
                      ~{item.calorieRatePerMin} kcal/min • {item.intensity}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Custom Routine Title Input */}
            {selectedSplitId === 'custom' && (
              <div className="pt-1 space-y-1">
                <label className="text-xs font-bold text-zinc-700">Custom Title</label>
                <Input
                  type="text"
                  placeholder="e.g. Olympic Weightlifting, Calisthenics..."
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="h-9 text-xs rounded-xl border-zinc-200"
                  required
                />
              </div>
            )}
          </div>

          {/* 2. Duration Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                2. Session Duration
              </label>
              <span className="text-xs font-bold text-zinc-900 tabular-nums">
                {duration} minutes
              </span>
            </div>

            <div className="grid grid-cols-6 gap-1.5">
              {DURATION_OPTIONS.map((mins) => {
                const isSelected = duration === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDuration(mins)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer tabular-nums border ${
                      isSelected
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                        : 'bg-zinc-50 text-zinc-800 border-zinc-200/80 hover:bg-zinc-100'
                    }`}
                  >
                    {mins}m
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Live Calorie & Intensity Calculation Pill */}
          <div className="p-3 bg-zinc-900 text-white rounded-xl border border-zinc-800 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Est. Energy Burn
                </span>
                <span className="text-sm font-black text-white tabular-nums">
                  ~{estimatedCalories} <span className="text-xs font-semibold text-zinc-400">kcal</span>
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-semibold text-zinc-400 block">
                Active Session
              </span>
              <span className="text-xs font-bold text-zinc-200 flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-400" />
                {Math.floor(duration / 60) > 0 ? `${Math.floor(duration / 60)}h ` : ''}
                {duration % 60 > 0 ? `${duration % 60}m` : ''}
              </span>
            </div>
          </div>

          {/* 4. Workout Notes (Optional) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                3. Notes & PRs
              </label>
              <span className="text-[10px] text-zinc-400">Optional</span>
            </div>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="e.g. Hit 100kg Bench PR, 4x10 Incline Dumbbells..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl border-zinc-200"
              />
            </div>
          </div>

          {/* 5. Submit Button */}
          <Button
            type="submit"
            className="w-full h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>Save Workout Log (~{estimatedCalories} kcal)</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
