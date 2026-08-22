import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  Star,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { HourlyPrediction } from '@/types/occupancy';

const HOURLY_SCHEDULE: HourlyPrediction[] = [
  { id: '1', time: '6 AM', peopleCount: 18, percentage: 30 },
  { id: '2', time: '7 AM', peopleCount: 22, percentage: 37 },
  { id: '3', time: '8 AM', peopleCount: 32, percentage: 53 },
  { id: '4', time: '9 AM', peopleCount: 26, percentage: 43 },
  { id: '5', time: '10 AM', peopleCount: 20, percentage: 33 },
  { id: '6', time: '11 AM', peopleCount: 22, percentage: 37 },
  { id: '7', time: '12 PM', peopleCount: 28, percentage: 47 },
  { id: '8', time: '1 PM', peopleCount: 24, percentage: 40 },
  { id: '9', time: '2 PM', peopleCount: 19, percentage: 32 },
  { id: '10', time: '3 PM', peopleCount: 23, percentage: 38 },
  { id: '11', time: '4 PM', peopleCount: 38, percentage: 63 },
  { id: '12', time: '5 PM', peopleCount: 49, percentage: 82, isHigh: true },
  { id: '13', time: '6 PM', peopleCount: 54, percentage: 90, isHigh: true },
  { id: '14', time: '7 PM', peopleCount: 58, percentage: 97, isHighest: true },
  { id: '15', time: '8 PM', peopleCount: 44, percentage: 73 },
  { id: '16', time: '9 PM', peopleCount: 30, percentage: 50 },
  { id: '17', time: '10 PM', peopleCount: 15, percentage: 25 },
];

export const SchedulePage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');

  const filteredSchedule = HOURLY_SCHEDULE.filter((item) => {
    const hourNumber = parseInt(item.time.split(' ')[0], 10);
    const isPM = item.time.includes('PM');

    if (activeFilter === 'morning') {
      return !isPM && hourNumber >= 6 && hourNumber <= 11;
    }
    if (activeFilter === 'afternoon') {
      return (isPM && hourNumber === 12) || (isPM && hourNumber >= 1 && hourNumber <= 4);
    }
    if (activeFilter === 'evening') {
      return isPM && hourNumber >= 5;
    }
    return true;
  });

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
            AI-modeled hourly traffic predictions based on historical gym attendance patterns.
          </p>
        </div>

        {/* Date Badge */}
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-[10px] border border-[#dedede] self-start md:self-auto shadow-sm">
          <Calendar className="w-4 h-4 text-gym-dark" />
          <span className="text-xs font-bold text-gym-dark">Today, 22 August 2026</span>
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
            Avg. ~18–22 people. Ideal for cardio & squat racks without waiting.
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
            Avg. ~19–23 people. Minimum wait times across all equipment zones.
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
            Capacity reaches 90%–97%. Expected equipment wait times 15–25 mins.
          </p>
        </Card>
      </div>

      {/* Hourly Schedule Timeline Card */}
      <Card className="p-6 md:p-8 bg-white border-[#dedede]">
        {/* Time of Day Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-[#eee]">
          <div>
            <h3 className="text-lg font-extrabold text-gym-dark">
              Hourly Attendance Curve
            </h3>
            <p className="text-xs text-gym-subtle mt-0.5">
              Live capacity benchmark: 60 maximum occupants.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-[#f0f0f0] p-1 rounded-[9px]">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-[7px] transition-colors ${
                activeFilter === 'all'
                  ? 'bg-white text-gym-dark shadow-sm'
                  : 'text-gym-subtle hover:text-gym-dark'
              }`}
            >
              All Day
            </button>
            <button
              onClick={() => setActiveFilter('morning')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-[7px] transition-colors ${
                activeFilter === 'morning'
                  ? 'bg-white text-gym-dark shadow-sm'
                  : 'text-gym-subtle hover:text-gym-dark'
              }`}
            >
              Morning (6-11)
            </button>
            <button
              onClick={() => setActiveFilter('afternoon')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-[7px] transition-colors ${
                activeFilter === 'afternoon'
                  ? 'bg-white text-gym-dark shadow-sm'
                  : 'text-gym-subtle hover:text-gym-dark'
              }`}
            >
              Afternoon (12-4)
            </button>
            <button
              onClick={() => setActiveFilter('evening')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-[7px] transition-colors ${
                activeFilter === 'evening'
                  ? 'bg-white text-gym-dark shadow-sm'
                  : 'text-gym-subtle hover:text-gym-dark'
              }`}
            >
              Evening (5-10)
            </button>
          </div>
        </div>

        {/* Schedule List */}
        <div className="space-y-4">
          {filteredSchedule.map((row) => {
            let statusText = 'Low Crowd';
            let statusBadge = 'bg-emerald-50 text-emerald-800 border-emerald-200';
            let barColor = 'bg-emerald-500';

            if (row.percentage >= 75) {
              statusText = row.isHighest ? 'Maximum Surge' : 'High Crowd';
              statusBadge = 'bg-red-50 text-red-800 border-red-200';
              barColor = 'bg-red-500';
            } else if (row.percentage >= 40) {
              statusText = 'Moderate';
              statusBadge = 'bg-amber-50 text-amber-800 border-amber-200';
              barColor = 'bg-amber-500';
            }

            return (
              <div
                key={row.id}
                className="grid grid-cols-[65px_1fr_110px_90px] items-center gap-4 text-xs py-1 hover:bg-[#fafafa] rounded-md px-2 transition-colors"
              >
                {/* Time Label */}
                <span className="font-bold text-gym-dark">{row.time}</span>

                {/* Animated Capacity Bar */}
                <div className="space-y-1">
                  <div className="h-[10px] w-full bg-[#eeeeee] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${row.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Headcount */}
                <span className="text-gym-subtle font-medium text-right">
                  <strong className="text-gym-dark">{row.peopleCount}</strong> / 60 people
                </span>

                {/* Status Tag */}
                <div className="text-right">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge}`}
                  >
                    {statusText}
                  </span>
                </div>
              </div>
            );
          })}
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
              Less than 25 members present. Zero wait times for power racks, benches, and free weights.
            </p>
          </div>
        </div>

        <Button
          asChild
          className="h-10 px-5 rounded-[9px] bg-gym-dark hover:bg-[#3a3a3a] text-white text-xs font-bold gap-2 shrink-0"
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
