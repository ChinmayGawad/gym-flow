import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dumbbell, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import { signIn } from '@/lib/auth-client';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Status State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setErrorMessage(null);
    setIsSubmitting(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
      onClose();
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const { data, error } = await signIn.email({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message || 'Failed to sign in. Please check your credentials.');
      } else if (data) {
        resetForm();
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred during sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-6 bg-white border border-black/[0.08] rounded-2xl shadow-2xl">
        <DialogHeader className="flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-xs mb-2">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <DialogTitle className="text-lg sm:text-xl font-black tracking-tight text-zinc-900">
            GymFlow Account Sign In
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 mt-0.5">
            Sign in with your member or admin credentials
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="mt-2 p-3 bg-rose-50 border border-rose-200/80 rounded-xl flex items-start gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSignIn} className="space-y-4 mt-3">
          <div className="space-y-1.5">
            <Label htmlFor="signin-email" className="text-xs font-bold text-zinc-700">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
              <Input
                id="signin-email"
                type="email"
                placeholder="member@gymflow.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9.5 rounded-xl border-zinc-200"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="signin-password" className="text-xs font-bold text-zinc-700">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
              <Input
                id="signin-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9.5 rounded-xl border-zinc-200"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 font-bold text-xs h-10 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 flex items-center justify-center gap-2 shadow-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing In...
              </>
            ) : (
              'Sign In to Account'
            )}
          </Button>
        </form>

        <p className="text-[11px] text-center text-zinc-400 mt-4">
          Need an account? Member accounts are issued directly by Gym Admins.
        </p>
      </DialogContent>
    </Dialog>
  );
};

