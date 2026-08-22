import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';

interface VisitRecord {
  id: string;
  date: string;
  checkIn: string;
  checkOut: string;
  duration: string;
  workoutType: string;
  calories: number;
  period: 'this_month' | 'last_month';
}

const INITIAL_VISITS: VisitRecord[] = [
  {
    id: 'v1',
    date: '21 August 2026',
    checkIn: '7:15 PM',
    checkOut: '8:40 PM',
    duration: '1h 25m',
    workoutType: 'Chest & Triceps Hypertrophy',
    calories: 420,
    period: 'this_month',
  },
  {
    id: 'v2',
    date: '20 August 2026',
    checkIn: '10:20 AM',
    checkOut: '11:35 AM',
    duration: '1h 15m',
    workoutType: 'Back & Biceps Pull Day',
    calories: 380,
    period: 'this_month',
  },
  {
    id: 'v3',
    date: '19 August 2026',
    checkIn: '7:00 PM',
    checkOut: '8:10 PM',
    duration: '1h 10m',
    workoutType: 'Legs & Core Strength',
    calories: 490,
    period: 'this_month',
  },
  {
    id: 'v4',
    date: '17 August 2026',
    checkIn: '6:30 AM',
    checkOut: '7:45 AM',
    duration: '1h 15m',
    workoutType: 'Full Body HIIT & Cardio',
    calories: 520,
    period: 'this_month',
  },
  {
    id: 'v5',
    date: '15 August 2026',
    checkIn: '5:45 PM',
    checkOut: '7:00 PM',
    duration: '1h 15m',
    workoutType: 'Shoulders & Arms',
    calories: 360,
    period: 'this_month',
  },
  {
    id: 'v6',
    date: '29 July 2026',
    checkIn: '6:15 PM',
    checkOut: '7:30 PM',
    duration: '1h 15m',
    workoutType: 'Upper Body Power',
    calories: 410,
    period: 'last_month',
  },
  {
    id: 'v7',
    date: '26 July 2026',
    checkIn: '10:00 AM',
    checkOut: '11:20 AM',
    duration: '1h 20m',
    workoutType: 'Deadlifts & Functional Core',
    calories: 460,
    period: 'last_month',
  },
];

