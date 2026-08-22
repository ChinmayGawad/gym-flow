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
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-4 md:p-8 font-sans animate-in fade-in duration-300">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-card mb-3">
          <Dumbbell className="w-6 h-6 stroke-[2.2]" />
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight">
          GYMFLOW
        </h1>
        <p className="text-xs md:text-sm text-zinc-500 mt-1 font-medium max-w-[320px]">
          Real-time gym occupancy monitoring & crowd prediction platform
        </p>
      </div>

      {/* Main Auth Card */}
      <Card className="w-full max-w-[400px] bg-white border border-black/[0.06] shadow-card rounded-2xl p-6 sm:p-7">
        <div className="text-center mb-5">
          <h2 className="text-lg font-black text-zinc-900 tracking-tight">
            Member Sign In
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Enter your credentials to access the facility dashboard
          </p>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200/80 rounded-xl flex items-start gap-2 text-xs text-rose-700 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-start gap-2 text-xs text-emerald-800 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="auth-signin-email" className="text-xs font-bold text-zinc-700">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
              <Input
                id="auth-signin-email"
                type="email"
                placeholder="member@gymflow.com"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                className="pl-9.5 h-10 text-xs rounded-xl border-zinc-200"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="auth-signin-password" className="text-xs font-bold text-zinc-700">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
              <Input
                id="auth-signin-password"
                type="password"
                placeholder="••••••••"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                className="pl-9.5 h-10 text-xs rounded-xl border-zinc-200"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-10 mt-1 font-bold text-xs bg-zinc-900 text-white hover:bg-zinc-800 flex items-center justify-center gap-2 rounded-xl cursor-pointer shadow-xs"
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
          <div className="pt-4 border-t border-zinc-100 mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Quick Demo Access
              </span>
              <span className="text-[10px] text-zinc-400">1-click login</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount('admin')}
                disabled={isSubmitting}
                className="p-2.5 rounded-xl bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200/80 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 text-amber-950 font-bold text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  Admin Demo
                </div>
                <span className="text-[10px] text-amber-700 block mt-0.5 font-medium truncate">
                  admin@gymflow.com
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('member')}
                disabled={isSubmitting}
                className="p-2.5 rounded-xl bg-zinc-100/80 hover:bg-zinc-200/70 border border-zinc-200/70 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 text-zinc-900 font-bold text-xs">
                  <User className="w-3.5 h-3.5 text-zinc-700" />
                  Member Demo
                </div>
                <span className="text-[10px] text-zinc-500 block mt-0.5 font-medium truncate">
                  member@gymflow.com
                </span>
              </button>
            </div>
          </div>
        </form>

        <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center gap-2 text-[11px] text-zinc-400 justify-center">
          <Shield className="w-3 h-3 text-zinc-400 shrink-0" />
          <span>New accounts are managed by Gym Administrators.</span>
        </div>
      </Card>

      {/* Footer Info */}
      <div className="text-center mt-6 text-xs text-zinc-400 font-medium">
        <span>Protected by GymFlow Member Authentication System</span>
      </div>
    </div>
  );
};

