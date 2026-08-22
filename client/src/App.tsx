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
import { PageTransition } from '@/components/layout/PageTransition';
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

  // 1. Session check skeleton loading screen
  if (isPending) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
        {/* Skeleton Top Navbar */}
        <header className="h-[72px] w-full border-b border-black/[0.06] bg-white/70 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-card animate-pulse">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <div className="h-5 w-24 rounded-lg bg-zinc-200/80 animate-shimmer" />
          </div>
          <div className="hidden md:flex items-center gap-2">
            <div className="h-8 w-20 rounded-xl bg-zinc-200/60 animate-shimmer" />
            <div className="h-8 w-24 rounded-xl bg-zinc-200/60 animate-shimmer" />
            <div className="h-8 w-20 rounded-xl bg-zinc-200/60 animate-shimmer" />
          </div>
          <div className="h-9 w-9 rounded-full bg-zinc-200/70 animate-shimmer" />
        </header>

        {/* Skeleton Page Content */}
        <main className="w-[90%] max-w-[1100px] mx-auto py-8 md:py-12 space-y-6 flex-1">
          {/* Welcome skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-zinc-100">
            <div className="space-y-2">
              <div className="h-7 w-56 rounded-xl bg-zinc-200/80 animate-shimmer" />
              <div className="h-4 w-72 rounded-lg bg-zinc-200/50 animate-shimmer" />
            </div>
            <div className="h-7 w-28 rounded-full bg-zinc-200/60 animate-shimmer" />
          </div>

          {/* Crowd Hero Card Skeleton */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-black/[0.06] shadow-card flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 w-full md:w-1/2">
              <div className="h-4 w-28 rounded-lg bg-zinc-200/60 animate-shimmer" />
              <div className="h-9 w-44 rounded-xl bg-zinc-200/80 animate-shimmer" />
              <div className="h-4 w-60 rounded-lg bg-zinc-200/50 animate-shimmer" />
              <div className="h-10 w-40 rounded-xl bg-zinc-200/70 animate-shimmer mt-2" />
            </div>
            <div className="w-36 h-36 rounded-full bg-zinc-200/60 animate-shimmer shrink-0" />
          </div>

          {/* Quick Stats Grid Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-5 rounded-2xl bg-white border border-black/[0.06] shadow-card space-y-3">
                <div className="w-9 h-9 rounded-xl bg-zinc-200/70 animate-shimmer" />
                <div className="h-3 w-20 rounded-md bg-zinc-200/60 animate-shimmer" />
                <div className="h-7 w-24 rounded-lg bg-zinc-200/80 animate-shimmer" />
              </div>
            ))}
          </div>
        </main>
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

        {/* Main Content Area with Smooth Page Transition */}
        <main className="w-[90%] max-w-[1100px] mx-auto py-8 md:py-12 pb-24 md:pb-16 flex-1">
          <PageTransition>
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
          </PageTransition>
        </main>


        {/* Authentication Sign-In Modal (Optional inside app) */}
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      </div>
    </BrowserRouter>
  );
}

export default App;

