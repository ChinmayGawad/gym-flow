import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { HomePage } from '@/pages/HomePage';
import { SchedulePage } from '@/pages/SchedulePage';
import { HistoryPage } from '@/pages/HistoryPage';
import { MembersPage } from '@/pages/MembersPage';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { AuthModal } from '@/components/auth/AuthModal';
import { useOccupancy } from '@/hooks/useOccupancy';
import { useSession } from '@/lib/auth-client';

export function App() {
  const occupancy = useOccupancy(42, 60);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const { data: session } = useSession();
  const user = session?.user as (NonNullable<typeof session>['user'] & { role?: string; plan?: string }) | undefined;
  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Gym Member');
  const userPlan = user?.plan;

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gym-canvas text-gym-dark flex flex-col font-sans">
        {/* Sticky Navbar with Routing Navigation */}
        <Navbar onOpenAuth={() => setIsAuthOpen(true)} />

        {/* Main Content Area */}
        <main className="w-[90%] max-w-[1100px] mx-auto py-8 md:py-12 pb-24 md:pb-16 flex-1">
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  displayName={displayName}
                  userPlan={userPlan}
                  occupancy={occupancy}
                />
              }
            />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route
              path="/members"
              element={
                <AdminRoute onOpenAuth={() => setIsAuthOpen(true)}>
                  <MembersPage />
                </AdminRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Authentication Sign-In Modal */}
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      </div>
    </BrowserRouter>
  );
}

export default App;
