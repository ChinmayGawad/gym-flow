import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from '@/lib/auth-client';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminRouteProps {
  children: React.ReactNode;
  onOpenAuth?: () => void;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children, onOpenAuth }) => {
  const { data: session, isPending } = useSession();
  const location = useLocation();

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 text-gym-dark animate-spin" />
        <span className="text-xs text-gym-subtle font-semibold">
          Verifying administrator credentials...
        </span>
      </div>
    );
  }

  const user = session?.user as (NonNullable<typeof session>['user'] & { role?: string }) | undefined;
  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[55vh] max-w-[450px] mx-auto text-center p-8 bg-white border border-[#dedede] rounded-[15px] shadow-sm animate-in fade-in">
        <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 mb-4">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-gym-dark">
          Administrator Access Required
        </h2>
        <p className="text-xs text-gym-subtle mt-2 leading-relaxed">
          The Gym Members directory is restricted to authorized gym administrators. Please sign in with an admin account to view and manage members.
        </p>
        <div className="flex items-center gap-3 mt-6">
          <Button
            onClick={() => onOpenAuth?.()}
            className="h-10 px-5 rounded-[9px] bg-gym-dark hover:bg-[#3a3a3a] text-white text-xs font-bold"
          >
            Sign In as Admin
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="h-10 px-5 rounded-[9px] border-[#dedede] text-gym-dark text-xs font-bold"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
