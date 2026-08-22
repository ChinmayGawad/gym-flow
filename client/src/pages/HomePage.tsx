import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { WelcomeSection } from '@/components/dashboard/WelcomeSection';
import { CrowdCard } from '@/components/dashboard/CrowdCard';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { BestTimeCard } from '@/components/dashboard/BestTimeCard';
import { OccupancySimulatorControl } from '@/components/dashboard/OccupancySimulatorControl';
import { CapacitySettingsModal } from '@/components/admin/CapacitySettingsModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useOccupancy } from '@/hooks/useOccupancy';
import { Calendar, Clock, ArrowRight, TrendingUp } from 'lucide-react';

interface HomePageProps {
  displayName: string;
  userPlan?: string;
  isAdmin?: boolean;
  isLoggedIn?: boolean;
  occupancy: ReturnType<typeof useOccupancy>;
  onOpenAuth?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  displayName,
  userPlan,
  isAdmin = false,
  isLoggedIn = false,
  occupancy,
  onOpenAuth,
}) => {
  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome Banner with Membership Plan Badge */}
      <WelcomeSection userName={displayName} plan={userPlan} />

      {/* Current Occupancy Hero Card with Self Check-In & Capacity Options */}
      <CrowdCard
        data={occupancy}
        isAdmin={isAdmin}
        isLoggedIn={isLoggedIn}
        onToggleSelfCheckIn={occupancy.toggleSelfCheckIn}
        onOpenCapacityModal={() => setIsCapacityModalOpen(true)}
        onOpenAuth={onOpenAuth}
        isLoadingCheckIn={occupancy.isLoading}
      />

      {/* Quick Stats Grid with 4 Key Metrics */}
      <QuickStats
        peopleCount={occupancy.peopleCount}
        capacity={occupancy.capacity}
        totalRegisteredMembers={occupancy.totalRegisteredMembers}
        waitTime={occupancy.waitTime}
      />

      {/* Best Time Recommendation Card */}
      <BestTimeCard capacity={occupancy.capacity} />

      {/* Live Simulation Controls */}
      <OccupancySimulatorControl
        isAutoSimulating={occupancy.isAutoSimulating}
        capacity={occupancy.capacity}
        onToggleAutoSimulating={occupancy.toggleAutoSimulating}
        onIncrement={occupancy.increment}
        onDecrement={occupancy.decrement}
        onSetOccupants={occupancy.setOccupants}
      />

      {/* Gym Owner Capacity Modal */}
      <CapacitySettingsModal
        isOpen={isCapacityModalOpen}
        onClose={() => setIsCapacityModalOpen(false)}
        currentCapacity={occupancy.capacity}
        onSaveCapacity={occupancy.updateCapacity}
        gymName={occupancy.gymName}
      />

      {/* Navigation Bento Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <Card className="p-6 bg-white border border-black/[0.06] shadow-card hover:border-black/[0.12] hover:shadow-card-hover transition-all duration-200 group flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 group-hover:bg-zinc-900 group-hover:text-white flex items-center justify-center text-zinc-800 transition-colors">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                SCHEDULE & FORECAST
              </span>
            </div>
            <h3 className="text-lg font-black text-zinc-900 mt-4 tracking-tight">
              Hourly Attendance Wave
            </h3>
            <p className="text-xs text-zinc-500 mt-1 mb-5 leading-relaxed">
              Explore predicted rush waves, morning/afternoon quiet windows, and real-time attendance estimates.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="w-full text-xs font-bold rounded-xl border-zinc-200 text-zinc-800 hover:bg-zinc-900 hover:text-white transition-colors gap-2 justify-center"
          >
            <Link to="/schedule">
              View Hourly Predictions
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </Button>
        </Card>

        <Card className="p-6 bg-white border border-black/[0.06] shadow-card hover:border-black/[0.12] hover:shadow-card-hover transition-all duration-200 group flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 group-hover:bg-zinc-900 group-hover:text-white flex items-center justify-center text-zinc-800 transition-colors">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                PERSONAL LOGS
              </span>
            </div>
            <h3 className="text-lg font-black text-zinc-900 mt-4 tracking-tight">
              Workout Check-In History
            </h3>
            <p className="text-xs text-zinc-500 mt-1 mb-5 leading-relaxed">
              Review personal workout logs, average training duration, and weekly attendance consistency streaks.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="w-full text-xs font-bold rounded-xl border-zinc-200 text-zinc-800 hover:bg-zinc-900 hover:text-white transition-colors gap-2 justify-center"
          >
            <Link to="/history">
              View Workout Logs
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </Button>
        </Card>
      </div>
    </div>
  );
};

