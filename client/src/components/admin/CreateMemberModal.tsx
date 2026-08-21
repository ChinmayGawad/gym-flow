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
import { UserPlus, Mail, Lock, User, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authClient } from '@/lib/auth-client';

interface CreateMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateMemberModal: React.FC<CreateMemberModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
      onClose();
    }
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Admin API call via Better Auth adminClient plugin
      const res = await authClient.admin.createUser({
        email,
        password,
        name,
        role: 'user',
      });

      if (res?.error) {
        setErrorMessage(res.error.message || 'Failed to create member account.');
      } else {
        setSuccessMessage(`Member account for "${name}" created successfully!`);
        setTimeout(() => {
          resetForm();
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An error occurred while creating member account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-6">
        <DialogHeader className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-[#f0f0f0] flex items-center justify-center text-gym-dark mb-2">
            <UserPlus className="w-6 h-6 text-gym-dark" />
          </div>
          <DialogTitle className="text-xl font-extrabold tracking-tight text-gym-dark flex items-center gap-2">
            Admin: Register New Member
          </DialogTitle>
          <DialogDescription className="text-xs text-gym-subtle mt-1">
            Create an official GymFlow member account with member access privileges.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-[9px] flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-[9px] flex items-start gap-2 text-xs text-green-700">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleCreateMember} className="space-y-4 mt-3">
          <div className="space-y-1.5">
            <Label htmlFor="member-name">Member Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-[#888]" />
              <Input
                id="member-name"
                type="text"
                placeholder="Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-9"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="member-email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-[#888]" />
              <Input
                id="member-email"
                type="email"
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="member-password">Initial Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-[#888]" />
              <Input
                id="member-password"
                type="password"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
                required
                minLength={8}
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
                Registering Member...
              </>
            ) : (
              'Create Member Account'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
