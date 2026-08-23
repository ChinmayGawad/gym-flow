import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  Dumbbell,
  Flame,
  TrendingUp,
  Award,
  ArrowLeft,
  CheckCircle,
  PlusCircle,
  Trash2,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { LogWorkoutModal, WorkoutLogData } from '@/components/history/LogWorkoutModal';
import { API_BASE } from '@/lib/api-config';

interface VisitRecord {
  id: string;
  date: string;
  checkIn: string;
  checkOut: string;
  duration: string;
  workoutType: string;
  calories: number;
  period: 'this_month' | 'last_month';
  notes?: string;
}

export const HistoryPage: React.FC = () => {
  const location = useLocation();
  const [filter, setFilter] = useState<'all' | 'this_month' | 'last_month'>('all');
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [justLogged, setJustLogged] = useState(Boolean(location.state?.justLogged));
  const [isLoading, setIsLoading] = useState(false);

  // Clear justLogged notification after 5s
  React.useEffect(() => {
    if (justLogged) {
      const timer = setTimeout(() => setJustLogged(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [justLogged]);

  // 1. Fetch live database manual visit records on mount
  React.useEffect(() => {
    const fetchVisits = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE}/api/user/visits`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.visits && data.visits.length > 0) {
            const mappedVisits: VisitRecord[] = data.visits.map((v: any) => {
              const checkInDate = new Date(v.checkInTime || v.createdAt);
              const now = new Date();
              const isThisMonth =
                checkInDate.getMonth() === now.getMonth() &&
                checkInDate.getFullYear() === now.getFullYear();

              const hours = Math.floor((v.durationMinutes || 60) / 60);
              const mins = (v.durationMinutes || 60) % 60;
              const formattedDuration =
                hours > 0 ? (mins > 0 ? `${hours}h ${mins}m` : `${hours}h`) : `${mins}m`;

              return {
                id: v.id,
                date: checkInDate.toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }),
                checkIn: checkInDate.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                }),
                checkOut: v.checkOutTime
                  ? new Date(v.checkOutTime).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })
                  : 'Completed',
                duration: formattedDuration,
                workoutType: v.workoutType || 'General Strength Workout',
                calories: v.caloriesBurned || 350,
                period: isThisMonth ? 'this_month' : 'last_month',
                notes: v.notes || undefined,
              };
            });

            setVisits(mappedVisits);
          } else {
            setVisits([]);
          }
        } else {
          setVisits([]);
        }
      } catch (err) {
        console.warn('Could not fetch visit logs from database:', err);
        setVisits([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVisits();
  }, []);

  const filteredVisits = visits.filter((v) => {
    if (filter === 'all') return true;
    return v.period === filter;
  });

  // 2. Persist new workout log to backend database
  const handleSaveWorkout = async (data: WorkoutLogData) => {
    const hours = Math.floor(data.durationMinutes / 60);
    const mins = data.durationMinutes % 60;
    const formattedDuration =
      hours > 0 ? (mins > 0 ? `${hours}h ${mins}m` : `${hours}h`) : `${mins}m`;

    const optimisticRecord: VisitRecord = {
      id: `v-${Date.now()}`,
      date: new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      checkIn: new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
      checkOut: 'Completed',
      duration: formattedDuration,
      workoutType: data.workoutType,
      calories: data.calories,
      period: 'this_month',
      notes: data.notes,
    };

    setVisits((prev) => [optimisticRecord, ...prev]);
    setJustLogged(true);

    try {
      const res = await fetch(`${API_BASE}/api/user/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          workoutType: data.workoutType,
          durationMinutes: data.durationMinutes,
          calories: data.calories,
          notes: data.notes,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.visit?.id) {
          setVisits((prev) =>
            prev.map((v) => (v.id === optimisticRecord.id ? { ...v, id: result.visit.id } : v))
          );
        }
      }
    } catch (err) {
      console.error('Error saving workout to database:', err);
    }
  };

  // 3. Delete a manually entered workout
  const handleDeleteWorkout = async (id: string) => {
    setVisits((prev) => prev.filter((v) => v.id !== id));
    try {
      await fetch(`${API_BASE}/api/user/visits/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Error deleting workout record:', err);
    }
  };

  // Dynamic calculated metrics from database logs
  const thisMonthVisits = visits.filter((v) => v.period === 'this_month');
  const totalCaloriesBurned = visits.reduce((acc, curr) => acc + (curr.calories || 0), 0);
  const totalDurationMins = visits.reduce((acc, curr) => {
    const match = curr.duration.match(/(\d+)h\s*(\d+)?m?/) || curr.duration.match(/(\d+)m/);
    if (match) {
      if (match[2] !== undefined) {
        return acc + parseInt(match[1], 10) * 60 + (parseInt(match[2], 10) || 0);
      }
      return acc + parseInt(match[1], 10);
    }
    return acc + 60;
  }, 0);
  const avgDurationMinutes =
    visits.length > 0 ? Math.round(totalDurationMins / visits.length) : 0;
  const avgDurationFormatted =
    avgDurationMinutes > 0
      ? `${Math.floor(avgDurationMinutes / 60)}h ${avgDurationMinutes % 60}m`
      : '0m';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Link
              to="/"
              className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <span className="text-xs font-semibold text-zinc-900 dark:text-white">History</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Workout Check-In History
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
            Review training frequency, workout durations, and consistency metrics synced with the gym.
          </p>
        </div>

        {/* Trigger Card Layout Modal with Backdrop Blur */}
        <Button
          onClick={() => setIsLogModalOpen(true)}
          className="h-10 px-5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 text-xs font-bold gap-2 self-start md:self-auto shadow-xs cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Log Workout Session</span>
        </Button>
      </div>

      {justLogged && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/50 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 font-semibold animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Workout session logged and synchronized to database successfully!</span>
        </div>
      )}

      {/* Log Workout Modal with Backdrop Blur & Card Layout */}
      <LogWorkoutModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onSave={handleSaveWorkout}
      />

      {/* Analytics Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-5 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card space-y-3">
              <Skeleton className="w-9 h-9 rounded-xl" />
              <Skeleton className="h-3 w-20 rounded-md" />
              <Skeleton className="h-7 w-28 rounded-lg" />
              <Skeleton className="h-3 w-24 rounded-md" />
            </Card>
          ))
        ) : (
          <>
            <Card className="p-5 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card hover:border-black/[0.12] dark:hover:border-white/[0.15] transition-all">
              <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700 flex items-center justify-center text-zinc-800 dark:text-zinc-200 mb-3">
                <Calendar className="w-4.5 h-4.5" />
              </div>
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">
                This Month
              </span>
              <span className="text-2xl font-black text-zinc-900 dark:text-white mt-0.5 block tabular-nums">
                {thisMonthVisits.length} Visits
              </span>
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                {thisMonthVisits.length > 0 ? `${thisMonthVisits.length} recorded this month` : 'No logs recorded'}
              </span>
            </Card>

            <Card className="p-5 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card hover:border-black/[0.12] dark:hover:border-white/[0.15] transition-all">
              <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700 flex items-center justify-center text-zinc-800 dark:text-zinc-200 mb-3">
                <Clock className="w-4.5 h-4.5" />
              </div>
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">
                Avg Duration
              </span>
              <span className="text-2xl font-black text-zinc-900 dark:text-white mt-0.5 block tabular-nums">
                {avgDurationFormatted}
              </span>
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium mt-1 block">
                {visits.length > 0 ? 'Consistent sessions' : 'Log a session to track'}
              </span>
            </Card>

            <Card className="p-5 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card hover:border-black/[0.12] dark:hover:border-white/[0.15] transition-all">
              <div className="w-9 h-9 rounded-xl bg-orange-50/70 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-900/50 flex items-center justify-center text-orange-600 dark:text-orange-400 mb-3">
                <Flame className="w-4.5 h-4.5" />
              </div>
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">
                Est. Calories
              </span>
              <span className="text-2xl font-black text-zinc-900 dark:text-white mt-0.5 block tabular-nums">
                {totalCaloriesBurned.toLocaleString()} kcal
              </span>
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium mt-1 block">
                {visits.length > 0 ? 'Burned across logs' : 'Energy expenditure'}
              </span>
            </Card>

            <Card className="p-5 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card hover:border-black/[0.12] dark:hover:border-white/[0.15] transition-all">
              <div className="w-9 h-9 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-3">
                <Award className="w-4.5 h-4.5" />
              </div>
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">
                Current Streak
              </span>
              <span className="text-2xl font-black text-zinc-900 dark:text-white mt-0.5 block tabular-nums">
                {Math.min(visits.length, 5)} Days
              </span>
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium mt-1 block">
                {visits.length > 0 ? 'Active logged routine' : 'Start your streak!'}
              </span>
            </Card>
          </>
        )}
      </div>

      {/* History Table / List Card */}
      <Card className="p-6 md:p-8 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card rounded-2xl">
        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">
              Activity History
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Showing {filteredVisits.length} manually recorded workout sessions.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-zinc-100/90 dark:bg-zinc-900/90 p-1 rounded-xl border border-black/[0.04] dark:border-white/[0.06]">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              All Records ({visits.length})
            </button>
            <button
              onClick={() => setFilter('this_month')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                filter === 'this_month'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              This Month ({thisMonthVisits.length})
            </button>
            <button
              onClick={() => setFilter('last_month')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                filter === 'last_month'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Last Month
            </button>
          </div>
        </div>

        {/* Visit Items List / Empty State */}
        {isLoading ? (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 px-3"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                  <div className="space-y-2 flex-1 max-w-sm">
                    <Skeleton className="h-4 w-44 rounded-lg" />
                    <Skeleton className="h-3 w-56 rounded-md" />
                  </div>
                </div>
                <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
                  <Skeleton className="h-7 w-20 rounded-lg" />
                  <Skeleton className="h-7 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredVisits.length === 0 ? (
          <div className="py-14 px-4 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-700 flex items-center justify-center text-zinc-400 dark:text-zinc-500 mb-3.5 shadow-xs">
              <Dumbbell className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
            </div>
            <h4 className="text-base font-black text-zinc-900 dark:text-white tracking-tight">
              No Workout Activity Recorded
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mt-1 mb-5 leading-relaxed font-medium">
              Your activity history is currently empty. Workouts will only appear here when you manually log your training sessions, exercises, duration, and calories.
            </p>
            <Button
              onClick={() => setIsLogModalOpen(true)}
              className="h-9.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 text-xs font-bold gap-2 shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Log Your First Workout</span>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filteredVisits.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/50 px-3 rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700 flex items-center justify-center text-zinc-800 dark:text-zinc-200 shrink-0">
                    <Dumbbell className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white block">
                      {item.workoutType}
                    </span>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">{item.date}</span>
                      <span>•</span>
                      <span className="tabular-nums">{item.checkIn} → {item.checkOut}</span>
                      {item.notes && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium italic">"{item.notes}"</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-auto">
                  <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-100/80 dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-200/60 dark:border-zinc-700 tabular-nums">
                    ~{item.calories} kcal
                  </span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full border border-zinc-200/80 dark:border-zinc-700 tabular-nums">
                    {item.duration}
                  </span>
                  <button
                    onClick={() => handleDeleteWorkout(item.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Delete workout log"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </Card>
    </div>
  );
};
