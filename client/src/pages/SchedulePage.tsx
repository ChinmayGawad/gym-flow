import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Zap,
  Activity,
} from 'lucide-react';
import { HourlyPrediction } from '@/types/occupancy';
import { AttendanceWaveChart } from '@/components/schedule/AttendanceWaveChart';

interface SchedulePageProps {
  capacity?: number;
}

const SCHEDULE_CURVE = [
  { id: '1', time: '6 AM', factor: 0.30 },
  { id: '2', time: '7 AM', factor: 0.37 },
  { id: '3', time: '8 AM', factor: 0.53 },
  { id: '4', time: '9 AM', factor: 0.43 },
  { id: '5', time: '10 AM', factor: 0.33 },
  { id: '6', time: '11 AM', factor: 0.37 },
  { id: '7', time: '12 PM', factor: 0.47 },
  { id: '8', time: '1 PM', factor: 0.40 },
  { id: '9', time: '2 PM', factor: 0.32 },
  { id: '10', time: '3 PM', factor: 0.38 },
  { id: '11', time: '4 PM', factor: 0.63 },
  { id: '12', time: '5 PM', factor: 0.82, isHigh: true },
  { id: '13', time: '6 PM', factor: 0.90, isHigh: true },
  { id: '14', time: '7 PM', factor: 0.97, isHighest: true },
  { id: '15', time: '8 PM', factor: 0.73 },
  { id: '16', time: '9 PM', factor: 0.50 },
  { id: '17', time: '10 PM', factor: 0.25 },
];

