import React, { useState } from 'react';
import {
  Dumbbell,
  Lock,
  Mail,
  User,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { signIn } from '@/lib/auth-client';

export const AuthPage: React.FC = () => {
  // Sign In State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Status & Feedback State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle Sign In submission
  const handleSignIn = async (e?: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    const email = customEmail || signInEmail;
    const password = customPassword || signInPassword;

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { data, error } = await signIn.email({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message || 'Failed to sign in. Please verify your email and password.');
      } else if (data) {
        setSuccessMessage('Sign in successful! Entering GymFlow...');
        // Session hook will trigger App re-render automatically
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred during sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Demo account prefill & sign in
  const fillDemoAccount = (role: 'admin' | 'member') => {
    if (role === 'admin') {
      setSignInEmail('admin@gymflow.com');
      setSignInPassword('Admin123456!');
      handleSignIn(undefined, 'admin@gymflow.com', 'Admin123456!');
    } else {
      setSignInEmail('member@gymflow.com');
      setSignInPassword('Member123456!');
      handleSignIn(undefined, 'member@gymflow.com', 'Member123456!');
    }
  };

  return (
    <div className="min-h-screen bg-gym-canvas flex flex-col items-center justify-center p-4 md:p-8 font-sans">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-gym-dark text-white flex items-center justify-center shadow-md mb-3">
          <Dumbbell className="w-8 h-8" />
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-gym-dark tracking-tight">
          GYMFLOW
        </h1>
        <p className="text-xs md:text-sm text-gym-subtle mt-1 font-medium max-w-[320px]">
          Real-time gym occupancy monitoring and crowd prediction platform
        </p>
      </div>

      {/* Main Auth Card */}
      <Card className="w-full max-w-[420px] bg-white border-[#dedede] shadow-sm rounded-2xl p-6 md:p-8">
        <div className="text-center mb-6">
          <h2 className="text-xl font-extrabold text-gym-dark tracking-tight">
            Member Sign In
          </h2>
          <p className="text-xs text-gym-subtle mt-1">
            Enter your credentials to access the facility dashboard
          </p>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-[9px] flex items-start gap-2 text-xs text-red-700 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-[9px] flex items-start gap-2 text-xs text-green-700 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="auth-signin-email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-[#888]" />
              <Input
                id="auth-signin-email"
                type="email"
                placeholder="member@gymflow.com"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                className="pl-9 h-10 text-xs"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="auth-signin-password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-[#888]" />
              <Input
                id="auth-signin-password"
                type="password"
                placeholder="••••••••"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                className="pl-9 h-10 text-xs"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 mt-2 font-bold text-xs bg-gym-dark text-white hover:bg-[#3a3a3a] flex items-center justify-center gap-2 rounded-[9px] cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                Sign In to GymFlow
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>

          {/* Quick Demo Access Divider & Buttons */}
          <div className="pt-4 border-t border-[#f0f0f0] mt-5">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-bold text-gym-subtle uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Quick Demo Access
              </span>
              <span className="text-[10px] text-gym-subtle">Click to log in</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount('admin')}
                disabled={isSubmitting}
                className="p-2.5 rounded-[9px] bg-amber-50 hover:bg-amber-100 border border-amber-200 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  Admin Demo
                </div>
                <span className="text-[10px] text-amber-700/80 block mt-0.5">
                  admin@gymflow.com
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('member')}
                disabled={isSubmitting}
                className="p-2.5 rounded-[9px] bg-[#f5f5f5] hover:bg-[#ebebeb] border border-[#dedede] text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 text-gym-dark font-bold text-xs">
                  <User className="w-3.5 h-3.5 text-gym-dark" />
                  Member Demo
                </div>
                <span className="text-[10px] text-gym-subtle block mt-0.5">
                  member@gymflow.com
                </span>
              </button>
            </div>
          </div>
        </form>

        <div className="mt-5 pt-3 border-t border-[#f4f4f4] flex items-center gap-2 text-[11px] text-gym-subtle justify-center">
          <Shield className="w-3.5 h-3.5 text-gym-subtle shrink-0" />
          <span>New accounts are issued directly by Gym Administrators.</span>
        </div>
      </Card>

      {/* Footer Info */}
      <div className="text-center mt-6 text-xs text-gym-subtle">
        <span>Protected by GymFlow Member Authentication System</span>
      </div>
    </div>
  );
};
