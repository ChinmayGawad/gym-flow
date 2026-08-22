import React, { useState, useEffect } from 'react';
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
  Edit3,
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
  ShieldCheck,
} from 'lucide-react';
import { MEMBERSHIP_PLANS, MembershipPlan } from '@/types/plans';

export interface EditableMember {
  id: string;
  name: string;
  email: string;
  role: string;
  plan?: string;
  planStatus?: string;
}

interface EditMemberModalProps {
  member: EditableMember | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedMember: EditableMember) => void;
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({
  member,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [plan, setPlan] = useState<MembershipPlan>('basic');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (member) {
      setName(member.name || '');
      setEmail(member.email || '');
      setRole((member.role as 'user' | 'admin') || 'user');
      setPlan((member.plan as MembershipPlan) || 'basic');
      setPassword('');
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [member, isOpen]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setErrorMessage(null);
      setSuccessMessage(null);
      onClose();
    }
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`http://localhost:3000/api/admin/members/${member.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          role,
          plan,
          ...(password ? { password } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update member profile.');
      }

      setSuccessMessage(`Member "${name}" updated successfully!`);
      onSuccess({
        ...member,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role,
        plan,
      });

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err?.message || 'An error occurred while updating member profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-[#f0f0f0] flex items-center justify-center text-gym-dark mb-2">
            <Edit3 className="w-6 h-6 text-gym-dark" />
          </div>
          <DialogTitle className="text-xl font-extrabold tracking-tight text-gym-dark flex items-center gap-2">
            Edit Member Account
          </DialogTitle>
          <DialogDescription className="text-xs text-gym-subtle mt-1">
            Update member credentials, subscription tier, and administration role.
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

        <form onSubmit={handleSaveMember} className="space-y-4 mt-3">
          {/* Member Name */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-member-name">Member Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-[#888]" />
              <Input
                id="edit-member-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-9"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-member-email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-[#888]" />
              <Input
                id="edit-member-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Reset Password (Optional) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-member-password">Reset Password (Optional)</Label>
              <span className="text-[10px] text-gym-subtle font-medium">Leave blank to keep unchanged</span>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-[#888]" />
              <Input
                id="edit-member-password"
                type="password"
                placeholder="New password (min 8 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
                minLength={8}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Indian Subscription Plan Selection */}
          <div className="space-y-2 pt-1">
            <Label className="flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-gym-dark" />
              Gym Membership Plan (₹ INR)
            </Label>
            <div className="grid grid-cols-3 gap-2.5">
              {/* Basic Plan */}
              <button
                type="button"
                onClick={() => setPlan('basic')}
                className={`p-3 rounded-[10px] text-left border transition-all cursor-pointer ${
                  plan === 'basic'
                    ? 'border-gym-dark bg-slate-50 ring-1 ring-gym-dark shadow-sm'
                    : 'border-[#dedede] bg-white hover:border-[#aaa]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Shield className="w-4 h-4 text-slate-700" />
                  <span className="text-[11px] font-black text-slate-900">₹999</span>
                </div>
                <strong className="text-xs font-bold text-gym-dark block">Basic</strong>
                <span className="text-[10px] text-gym-subtle block mt-0.5">₹999 / mo</span>
              </button>

              {/* Pro Plan */}
              <button
                type="button"
                onClick={() => setPlan('pro')}
                className={`p-3 rounded-[10px] text-left border transition-all cursor-pointer ${
                  plan === 'pro'
                    ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600 shadow-sm'
                    : 'border-[#dedede] bg-white hover:border-[#aaa]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span className="text-[11px] font-black text-blue-900">₹1,999</span>
                </div>
                <strong className="text-xs font-bold text-gym-dark block">Pro Athlete</strong>
                <span className="text-[10px] text-gym-subtle block mt-0.5">₹1,999 / mo</span>
              </button>

              {/* Elite Plan */}
              <button
                type="button"
                onClick={() => setPlan('elite')}
                className={`p-3 rounded-[10px] text-left border transition-all cursor-pointer ${
                  plan === 'elite'
                    ? 'border-amber-500 bg-amber-50/70 ring-1 ring-amber-500 shadow-sm'
                    : 'border-[#dedede] bg-white hover:border-[#aaa]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Crown className="w-4 h-4 text-amber-600" />
                  <span className="text-[11px] font-black text-amber-900">₹3,499</span>
                </div>
                <strong className="text-xs font-bold text-gym-dark block">VIP Elite</strong>
                <span className="text-[10px] text-gym-subtle block mt-0.5">₹3,499 / mo</span>
              </button>
            </div>
            <p className="text-[11px] text-gym-subtle font-medium mt-1">
              {MEMBERSHIP_PLANS[plan].description}
            </p>
          </div>

          {/* Account Role */}
          <div className="space-y-1.5 pt-1">
            <Label>Account Role</Label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-gym-dark cursor-pointer">
                <input
                  type="radio"
                  name="edit-role"
                  value="user"
                  checked={role === 'user'}
                  onChange={() => setRole('user')}
                  className="accent-gym-dark"
                />
                Gym Member
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-gym-dark cursor-pointer">
                <input
                  type="radio"
                  name="edit-role"
                  value="admin"
                  checked={role === 'admin'}
                  onChange={() => setRole('admin')}
                  className="accent-gym-dark"
                />
                Gym Administrator
              </label>
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
                Saving Changes...
              </>
            ) : (
              `Save Changes (${MEMBERSHIP_PLANS[plan].price}/mo)`
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
