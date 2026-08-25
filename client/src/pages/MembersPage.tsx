import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Search,
  Trash2,
  Edit3,
  Mail,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  CreditCard,
  Zap,
  Building2,
  Settings,
  MapPin,
  LogOut,
  LogIn,
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { CreateMemberModal } from '@/components/admin/CreateMemberModal';
import { EditMemberModal, EditableMember } from '@/components/admin/EditMemberModal';
import { CapacitySettingsModal } from '@/components/admin/CapacitySettingsModal';
import { MEMBERSHIP_PLANS, MembershipPlan } from '@/types/plans';
import { useOccupancy } from '@/hooks/useOccupancy';
import { Skeleton } from '@/components/ui/skeleton';
import { API_BASE } from '@/lib/api-config';

interface GymMember {
  id: string;
  name: string;
  email: string;
  role: string;
  plan?: MembershipPlan;
  planStatus?: string;
  isCheckedIn?: boolean;
  lastCheckInAt?: string | Date | null;
  createdAt: string | Date;
  image?: string | null;
}

interface MembersPageProps {
  occupancy?: ReturnType<typeof useOccupancy>;
}

export const MembersPage: React.FC<MembersPageProps> = ({ occupancy }) => {
  const [members, setMembers] = useState<GymMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter] = useState<'all' | 'user' | 'admin'>('all');
  const [planFilter, setPlanFilter] = useState<'all' | 'basic' | 'pro' | 'elite'>('all');
  const [checkInFilter, setCheckInFilter] = useState<'all' | 'inside' | 'outside'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<EditableMember | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchMembers = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      // 1. Try dedicated express admin members endpoint (guarantees accurate isCheckedIn state)
      const res = await fetch(`${API_BASE}/api/admin/members`, {
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.members) {
          setMembers(data.members as GymMember[]);
          return;
        }
      }

      // 2. Fallback to authClient admin listUsers
      const authRes = await authClient.admin.listUsers({
        query: {
          limit: 100,
        },
      });

      if (authRes?.data?.users) {
        setMembers(authRes.data.users as GymMember[]);
      }
    } catch (err: any) {
      if (!silent) {
        console.error('Error fetching members:', err);
        setActionFeedback({
          type: 'error',
          message: err?.message || 'Failed to fetch gym members list.',
        });
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // 1. Initial members fetch
  useEffect(() => {
    fetchMembers();
  }, []);

  // 2. Real-time Multi-Tab Broadcast Sync Listener
  useEffect(() => {
    try {
      const channel = new BroadcastChannel('gymflow_realtime_sync');
      channel.onmessage = (event) => {
        if (
          event.data?.type === 'GYM_CHECKIN_UPDATED' ||
          event.data?.type === 'GYM_CAPACITY_UPDATED' ||
          event.data?.type === 'GYM_OCCUPANCY_SYNC'
        ) {
          fetchMembers(true);
        }
      };
      return () => {
        channel.close();
      };
    } catch {
      // BroadcastChannel not available
    }
  }, []);

  // 3. Sync members check-in states live with SSE checkedInUserIds
  useEffect(() => {
    if (occupancy?.checkedInUserIds) {
      const liveIds = occupancy.checkedInUserIds;
      setMembers((prev) =>
        prev.map((m) => ({
          ...m,
          isCheckedIn: liveIds.includes(m.id),
        }))
      );
    }
  }, [occupancy?.checkedInUserIds]);

  // 4. Tab focus auto-sync
  useEffect(() => {
    const handleFocus = () => {
      fetchMembers(true);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Admin Toggle Member Check-In / Out
  const handleToggleMemberCheckIn = async (member: GymMember) => {
    setTogglingId(member.id);
    setActionFeedback(null);

    const prevCheckedIn = !!member.isCheckedIn;
    const nextState = !prevCheckedIn;

    // Optimistic UI update
    setMembers((prev) =>
      prev.map((m) =>
        m.id === member.id ? { ...m, isCheckedIn: nextState } : m
      )
    );

    try {
      const res = await fetch(`${API_BASE}/api/admin/members/${member.id}/checkin-toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const confirmedState = Boolean(data.isCheckedIn);

        // Update local members list with confirmed state
        setMembers((prev) =>
          prev.map((m) =>
            m.id === member.id ? { ...m, isCheckedIn: confirmedState } : m
          )
        );

        // Sync global occupancy hook & broadcast
        if (occupancy?.refreshStatus) {
          occupancy.refreshStatus();
        }

        try {
          const bc = new BroadcastChannel('gymflow_realtime_sync');
          bc.postMessage({
            type: 'GYM_OCCUPANCY_SYNC',
            payload: { peopleCount: data.checkedInCount },
          });
          bc.close();
        } catch {}

        setActionFeedback({
          type: 'success',
          message: data.message || `${member.name} is now ${confirmedState ? 'checked in' : 'checked out'}.`,
        });
      } else {
        // Revert optimistic update on failure
        setMembers((prev) =>
          prev.map((m) =>
            m.id === member.id ? { ...m, isCheckedIn: prevCheckedIn } : m
          )
        );
        setActionFeedback({
          type: 'error',
          message: data?.error || `Failed to update ${member.name}'s check-in status.`,
        });
      }
    } catch (err: any) {
      // Revert optimistic update on network error
      setMembers((prev) =>
        prev.map((m) =>
          m.id === member.id ? { ...m, isCheckedIn: prevCheckedIn } : m
        )
      );
      setActionFeedback({
        type: 'error',
        message: err?.message || 'Network error updating check-in status.',
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteMember = async (userId: string, memberName: string) => {
    if (!window.confirm(`Are you sure you want to remove member "${memberName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(userId);
    setActionFeedback(null);

    try {
      const res = await fetch(`${API_BASE}/api/admin/members/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        setActionFeedback({
          type: 'success',
          message: `Member "${memberName}" has been removed.`,
        });
        setMembers((prev) => prev.filter((m) => m.id !== userId));
        if (occupancy?.refreshStatus) {
          occupancy.refreshStatus();
        }
      } else {
        const authRes = await authClient.admin.removeUser({ userId });
        if (authRes?.error) {
          setActionFeedback({
            type: 'error',
            message: authRes.error.message || 'Failed to remove member.',
          });
        } else {
          setActionFeedback({
            type: 'success',
            message: `Member "${memberName}" has been removed.`,
          });
          setMembers((prev) => prev.filter((m) => m.id !== userId));
          if (occupancy?.refreshStatus) {
            occupancy.refreshStatus();
          }
        }
      }
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err?.message || 'An error occurred while removing the member.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleMemberUpdated = (updated: EditableMember) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === updated.id
          ? {
              ...m,
              name: updated.name,
              email: updated.email,
              role: updated.role,
              plan: (updated.plan as MembershipPlan) || 'basic',
            }
          : m
      )
    );
    setActionFeedback({
      type: 'success',
      message: `Member "${updated.name}" updated successfully.`,
    });
  };

  // Filtered members list
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole =
      roleFilter === 'all' ? true : (member.role || 'user') === roleFilter;

    const memberPlan = member.plan || 'basic';
    const matchesPlan =
      planFilter === 'all' ? true : memberPlan === planFilter;

    const isInside = !!member.isCheckedIn;
    const matchesCheckIn =
      checkInFilter === 'all'
        ? true
        : checkInFilter === 'inside'
        ? isInside
        : !isInside;

    return matchesSearch && matchesRole && matchesPlan && matchesCheckIn;
  });

  const totalMembersCount = members.length;
  const checkedInMembersCount = members.filter((m) => m.isCheckedIn).length;
  const currentCapacity = occupancy?.capacity || 30;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Link
              to="/"
              className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <span className="text-xs font-semibold text-zinc-900 dark:text-white">Members Directory</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              Gym Members Directory
            </h1>
            <Badge className="bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60 font-bold text-[10px] uppercase gap-1 px-2 py-0.5">
              <ShieldCheck className="w-3 h-3 text-amber-700 dark:text-amber-400" />
              Admin
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
            Manage member accounts, track live check-ins, configure gym capacity, and assign Indian subscription plans (₹ INR).
          </p>
        </div>

        {/* Top Actions: Add Member + Capacity Settings */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            onClick={() => setIsCapacityModalOpen(true)}
            variant="outline"
            className="h-9 px-3.5 rounded-xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xs font-semibold gap-1.5 shadow-xs"
          >
            <Settings className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
            <span>Capacity ({currentCapacity})</span>
          </Button>

          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="h-9 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 text-xs font-bold gap-1.5 shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Member</span>
          </Button>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-3.5 rounded-xl flex items-center justify-between text-xs font-semibold border ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/50'
              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/50'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-xs font-bold underline cursor-pointer ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Accounts */}
        <Card className="p-5 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card hover:border-black/[0.12] dark:hover:border-white/[0.15] transition-all">
          <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700 flex items-center justify-center text-zinc-800 dark:text-zinc-200 mb-2">
            <Users className="w-4.5 h-4.5" />
          </div>
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">
            Total Accounts
          </span>
          <span className="text-2xl font-black text-zinc-900 dark:text-white mt-0.5 block tabular-nums">
            {totalMembersCount}
          </span>
        </Card>

        {/* Live Inside Gym */}
        <Card className="p-5 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card hover:border-black/[0.12] dark:hover:border-white/[0.15] transition-all">
          <div className="w-9 h-9 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-2">
            <MapPin className="w-4.5 h-4.5" />
          </div>
          <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-widest block">
            Inside Gym Now
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl font-black text-emerald-900 dark:text-emerald-100 tabular-nums">
              {checkedInMembersCount}
            </span>
            <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 tabular-nums">
              / {currentCapacity} max
            </span>
          </div>
        </Card>

        {/* Pro & Elite Subscribers */}
        <Card className="p-5 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card hover:border-black/[0.12] dark:hover:border-white/[0.15] transition-all">
          <div className="w-9 h-9 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/50 text-blue-700 dark:text-blue-300 flex items-center justify-center mb-2">
            <Zap className="w-4.5 h-4.5" />
          </div>
          <span className="text-[10px] font-bold text-blue-900 dark:text-blue-300 uppercase tracking-widest block">
            Pro & Elite Plans
          </span>
          <span className="text-2xl font-black text-blue-900 dark:text-blue-100 mt-0.5 block tabular-nums">
            {members.filter((m) => m.plan === 'pro' || m.plan === 'elite').length}
          </span>
        </Card>

        {/* Facility Capacity */}
        <Card className="p-5 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card hover:border-black/[0.12] dark:hover:border-white/[0.15] transition-all">
          <div className="w-9 h-9 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/50 text-amber-700 dark:text-amber-300 flex items-center justify-center mb-2">
            <Building2 className="w-4.5 h-4.5" />
          </div>
          <span className="text-[10px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-widest block">
            Facility Capacity
          </span>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-2xl font-black text-amber-900 dark:text-amber-100 tabular-nums">
              {currentCapacity}
            </span>
            <Button
              onClick={() => setIsCapacityModalOpen(true)}
              variant="outline"
              size="sm"
              className="h-6 text-[10px] font-bold px-2 rounded-lg text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-950"
            >
              Scale
            </Button>
          </div>
        </Card>
      </div>

      {/* Members Directory Card */}
      <Card className="p-6 md:p-8 bg-white dark:bg-[#131418] border border-black/[0.06] dark:border-white/[0.08] shadow-card rounded-2xl">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col gap-4 mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Search Box */}
            <div className="relative w-full sm:max-w-[320px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search members by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 text-xs border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-xl"
              />
            </div>

            {/* Attendance Filter Tabs */}
            <div className="flex items-center gap-1 bg-zinc-100/90 dark:bg-zinc-900/90 p-1 rounded-xl self-start sm:self-auto border border-black/[0.04] dark:border-white/[0.06]">
              <button
                onClick={() => setCheckInFilter('all')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  checkInFilter === 'all'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                All ({totalMembersCount})
              </button>
              <button
                onClick={() => setCheckInFilter('inside')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  checkInFilter === 'inside'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/70 dark:hover:bg-emerald-950/40'
                }`}
              >
                Inside Gym ({checkedInMembersCount})
              </button>
              <button
                onClick={() => setCheckInFilter('outside')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  checkInFilter === 'outside'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Outside ({totalMembersCount - checkedInMembersCount})
              </button>
            </div>
          </div>

          {/* Subscription Plan Filter Toolbar */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
              Plans:
            </span>
            <button
              onClick={() => setPlanFilter('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                planFilter === 'all'
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-xs'
                  : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
              }`}
            >
              All Plans
            </button>
            <button
              onClick={() => setPlanFilter('basic')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                planFilter === 'basic'
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-xs'
                  : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
              }`}
            >
              Basic (₹999/mo)
            </button>
            <button
              onClick={() => setPlanFilter('pro')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                planFilter === 'pro'
                  ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                  : 'bg-white dark:bg-zinc-800 text-blue-700 dark:text-blue-400 border-blue-200/80 dark:border-blue-800/50 hover:border-blue-300'
              }`}
            >
              Pro Athlete (₹1,999/mo)
            </button>
            <button
              onClick={() => setPlanFilter('elite')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                planFilter === 'elite'
                  ? 'bg-amber-700 text-white border-amber-700 shadow-xs'
                  : 'bg-white dark:bg-zinc-800 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/50 hover:border-amber-300'
              }`}
            >
              VIP Elite (₹3,499/mo)
            </button>
          </div>
        </div>

        {/* Member Directory Content */}
        {isLoading ? (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3.5 px-3"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                  <div className="space-y-2 flex-1 max-w-sm">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-32 rounded-lg" />
                      <Skeleton className="h-4 w-20 rounded-full" />
                      <Skeleton className="h-4 w-16 rounded-full" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3 w-40 rounded-md" />
                      <Skeleton className="h-3 w-24 rounded-md" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <Skeleton className="h-8 w-24 rounded-xl" />
                  <Skeleton className="h-8 w-14 rounded-xl" />
                  <Skeleton className="h-8 w-14 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
              No members found
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {searchTerm
                ? 'Try refining your search keyword.'
                : 'Get started by adding your first gym member.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filteredMembers.map((member) => {
              const isAdmin = member.role === 'admin';
              const isInside = !!member.isCheckedIn;
              const memberPlan = (member.plan as MembershipPlan) || 'basic';
              const planConfig = MEMBERSHIP_PLANS[memberPlan] || MEMBERSHIP_PLANS.basic;

              const formattedDate = member.createdAt
                ? new Date(member.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Active';

              return (
                <div
                  key={member.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3.5 px-3 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/50 rounded-xl transition-colors"
                >
                  {/* Member Info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 relative ${
                        isAdmin
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                          : isInside
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200/70 dark:border-zinc-700'
                      }`}
                    >
                      {member.name ? member.name.charAt(0).toUpperCase() : 'M'}
                      {isInside && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                          {member.name}
                        </span>

                        {/* Live Check-In Pill */}
                        {isInside ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/50 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Inside Gym
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200/70 dark:border-zinc-700">
                            Checked Out
                          </span>
                        )}

                        {/* Plan Badge */}
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${planConfig.badgeColor}`}
                        >
                          {planConfig.badgeText}
                        </span>

                        {/* Admin Badge */}
                        {isAdmin && (
                          <Badge className="bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60 font-bold text-[9px] uppercase px-1.5 py-0">
                            Admin
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                          {member.email}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                          Joined {formattedDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Check-In Toggle + Edit + Remove */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    {/* Admin Master Check-In Toggle Button */}
                    <Button
                      onClick={() => handleToggleMemberCheckIn(member)}
                      disabled={togglingId === member.id}
                      variant="outline"
                      size="sm"
                      className={`h-8 px-3 text-xs font-bold rounded-xl gap-1.5 transition-colors ${
                        isInside
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 hover:border-rose-200 dark:hover:border-rose-800/60'
                          : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                      }`}
                      title={isInside ? 'Check Member Out' : 'Check Member In'}
                    >
                      {togglingId === member.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isInside ? (
                        <>
                          <LogOut className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                          Check Out
                        </>
                      ) : (
                        <>
                          <LogIn className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                          Check In
                        </>
                      )}
                    </Button>

                    {/* Edit Member Button */}
                    <Button
                      onClick={() =>
                        setEditingMember({
                          id: member.id,
                          name: member.name,
                          email: member.email,
                          role: member.role || 'user',
                          plan: member.plan || 'basic',
                        })
                      }
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border-zinc-200 dark:border-zinc-700 rounded-xl gap-1.5 font-semibold"
                      title="Edit Member Profile & Plan"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </Button>

                    {/* Delete Member Button */}
                    <Button
                      onClick={() => handleDeleteMember(member.id, member.name)}
                      variant="outline"
                      size="sm"
                      disabled={deletingId === member.id}
                      className="h-8 px-2.5 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200/80 dark:border-rose-800/60 rounded-xl gap-1.5"
                      title="Remove Member"
                    >
                      {deletingId === member.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      Remove
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Gym Owner Capacity Modal */}
      <CapacitySettingsModal
        isOpen={isCapacityModalOpen}
        onClose={() => setIsCapacityModalOpen(false)}
        currentCapacity={currentCapacity}
        onSaveCapacity={async (newCap) => {
          if (occupancy?.updateCapacity) {
            await occupancy.updateCapacity(newCap);
          }
        }}
        gymName={occupancy?.gymName}
      />

      {/* Member Registration Modal */}
      <CreateMemberModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          fetchMembers();
          if (occupancy?.refreshStatus) occupancy.refreshStatus();
        }}
      />

      {/* Member Edit Modal */}
      <EditMemberModal
        member={editingMember}
        isOpen={!!editingMember}
        onClose={() => setEditingMember(null)}
        onSuccess={handleMemberUpdated}
      />
    </div>
  );
};
