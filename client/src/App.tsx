import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { HomePage } from '@/pages/HomePage';
import { SchedulePage } from '@/pages/SchedulePage';
import { HistoryPage } from '@/pages/HistoryPage';
import { MembersPage } from '@/pages/MembersPage';
import { AuthPage } from '@/pages/AuthPage';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { AuthModal } from '@/components/auth/AuthModal';
import { useOccupancy } from '@/hooks/useOccupancy';
import { useSession } from '@/lib/auth-client';
import { Dumbbell, Loader2 } from 'lucide-react';

export function App() {
  const occupancy = useOccupancy(18, 30);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const { data: session, isPending } = useSession();
  const user = session?.user as (NonNullable<typeof session>['user'] & { role?: string; plan?: string }) | undefined;
  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Gym Member');
  const userPlan = user?.plan;
  const isAdmin = user?.role === 'admin';
  const isLoggedIn = !!user;

  // 1. Session check loading state
  if (isPending) {
    return (
      <div className="min-h-screen bg-gym-canvas flex flex-col items-center justify-center font-sans gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gym-dark text-white flex items-center justify-center shadow-md animate-pulse">
          <Dumbbell className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gym-dark">
          <Loader2 className="w-4 h-4 animate-spin text-gym-dark" />
          <span>Verifying GymFlow session...</span>
        </div>
      </div>
    );
  }

  // 2. Authentication Barrier: Only open app when user is signed in / logged in
  if (!isLoggedIn) {
    return <AuthPage />;
  }

  // 3. Authenticated App Experience
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
                  isAdmin={isAdmin}
                  isLoggedIn={isLoggedIn}
                  occupancy={occupancy}
                  onOpenAuth={() => setIsAuthOpen(true)}
                />
              }
            />
            <Route
              path="/schedule"
              element={<SchedulePage capacity={occupancy.capacity} />}
            />
            <Route path="/history" element={<HistoryPage />} />
            <Route
              path="/members"
              element={
                <AdminRoute onOpenAuth={() => setIsAuthOpen(true)}>
                  <MembersPage
                    occupancy={occupancy}
                  />
                </AdminRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Authentication Sign-In Modal (Optional inside app) */}
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      </div>
    </BrowserRouter>
  );
}

export default App;

