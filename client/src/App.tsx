import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { WelcomeSection } from '@/components/dashboard/WelcomeSection';
import { CrowdCard } from '@/components/dashboard/CrowdCard';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { BestTimeCard } from '@/components/dashboard/BestTimeCard';
import { OccupancySimulatorControl } from '@/components/dashboard/OccupancySimulatorControl';
import { PredictionSection } from '@/components/prediction/PredictionSection';
import { VisitHistorySection } from '@/components/history/VisitHistorySection';
import { AuthModal } from '@/components/auth/AuthModal';
import { CreateMemberModal } from '@/components/admin/CreateMemberModal';
import { Button } from '@/components/ui/button';
import { useOccupancy } from '@/hooks/useOccupancy';
import { useSession } from '@/lib/auth-client';
import { ArrowRight } from 'lucide-react';

export function App() {
  const occupancy = useOccupancy(42, 60);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCreateMemberOpen, setIsCreateMemberOpen] = useState(false);

  const { data: session } = useSession();

  const handleScrollToPrediction = () => {
    const section = document.getElementById('prediction');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const displayName = session?.user?.name || (session?.user?.email ? session.user.email.split('@')[0] : 'Gym Member');

  return (
    <div className="min-h-screen bg-gym-canvas text-gym-dark flex flex-col font-sans">
      {/* Sticky Navbar */}
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenCreateMember={() => setIsCreateMemberOpen(true)}
      />

      {/* Main Container */}
      <main className="w-[90%] max-w-[1100px] mx-auto py-10 md:py-14 pb-20 flex-1">
        {/* Welcome Banner */}
        <WelcomeSection userName={displayName} />

        {/* Current Occupancy Hero Card */}
        <CrowdCard data={occupancy} />

        {/* Quick Stats Grid */}
        <QuickStats
          peopleCount={occupancy.peopleCount}
          waitTime={occupancy.waitTime}
        />

        {/* Best Time Recommendation Card */}
        <BestTimeCard />

        {/* Developer / User Live Simulation Controls */}
        <OccupancySimulatorControl
          isAutoSimulating={occupancy.isAutoSimulating}
          onToggleAutoSimulating={occupancy.toggleAutoSimulating}
          onIncrement={occupancy.increment}
          onDecrement={occupancy.decrement}
          onSetOccupants={occupancy.setOccupants}
        />

        {/* View Prediction CTA Button */}
        <div className="flex justify-center my-8 md:my-12">
          <Button
            onClick={handleScrollToPrediction}
            className="h-12 px-8 rounded-[9px] bg-gym-dark hover:bg-[#3a3a3a] text-white text-xs font-extrabold tracking-wider gap-2 uppercase shadow-md transition-all hover:-translate-y-0.5"
          >
            VIEW TODAY'S CROWD
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Crowd Prediction Timeline Section */}
        <PredictionSection />

        {/* Recent Member Visits Activity Section */}
        <VisitHistorySection />
      </main>

      {/* Authentication Sign-In Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {/* Admin Member Registration Modal */}
      <CreateMemberModal
        isOpen={isCreateMemberOpen}
        onClose={() => setIsCreateMemberOpen(false)}
      />
    </div>
  );
}

export default App;
