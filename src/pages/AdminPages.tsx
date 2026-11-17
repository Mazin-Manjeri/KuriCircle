import React from 'react';
import {
  AlertCircle,
  Flag,
  FolderKanban,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
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
import { formatDateTime, formatINR } from '@/src/lib/utils';
import type { UserRole } from '@/src/types/kuri';

export const AdminOverviewPage: React.FC = () => {
  const { db, verificationReport, getGroupTotalSaved, navigate } = useKuri();

  const totalPlatformSimulated = db.contributions
    .filter((c) => c.verificationStatus === 'verified')
    .reduce((s, c) => s + c.amount, 0);

  const openOrEscalatedDisputes = db.disputes.filter(
    (d) => d.status === 'open' || d.status === 'escalated'
  ).length;

  const groupChartData = db.groups.map((g) => ({
    name: g.name.split(' ').slice(0, 2).join(' '),
    saved: getGroupTotalSaved(g.id),
    target: g.targetAmount,
  }));

  return (
    <div className="space-y-5">
      <div className="grid gap-3.5 sm:gap-4 grid-cols-1 min-[420px]:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs text-[#7A7A7A]">Total Platform Users</p>
          <p className="mt-2 font-display text-2xl font-bold text-[#1F1F1F] tabular-nums">
            {db.profiles.length}
          </p>
          <p className="mt-1 text-xs text-[#0E5A46]">
            {db.profiles.filter((p) => p.isActive).length} active accounts
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-[#7A7A7A]">Demonstration Groups</p>
          <p className="mt-2 font-display text-2xl font-bold text-[#1F1F1F] tabular-nums">
            {db.groups.length}
          </p>
          <p className="mt-1 text-xs text-[#7A7A7A]">
            {db.groups.filter((g) => g.isFlagged).length} flagged for review
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-[#7A7A7A]">Simulated Volume Verified</p>
          <p className="mt-2 font-display text-2xl font-bold text-[#0E5A46] tabular-nums">
            {formatINR(totalPlatformSimulated)}
          </p>
          <p className="mt-1 text-xs text-[#7A7A7A]">
            Across {db.contributions.length} total records
          </p>
        </Card>
        <Card className="p-5 bg-[#0E5A46] text-white">
          <p className="text-xs text-white/80">Disputes & Ledger Status</p>
          <p className="mt-2 font-display text-2xl font-bold tabular-nums">
            {openOrEscalatedDisputes} Active
          </p>
          <p className="mt-1 text-xs text-white/85">
            SHA-256 Chain:{' '}
            {verificationReport?.isChainIntact ? 'Intact' : 'Broken'}
          </p>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <Card className="lg:col-span-7 p-4 sm:p-6 space-y-4 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-base font-semibold text-[#1F1F1F]">
              Group Simulated Progress vs Target
            </h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('admin-groups')}
            >
              Monitor All Groups
            </Button>
          </div>
          <div className="h-56 sm:h-64 w-full">
            {groupChartData.length === 0 ? (
              <div className="h-full rounded-2xl bg-[#F8F6F2] flex items-center justify-center p-6 text-center text-xs text-[#7A7A7A]">
                No savings groups created yet. Group progress vs target bars will appear here.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={groupChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECEAE3" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#7A7A7A', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#7A7A7A', fontSize: 11 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <RechartsTooltip formatter={(v) => formatINR(Number(v ?? 0))} />
                  <Bar dataKey="saved" name="Verified Simulated" fill="#0E5A46" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="target" name="Target Goal" fill="#DCE6E1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-5 p-4 sm:p-6 space-y-4 min-w-0">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-[#1F1F1F]">
              Quick Admin Queues
            </h2>
          </div>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => navigate('admin-disputes')}
              className="w-full flex items-center justify-between rounded-2xl bg-[#F8F6F2] p-4 hover:bg-[#EFECE4] transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-[#9A6B16]" />
                <div>
                  <p className="text-sm font-semibold text-[#1F1F1F]">
                    Escalated Dispute Monitoring
                  </p>
                  <p className="text-xs text-[#7A7A7A]">
                    Review discrepancies escalated by organizers
                  </p>
                </div>
              </div>
              <span className="font-display text-base font-bold text-[#1F1F1F] tabular-nums">
                {openOrEscalatedDisputes}
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate('admin-users')}
              className="w-full flex items-center justify-between rounded-2xl bg-[#F8F6F2] p-4 hover:bg-[#EFECE4] transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-[#0E5A46]" />
                <div>
                  <p className="text-sm font-semibold text-[#1F1F1F]">
                    User Access & Role Directory
                  </p>
                  <p className="text-xs text-[#7A7A7A]">
                    Manage roles and account activation status
                  </p>
                </div>
              </div>
              <span className="font-display text-base font-bold text-[#1F1F1F] tabular-nums">
                {db.profiles.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate('admin-activity')}
              className="w-full flex items-center justify-between rounded-2xl bg-[#F8F6F2] p-4 hover:bg-[#EFECE4] transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-[#0E5A46]" />
                <div>
                  <p className="text-sm font-semibold text-[#1F1F1F]">
                    System Activity & Settings
                  </p>
                  <p className="text-xs text-[#7A7A7A]">
                    Platform demonstration policies and audit trail
                  </p>
                </div>
              </div>
              <span className="font-display text-base font-bold text-[#1F1F1F] tabular-nums">
                {db.activityLogs.length}
              </span>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export const AdminUsersPage: React.FC = () => {
  const { db, currentUser, toggleUserActive, changeUserRole } = useKuri();

  return (
    <Card className="overflow-hidden">
      <div className="p-5 border-b border-[#ECEAE3] flex items-center justify-between">
        <div>
          <h2 className="font-display text-base font-semibold text-[#1F1F1F]">
            Platform User Management
          </h2>
          <p className="text-xs text-[#7A7A7A]">
            Manage user roles and account status across the demonstration platform
          </p>
        </div>
      </div>
      <div className="md:hidden divide-y divide-[#F2EFE8]">
        {db.profiles.map((u) => (
          <div key={u.id} className="p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <UserAvatar name={u.fullName} src={u.avatarUrl} size="sm" />
                <div className="min-w-0">
                  <p className="font-semibold text-[#1F1F1F] truncate">
                    {u.fullName}
                  </p>
                  <p className="text-[11px] text-[#7A7A7A] truncate">{u.email}</p>
                </div>
              </div>
              <SemanticStatusText status={u.isActive ? 'active' : 'suspended'} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Select
                value={u.role}
                onValueChange={(r) => changeUserRole(u.id, r as UserRole)}
                disabled={u.id === currentUser?.id}
              >
                <SelectTrigger className="h-9 w-36 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="organizer">Organizer</SelectItem>
                  <SelectItem value="platform_admin">Platform Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                disabled={u.id === currentUser?.id}
                onClick={() => toggleUserActive(u.id)}
              >
                {u.isActive ? 'Suspend' : 'Activate'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#ECEAE3] bg-[#F8F6F2] text-[#7A7A7A]">
              <th className="py-3 px-4 font-semibold">User</th>
              <th className="py-3 px-4 font-semibold">Email</th>
              <th className="py-3 px-4 font-semibold">City</th>
              <th className="py-3 px-4 font-semibold">Role</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F2EFE8]">
            {db.profiles.map((u) => (
              <tr key={u.id} className="hover:bg-[#F8F6F2]/60">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <UserAvatar name={u.fullName} src={u.avatarUrl} size="sm" />
                    <span className="font-semibold text-[#1F1F1F]">
                      {u.fullName}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-[#555555]">{u.email}</td>
                <td className="py-3 px-4 text-[#7A7A7A]">{u.city}</td>
                <td className="py-3 px-4">
                  <Select
                    value={u.role}
                    onValueChange={(r) => changeUserRole(u.id, r as UserRole)}
                    disabled={u.id === currentUser?.id}
                  >
                    <SelectTrigger className="h-8 w-36 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="organizer">Organizer</SelectItem>
                      <SelectItem value="platform_admin">Platform Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="py-3 px-4">
                  <SemanticStatusText
                    status={u.isActive ? 'active' : 'suspended'}
                  />
                </td>
                <td className="py-3 px-4 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={u.id === currentUser?.id}
                    onClick={() => toggleUserActive(u.id)}
                  >
                    {u.isActive ? 'Suspend' : 'Activate'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export const AdminGroupsPage: React.FC = () => {
  const { db, getGroupTotalSaved, toggleGroupFlag, navigate } = useKuri();

  return (
    <div className="space-y-4">
      {db.groups.length === 0 ? (
        <Card className="p-8 text-center text-xs text-[#7A7A7A]">
          No savings groups have been created yet.
        </Card>
      ) : (
        db.groups.map((g) => {
        const organizer = db.profiles.find((p) => p.id === g.organizerId);
        const saved = getGroupTotalSaved(g.id);
        const membersCount = db.groupMembers.filter(
          (gm) => gm.groupId === g.id && gm.status === 'active'
        ).length;

        return (
          <Card
            key={g.id}
            className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <FolderKanban className="h-4 w-4 text-[#0E5A46]" />
                <span className="font-mono font-semibold text-[#0E5A46]">
                  {g.inviteCode}
                </span>
                <span>·</span>
                <span className="text-[#7A7A7A]">{g.purpose}</span>
                {g.isFlagged && (
                  <span className="font-semibold text-[#B91C1C]">
                    · Flagged for Review
                  </span>
                )}
              </div>
              <h3 className="font-display text-base font-bold text-[#1F1F1F]">
                {g.name}
              </h3>
              <p className="text-xs text-[#7A7A7A] tabular-nums">
                Organizer: {organizer?.fullName} · {membersCount}/{g.maxMembers}{' '}
                members · Verified Simulated: {formatINR(saved)} /{' '}
                {formatINR(g.targetAmount)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('group-details', { groupId: g.id })}
              >
                Inspect Circle
              </Button>
              <Button
                size="sm"
                variant={g.isFlagged ? 'destructive' : 'secondary'}
                onClick={() => toggleGroupFlag(g.id, 'Admin compliance check')}
                className="gap-1.5"
              >
                <Flag className="h-3.5 w-3.5" />
                <span>{g.isFlagged ? 'Clear Flag' : 'Flag Group'}</span>
              </Button>
            </div>
          </Card>
        );
      })
      )}
    </div>
  );
};

export const AdminDisputesPage: React.FC = () => {
  const { db, respondDispute } = useKuri();

  return (
    <div className="space-y-4">
      {db.disputes.length === 0 ? (
        <Card className="p-8 text-center text-xs text-[#7A7A7A]">
          No disputes recorded across the platform.
        </Card>
      ) : (
        db.disputes.map((d) => {
        const group = db.groups.find((g) => g.id === d.groupId);
        const reporter = db.profiles.find((p) => p.id === d.reportedBy);

        return (
          <Card key={d.id} className="p-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-mono text-[#0E5A46]">
                  {d.id.toUpperCase()} · {group?.name}
                </p>
                <h3 className="font-display text-base font-bold text-[#1F1F1F]">
                  {d.category}
                </h3>
                <p className="text-xs text-[#7A7A7A]">
                  Reported by {reporter?.fullName} · Updated{' '}
                  {formatDateTime(d.updatedAt)}
                </p>
              </div>
              <SemanticStatusText status={d.status} />
            </div>

            <p className="text-sm text-[#555555]">{d.description}</p>

            {d.status !== 'resolved' && d.status !== 'dismissed' && (
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() =>
                    respondDispute(
                      d.id,
                      'Platform Administrator reviewed transaction hashes and marked resolved.',
                      'resolved',
                      'Admin Resolved'
                    )
                  }
                >
                  Mark Resolved
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    respondDispute(
                      d.id,
                      'Dismissed after audit log verification confirmed record accuracy.',
                      'dismissed',
                      'Admin Dismissed'
                    )
                  }
                >
                  Dismiss Dispute
                </Button>
              </div>
            )}
          </Card>
        );
      })
      )}
    </div>
  );
};

export const AdminActivityPage: React.FC = () => {
  const { db, updatePlatformSettings } = useKuri();

  return (
    <div className="grid gap-5 lg:grid-cols-12">
      <Card className="lg:col-span-5 p-4 sm:p-6 space-y-4 min-w-0">
        <h2 className="font-display text-base font-semibold text-[#1F1F1F]">
          Platform Governance Settings
        </h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-2xl bg-[#F8F6F2] p-4">
            <div>
              <p className="text-xs font-semibold text-[#1F1F1F]">
                Demonstration Disclosure Banner
              </p>
              <p className="text-[11px] text-[#7A7A7A]">
                Show simulated prototype notice in workspace
              </p>
            </div>
            <Switch
              checked={db.platformSettings.demonstrationNoticeEnabled}
              onCheckedChange={(v) =>
                updatePlatformSettings({ demonstrationNoticeEnabled: v })
              }
            />
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-[#F8F6F2] p-4">
            <div>
              <p className="text-xs font-semibold text-[#1F1F1F]">
                Community Directory Visibility
              </p>
              <p className="text-[11px] text-[#7A7A7A]">
                Allow organizers to list groups publicly
              </p>
            </div>
            <Switch
              checked={db.platformSettings.allowPublicDirectory}
              onCheckedChange={(v) =>
                updatePlatformSettings({ allowPublicDirectory: v })
              }
            />
          </div>
        </div>
      </Card>

      <Card className="lg:col-span-7 p-4 sm:p-6 space-y-4 min-w-0">
        <h2 className="font-display text-base font-semibold text-[#1F1F1F]">
          Recent System Activity Logs
        </h2>
        <div className="divide-y divide-[#F2EFE8]">
          {db.activityLogs.length === 0 ? (
            <p className="py-6 text-center text-xs text-[#7A7A7A]">
              No system activity logged yet.
            </p>
          ) : (
            db.activityLogs.map((log) => {
              const actor = db.profiles.find((p) => p.id === log.userId);
              return (
                <div
                  key={log.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[#1F1F1F]">{log.action}</p>
                    <p className="text-[#555555]">{log.details}</p>
                    <p className="text-[11px] text-[#7A7A7A]">
                      {actor?.fullName ?? log.userId} · {log.resourceType}
                    </p>
                  </div>
                  <span className="text-[11px] text-[#7A7A7A] whitespace-nowrap tabular-nums shrink-0">
                    {formatDateTime(log.createdAt)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
};
