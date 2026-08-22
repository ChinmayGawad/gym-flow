import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dumbbell,
  Flame,
  Clock,
  ArrowLeft,
  CheckCircle,
  PlusCircle,
  Zap,
  Heart,
  Activity,
  Sparkles,
  Check,
  Layers,
  ArrowRight,
  FileText,
  ChevronLeft,
} from 'lucide-react';
import { API_BASE } from '@/lib/api-config';

export interface WorkoutSplitPreset {
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

export const WORKOUT_SPLIT_PRESETS: WorkoutSplitPreset[] = [
  // Strength & Hypertrophy
  {
    id: 'push',
    name: 'Push Day (Chest, Shoulders & Triceps)',
    shortName: 'Push Day',
    category: 'strength',
    icon: <Dumbbell className="w-4 h-4 text-emerald-600" />,
    iconBg: 'bg-emerald-50 border-emerald-100',
    calorieRatePerMin: 6.2,
    description: 'Bench press, incline dumbbells, lateral raises, dips, tricep pushdowns',
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
    description: 'Deadlifts, lat pulldowns, barbell rows, hammer curls, face pulls',
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
    description: 'Barbell squats, leg press, Romanian deadlifts, walking lunges, calf raises',
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
    description: 'Overhead press, pull-ups, cable crossovers, bicep/tricep supersets',
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
    description: 'Squat, bench, row, clean & press circuit with minimal rest',
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
    description: 'Hanging leg raises, weighted planks, ab rollout, cable woodchops',
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
    description: 'Incline treadmill intervals, stairmaster climb, indoor rowing machine',
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
    description: 'Kettlebell snatches, battle ropes, plyo box jumps, burpees, sled pushes',
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
    description: 'High-resistance interval spin cadence, hill climb simulations, sprints',
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
    description: 'Dynamic joint mobility, foam rolling, vinyasa yoga flow, deep stretches',
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
    description: 'Specify your own custom routine name, targeted exercises, and notes',
    intensity: 'Moderate',
  },
];

const CATEGORY_TABS = [
  { id: 'all', label: 'All Splits', icon: Layers, count: 11 },
  { id: 'strength', label: 'Strength', icon: Dumbbell, count: 6 },
  { id: 'cardio', label: 'Cardio & HIIT', icon: Flame, count: 3 },
  { id: 'mobility', label: 'Mobility & Custom', icon: Sparkles, count: 2 },
] as const;

const DURATION_OPTIONS = [30, 45, 60, 75, 90, 120];

export const LogWorkoutPage: React.FC = () => {
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState<'all' | 'strength' | 'cardio' | 'mobility'>('all');
  const [selectedSplitId, setSelectedSplitId] = useState<string>('push');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [duration, setDuration] = useState<number>(60);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Active preset & calculations
  const activePreset = WORKOUT_SPLIT_PRESETS.find((i) => i.id === selectedSplitId) || WORKOUT_SPLIT_PRESETS[0];
  const calorieRate = activePreset.calorieRatePerMin;
  const estimatedCalories = Math.round(duration * calorieRate);

  const filteredSplits = activeCategory === 'all'
    ? WORKOUT_SPLIT_PRESETS
    : WORKOUT_SPLIT_PRESETS.filter((item) => item.category === activeCategory);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let finalTitle = activePreset.name;
    if (selectedSplitId === 'custom' && customTitle.trim()) {
      finalTitle = customTitle.trim();
    }

    try {
      await fetch(`${API_BASE}/api/user/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          workoutType: finalTitle,
          durationMinutes: duration,
          calories: estimatedCalories,
          notes: notes.trim() || undefined,
        }),
      });

      // Navigate back to history page
      navigate('/history', { state: { justLogged: true } });
    } catch (err) {
      console.error('Error logging workout session:', err);
      navigate('/history');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Breadcrumb & Back Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-100">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Link
              to="/"
              className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
            <span className="text-zinc-300">/</span>
            <Link
              to="/history"
              className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              History
            </Link>
            <span className="text-zinc-300">/</span>
            <span className="text-xs font-semibold text-zinc-900">Log Workout</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            Log Workout Session
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5 font-medium">
            Select your training split, customize session duration, and record your energy burn and personal records.
          </p>
        </div>

        <Button
          asChild
          variant="outline"
          className="h-9 px-4 rounded-xl border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-100 text-xs font-semibold gap-1.5 self-start sm:self-auto shadow-xs"
        >
          <Link to="/history">
            <ChevronLeft className="w-3.5 h-3.5 text-zinc-600" />
            <span>Back to History</span>
          </Link>
        </Button>
      </div>

      {/* Full-Page Logger Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 7 Columns: Training Split Selector */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="p-5 sm:p-6 bg-white border border-black/[0.06] shadow-card rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 tracking-tight">
                    1. Select Training Split
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Choose a target muscle group or cardio routine.
                  </p>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1 bg-zinc-100/90 p-1 rounded-xl border border-black/[0.04] overflow-x-auto self-start sm:self-auto max-w-full">
                  {CATEGORY_TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeCategory === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveCategory(tab.id as any)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                          isActive
                            ? 'bg-white text-zinc-900 shadow-xs'
                            : 'text-zinc-500 hover:text-zinc-900'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Workout Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {filteredSplits.map((item) => {
                  const isSelected = selectedSplitId === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedSplitId(item.id)}
                      className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-150 relative group ${
                        isSelected
                          ? 'border-zinc-900 bg-zinc-900/[0.03] ring-1 ring-zinc-900 shadow-xs'
                          : 'border-zinc-200/80 bg-white hover:border-zinc-300 hover:bg-zinc-50/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${item.iconBg}`}>
                            {item.icon}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-zinc-900 block leading-tight">
                              {item.shortName}
                            </span>
                            <span className="text-[10px] font-semibold text-zinc-400 flex items-center gap-1 mt-0.5">
                              ~{item.calorieRatePerMin} kcal/min • {item.intensity}
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0 mt-0.5">
                          {isSelected ? (
                            <span className="w-4.5 h-4.5 rounded-full bg-zinc-900 text-white flex items-center justify-center shadow-xs">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="w-4.5 h-4.5 rounded-full border border-zinc-200 group-hover:border-zinc-400 block transition-colors" />
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-2.5 leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Custom routine text input if custom selected */}
              {selectedSplitId === 'custom' && (
                <div className="pt-2 animate-in fade-in space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">Custom Routine Title</label>
                  <div className="relative">
                    <Activity className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                    <Input
                      type="text"
                      placeholder="e.g., Crossfit Hero WOD, Olympic Weightlifting..."
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="pl-10 h-10 text-xs rounded-xl border-zinc-200"
                      required
                    />
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Right 5 Columns: Duration, Energy Burn, Notes & Action */}
          <div className="lg:col-span-5 space-y-4">
            {/* Duration Card */}
            <Card className="p-5 bg-white border border-black/[0.06] shadow-card rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 tracking-tight">
                    2. Session Duration
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Total active training time.
                  </p>
                </div>
                <span className="text-xs font-black text-zinc-900 tabular-nums px-2.5 py-1 rounded-lg bg-zinc-100 border border-zinc-200/60">
                  {duration} min
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                {DURATION_OPTIONS.map((mins) => {
                  const isSelected = duration === mins;
                  return (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDuration(mins)}
                      className={`py-2 px-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer tabular-nums flex flex-col items-center justify-center gap-0.5 border ${
                        isSelected
                          ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                          : 'bg-zinc-50 text-zinc-800 border-zinc-200/80 hover:bg-zinc-100 hover:border-zinc-300'
                      }`}
                    >
                      <span>{mins}m</span>
                      <span className={`text-[9px] font-medium ${isSelected ? 'text-zinc-300' : 'text-zinc-400'}`}>
                        {mins >= 60 ? `${(mins / 60).toFixed(mins % 60 ? 1 : 0)} hr` : 'session'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Energy Burn Summary Banner */}
            <Card className="p-5 bg-zinc-900 text-white border border-zinc-800 shadow-card rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400 flex items-center justify-center">
                    <Flame className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        Estimated Energy Burn
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                        {activePreset.intensity}
                      </span>
                    </div>
                    <span className="text-2xl font-black text-white leading-tight tabular-nums tracking-tight block mt-0.5">
                      ~{estimatedCalories} <span className="text-sm font-bold text-zinc-400">kcal</span>
                    </span>
                  </div>
                </div>

                <div className="text-right border-l border-zinc-800 pl-4">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                    Active Time
                  </span>
                  <span className="text-sm font-bold text-zinc-200 flex items-center justify-end gap-1 tabular-nums mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    {Math.floor(duration / 60) > 0 ? `${Math.floor(duration / 60)}h ` : ''}
                    {duration % 60 > 0 ? `${duration % 60}m` : ''}
                  </span>
                </div>
              </div>
            </Card>

            {/* Session Notes Card */}
            <Card className="p-5 bg-white border border-black/[0.06] shadow-card rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-900 tracking-tight">
                  3. Workout Notes & PRs
                </h3>
                <span className="text-[10px] text-zinc-400 font-medium">Optional</span>
              </div>
              <div className="relative pt-1">
                <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="e.g., Hit 100kg Bench PR, 4x10 Incline Dumbbell Press..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="pl-10 h-10 text-xs rounded-xl border-zinc-200"
                />
              </div>
            </Card>

            {/* Action Submit Card */}
            <Card className="p-5 bg-white border border-black/[0.06] shadow-card rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-700">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-zinc-900 font-bold">{activePreset.shortName}</span>
                  <span className="text-zinc-400">•</span>
                  <span>{duration}m</span>
                  <span className="text-zinc-400">•</span>
                  <span className="text-orange-600 font-bold tabular-nums">~{estimatedCalories} kcal</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <Button
                  asChild
                  type="button"
                  variant="outline"
                  className="h-10 px-4 rounded-xl text-xs font-semibold border-zinc-200 hover:bg-zinc-100 flex-1"
                >
                  <Link to="/history">
                    Cancel
                  </Link>
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 px-5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 flex-2 cursor-pointer"
                >
                  <span>{isSubmitting ? 'Saving...' : 'Save Workout Log'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};
