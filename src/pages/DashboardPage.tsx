import React, { useMemo, useState } from 'react';
import { ArrowUpRight, Plus, ShieldAlert, ShieldCheck } from 'lucide-react';
import {
  Area,
  AreaChart,
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
import { useKuri } from '@/src/lib/store';
import { formatDate, formatINR } from '@/src/lib/utils';

export const DashboardPage: React.FC = () => {
  const {
    db,
    currentUser,
    navigate,
    verificationReport,
    getGroupTotalSaved,
    getGroupPendingTotal,
    getVisibleGroupsForUser,
  } = useKuri();

  const visibleGroups = useMemo(
    () => getVisibleGroupsForUser(currentUser),
    [db.groups, db.groupMembers, currentUser]
  );

  const [focusGroupId, setFocusGroupId] = useState<string>('');
  const activeGroup =
    visibleGroups.find((g) => g.id === focusGroupId) ?? visibleGroups[0] ?? null;

  const visibleGroupIds = new Set(visibleGroups.map((g) => g.id));

  const visibleContributions = useMemo(
    () =>
      db.contributions.filter(
        (c) =>
          visibleGroupIds.has(c.groupId) &&
          (currentUser?.role !== 'member' ||
            c.memberId === currentUser.id ||
            db.groupMembers.some(
              (gm) =>
                gm.groupId === c.groupId &&
                gm.userId === currentUser.id &&
                gm.canViewPeerTotals
            ))
      ),
    [db.contributions, db.groupMembers, currentUser, visibleGroups]
  );

  const totalVerified = useMemo(
    () =>
      visibleContributions
        .filter((c) => c.verificationStatus === 'verified')
        .reduce((s, c) => s + c.amount, 0),
    [visibleContributions]
  );

  const totalPendingAmount = useMemo(
    () =>
      visibleContributions
        .filter(
          (c) => c.paymentStatus === 'pending' || c.paymentStatus === 'submitted'
        )
        .reduce((s, c) => s + c.amount, 0),
    [visibleContributions]
  );

  const uniqueActiveMembersCount = useMemo(() => {
    const ids = new Set(
      db.groupMembers
        .filter((gm) => visibleGroupIds.has(gm.groupId) && gm.status === 'active')
        .map((gm) => gm.userId)
    );
    return ids.size;
  }, [db.groupMembers, visibleGroups]);

  const activeGoalsCount = useMemo(
    () => db.goals.filter((g) => visibleGroupIds.has(g.groupId)).length,
    [db.goals, visibleGroups]
  );

  const completionRate = useMemo(() => {
    if (visibleContributions.length === 0) return 0;
    const verified = visibleContributions.filter(
      (c) => c.verificationStatus === 'verified'
    ).length;
    return Math.round((verified / visibleContributions.length) * 100);
  }, [visibleContributions]);

  const chartData = useMemo(() => {
    const map = new Map<string, { period: string; verified: number }>();
    const source = activeGroup
      ? visibleContributions.filter((c) => c.groupId === activeGroup.id)
      : visibleContributions;

    source.forEach((c) => {
      const existing = map.get(c.contributionPeriod) ?? {
        period: c.contributionPeriod,
        verified: 0,
      };
      if (c.verificationStatus === 'verified') {
        existing.verified += c.amount;
      }
      map.set(c.contributionPeriod, existing);
    });

    return Array.from(map.values()).sort((a, b) =>
      a.period.localeCompare(b.period)
    );
  }, [visibleContributions, activeGroup]);

  const focusSaved = activeGroup ? getGroupTotalSaved(activeGroup.id) : 0;
  const focusPending = activeGroup ? getGroupPendingTotal(activeGroup.id) : 0;
  const focusPercent =
    activeGroup && activeGroup.targetAmount > 0
      ? Math.min(100, Math.round((focusSaved / activeGroup.targetAmount) * 100))
      : 0;

  const recentTransactions = useMemo(
    () =>
      [...visibleContributions]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5),
    [visibleContributions]
  );

  const userVerifiedCount = useMemo(
    () =>
      db.contributions.filter(
        (c) =>
          c.memberId === currentUser?.id && c.verificationStatus === 'verified'
      ).length,
    [db.contributions, currentUser]
  );

  if (!currentUser) return null;

  const radius = 72;
  const circumference = Math.PI * radius;
  const dashOffset = circumference - (focusPercent / 100) * circumference;

  const totalAuditEvents = verificationReport?.totalEvents ?? 0;
  const isAuditHealthy =
    totalAuditEvents === 0 || Boolean(verificationReport?.isChainIntact);

  return (
    <div className="space-y-5">
      {/* Row 1: 4 Clean KPI Cards (Real Live Totals, Zero Fake Sparklines) */}
      <div className="grid gap-3.5 sm:gap-4 grid-cols-1 min-[420px]:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs font-medium text-[#7A7A7A]">
            Verified Pool Total
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-[#1F1F1F] tabular-nums">
            {formatINR(totalVerified)}
          </p>
          <p className="mt-1 text-xs text-[#7A7A7A] tabular-nums">
            {formatINR(totalPendingAmount)} pending verification
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-medium text-[#7A7A7A]">Active Members</p>
          <p className="mt-2 font-display text-2xl font-bold text-[#1F1F1F] tabular-nums">
            {uniqueActiveMembersCount}
          </p>
          <p className="mt-1 text-xs text-[#7A7A7A] tabular-nums">
            Across {visibleGroups.length} savings groups
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-medium text-[#7A7A7A]">
            Active Savings Goals
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-[#1F1F1F] tabular-nums">
            {activeGoalsCount}
          </p>
          <p className="mt-1 text-xs text-[#7A7A7A]">
            Goal-based community pools
          </p>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-[#2B6150] to-[#0E5A46] text-white">
          <p className="text-xs font-medium text-white/80">Verification Rate</p>
          <p className="mt-2 font-display text-2xl font-bold tabular-nums">
            {completionRate}%
          </p>
          <p className="mt-1 text-xs text-white/85 tabular-nums">
            {visibleContributions.length} total records
          </p>
        </Card>
      </div>

      {/* Row 2: Contribution Flow + Goal Gauge + Identity Card */}
      <div className="grid gap-4 sm:gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-12">
        <Card className="md:col-span-2 lg:col-span-6 p-4 sm:p-6 flex flex-col justify-between min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-display text-base sm:text-lg font-semibold text-[#1F1F1F]">
                Contribution Flow
              </h2>
              <p className="text-xs text-[#7A7A7A] truncate">
                {activeGroup
                  ? activeGroup.name
                  : 'Create or join a savings group to track cycle flow'}
              </p>
            </div>

            {visibleGroups.length > 0 && (
              <div className="w-full sm:w-52">
                <Select
                  value={activeGroup?.id ?? ''}
                  onValueChange={setFocusGroupId}
                >
                  <SelectTrigger className="h-8 text-xs rounded-lg bg-[#F8F6F2] border-0">
                    <SelectValue placeholder="Select group" />
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
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 min-[400px]:grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#F8F6F2] p-3.5">
              <p className="text-[11px] text-[#7A7A7A]">Verified Progress</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-display text-lg sm:text-xl font-bold text-[#1F1F1F] tabular-nums">
                  {focusPercent}%
                </span>
                <span className="text-[11px] font-semibold text-[#0E5A46] tabular-nums">
                  {formatINR(focusSaved)}
                </span>
              </div>
            </div>
            <div className="rounded-2xl bg-[#F8F6F2] p-3.5">
              <p className="text-[11px] text-[#7A7A7A]">Remaining to Target</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-display text-lg sm:text-xl font-bold text-[#1F1F1F] tabular-nums">
                  {formatINR(
                    Math.max(0, (activeGroup?.targetAmount ?? 0) - focusSaved)
                  )}
                </span>
                <span className="text-[11px] font-medium text-[#9A6B16] tabular-nums">
                  {formatINR(focusPending)} pending
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 h-48 w-full">
            {chartData.length === 0 ? (
              <div className="h-full rounded-2xl bg-[#F8F6F2] flex flex-col items-center justify-center p-6 text-center gap-2">
                <p className="text-xs font-medium text-[#555555]">
                  No contribution cycles recorded yet
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    navigate(
                      visibleGroups.length === 0 ? 'create-group' : 'contributions'
                    )
                  }
                >
                  {visibleGroups.length === 0
                    ? 'Create First Savings Group'
                    : 'Record Contribution'}
                </Button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0E5A46" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#0E5A46" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#ECEAE3"
                  />
                  <XAxis
                    dataKey="period"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#7A7A7A', fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#7A7A7A', fontSize: 11 }}
                    tickFormatter={(v) => `₹${v / 1000}k`}
                  />
                  <RechartsTooltip
                    formatter={(value) => [
                      formatINR(Number(value ?? 0)),
                      'Verified',
                    ]}
                    contentStyle={{
                      borderRadius: '14px',
                      border: '1px solid #E7E4DC',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="verified"
                    stroke="#0E5A46"
                    strokeWidth={2.5}
                    fill="url(#emeraldGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Middle 3 Cols: Goal Progress Radial Gauge */}
        <Card className="md:col-span-1 lg:col-span-3 p-5 sm:p-6 flex flex-col justify-between min-w-0">
          <div>
            <p className="font-display text-base font-semibold text-[#1F1F1F]">
              Savings Goal
            </p>
            <p className="text-xs text-[#7A7A7A] mt-0.5 truncate">
              {activeGroup?.name ?? 'No active group'}
            </p>
            <p className="mt-2 font-display text-2xl font-bold text-[#0E5A46] tabular-nums">
              {formatINR(focusSaved)}
            </p>
            <p className="text-xs text-[#7A7A7A] mt-0.5 tabular-nums">
              Target {formatINR(activeGroup?.targetAmount ?? 0)}
            </p>
          </div>

          <div className="my-3 flex flex-col items-center justify-center">
            <svg viewBox="0 0 180 105" className="w-44 h-28 overflow-visible">
              <path
                d="M 18 90 A 72 72 0 0 1 162 90"
                fill="none"
                stroke="#E8F0ED"
                strokeWidth="18"
                strokeLinecap="round"
              />
              <path
                d="M 18 90 A 72 72 0 0 1 162 90"
                fill="none"
                stroke="#0E5A46"
                strokeWidth="18"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
              />
              <text
                x="90"
                y="82"
                textAnchor="middle"
                className="font-display font-bold fill-[#1F1F1F] text-2xl"
              >
                {focusPercent}%
              </text>
            </svg>
          </div>

          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={() =>
              activeGroup
                ? navigate('group-details', { groupId: activeGroup.id })
                : navigate('groups')
            }
          >
            {activeGroup ? 'Inspect Milestones' : 'Browse Groups'}
          </Button>
        </Card>

        {/* Right 3 Cols: User Identity Card */}
        <Card className="md:col-span-1 lg:col-span-3 p-5 sm:p-6 flex flex-col items-center justify-between text-center min-w-0">
          <div className="flex flex-col items-center space-y-2.5 pt-1">
            <UserAvatar
              name={currentUser.fullName}
              src={currentUser.avatarUrl}
              size="xl"
              className="ring-4 ring-[#F3F1EC]"
            />
            <div>
              <h2 className="font-display text-base font-bold text-[#1F1F1F]">
                {currentUser.fullName}
              </h2>
              <p className="text-xs text-[#7A7A7A] truncate max-w-[200px]">
                {currentUser.email}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-[#0E5A46] capitalize">
                {currentUser.role.replace('_', ' ')} · {currentUser.city}
              </p>
            </div>
          </div>

          <div className="w-full grid grid-cols-3 gap-2 pt-4 mt-4 border-t border-[#ECEAE3]">
            <div>
              <p className="text-[11px] text-[#7A7A7A]">Circles</p>
              <p className="mt-0.5 font-display text-base font-bold text-[#1F1F1F] tabular-nums">
                {visibleGroups.length}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[#7A7A7A]">Verified</p>
              <p className="mt-0.5 font-display text-base font-bold text-[#1F1F1F] tabular-nums">
                {userVerifiedCount}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[#7A7A7A]">Audit</p>
              <p className="mt-0.5 font-display text-base font-bold text-[#0E5A46] tabular-nums">
                {verificationReport?.validEvents ?? 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 3: Active Circle Actions + Recent Contributions + Audit Ledger Status */}
      <div className="grid gap-4 sm:gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-12">
        <Card className="md:col-span-2 lg:col-span-5 p-5 sm:p-6 flex flex-col justify-between gap-4 min-w-0">
          {activeGroup ? (
            <>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#0E5A46]">
                  Active Circle · {activeGroup.purpose}
                </p>
                <h2 className="font-display text-lg sm:text-xl font-bold text-[#1F1F1F]">
                  {activeGroup.name}
                </h2>
                <p className="text-xs leading-relaxed text-[#7A7A7A]">
                  {activeGroup.description}
                </p>
              </div>
              <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-3 rounded-2xl bg-[#F8F6F2] p-3.5 text-xs tabular-nums">
                <div className="min-w-0">
                  <p className="text-[#7A7A7A]">Invite Code</p>
                  <p className="font-mono font-semibold text-[#0E5A46] mt-0.5 truncate">
                    {activeGroup.inviteCode}
                  </p>
                </div>
                <div>
                  <p className="text-[#7A7A7A]">Cycle Amount</p>
                  <p className="font-semibold text-[#1F1F1F] mt-0.5">
                    {formatINR(activeGroup.proposedContribution)}
                  </p>
                </div>
                <div>
                  <p className="text-[#7A7A7A]">Target Date</p>
                  <p className="font-semibold text-[#1F1F1F] mt-0.5">
                    {formatDate(activeGroup.endDate)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => navigate('contributions')}
                  className="gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Record Contribution</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    navigate('group-details', { groupId: activeGroup.id })
                  }
                >
                  Open Circle
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4 my-auto">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-[#0E5A46]">
                  Get Started
                </p>
                <h2 className="font-display text-xl font-bold text-[#1F1F1F]">
                  No savings circles yet
                </h2>
                <p className="text-xs leading-relaxed text-[#7A7A7A]">
                  Create a new goal-based community savings group or join an
                  existing circle using an organizer’s invitation code.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(currentUser.role === 'organizer' ||
                  currentUser.role === 'platform_admin') && (
                  <Button
                    size="sm"
                    onClick={() => navigate('create-group')}
                    className="gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create Savings Group</span>
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('groups')}
                >
                  Join via Invite Code
                </Button>
              </div>
            </div>
          )}
        </Card>

        <Card className="md:col-span-1 lg:col-span-4 p-5 flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-base font-semibold text-[#1F1F1F]">
              Recent Contributions
            </h2>
            <button
              type="button"
              onClick={() => navigate('contributions')}
              className="text-xs font-medium text-[#0E5A46] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
            >
              <span>All</span>
              <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-2.5 flex-1">
            {recentTransactions.length === 0 ? (
              <p className="text-xs text-[#7A7A7A] py-8 text-center">
                No contributions recorded yet.
              </p>
            ) : (
              recentTransactions.map((tx) => {
                const member = db.profiles.find((p) => p.id === tx.memberId);
                return (
                  <button
                    key={tx.id}
                    type="button"
                    onClick={() =>
                      navigate('transaction-details', { transactionId: tx.id })
                    }
                    className="flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left hover:bg-[#F8F6F2] transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#1F1F1F] truncate">
                        {member?.fullName ?? 'Member'}
                      </p>
                      <p className="text-[11px] text-[#7A7A7A] tabular-nums">
                        {formatDate(tx.transactionDate)} · {tx.contributionPeriod}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-[#1F1F1F] tabular-nums">
                        {formatINR(tx.amount)}
                      </p>
                      <SemanticStatusText
                        status={tx.paymentStatus}
                        className="text-[10px] justify-end"
                      />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        <Card className="md:col-span-1 lg:col-span-3 p-5 flex flex-col justify-between min-w-0">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              {isAuditHealthy ? (
                <ShieldCheck className="h-5 w-5 text-[#0E5A46]" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-[#B91C1C]" />
              )}
              <h2 className="font-display text-base font-bold text-[#1F1F1F]">
                Audit Integrity
              </h2>
            </div>
            <p className="text-xs leading-relaxed text-[#7A7A7A]">
              {totalAuditEvents === 0
                ? 'No audit events recorded yet. Every group and contribution action generates a SHA-256 linked event.'
                : isAuditHealthy
                ? `All ${verificationReport?.totalEvents ?? 0} SHA-256 linked audit events verified intact.`
                : `${verificationReport?.brokenEvents ?? 1} audit event failed hash verification.`}
            </p>
          </div>

          <Button
            className="w-full mt-4"
            variant={isAuditHealthy ? 'default' : 'destructive'}
            onClick={() => navigate('verify-history')}
          >
            Verify Audit Ledger
          </Button>
        </Card>
      </div>
    </div>
  );
};
