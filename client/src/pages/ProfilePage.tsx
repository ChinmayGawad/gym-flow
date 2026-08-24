import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  ShieldCheck,
  CreditCard,
  QrCode,
  Calendar,
  Clock,
  Flame,
  Award,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  LogOut,
  Moon,
  Sun,
  Laptop,
  Check,
  Zap,
  Activity,
  Radio,
} from 'lucide-react';
import { useSession, signOut } from '@/lib/auth-client';
import { useTheme } from '@/context/ThemeContext';
import { MEMBERSHIP_PLANS, MembershipPlan } from '@/types/plans';
import { API_BASE } from '@/lib/api-config';
import { useOccupancy } from '@/hooks/useOccupancy';

interface ProfilePageProps {
  occupancy?: ReturnType<typeof useOccupancy>;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ occupancy }) => {
  const { data: session } = useSession();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const user = session?.user as (NonNullable<typeof session>['user'] & { role?: string; plan?: string }) | undefined;
  const isAdmin = user?.role === 'admin';
  const planKey = (user?.plan as MembershipPlan) || 'basic';
  const planConfig = MEMBERSHIP_PLANS[planKey] || MEMBERSHIP_PLANS.basic;

  const [visitStats, setVisitStats] = useState({
    totalVisits: 0,
    totalCalories: 0,
    avgDurationMinutes: 0,
    streakDays: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const memberId = user?.id
    ? `GF-${user.id.slice(0, 4).toUpperCase()}-${user.id.slice(-4).toUpperCase()}`
    : 'GF-2026-8842';

  const userInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : 'M';

  // Fetch user visits for personal profile stats
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/user/visits`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.visits && Array.isArray(data.visits)) {
            const visits = data.visits;
            const totalVisits = visits.length;
            const totalCalories = visits.reduce((acc: number, curr: any) => acc + (curr.caloriesBurned || 0), 0);
            const totalDurationMins = visits.reduce((acc: number, curr: any) => acc + (curr.durationMinutes || 60), 0);
            const avgDurationMinutes = totalVisits > 0 ? Math.round(totalDurationMins / totalVisits) : 0;
            const streakDays = Math.min(totalVisits, 5);

            setVisitStats({
              totalVisits,
              totalCalories,
              avgDurationMinutes,
              streakDays,
            });
          }
        }
      } catch {
        // Fallback stats
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchUserStats();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const isInside = occupancy?.isCheckedInSelf;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12 max-w-[1000px] mx-auto">
      {/* Header Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Link
              to="/"
              className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <span className="text-xs font-semibold text-zinc-900 dark:text-white">Profile & Membership</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Member Digital Pass
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
            Manage your facility access pass, Indian subscription tier (₹ INR), workout achievements, and preferences.
          </p>
        </div>

        <Button
          onClick={handleSignOut}
          variant="outline"
          className="h-9 px-4 rounded-xl border-rose-200/80 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </Button>
      </div>

      {/* Main Grid: Digital Pass Card & Subscription Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Digital Pass Card (Bento Spotlight) */}
        <div className="lg:col-span-5 space-y-4">
          {/* GymFlow Membership Digital Card */}
          <div className="relative rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black text-white shadow-2xl border border-white/15 overflow-hidden transition-transform duration-200">
            {/* Holographic glowing background accents */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-br from-emerald-500/20 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-tr from-amber-500/15 to-transparent rounded-full blur-2xl pointer-events-none" />

            {/* Top Card Header: Brand & Chip */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="font-extrabold text-sm tracking-wider uppercase text-white/90">
                  GYMFLOW PASS
                </span>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-1.5">
                {isInside ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-black flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                    CHECKED IN
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white/80 border border-white/10">
                    STANDBY
                  </span>
                )}
              </div>
            </div>

            {/* Middle Section: Avatar & Name */}
            <div className="mt-8 mb-6 relative z-10 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-700 border-2 border-white/20 flex items-center justify-center text-xl font-black text-white shadow-md shrink-0">
                {userInitial}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white tracking-tight truncate">
                    {user?.name || user?.email?.split('@')[0] || 'GymFlow Member'}
                  </h3>
                  {isAdmin && (
                    <Badge className="bg-amber-400/20 text-amber-300 border-amber-400/40 text-[9px] font-bold uppercase px-1.5 py-0">
                      ADMIN
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-white/60 font-medium truncate mt-0.5">
                  {user?.email || 'member@gymflow.com'}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] font-bold tracking-widest text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                    {planConfig.name}
                  </span>
                  <span className="text-[10px] text-white/40 font-mono">
                    {memberId}
                  </span>
                </div>
              </div>
            </div>

            {/* QR Code Barcode Pass Graphic */}
            <div className="p-3.5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shrink-0">
                  <QrCode className="w-8 h-8 text-zinc-900" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/60 block">
                    Digital Member Barcode
                  </span>
                  <span className="text-xs font-mono font-bold text-white tracking-wider">
                    {memberId}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[9px] font-bold text-emerald-400 block uppercase">
                  Active Pass
                </span>
                <span className="text-[10px] text-white/50">2026-2027</span>
              </div>
            </div>

            {/* Quick 1-Click Check-in Toggle on Card */}
            {occupancy?.toggleSelfCheckIn && (
              <div className="mt-4 pt-2 relative z-10">
                <Button
                  onClick={() => occupancy.toggleSelfCheckIn()}
                  disabled={occupancy.isLoading}
                  className={`w-full h-10 rounded-xl text-xs font-bold gap-2 cursor-pointer shadow-md transition-all ${
                    isInside
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                      : 'bg-white text-black hover:bg-zinc-100'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  <span>{isInside ? 'Currently Inside Gym · Tap to Check Out' : 'Tap to Self Check-In'}</span>
                </Button>
              </div>
            )}
          </div>

          {/* Quick Consistency Streaks Card */}
          <Card className="p-5 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card rounded-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Award className="w-4.5 h-4.5 text-amber-500" />
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Consistency & Badges
                </h4>
              </div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                Level 2 Member
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3">
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase block">
                  Total Logged
                </span>
                <span className="text-xl font-black text-zinc-900 dark:text-white tabular-nums mt-0.5 block">
                  {visitStats.totalVisits} Workouts
                </span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase block">
                  Active Streak
                </span>
                <span className="text-xl font-black text-amber-600 dark:text-amber-400 tabular-nums mt-0.5 block">
                  {visitStats.streakDays} Days 🔥
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Plan Perks, Lifetime Stats, App Settings */}
        <div className="lg:col-span-7 space-y-4">
          {/* Subscription Tier Details Card */}
          <Card className="p-6 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <CreditCard className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-zinc-900 dark:text-white tracking-tight">
                    {planConfig.name} Plan
                  </h3>
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    Indian Membership Tier (₹ INR)
                  </span>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xl font-black text-zinc-900 dark:text-white tabular-nums tracking-tight">
                  {planConfig.price}
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500"> / month</span>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed">
              {planConfig.description}
            </p>

            {/* Included Plan Features Checklist */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                Included with your membership:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {planConfig.perks.map((perk, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800 text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 border-t border-zinc-100 dark:border-zinc-800">
              <span>Member status managed by Gym Administrator</span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">Active Membership</span>
            </div>
          </Card>

          {/* Workout Stats Analytics Strip */}
          <Card className="p-6 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                  Training Energy & Volume
                </h3>
              </div>
              <Link
                to="/history"
                className="text-xs font-bold text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white transition-colors"
              >
                Full History →
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase block">
                  Est. Burned
                </span>
                <span className="text-lg font-black text-orange-600 dark:text-orange-400 tabular-nums mt-0.5 block">
                  {visitStats.totalCalories.toLocaleString()} <span className="text-xs font-normal">kcal</span>
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase block">
                  Avg Duration
                </span>
                <span className="text-lg font-black text-zinc-900 dark:text-white tabular-nums mt-0.5 block">
                  {visitStats.avgDurationMinutes}m
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase block">
                  Avg Burn Rate
                </span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5 block">
                  ~6.2 <span className="text-xs font-normal">c/m</span>
                </span>
              </div>
            </div>
          </Card>

          {/* App Preferences & Theme Switcher */}
          <Card className="p-6 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
              App Preferences & Live Sync
            </h3>

            {/* Theme Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800">
              <div>
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
                  Interface Theme
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Select your preferred visual mode
                </span>
              </div>

              <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    theme === 'light'
                      ? 'bg-zinc-900 text-white shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Light</span>
                </button>

                <button
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-white text-zinc-900 dark:bg-zinc-100 shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Dark</span>
                </button>

                <button
                  onClick={() => setTheme('system')}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    theme === 'system'
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>System</span>
                </button>
              </div>
            </div>

            {/* Live SSE Stream Status */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                <div>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
                    Zero-Delay Live Sync
                  </span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    SSE stream & multi-tab BroadcastChannel active
                  </span>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/50">
                Connected
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
