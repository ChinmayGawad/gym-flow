import React, { useState } from 'react';
import { WelcomeSection } from '@/components/dashboard/WelcomeSection';
import { CrowdCard } from '@/components/dashboard/CrowdCard';
import { TodayRushSparkline } from '@/components/dashboard/TodayRushSparkline';
import { RecentActivityStrip } from '@/components/dashboard/RecentActivityStrip';
import { OccupancySimulatorControl } from '@/components/dashboard/OccupancySimulatorControl';
import { CapacitySettingsModal } from '@/components/admin/CapacitySettingsModal';
import { useOccupancy } from '@/hooks/useOccupancy';

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
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* 1. Welcome Greeting with Membership Badge */}
      <WelcomeSection userName={displayName} plan={userPlan} />

      {/* 2. Unified Live Gym Pulse Hero Card */}
      <CrowdCard
        data={occupancy}
        isAdmin={isAdmin}
        isLoggedIn={isLoggedIn}
        onToggleSelfCheckIn={occupancy.toggleSelfCheckIn}
        onOpenCapacityModal={() => setIsCapacityModalOpen(true)}
        onOpenAuth={onOpenAuth}
        isLoadingCheckIn={occupancy.isLoading}
      />

      {/* 3. Glanceable Today's Crowd Wave Sparkline */}
      <TodayRushSparkline capacity={occupancy.capacity} />

      {/* 4. Training Activity & Log Workout Shortcut */}
      <RecentActivityStrip isLoggedIn={isLoggedIn} />

      {/* 5. Floating Progressive-Disclosure Simulator Controls */}
      <OccupancySimulatorControl
        isAutoSimulating={occupancy.isAutoSimulating}
        capacity={occupancy.capacity}
        onToggleAutoSimulating={occupancy.toggleAutoSimulating}
        onIncrement={occupancy.increment}
        onDecrement={occupancy.decrement}
        onSetOccupants={occupancy.setOccupants}
      />

      {/* 6. Gym Owner Capacity Modal */}
      <CapacitySettingsModal
        isOpen={isCapacityModalOpen}
        onClose={() => setIsCapacityModalOpen(false)}
        currentCapacity={occupancy.capacity}
        onSaveCapacity={occupancy.updateCapacity}
        gymName={occupancy.gymName}
      />
    </div>
  );
};
