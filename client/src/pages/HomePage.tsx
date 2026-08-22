import React from 'react';
import { Link } from 'react-router-dom';
import { WelcomeSection } from '@/components/dashboard/WelcomeSection';
import { CrowdCard } from '@/components/dashboard/CrowdCard';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { BestTimeCard } from '@/components/dashboard/BestTimeCard';
import { OccupancySimulatorControl } from '@/components/dashboard/OccupancySimulatorControl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useOccupancy } from '@/hooks/useOccupancy';
import { Calendar, Clock, ArrowRight, Activity, TrendingUp } from 'lucide-react';

interface HomePageProps {
  displayName: string;
  userPlan?: string;
  occupancy: ReturnType<typeof useOccupancy>;
}

export const HomePage: React.FC<HomePageProps> = ({
  displayName,
  userPlan,
  occupancy,
}) => {
  return (
    <div className="space-y-6">
      {/* Welcome Banner with Indian Membership Plan Badge */}
      <WelcomeSection userName={displayName} plan={userPlan} />

      {/* Current Occupancy Hero Card */}
      <CrowdCard data={occupancy} />

      {/* Quick Stats Grid */}
      <QuickStats
        peopleCount={occupancy.peopleCount}
        waitTime={occupancy.waitTime}
      />

      {/* Best Time Recommendation Card */}
      <BestTimeCard />

      {/* Live Simulation Controls */}
      <OccupancySimulatorControl
        isAutoSimulating={occupancy.isAutoSimulating}
        onToggleAutoSimulating={occupancy.toggleAutoSimulating}
        onIncrement={occupancy.increment}
        onDecrement={occupancy.decrement}
        onSetOccupants={occupancy.setOccupants}
      />

      {/* Navigation Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
        <Card className="p-6 bg-white border-[#dedede] hover:border-gym-dark transition-all duration-200 group">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-full bg-[#f0f0f0] group-hover:bg-gym-dark group-hover:text-white flex items-center justify-center text-gym-dark transition-colors">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold tracking-wider text-gym-subtle uppercase">
              Schedule & Trends
            </span>
          </div>
          <h3 className="text-lg font-extrabold text-gym-dark mt-3">
            Today's Crowd Predictions
          </h3>
          <p className="text-xs text-gym-subtle mt-1 mb-4">
            Discover predicted peak rush hours, hourly headcount curves, and recommended low-traffic time slots.
          </p>
          <Button
            asChild
            variant="outline"
            className="w-full text-xs font-bold rounded-[9px] border-[#dedede] text-gym-dark hover:bg-gym-dark hover:text-white transition-colors gap-2 justify-center"
          >
            <Link to="/schedule">
              View Hourly Predictions
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </Card>

        <Card className="p-6 bg-white border-[#dedede] hover:border-gym-dark transition-all duration-200 group">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-full bg-[#f0f0f0] group-hover:bg-gym-dark group-hover:text-white flex items-center justify-center text-gym-dark transition-colors">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold tracking-wider text-gym-subtle uppercase">
              Personal Logs
            </span>
          </div>
          <h3 className="text-lg font-extrabold text-gym-dark mt-3">
            Your Visit History
          </h3>
          <p className="text-xs text-gym-subtle mt-1 mb-4">
            Review past gym check-ins, average workout duration, and weekly attendance consistency.
          </p>
          <Button
            asChild
            variant="outline"
            className="w-full text-xs font-bold rounded-[9px] border-[#dedede] text-gym-dark hover:bg-gym-dark hover:text-white transition-colors gap-2 justify-center"
          >
            <Link to="/history">
              View Visit History
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </Card>
      </div>
    </div>
  );
};
