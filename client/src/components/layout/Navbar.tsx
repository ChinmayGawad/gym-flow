import React from 'react';
import { Dumbbell, Home, Calendar, Clock, User, LogOut, UserPlus, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSession, signOut } from '@/lib/auth-client';

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenCreateMember?: () => void;
  activeSection?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onOpenCreateMember,
  activeSection = 'home',
}) => {
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
    <header className="sticky top-0 z-50 h-[76px] w-full bg-white border-b border-[#e5e5e5] px-[4%] md:px-[7%] flex items-center justify-between transition-all">
      {/* Brand Logo */}
      <a href="#" className="flex items-center gap-2.5 font-extrabold text-xl tracking-tight text-gym-dark">
        <Dumbbell className="h-6 w-6 text-gym-dark" />
        <span>GYMFLOW</span>
      </a>

      {/* Desktop Navigation Links */}
      <nav className="hidden md:flex items-center gap-2">
        <a
          href="#"
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-[9px] text-sm font-medium transition-colors ${
            activeSection === 'home'
              ? 'bg-gym-dark text-white font-semibold'
              : 'text-[#555] hover:bg-gym-dark hover:text-white'
          }`}
        >
          <Home className="h-4 w-4" />
          Home
        </a>

        <a
          href="#prediction"
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-[9px] text-sm font-medium transition-colors ${
            activeSection === 'prediction'
              ? 'bg-gym-dark text-white font-semibold'
              : 'text-[#555] hover:bg-gym-dark hover:text-white'
          }`}
        >
          <Calendar className="h-4 w-4" />
          Schedule
        </a>

        <a
          href="#history"
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-[9px] text-sm font-medium transition-colors ${
            activeSection === 'history'
              ? 'bg-gym-dark text-white font-semibold'
              : 'text-[#555] hover:bg-gym-dark hover:text-white'
          }`}
        >
          <Clock className="h-4 w-4" />
          History
        </a>

        {user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-[#eee]">
            {isAdmin && (
              <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-extrabold text-[10px] uppercase gap-1 px-2 py-0.5">
                <ShieldCheck className="w-3 h-3 text-amber-700" />
                Admin
              </Badge>
            )}

            <span className="text-xs font-semibold text-gym-dark max-w-[120px] truncate">
              {user.name || user.email}
            </span>

            {isAdmin && onOpenCreateMember && (
              <Button
                onClick={onOpenCreateMember}
                variant="outline"
                size="sm"
                className="h-8 px-3 rounded-[9px] text-xs font-medium bg-gym-dark text-white hover:bg-[#3a3a3a] border-none gap-1.5"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Add Member
              </Button>
            )}

            <Button
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="h-8 px-3 rounded-[9px] text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </Button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-[9px] text-sm font-medium text-[#555] hover:bg-gym-dark hover:text-white transition-colors cursor-pointer"
          >
            <User className="h-4 w-4" />
            Sign In
          </button>
        )}
      </nav>

      {/* Action / Profile Button (Mobile Header Right) */}
      <div className="flex items-center gap-2 md:hidden">
        {user ? (
          <>
            {isAdmin && onOpenCreateMember && (
              <Button
                onClick={onOpenCreateMember}
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full bg-gym-dark text-white hover:bg-[#3a3a3a] border-none"
                title="Add Member (Admin)"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            )}
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full bg-[#eeeeee] border-none text-red-600 hover:bg-red-50"
              title={`Sign Out (${user.name || user.email})`}
            >
              <LogOut className="h-4.5 w-4.5" />
            </Button>
          </>
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
    </header>
  );
};