export const HistoryPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'this_month' | 'last_month'>('all');
  const [visits, setVisits] = useState<VisitRecord[]>(INITIAL_VISITS);
  const [justLogged, setJustLogged] = useState(false);

  const filteredVisits = visits.filter((v) => {
    if (filter === 'all') return true;
    return v.period === filter;
  });

  const handleSimulateCheckIn = () => {
    const now = new Date();
    const newRecord: VisitRecord = {
      id: `v-${Date.now()}`,
      date: 'Today, 22 August 2026',
      checkIn: 'Just Now',
      checkOut: 'In Progress',
      duration: 'Live Session',
      workoutType: 'General Strength & Conditioning',
      calories: 120,
      period: 'this_month',
    };

    setVisits([newRecord, ...visits]);
    setJustLogged(true);
    setTimeout(() => setJustLogged(false), 4000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="text-xs font-semibold text-gym-subtle hover:text-gym-dark flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-extrabold text-gym-dark tracking-tight mt-1">
            Visit History & Workout Logs
          </h1>
          <p className="text-xs text-gym-subtle mt-0.5 font-medium">
            Track your past gym visits, duration metrics, and training consistency.
          </p>
        </div>

        {/* Quick Check-in simulation button */}
        <Button
          onClick={handleSimulateCheckIn}
          className="h-10 px-5 rounded-[9px] bg-gym-dark hover:bg-[#3a3a3a] text-white text-xs font-bold gap-2 self-start md:self-auto shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          Log Workout Check-In
        </Button>
      </div>

      {justLogged && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-[9px] flex items-center gap-2 text-xs text-emerald-800 font-semibold animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          New workout session logged successfully!
        </div>
      )}

      {/* Analytics Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 bg-white border-[#dedede]">
          <div className="w-9 h-9 rounded-full bg-[#f0f0f0] flex items-center justify-center text-gym-dark mb-3">
            <Calendar className="w-4.5 h-4.5" />
          </div>
          <span className="text-[11px] font-bold text-gym-subtle uppercase tracking-wider block">
            This Month
          </span>
          <span className="text-2xl font-black text-gym-dark mt-1 block">
            {visits.filter((v) => v.period === 'this_month').length} Visits
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" />
            +2 vs last month
          </span>
        </Card>

        <Card className="p-5 bg-white border-[#dedede]">
          <div className="w-9 h-9 rounded-full bg-[#f0f0f0] flex items-center justify-center text-gym-dark mb-3">
            <Clock className="w-4.5 h-4.5" />
          </div>
          <span className="text-[11px] font-bold text-gym-subtle uppercase tracking-wider block">
            Avg Duration
          </span>
          <span className="text-2xl font-black text-gym-dark mt-1 block">
            1h 17m
          </span>
          <span className="text-[11px] text-gym-subtle font-medium mt-1 block">
            Consistent sessions
          </span>
        </Card>

        <Card className="p-5 bg-white border-[#dedede]">
          <div className="w-9 h-9 rounded-full bg-[#f0f0f0] flex items-center justify-center text-gym-dark mb-3">
            <Flame className="w-4.5 h-4.5 text-orange-500" />
          </div>
          <span className="text-[11px] font-bold text-gym-subtle uppercase tracking-wider block">
            Est. Calories
          </span>
          <span className="text-2xl font-black text-gym-dark mt-1 block">
            2,780 kcal
          </span>
          <span className="text-[11px] text-gym-subtle font-medium mt-1 block">
            Burned this month
          </span>
        </Card>

        <Card className="p-5 bg-white border-[#dedede]">
          <div className="w-9 h-9 rounded-full bg-[#f0f0f0] flex items-center justify-center text-gym-dark mb-3">
            <Award className="w-4.5 h-4.5 text-amber-500" />
          </div>
          <span className="text-[11px] font-bold text-gym-subtle uppercase tracking-wider block">
            Current Streak
          </span>
          <span className="text-2xl font-black text-gym-dark mt-1 block">
            4 Days
          </span>
          <span className="text-[11px] text-amber-700 font-semibold mt-1 block">
            🔥 Keep it up!
          </span>
        </Card>
      </div>

      {/* History Table / List Card */}
      <Card className="p-6 md:p-8 bg-white border-[#dedede]">
        {/* Filter Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-[#eee]">
          <div>
            <h3 className="text-lg font-extrabold text-gym-dark">
              Activity History
            </h3>
            <p className="text-xs text-gym-subtle mt-0.5">
              Showing {filteredVisits.length} recorded workout sessions.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-[#f0f0f0] p-1 rounded-[9px]">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-[7px] transition-colors ${
                filter === 'all'
                  ? 'bg-white text-gym-dark shadow-sm'
                  : 'text-gym-subtle hover:text-gym-dark'
              }`}
            >
              All Records
            </button>
            <button
              onClick={() => setFilter('this_month')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-[7px] transition-colors ${
                filter === 'this_month'
                  ? 'bg-white text-gym-dark shadow-sm'
                  : 'text-gym-subtle hover:text-gym-dark'
              }`}
            >
              August 2026
            </button>
            <button
              onClick={() => setFilter('last_month')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-[7px] transition-colors ${
                filter === 'last_month'
                  ? 'bg-white text-gym-dark shadow-sm'
                  : 'text-gym-subtle hover:text-gym-dark'
              }`}
            >
              July 2026
            </button>
          </div>
        </div>

        {/* Visit Items List */}
        <div className="divide-y divide-[#eeeeee]">
          {filteredVisits.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 hover:bg-[#fafafa] px-2 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-[#f0f0f0] flex items-center justify-center text-gym-dark shrink-0">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-gym-dark block">
                    {item.workoutType}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-gym-subtle mt-0.5">
                    <span className="font-semibold text-[#444]">{item.date}</span>
                    <span>•</span>
                    <span>{item.checkIn} → {item.checkOut}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <span className="text-[11px] font-semibold text-gym-subtle bg-[#f5f5f5] px-2.5 py-1 rounded-md border border-[#e5e5e5]">
                  ~{item.calories} kcal
                </span>
                <span className="text-xs font-bold text-gym-dark bg-[#eeeeee] px-3 py-1 rounded-full border border-[#dedede]">
                  {item.duration}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
