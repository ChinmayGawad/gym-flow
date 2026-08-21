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
      <DialogContent className="sm:max-w-[400px] p-6">
        <DialogHeader className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-[#f0f0f0] flex items-center justify-center text-gym-dark mb-2">
            <Dumbbell className="w-6 h-6 text-gym-dark" />
          </div>
          <DialogTitle className="text-xl font-extrabold tracking-tight text-gym-dark">
            GymFlow Account Sign In
          </DialogTitle>
          <DialogDescription className="text-xs text-gym-subtle mt-1">
            Sign in with your member or admin credentials
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-[9px] flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSignIn} className="space-y-4 mt-3">
          <div className="space-y-1.5">
            <Label htmlFor="signin-email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-[#888]" />
              <Input
                id="signin-email"
                type="email"
                placeholder="member@gymflow.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="signin-password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-[#888]" />
              <Input
                id="signin-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 font-bold text-xs h-10 bg-gym-dark text-white hover:bg-[#3a3a3a] flex items-center justify-center gap-2"
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

        <p className="text-[11px] text-center text-gym-subtle mt-4">
          Need an account? Member accounts are issued directly by Gym Admins.
        </p>
      </DialogContent>
    </Dialog>
  );
};
