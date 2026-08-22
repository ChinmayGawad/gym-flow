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
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Loader2,
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Crown,
  Zap,
  Shield,
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { MEMBERSHIP_PLANS, MembershipPlan } from '@/types/plans';

interface CreateMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateMemberModal: React.FC<CreateMemberModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [plan, setPlan] = useState<MembershipPlan>('basic');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('user');
    setPlan('basic');
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
        email: email.toLowerCase().trim(),
        password,
        name: name.trim(),
        role,
        data: {
          plan,
          planStatus: 'active',
        },
      });

      if (res?.error) {
        setErrorMessage(res.error.message || 'Failed to create member account.');
      } else {
        const planName = MEMBERSHIP_PLANS[plan].name;
        const planPrice = MEMBERSHIP_PLANS[plan].price;
        setSuccessMessage(`Account for "${name}" created with ${planName} (${planPrice}/mo)!`);
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
      <DialogContent className="sm:max-w-[480px] p-6 max-h-[90vh] overflow-y-auto bg-white border border-black/[0.08] rounded-2xl shadow-2xl">
        <DialogHeader className="flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-xs mb-2">
            <UserPlus className="w-5 h-5 text-white" />
          </div>
          <DialogTitle className="text-lg sm:text-xl font-black tracking-tight text-zinc-900">
            Register Gym Member
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 mt-0.5">
            Create an official GymFlow account with subscription plan assignment.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="mt-2 p-3 bg-rose-50 border border-rose-200/80 rounded-xl flex items-start gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-start gap-2 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleCreateMember} className="space-y-4 mt-3">
          {/* Member Name */}
          <div className="space-y-1.5">
            <Label htmlFor="member-name" className="text-xs font-bold text-zinc-700">Member Full Name</Label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              <Input
                id="member-name"
                type="text"
                placeholder="Rohan Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10 rounded-xl border-zinc-200"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <Label htmlFor="member-email" className="text-xs font-bold text-zinc-700">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              <Input
                id="member-email"
                type="email"
                placeholder="rohan@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 rounded-xl border-zinc-200"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Initial Password */}
          <div className="space-y-1.5">
            <Label htmlFor="member-password" className="text-xs font-bold text-zinc-700">Initial Password</Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              <Input
                id="member-password"
                type="password"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 rounded-xl border-zinc-200"
                required
                minLength={8}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Indian Subscription Plan Selection */}
          <div className="space-y-2 pt-1">
            <Label className="flex items-center gap-1.5 text-xs font-bold text-zinc-700">
              <CreditCard className="w-3.5 h-3.5 text-zinc-700" />
              Gym Membership Plan (₹ INR)
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {/* Basic Plan */}
              <button
                type="button"
                onClick={() => setPlan('basic')}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  plan === 'basic'
                    ? 'border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900 shadow-xs'
                    : 'border-zinc-200 bg-white hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Shield className="w-3.5 h-3.5 text-zinc-700" />
                  <span className="text-[11px] font-black text-zinc-900 tabular-nums">₹999</span>
                </div>
                <strong className="text-xs font-bold text-zinc-900 block">Basic</strong>
                <span className="text-[10px] text-zinc-400 block mt-0.5 tabular-nums">₹999 / mo</span>
              </button>

              {/* Pro Plan */}
              <button
                type="button"
                onClick={() => setPlan('pro')}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  plan === 'pro'
                    ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600 shadow-xs'
                    : 'border-zinc-200 bg-white hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Zap className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-[11px] font-black text-blue-900 tabular-nums">₹1,999</span>
                </div>
                <strong className="text-xs font-bold text-zinc-900 block">Pro Athlete</strong>
                <span className="text-[10px] text-zinc-400 block mt-0.5 tabular-nums">₹1,999 / mo</span>
              </button>

              {/* Elite Plan */}
              <button
                type="button"
                onClick={() => setPlan('elite')}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  plan === 'elite'
                    ? 'border-amber-600 bg-amber-50/70 ring-1 ring-amber-600 shadow-xs'
                    : 'border-zinc-200 bg-white hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Crown className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-[11px] font-black text-amber-900 tabular-nums">₹3,499</span>
                </div>
                <strong className="text-xs font-bold text-zinc-900 block">VIP Elite</strong>
                <span className="text-[10px] text-zinc-400 block mt-0.5 tabular-nums">₹3,499 / mo</span>
              </button>
            </div>
            <p className="text-[11px] text-zinc-400 font-medium mt-1">
              {MEMBERSHIP_PLANS[plan].description}
            </p>
          </div>

          {/* Account Role */}
          <div className="space-y-1.5 pt-1">
            <Label className="text-xs font-bold text-zinc-700">Account Role</Label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-zinc-800 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="user"
                  checked={role === 'user'}
                  onChange={() => setRole('user')}
                  className="accent-zinc-900"
                />
                Gym Member
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-zinc-800 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={role === 'admin'}
                  onChange={() => setRole('admin')}
                  className="accent-zinc-900"
                />
                Gym Administrator
              </label>
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
                Registering Member...
              </>
            ) : (
              `Create Member Account (${MEMBERSHIP_PLANS[plan].price}/mo)`
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};


