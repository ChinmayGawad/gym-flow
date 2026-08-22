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
  Mail,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  User,
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { CreateMemberModal } from '@/components/admin/CreateMemberModal';

interface GymMember {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string | Date;
  image?: string | null;
}

export const MembersPage: React.FC = () => {
  const [members, setMembers] = useState<GymMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const res = await authClient.admin.listUsers({
        query: {
          limit: 100,
        },
      });

      if (res?.data?.users) {
        setMembers(res.data.users as GymMember[]);
      }
    } catch (err: any) {
      console.error('Error fetching members:', err);
      setActionFeedback({
        type: 'error',
        message: err?.message || 'Failed to fetch gym members list.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleDeleteMember = async (userId: string, memberName: string) => {
    if (!window.confirm(`Are you sure you want to remove member "${memberName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(userId);
    setActionFeedback(null);

    try {
      const res = await authClient.admin.removeUser({
        userId,
      });

      if (res?.error) {
        setActionFeedback({
          type: 'error',
          message: res.error.message || 'Failed to remove member.',
        });
      } else {
        setActionFeedback({
          type: 'success',
          message: `Member "${memberName}" has been removed.`,
        });
        // Optimistic update + fetch
        setMembers((prev) => prev.filter((m) => m.id !== userId));
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

  // Filtered members list
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole =
      roleFilter === 'all' ? true : (member.role || 'user') === roleFilter;

    return matchesSearch && matchesRole;
  });

  const totalMembersCount = members.length;
  const adminCount = members.filter((m) => m.role === 'admin').length;
  const standardMembersCount = totalMembersCount - adminCount;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="text-xs font-semibold text-gym-subtle hover:text-gym-dark flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Dashboard
            </Link>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <h1 className="text-3xl font-extrabold text-gym-dark tracking-tight">
              Gym Members Directory
            </h1>
            <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-extrabold text-[10px] uppercase gap-1 px-2.5 py-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              Admin Only
            </Badge>
          </div>
          <p className="text-xs text-gym-subtle mt-0.5 font-medium">
            Manage member accounts, assign roles, and issue new credentials.
          </p>
        </div>

        {/* Add Member CTA */}
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="h-10 px-5 rounded-[9px] bg-gym-dark hover:bg-[#3a3a3a] text-white text-xs font-bold gap-2 self-start md:self-auto shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Add New Member
        </Button>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-3.5 rounded-[10px] flex items-center justify-between text-xs font-semibold border ${
            actionFeedback.type === 'success'
              ? 'bg-green-50 text-green-800 border-green-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-white border-[#dedede]">
          <div className="w-9 h-9 rounded-full bg-[#f0f0f0] flex items-center justify-center text-gym-dark mb-2">
            <Users className="w-4.5 h-4.5" />
          </div>
          <span className="text-[11px] font-bold text-gym-subtle uppercase tracking-wider block">
            Total Registered
          </span>
          <span className="text-2xl font-black text-gym-dark mt-0.5 block">
            {totalMembersCount} Accounts
          </span>
        </Card>

        <Card className="p-5 bg-white border-[#dedede]">
          <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mb-2">
            <User className="w-4.5 h-4.5" />
          </div>
          <span className="text-[11px] font-bold text-gym-subtle uppercase tracking-wider block">
            Active Members
          </span>
          <span className="text-2xl font-black text-gym-dark mt-0.5 block">
            {standardMembersCount} Members
          </span>
        </Card>

        <Card className="p-5 bg-white border-[#dedede]">
          <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mb-2">
            <ShieldCheck className="w-4.5 h-4.5" />
          </div>
          <span className="text-[11px] font-bold text-gym-subtle uppercase tracking-wider block">
            Gym Administrators
          </span>
          <span className="text-2xl font-black text-gym-dark mt-0.5 block">
            {adminCount} Admins
          </span>
        </Card>
      </div>

      {/* Members Directory Card */}
      <Card className="p-6 md:p-8 bg-white border-[#dedede]">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#eee]">
          {/* Search Box */}
          <div className="relative w-full sm:max-w-[320px]">
            <Search className="absolute left-3 top-3 h-4 w-4 text-[#888]" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 text-xs border-[#dedede] rounded-[9px]"
            />
          </div>

          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-[#f0f0f0] p-1 rounded-[9px] self-start sm:self-auto">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-[7px] transition-colors ${
                roleFilter === 'all'
                  ? 'bg-white text-gym-dark shadow-sm'
                  : 'text-gym-subtle hover:text-gym-dark'
              }`}
            >
              All ({totalMembersCount})
            </button>
            <button
              onClick={() => setRoleFilter('user')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-[7px] transition-colors ${
                roleFilter === 'user'
                  ? 'bg-white text-gym-dark shadow-sm'
                  : 'text-gym-subtle hover:text-gym-dark'
              }`}
            >
              Members ({standardMembersCount})
            </button>
            <button
              onClick={() => setRoleFilter('admin')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-[7px] transition-colors ${
                roleFilter === 'admin'
                  ? 'bg-white text-gym-dark shadow-sm'
                  : 'text-gym-subtle hover:text-gym-dark'
              }`}
            >
              Admins ({adminCount})
            </button>
          </div>
        </div>

        {/* Member Directory Content */}
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 text-gym-dark animate-spin" />
            <span className="text-xs text-gym-subtle font-semibold">
              Loading gym members directory...
            </span>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-[#bbb] mx-auto mb-3" />
            <h3 className="text-sm font-extrabold text-gym-dark">
              No members found
            </h3>
            <p className="text-xs text-gym-subtle mt-1">
              {searchTerm
                ? 'Try refining your search keyword.'
                : 'Get started by adding your first gym member.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#eeeeee]">
            {filteredMembers.map((member) => {
              const isAdmin = member.role === 'admin';
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
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-2 hover:bg-[#fafafa] rounded-lg transition-colors"
                >
                  {/* Member Info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                        isAdmin
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-[#ededed] text-gym-dark'
                      }`}
                    >
                      {member.name ? member.name.charAt(0).toUpperCase() : 'M'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-gym-dark truncate">
                          {member.name}
                        </span>
                        {isAdmin ? (
                          <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-extrabold text-[9px] uppercase px-2 py-0.2">
                            Admin
                          </Badge>
                        ) : (
                          <Badge className="bg-[#f0f0f0] text-[#555] border-[#dedede] font-bold text-[9px] uppercase px-2 py-0.2">
                            Member
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gym-subtle mt-0.5">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-[#999]" />
                          {member.email}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#999]" />
                          Joined {formattedDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <Button
                      onClick={() => handleDeleteMember(member.id, member.name)}
                      variant="outline"
                      size="sm"
                      disabled={deletingId === member.id}
                      className="h-8 px-2.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-[8px] gap-1.5"
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

      {/* Member Registration Modal */}
      <CreateMemberModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          fetchMembers(); // Reload list after modal closes
        }}
      />
    </div>
  );
};
