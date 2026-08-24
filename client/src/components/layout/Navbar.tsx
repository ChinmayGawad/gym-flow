import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  Dumbbell,
  Home,
  Calendar,
  Clock,
  User,
  Users,
  LogOut,
  ShieldCheck,
  TrendingUp,
  Radio,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSession, signOut } from '@/lib/auth-client';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

interface NavbarProps {
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth }) => {
  const location = useLocation();
  const { data: session } = useSession();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const user = session?.user as (NonNullable<typeof session>['user'] & { role?: string; plan?: string }) | undefined;
  const isAdmin = user?.role === 'admin';
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : user?.email ? user.email.charAt(0).toUpperCase() : 'M';
  const isHistoryActive = location.pathname === '/history' || location.pathname === '/log-workout';
  const isProfileActive = location.pathname === '/profile';

  return (
    <>
      {/* Top Sticky Navbar */}
      <header className="sticky top-0 z-50 h-[68px] w-full glass-nav border-b border-black/[0.06] dark:border-white/[0.08] px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-all">
        {/* Left Zone: Brand Logo */}
        <div className="flex items-center justify-start">
          <Link
            to="/"
            className="flex items-center gap-2.5 group transition-opacity"
          >
            <div className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Dumbbell className="h-4.5 w-4.5 stroke-[2.5]" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-white">
                GYMFLOW
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50">
                <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-500" />
                LIVE
              </span>
            </div>
          </Link>
        </div>

        {/* Center Zone: Centered Desktop Navigation Links */}
        <nav className="hidden md:flex items-center justify-center gap-1 bg-zinc-100/80 dark:bg-zinc-900/80 p-1 rounded-2xl border border-black/[0.04] dark:border-white/[0.06]">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs font-bold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-800/60'
              }`
            }
          >
            <Home className="h-3.5 w-3.5" />
            Home
          </NavLink>

          <NavLink
            to="/schedule"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs font-bold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-800/60'
              }`
            }
          >
            <Calendar className="h-3.5 w-3.5" />
            Schedule
          </NavLink>

          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs font-bold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-800/60'
              }`
            }
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Analytics
          </NavLink>

          <Link
            to="/history"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
              isHistoryActive
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs font-bold'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-800/60'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            History
          </Link>

          {/* Admin-Only Members Link */}
          {isAdmin && (
            <NavLink
              to="/members"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-xs font-bold'
                    : 'text-amber-800 dark:text-amber-300 hover:bg-amber-100/70 dark:hover:bg-amber-950/40'
                }`
              }
            >
              <Users className="h-3.5 w-3.5" />
              Members
            </NavLink>
          )}
        </nav>

        {/* Right Zone: User Profile, Theme Toggle & Actions */}
        <div className="flex items-center justify-end gap-2.5">
          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* Desktop User Status */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2 bg-white/70 dark:bg-zinc-900/80 border border-black/[0.05] dark:border-white/[0.08] pl-1.5 pr-2 py-1 rounded-full shadow-xs">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  title="View Member Pass & Profile"
                >
                  <div className="w-6 h-6 rounded-full bg-zinc-900 dark:bg-zinc-800 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    {userInitial}
                  </div>

                  {isAdmin && (
                    <Badge className="bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60 font-bold text-[9px] uppercase gap-1 px-1.5 py-0">
                      <ShieldCheck className="w-2.5 h-2.5 text-amber-700 dark:text-amber-400" />
                      Admin
                    </Badge>
                  )}

                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 max-w-[110px] truncate">
                    {user.name || user.email?.split('@')[0]}
                  </span>
                </Link>

                <button
                  onClick={handleSignOut}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors ml-0.5 cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <User className="h-3.5 w-3.5" />
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Header Right Profile / Sign In Button */}
          <div className="flex items-center gap-2 md:hidden">
            {user ? (
              <Link
                to="/profile"
                className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-zinc-800 text-white flex items-center justify-center text-xs font-bold shadow-xs"
                title="Member Profile"
              >
                {userInitial}
              </Link>
            ) : (
              <Button
                onClick={onOpenAuth}
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                title="Sign In"
              >
                <User className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (5 clean items with 44px+ touch targets) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-nav border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-around h-16 px-1 shadow-card">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-semibold transition-colors min-w-[48px] ${
              isActive ? 'text-zinc-900 dark:text-white font-bold' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={`p-1 rounded-xl mb-0.5 transition-colors ${
                  isActive ? 'bg-zinc-900 dark:bg-zinc-800 text-white' : ''
                }`}
              >
                <Home className="w-4 h-4" />
              </div>
              <span>Home</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/schedule"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-semibold transition-colors min-w-[48px] ${
              isActive ? 'text-zinc-900 dark:text-white font-bold' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={`p-1 rounded-xl mb-0.5 transition-colors ${
                  isActive ? 'bg-zinc-900 dark:bg-zinc-800 text-white' : ''
                }`}
              >
                <Calendar className="w-4 h-4" />
              </div>
              <span>Schedule</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/analytics"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-semibold transition-colors min-w-[48px] ${
              isActive ? 'text-zinc-900 dark:text-white font-bold' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={`p-1 rounded-xl mb-0.5 transition-colors ${
                  isActive ? 'bg-zinc-900 dark:bg-zinc-800 text-white' : ''
                }`}
              >
                <TrendingUp className="w-4 h-4" />
              </div>
              <span>Analytics</span>
            </>
          )}
        </NavLink>

        <Link
          to="/history"
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-semibold transition-colors min-w-[48px] ${
            isHistoryActive ? 'text-zinc-900 dark:text-white font-bold' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <div
            className={`p-1 rounded-xl mb-0.5 transition-colors ${
              isHistoryActive ? 'bg-zinc-900 dark:bg-zinc-800 text-white' : ''
            }`}
          >
            <Clock className="w-4 h-4" />
          </div>
          <span>History</span>
        </Link>

        <Link
          to="/profile"
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-semibold transition-colors min-w-[48px] ${
            isProfileActive ? 'text-zinc-900 dark:text-white font-bold' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <div
            className={`p-1 rounded-xl mb-0.5 transition-colors ${
              isProfileActive ? 'bg-zinc-900 dark:bg-zinc-800 text-white' : ''
            }`}
          >
            <User className="w-4 h-4" />
          </div>
          <span>Profile</span>
        </Link>
      </nav>
    </>
  );
};
