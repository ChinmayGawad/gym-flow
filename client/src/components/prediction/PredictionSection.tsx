import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { HourlyPrediction } from '@/types/occupancy';

const PREDICTION_DATA: HourlyPrediction[] = [
  { id: '1', time: '6 AM', peopleCount: 18, percentage: 31 },
  { id: '2', time: '8 AM', peopleCount: 30, percentage: 52 },
  { id: '3', time: '10 AM', peopleCount: 25, percentage: 43 },
  { id: '4', time: '12 PM', peopleCount: 28, percentage: 47 },
  { id: '5', time: '2 PM', peopleCount: 20, percentage: 34 },
  { id: '6', time: '5 PM', peopleCount: 50, percentage: 83, isHigh: true },
  { id: '7', time: '7 PM', peopleCount: 58, percentage: 96, isHighest: true },
  { id: '8', time: '9 PM', peopleCount: 32, percentage: 53 },
];

export const PredictionSection: React.FC = () => {
  return (
    <section id="prediction" className="pt-8 scroll-mt-24">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-2">
        <div>
          <span className="text-[11px] font-bold tracking-wider text-gym-subtle uppercase block">
            CROWD PREDICTION
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight text-gym-dark mt-0.5">
            Today's Gym Crowd
          </h2>
        </div>
        <span className="text-xs text-[#888] font-medium">
          21 August 2026
        </span>
      </div>

      {/* Hourly Prediction List Container */}
      <Card className="p-6 sm:p-7 bg-white border-[#dedede]">
        <div className="space-y-4.5">
          {PREDICTION_DATA.map((row) => {
            const isRush = row.isHigh || row.isHighest;
            const barFillColor = isRush ? 'bg-[#444444]' : 'bg-[#8b8b8b]';

            return (
              <div
                key={row.id}
                className="grid grid-cols-[55px_1fr_90px] items-center gap-4 text-xs"
              >
                <span className="font-semibold text-[#555]">{row.time}</span>

                {/* Progress track */}
                <div className="h-[9px] w-full bg-[#ededed] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barFillColor}`}
                    style={{ width: `${row.percentage}%` }}
                  />
                </div>

                <span className="text-right text-gym-subtle font-medium">
                  {row.peopleCount} people
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Recommendation Banner */}
      <div className="mt-5 p-5 rounded-[13px] bg-[#f0f0f0] flex items-center gap-4">
        <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-gym-dark shadow-sm shrink-0">
          <Star className="w-5 h-5 fill-gym-dark text-gym-dark" />
        </div>

        <div className="flex-1">
          <span className="text-[10px] font-bold tracking-wider text-gym-subtle uppercase block">
            RECOMMENDED TIME
          </span>
          <h3 className="text-base font-extrabold text-gym-dark leading-tight mt-0.5">
            10:00 AM – 11:00 AM
          </h3>
          <p className="text-xs text-gym-subtle font-medium mt-0.5">
            Expected crowd: 25 people
          </p>
        </div>

        <Badge variant="low" className="px-3 py-1 text-[10px]">
          LOW
        </Badge>
      </div>
    </section>
  );
};