export const SchedulePage: React.FC<SchedulePageProps> = ({ capacity = 30 }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');

  const fullHourlySchedule: HourlyPrediction[] = SCHEDULE_CURVE.map((item) => {
    const peopleCount = Math.max(1, Math.round(capacity * item.factor));
    const percentage = Math.round((peopleCount / capacity) * 100);
    return {
      id: item.id,
      time: item.time,
      peopleCount,
      percentage,
      isHigh: item.isHigh,
      isHighest: item.isHighest,
    };
  });

  const filteredSchedule = fullHourlySchedule.filter((item) => {
    const [numStr, period] = item.time.split(' ');
    const num = parseInt(numStr, 10);
    const hour24 = period === 'AM' ? (num === 12 ? 0 : num) : (num === 12 ? 12 : num + 12);

    if (activeFilter === 'morning') {
      return hour24 >= 6 && hour24 <= 11;
    }
    if (activeFilter === 'afternoon') {
      return hour24 >= 12 && hour24 <= 16;
    }
    if (activeFilter === 'evening') {
      return hour24 >= 17 && hour24 <= 22;
    }
    return true;
  });

  const morningLowAvg = Math.max(1, Math.round(capacity * 0.33));
  const afternoonLowAvg = Math.max(1, Math.round(capacity * 0.35));
  const eveningPeakAvg = Math.max(1, Math.round(capacity * 0.92));

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
            Crowd Schedule & Forecast
          </h1>
          <p className="text-xs text-gym-subtle mt-0.5 font-medium">
            AI-modeled hourly attendance wave curve scaled to {capacity} facility capacity benchmark.
          </p>
        </div>

        {/* Date Badge */}
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-[10px] border border-[#dedede] self-start md:self-auto shadow-sm">
          <Calendar className="w-4 h-4 text-gym-dark" />
          <span className="text-xs font-bold text-gym-dark">Live Forecast ({capacity} Max)</span>
        </div>
      </div>

      {/* Recommended Time Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Morning Quiet Window */}
        <Card className="p-5 bg-white border-[#dedede] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200 uppercase">
              Best Morning
            </span>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <h4 className="text-base font-extrabold text-gym-dark mt-3">
            6:00 AM – 7:30 AM
          </h4>
          <p className="text-xs text-gym-subtle mt-1">
            Avg. ~{morningLowAvg} people. Ideal for cardio & squat racks with zero wait times.
          </p>
        </Card>

        {/* Afternoon Quiet Window */}
        <Card className="p-5 bg-white border-[#dedede] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200 uppercase">
              Best Afternoon
            </span>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <h4 className="text-base font-extrabold text-gym-dark mt-3">
            1:30 PM – 3:30 PM
          </h4>
          <p className="text-xs text-gym-subtle mt-1">
            Avg. ~{afternoonLowAvg} people. Minimum wait times across all equipment zones.
          </p>
        </Card>

        {/* Peak Rush Warning */}
        <Card className="p-5 bg-white border-[#dedede] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200 uppercase">
              Peak Rush Hours
            </span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <h4 className="text-base font-extrabold text-gym-dark mt-3">
            5:30 PM – 8:00 PM
          </h4>
          <p className="text-xs text-gym-subtle mt-1">
            Capacity reaches 85%–97% (~{eveningPeakAvg} people). Expected equipment wait 15–25 mins.
          </p>
        </Card>
      </div>

      {/* Hero Reference-Styled Card Container */}
      <Card className="p-6 md:p-8 bg-white border-[#dedede] shadow-sm rounded-2xl">
        {/* Header matching reference screenshot */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 pb-3 border-b border-[#f0f0f0]">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gym-dark stroke-[2.5]" />
              <h3 className="text-xl font-extrabold text-gym-dark tracking-tight">
                Crowd volume
              </h3>
            </div>
            <p className="text-[10px] font-bold text-[#888888] tracking-widest uppercase">
              TODAY'S FORECAST
            </p>
            <div className="pt-0.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#e0f2f1] text-[#00796b] border border-[#b2dfdb]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#009688]" />
                AI ASSISTED
              </span>
            </div>
          </div>

          {/* Time of Day Filter Tabs */}
          <div className="flex items-center gap-1 bg-[#f4f4f4] p-1 rounded-xl self-start sm:self-center border border-[#e8e8e8]">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-white text-gym-dark shadow-sm'
                  : 'text-gym-subtle hover:text-gym-dark'
              }`}
            >
              All Day
            </button>
            <button
              onClick={() => setActiveFilter('morning')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeFilter === 'morning'
                  ? 'bg-white text-gym-dark shadow-sm'
                  : 'text-gym-subtle hover:text-gym-dark'
              }`}
            >
              Morning (6-11)
            </button>
            <button
              onClick={() => setActiveFilter('afternoon')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeFilter === 'afternoon'
                  ? 'bg-white text-gym-dark shadow-sm'
                  : 'text-gym-subtle hover:text-gym-dark'
              }`}
            >
              Afternoon (12-4)
            </button>
            <button
              onClick={() => setActiveFilter('evening')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeFilter === 'evening'
                  ? 'bg-white text-gym-dark shadow-sm'
                  : 'text-gym-subtle hover:text-gym-dark'
              }`}
            >
              Evening (5-10)
            </button>
          </div>
        </div>

        {/* Clean Reference Bar Chart */}
        <div className="py-2">
          <AttendanceWaveChart
            data={filteredSchedule}
            capacity={capacity}
            activeFilter={activeFilter}
          />
        </div>

        {/* Compact Daily Attendance Breakdown Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-[#f0f0f0]">
          <div className="p-3 bg-[#fafafa] rounded-xl border border-[#ededed]">
            <span className="text-[10px] font-bold text-gym-subtle uppercase block">
              Early Morning (6–8 AM)
            </span>
            <span className="text-sm font-extrabold text-gym-dark mt-0.5 block">
              ~{Math.round(capacity * 0.35)} People
            </span>
            <Badge variant="low" className="text-[9px] px-1.5 py-0 mt-1">
              Low Crowd
            </Badge>
          </div>

          <div className="p-3 bg-[#fafafa] rounded-xl border border-[#ededed]">
            <span className="text-[10px] font-bold text-gym-subtle uppercase block">
              Lunch Wave (12–2 PM)
            </span>
            <span className="text-sm font-extrabold text-gym-dark mt-0.5 block">
              ~{Math.round(capacity * 0.45)} People
            </span>
            <Badge variant="moderate" className="text-[9px] px-1.5 py-0 mt-1">
              Moderate
            </Badge>
          </div>

          <div className="p-3 bg-red-50/50 rounded-xl border border-red-100">
            <span className="text-[10px] font-bold text-red-700 uppercase block">
              Peak Surge (5–8 PM)
            </span>
            <span className="text-sm font-extrabold text-red-950 mt-0.5 block">
              ~{Math.round(capacity * 0.90)} People
            </span>
            <Badge variant="high" className="text-[9px] px-1.5 py-0 mt-1">
              High Surge
            </Badge>
          </div>

          <div className="p-3 bg-[#fafafa] rounded-xl border border-[#ededed]">
            <span className="text-[10px] font-bold text-gym-subtle uppercase block">
              Late Night (9–10 PM)
            </span>
            <span className="text-sm font-extrabold text-gym-dark mt-0.5 block">
              ~{Math.round(capacity * 0.30)} People
            </span>
            <Badge variant="low" className="text-[9px] px-1.5 py-0 mt-1">
              Low Crowd
            </Badge>
          </div>
        </div>
      </Card>

      {/* Recommended Strategy Callout */}
      <div className="p-6 rounded-[14px] bg-[#f0f0f0] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-gym-dark shadow-sm shrink-0">
            <Sparkles className="w-6 h-6 text-gym-dark" />
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-wider text-gym-subtle uppercase block">
              OPTIMAL WORKOUT WINDOW
            </span>
            <h3 className="text-lg font-extrabold text-gym-dark">
              10:00 AM – 11:30 AM or 1:30 PM – 3:30 PM
            </h3>
            <p className="text-xs text-gym-subtle font-medium mt-0.5">
              Less than {Math.round(capacity * 0.4)} members present. Zero wait times for power racks, benches, and free weights.
            </p>
          </div>
        </div>

        <Button
          asChild
          className="h-10 px-5 rounded-[9px] bg-gym-dark hover:bg-[#3a3a3a] text-white text-xs font-bold gap-2 shrink-0 shadow-sm"
        >
          <Link to="/">
            Check Live Crowd
            <TrendingUp className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
};

