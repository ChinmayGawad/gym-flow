import React from 'react';
import { NavLink, Link } from 'react-router-dom';
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

  return (
    <>
      {/* Top Sticky Navbar */}
      <header className="sticky top-0 z-50 h-[76px] w-full bg-white border-b border-[#e5e5e5] px-[4%] md:px-[7%] flex items-center justify-between transition-all">
        {/* Left Zone: Brand Logo */}
        <div className="flex-1 flex items-center justify-start">
          <Link
            to="/"
            className="flex items-center gap-2.5 font-extrabold text-xl tracking-tight text-gym-dark hover:opacity-90 transition-opacity"
          >
            <Dumbbell className="h-6 w-6 text-gym-dark" />
            <span>GYMFLOW</span>
          </Link>
        </div>

        {/* Center Zone: Centered Desktop Navigation Links */}
        <nav className="hidden md:flex items-center justify-center gap-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-4 py-2.5 rounded-[9px] text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gym-dark text-white font-semibold shadow-sm'
                  : 'text-[#555] hover:bg-gym-dark hover:text-white'
              }`
            }
          >
            <Home className="h-4 w-4" />
            Home
          </NavLink>

          <NavLink
            to="/schedule"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-4 py-2.5 rounded-[9px] text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gym-dark text-white font-semibold shadow-sm'
                  : 'text-[#555] hover:bg-gym-dark hover:text-white'
              }`
            }
          >
            <Calendar className="h-4 w-4" />
            Schedule
          </NavLink>

          <NavLink
            to="/history"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-4 py-2.5 rounded-[9px] text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gym-dark text-white font-semibold shadow-sm'
                  : 'text-[#555] hover:bg-gym-dark hover:text-white'
              }`
            }
          >
            <Clock className="h-4 w-4" />
            History
          </NavLink>

          {/* Admin-Only Members Link */}
          {isAdmin && (
            <NavLink
              to="/members"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-4 py-2.5 rounded-[9px] text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-800 text-white font-semibold shadow-sm'
                    : 'text-amber-900 bg-amber-50 hover:bg-amber-800 hover:text-white border border-amber-200'
                }`
              }
            >
              <Users className="h-4 w-4" />
              Members
            </NavLink>
          )}
        </nav>

        {/* Right Zone: User Profile, Role Badge & Sign In/Out Actions */}
        <div className="flex-1 flex items-center justify-end gap-2">
          {/* Desktop User Status */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                {isAdmin && (
                  <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-extrabold text-[10px] uppercase gap-1 px-2 py-0.5">
                    <ShieldCheck className="w-3 h-3 text-amber-700" />
                    Admin
                  </Badge>
                )}

                <span className="text-xs font-semibold text-gym-dark max-w-[130px] truncate">
                  {user.name || user.email}
                </span>

                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 rounded-[9px] text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 gap-1.5 ml-1"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </Button>
              </>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-[9px] text-sm font-medium text-[#555] hover:bg-gym-dark hover:text-white transition-colors cursor-pointer"
              >
                <User className="h-4 w-4" />
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
                className="h-9 w-9 rounded-full bg-[#eeeeee] border-none text-red-600 hover:bg-red-50"
                title={`Sign Out (${user.name || user.email})`}
              >
                <LogOut className="h-4.5 w-4.5" />
              </Button>
            ) : (
              <Button
                onClick={onOpenAuth}
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full bg-[#eeeeee] border-none text-[#444] hover:bg-[#dedede]"
                title="Sign In / User Account"
              >
                <User className="h-4.5 w-4.5" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#dedede] flex items-center justify-around h-16 px-2 shadow-lg">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-bold transition-colors ${
              isActive ? 'text-gym-dark' : 'text-gym-subtle hover:text-gym-dark'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={`p-1 rounded-full mb-0.5 ${
                  isActive ? 'bg-[#f0f0f0]' : ''
                }`}
              >
                <Home className="w-5 h-5" />
              </div>
              <span>Home</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/schedule"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-bold transition-colors ${
              isActive ? 'text-gym-dark' : 'text-gym-subtle hover:text-gym-dark'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={`p-1 rounded-full mb-0.5 ${
                  isActive ? 'bg-[#f0f0f0]' : ''
                }`}
              >
                <Calendar className="w-5 h-5" />
              </div>
              <span>Schedule</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/history"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-bold transition-colors ${
              isActive ? 'text-gym-dark' : 'text-gym-subtle hover:text-gym-dark'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={`p-1 rounded-full mb-0.5 ${
                  isActive ? 'bg-[#f0f0f0]' : ''
                }`}
              >
                <Clock className="w-5 h-5" />
              </div>
              <span>History</span>
            </>
          )}
        </NavLink>

        {/* Mobile Admin-Only Members Link */}
        {isAdmin && (
          <NavLink
            to="/members"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-bold transition-colors ${
                isActive ? 'text-amber-900' : 'text-amber-700 hover:text-amber-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`p-1 rounded-full mb-0.5 ${
                    isActive ? 'bg-amber-100' : ''
                  }`}
                >
                  <Users className="w-5 h-5" />
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
