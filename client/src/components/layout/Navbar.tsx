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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSession, signOut } from '@/lib/auth-client';

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

  const user = session?.user as (NonNullable<typeof session>['user'] & { role?: string }) | undefined;
  const isAdmin = user?.role === 'admin';
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : user?.email ? user.email.charAt(0).toUpperCase() : 'M';
  const isHistoryActive = location.pathname === '/history' || location.pathname === '/log-workout';

  return (
    <>
      {/* Top Sticky Navbar */}
      <header className="sticky top-0 z-50 h-[70px] w-full glass-nav border-b border-black/[0.06] px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-all">
        {/* Left Zone: Brand Logo */}
        <div className="flex-1 flex items-center justify-start">
          <Link
            to="/"
            className="flex items-center gap-2.5 group transition-opacity"
          >
            <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Dumbbell className="h-4.5 w-4.5 text-white" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-zinc-900">
                GYMFLOW
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-zinc-100 text-zinc-600 border border-zinc-200">
                LIVE
              </span>
            </div>
          </Link>
        </div>

        {/* Center Zone: Centered Desktop Navigation Links */}
        <nav className="hidden md:flex items-center justify-center gap-1.5 bg-zinc-100/80 p-1 rounded-2xl border border-black/[0.04]">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-white/60'
              }`
            }
          >
            <Home className="h-3.5 w-3.5" />
            Home
          </NavLink>

          <NavLink
            to="/schedule"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-white/60'
              }`
            }
          >
            <Calendar className="h-3.5 w-3.5" />
            Schedule
          </NavLink>

          <Link
            to="/history"
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
              isHistoryActive
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-white/60'
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
                `flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-amber-800 hover:bg-amber-100/70'
                }`
              }
            >
              <Users className="h-3.5 w-3.5" />
              Members
            </NavLink>
          )}
        </nav>

        {/* Right Zone: User Profile, Role Badge & Sign In/Out Actions */}
        <div className="flex-1 flex items-center justify-end gap-2.5">
          {/* Desktop User Status */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2 bg-white/60 border border-black/[0.05] pl-1.5 pr-2 py-1 rounded-full shadow-xs">
                <div className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                  {userInitial}
                </div>

                {isAdmin && (
                  <Badge className="bg-amber-50 text-amber-800 border-amber-200/80 font-bold text-[9px] uppercase gap-1 px-1.5 py-0">
                    <ShieldCheck className="w-2.5 h-2.5 text-amber-700" />
                    Admin
                  </Badge>
                )}

                <span className="text-xs font-semibold text-zinc-800 max-w-[120px] truncate">
                  {user.name || user.email?.split('@')[0]}
                </span>

                <button
                  onClick={handleSignOut}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-0.5 cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <User className="h-3.5 w-3.5" />
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Header Right Profile / Sign In Button */}
          <div className="flex items-center gap-2 md:hidden">
            {user ? (
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full bg-zinc-100 border-zinc-200 text-rose-600 hover:bg-rose-50"
                title={`Sign Out (${user.name || user.email})`}
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                onClick={onOpenAuth}
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200"
                title="Sign In / User Account"
              >
                <User className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-nav border-t border-black/[0.06] flex items-center justify-around h-16 px-2 shadow-card">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-semibold transition-colors ${
              isActive ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-700'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={`p-1 rounded-xl mb-0.5 transition-colors ${
                  isActive ? 'bg-zinc-900 text-white' : ''
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
            `flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-semibold transition-colors ${
              isActive ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-700'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={`p-1 rounded-xl mb-0.5 transition-colors ${
                  isActive ? 'bg-zinc-900 text-white' : ''
                }`}
              >
                <Calendar className="w-4 h-4" />
              </div>
              <span>Schedule</span>
            </>
          )}
        </NavLink>

        <Link
          to="/history"
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-semibold transition-colors ${
            isHistoryActive ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-700'
          }`}
        >
          <div
            className={`p-1 rounded-xl mb-0.5 transition-colors ${
              isHistoryActive ? 'bg-zinc-900 text-white' : ''
            }`}
          >
            <Clock className="w-4 h-4" />
          </div>
          <span>History</span>
        </Link>

        {/* Mobile Admin-Only Members Link */}
        {isAdmin && (
          <NavLink
            to="/members"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-semibold transition-colors ${
                isActive ? 'text-amber-800' : 'text-zinc-400 hover:text-amber-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`p-1 rounded-xl mb-0.5 transition-colors ${
                    isActive ? 'bg-amber-600 text-white' : ''
                  }`}
                >
                  <Users className="w-4 h-4" />
                </div>
                <span>Members</span>
              </>
            )}
          </NavLink>
        )}
      </nav>
    </>
  );
};

