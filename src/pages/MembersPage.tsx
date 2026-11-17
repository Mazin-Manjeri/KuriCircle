import React, { useMemo, useState } from 'react';
import { Check, Shield, Users, X } from 'lucide-react';
import {
  SemanticStatusText,
  UserAvatar,
} from '@/src/components/shared/KuriBrand';
import { Button } from '@/src/components/ui/button';
import { Card } from '@/src/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/controls';
import { Switch } from '@/src/components/ui/primitives';
import { useKuri } from '@/src/lib/store';
import { formatDate, formatINR } from '@/src/lib/utils';

export const MembersPage: React.FC = () => {
  const {
    db,
    currentUser,
    searchQuery,
    getVisibleGroupsForUser,
    getGroupMembersList,
    handleMembershipRequest,
    updateMemberPermissions,
  } = useKuri();

  const visibleGroups = useMemo(
    () => getVisibleGroupsForUser(currentUser),
    [db.groups, db.groupMembers, currentUser]
  );

  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    visibleGroups[0]?.id ?? 'grp-greenfield'
  );

  const activeGroup =
    visibleGroups.find((g) => g.id === selectedGroupId) ?? visibleGroups[0];

  const isOrganizer =
    activeGroup &&
    (activeGroup.organizerId === currentUser?.id ||
      currentUser?.role === 'platform_admin');

  const members = useMemo(() => {
    if (!activeGroup) return [];
    return getGroupMembersList(activeGroup.id).filter(({ profile }) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        profile.fullName.toLowerCase().includes(q) ||
        profile.email.toLowerCase().includes(q) ||
        profile.city.toLowerCase().includes(q)
      );
    });
  }, [activeGroup, db.groupMembers, db.contributions, searchQuery]);

  if (!activeGroup) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-[#7A7A7A]">
          Join or create a savings group to view its member directory.
        </p>
      </Card>
    );
  }

  // Expected simulated contribution per member based on completed cycles
  const distinctPeriods = new Set(
    db.contributions
      .filter((c) => c.groupId === activeGroup.id)
      .map((c) => c.contributionPeriod)
  ).size;
  const expectedPerMember =
    Math.max(1, distinctPeriods) * activeGroup.proposedContribution;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-[#0E5A46]" />
          <div>
            <h2 className="font-display text-base font-semibold text-[#1F1F1F]">
              {activeGroup.name} Directory
            </h2>
            <p className="text-xs text-[#7A7A7A]">
              {members.filter((m) => m.membership.status === 'active').length}{' '}
              active members · Expected simulated baseline:{' '}
              {formatINR(expectedPerMember)}
            </p>
          </div>
        </div>

        <div className="w-full sm:w-64">
          <Select value={activeGroup.id} onValueChange={setSelectedGroupId}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {visibleGroups.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {members.map(({ membership, profile, totalVerified, totalPending }) => {
          const outstanding = Math.max(0, expectedPerMember - totalVerified);
          return (
            <Card key={membership.id} className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar
                    name={profile.fullName}
                    src={profile.avatarUrl}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="font-display text-sm font-bold text-[#1F1F1F] truncate">
                      {profile.fullName}
                    </p>
                    <p className="text-xs text-[#7A7A7A] truncate">
                      {profile.city}
                    </p>
                    <p className="text-[11px] text-[#7A7A7A] truncate">
                      {isOrganizer || profile.id === currentUser?.id
                        ? profile.email
                        : 'Contact protected'}
                    </p>
                  </div>
                </div>
                <SemanticStatusText status={membership.status} />
              </div>

              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 rounded-2xl bg-[#F8F6F2] p-2.5 sm:p-3 text-center tabular-nums">
                <div>
                  <p className="text-[10px] text-[#7A7A7A]">Verified</p>
                  <p className="text-xs font-bold text-[#0E5A46]">
                    {formatINR(totalVerified)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#7A7A7A]">Pending</p>
                  <p className="text-xs font-bold text-[#9A6B16]">
                    {formatINR(totalPending)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#7A7A7A]">Outstanding</p>
                  <p className="text-xs font-bold text-[#1F1F1F]">
                    {formatINR(outstanding)}
                  </p>
                </div>
              </div>

              {isOrganizer && membership.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={() =>
                      handleMembershipRequest(membership.id, 'active')
                    }
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Approve</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1"
                    onClick={() =>
                      handleMembershipRequest(membership.id, 'rejected')
                    }
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Reject</span>
                  </Button>
                </div>
              )}

              {isOrganizer &&
                membership.status === 'active' &&
                profile.id !== activeGroup.organizerId && (
                  <div className="pt-2 border-t border-[#ECEAE3] space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#555555] flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5 text-[#0E5A46]" />
                        <span>View peer group totals</span>
                      </span>
                      <Switch
                        checked={membership.canViewPeerTotals}
                        onCheckedChange={(checked) =>
                          updateMemberPermissions(membership.id, {
                            canViewPeerTotals: checked,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#7A7A7A]">
                      <span>
                        Joined {formatDate(membership.joinedAt || membership.createdAt)}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateMemberPermissions(membership.id, {
                            status: 'suspended',
                          })
                        }
                        className="text-[#B91C1C] hover:underline cursor-pointer"
                      >
                        Suspend
                      </button>
                    </div>
                  </div>
                )}

              {isOrganizer && membership.status === 'suspended' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    updateMemberPermissions(membership.id, { status: 'active' })
                  }
                >
                  Restore Active Membership
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
