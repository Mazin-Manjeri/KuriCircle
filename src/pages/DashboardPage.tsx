import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Fingerprint,
  Plus,
  ShieldAlert,
  Target,
  Users,
} from 'lucide-react';
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
import { Card, CardContent } from '@/src/components/ui/card';
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

  const [focusGroupId, setFocusGroupId] = useState<string>(
    visibleGroups[0]?.id ?? 'grp-greenfield'
  );

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

  const totalSimulatedVerified = useMemo(
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
    const relevant = visibleContributions.length;
    if (relevant === 0) return 0;
    const verified = visibleContributions.filter(
      (c) => c.verificationStatus === 'verified'
    ).length;
    return Math.round((verified / relevant) * 100);
  }, [visibleContributions]);

  // Monthly Recharts trend for the selected/visible groups
  const chartData = useMemo(() => {
    const map = new Map<string, { period: string; verified: number; pending: number }>();
    const source = activeGroup
      ? visibleContributions.filter((c) => c.groupId === activeGroup.id)
      : visibleContributions;

    source.forEach((c) => {
      const existing = map.get(c.contributionPeriod) ?? {
        period: c.contributionPeriod,
        verified: 0,
        pending: 0,
      };
      if (c.verificationStatus === 'verified') {
        existing.verified += c.amount;
      } else if (c.paymentStatus !== 'rejected') {
        existing.pending += c.amount;
      }
      map.set(c.contributionPeriod, existing);
    });

    return Array.from(map.values()).sort((a, b) =>
      a.period.localeCompare(b.period)
    );
  }, [visibleContributions, activeGroup]);

  // Focused group metrics for the semi-circular gauge (default Greenfield: ₹40,000 / ₹1,00,000 = 40%)
  const focusSaved = activeGroup ? getGroupTotalSaved(activeGroup.id) : 0;
  const focusPending = activeGroup ? getGroupPendingTotal(activeGroup.id) : 0;
  const focusPercent = activeGroup
    ? Math.min(100, Math.round((focusSaved / activeGroup.targetAmount) * 100))
    : 0;

  const recentTransactions = useMemo(
    () =>
      [...visibleContributions]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 4),
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

  const upcomingDates = useMemo(
    () =>
      visibleGroups.slice(0, 3).map((g) => ({
        groupId: g.id,
        groupName: g.name,
        nextDate: '2026-12-10',
        amount: g.proposedContribution,
        frequency: g.frequency,
      })),
    [visibleGroups]
  );

  if (!currentUser) return null;

  // SVG semi-circle arc math
  const radius = 72;
  const circumference = Math.PI * radius;
  const dashOffset = circumference - (focusPercent / 100) * circumference;

  return (
    <div className="space-y-5">
      {/* ROW 1: 4 KPI Cards (3 white + 1 signature Deep Emerald gradient card) */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* KPI 1 */}
        <Card className="p-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-[#7A7A7A]">
              Simulated Pool Total
            </p>
            <p className="mt-2 font-display text-2xl font-bold text-[#1F1F1F] tabular-nums">
              {formatINR(totalSimulatedVerified)}
            </p>
            <p className="mt-1 text-[11px] text-[#0E5A46]">
              Verified demonstration total
            </p>
          </div>
          {/* Mini Vertical Bar Sparkline (Reference aesthetic) */}
          <div className="flex items-end gap-1.5 h-12 shrink-0" aria-hidden="true">
            {[45, 70, 58, 92, 68].map((h, idx) => (
              <div
                key={idx}
                className="w-1.5 rounded-full bg-[#E8F0ED] flex items-end overflow-hidden h-full"
              >
                <div
                  className="w-full rounded-full bg-[#0E5A46]"
                  style={{ height: `${h}%` }}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* KPI 2 */}
        <Card className="p-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E8F0ED] text-[#0E5A46] shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#7A7A7A]">Total Members</p>
              <p className="mt-1 font-display text-2xl font-bold text-[#1F1F1F] tabular-nums">
                {uniqueActiveMembersCount}
              </p>
              <p className="text-[11px] text-[#7A7A7A]">
                Across {visibleGroups.length} savings groups
              </p>
            </div>
          </div>
          <svg
            viewBox="0 0 60 28"
            className="h-8 w-14 shrink-0 text-[#0E5A46]"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2 24 C14 24, 18 14, 28 16 C38 18, 44 6, 58 4"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </Card>

        {/* KPI 3 */}
        <Card className="p-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F7F0DF] text-[#9A6B16] shrink-0">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#7A7A7A]">
                Active Savings Goals
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-[#1F1F1F] tabular-nums">
                {activeGoalsCount}
              </p>
              <p className="text-[11px] text-[#7A7A7A]">
                Pending: {formatINR(totalPendingAmount)}
              </p>
            </div>
          </div>
        </Card>

        {/* KPI 4: Signature Featured Deep Emerald Gradient Card */}
        <Card className="p-5 bg-gradient-to-br from-[#648C7D] via-[#265E4D] to-[#0E5A46] text-white flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-white/80">
              Verification Rate
            </p>
            <p className="mt-2 font-display text-2xl font-bold tabular-nums">
              {completionRate}%
            </p>
            <p className="mt-1 text-[11px] text-white/85">
              {visibleContributions.length} total records
            </p>
          </div>
          <svg
            viewBox="0 0 72 34"
            className="h-9 w-16 shrink-0"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2 24 C10 8, 22 30, 34 16 C46 2, 54 28, 70 12"
              stroke="rgba(255,255,255,0.88)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </Card>
      </div>

      {/* ROW 2: 6-Col Chart + 3-Col Radial Gauge + 3-Col Identity Card */}
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Left 6 Cols: Balance / Contribution Flow Chart */}
        <Card className="lg:col-span-6 p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-lg font-semibold text-[#1F1F1F]">
                Contribution Flow
              </h2>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#0E5A46]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>On track</span>
              </span>
            </div>

            <div className="w-52">
              <Select value={activeGroup?.id ?? ''} onValueChange={setFocusGroupId}>
                <SelectTrigger className="h-8 text-xs rounded-lg bg-[#F8F6F2] border-0">
                  <SelectValue placeholder="Select savings group" />
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

          {/* 2 Flat Soft Summary Blocks (Reference layout, zero nested card borders) */}
          <div className="mt-4 grid grid-cols-2 gap-3">
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
                  formatter={(value) => [formatINR(Number(value ?? 0)), 'Simulated']}
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
          </div>
        </Card>

        {/* Middle 3 Cols: Goal Progress Semi-Circular Radial Gauge */}
        <Card className="lg:col-span-3 p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <p className="font-display text-base font-semibold text-[#1F1F1F]">
              Savings Goal
            </p>
            <p className="text-xs text-[#7A7A7A] mt-0.5 truncate">
              {activeGroup?.name ?? 'Community Pool'}
            </p>
            <p className="mt-2 font-display text-2xl font-bold text-[#0E5A46] tabular-nums">
              {formatINR(focusSaved)}
            </p>
            <p className="text-xs text-[#7A7A7A] mt-0.5 tabular-nums">
              Target {formatINR(activeGroup?.targetAmount ?? 0)} · Simulated
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
              activeGroup &&
              navigate('group-details', { groupId: activeGroup.id })
            }
          >
            Inspect Milestones
          </Button>
        </Card>

        {/* Right 3 Cols: User Standing / Identity Card */}
        <Card className="lg:col-span-3 p-5 sm:p-6 flex flex-col items-center justify-between text-center">
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

      {/* ROW 3: 6-Col Featured Group Passbook Cards + 3-Col Recent Transactions + 3-Col Audit Shield */}
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Left 6 Cols: Featured Circle Spotlight with Stacked Translucent Cards (Reference layout) */}
        <Card className="lg:col-span-6 p-6 flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden">
          <div className="space-y-3.5 max-w-xs">
            <p className="text-xs font-semibold text-[#0E5A46]">
              Goal-Based Community Pool
            </p>
            <h2 className="font-display text-xl font-bold text-[#1F1F1F] leading-snug">
              {activeGroup?.name ?? 'Greenfield Community Savings'}
            </h2>
            <p className="text-xs leading-relaxed text-[#7A7A7A]">
              {activeGroup?.description ??
                'Coordinate monthly simulated savings pledges with transparent member records and SHA-256 verification.'}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                size="sm"
                onClick={() => navigate('contributions')}
                className="gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>
                  {currentUser.role === 'member'
                    ? 'Submit Record'
                    : 'Record Contribution'}
                </span>
              </Button>
              {activeGroup && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    navigate('group-details', { groupId: activeGroup.id })
                  }
                >
                  Open Circle
                </Button>
              )}
            </div>
          </div>

          {/* Stacked Translucent Digital Kuri Passbook Visual (Reference Card Stack Motif) */}
          <div className="relative h-48 w-64 shrink-0 select-none" aria-hidden="true">
            <div className="absolute right-0 top-10 h-32 w-56 rounded-2xl bg-[#1F1F1F] p-4 text-white shadow-lg rotate-[6deg]">
              <p className="text-[10px] text-white/60">Audit Chain</p>
              <p className="mt-8 font-mono text-xs text-[#C8A45A]">
                SHA-256 VERIFIED
              </p>
            </div>
            <div className="absolute right-3 top-5 h-32 w-56 rounded-2xl bg-gradient-to-br from-[#2B6150] to-[#0E5A46] p-4 text-white shadow-lg rotate-[2deg]">
              <p className="text-[10px] text-white/75">Simulated Pool</p>
              <p className="mt-1 font-display text-lg font-bold tabular-nums">
                {formatINR(focusSaved)}
              </p>
              <p className="mt-7 font-mono text-[11px] text-white/80">
                {activeGroup?.inviteCode ?? 'KURI-GRN-2026'}
              </p>
            </div>
            <div className="absolute right-6 top-0 h-32 w-56 rounded-2xl bg-white/85 backdrop-blur-md border border-[#E7E4DC] p-4 text-[#1F1F1F] shadow-md -rotate-[3deg]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-[#0E5A46]">
                  DIGITAL KURI PASS
                </span>
                <span className="font-mono text-[10px] text-[#7A7A7A]">
                  DEMO
                </span>
              </div>
              <p className="mt-3 font-display text-sm font-bold truncate">
                {activeGroup?.name ?? 'Greenfield Community'}
              </p>
              <div className="mt-6 flex items-center justify-between text-[11px] text-[#7A7A7A] tabular-nums">
                <span>{activeGroup?.frequency ?? 'Monthly'}</span>
                <span className="font-semibold text-[#1F1F1F]">
                  {formatINR(activeGroup?.proposedContribution ?? 1000)} / cycle
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Middle 3 Cols: Recent Simulated Contributions */}
        <Card className="lg:col-span-3 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-base font-semibold text-[#1F1F1F]">
              Recent Entries
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

          <div className="space-y-3 flex-1">
            {recentTransactions.length === 0 ? (
              <p className="text-xs text-[#7A7A7A] py-6 text-center">
                No simulated contributions recorded yet.
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

        {/* Right 3 Cols: Keep You Safe / Cryptographic Audit Verification Card */}
        <Card className="lg:col-span-3 p-5 flex flex-col items-center justify-between text-center">
          <div className="pt-2 flex flex-col items-center space-y-2.5">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full ${
                verificationReport?.isChainIntact
                  ? 'bg-[#E8F0ED] text-[#0E5A46]'
                  : 'bg-[#FEE2E2] text-[#B91C1C]'
              }`}
            >
              {verificationReport?.isChainIntact ? (
                <Fingerprint className="h-7 w-7" />
              ) : (
                <ShieldAlert className="h-7 w-7" />
              )}
            </div>
            <h2 className="font-display text-base font-bold text-[#1F1F1F]">
              {verificationReport?.isChainIntact
                ? 'Keep records safe!'
                : 'Integrity Alert'}
            </h2>
            <p className="text-xs leading-relaxed text-[#7A7A7A]">
              {verificationReport?.isChainIntact
                ? `All ${verificationReport.totalEvents} audit events pass SHA-256 chain verification.`
                : `${verificationReport?.brokenEvents ?? 1} audit link failed hash verification. Inspect immediately.`}
            </p>
          </div>

          <Button
            className="w-full mt-4"
            variant={verificationReport?.isChainIntact ? 'default' : 'destructive'}
            onClick={() => navigate('verify-history')}
          >
            Verify Audit Ledger
          </Button>
        </Card>
      </div>

      {/* Upcoming Contribution Dates Strip */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-[#0E5A46]" />
            <h2 className="font-display text-sm font-semibold text-[#1F1F1F]">
              Upcoming Simulated Contribution Schedule
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('groups')}
            className="text-xs font-medium text-[#0E5A46] hover:underline cursor-pointer"
          >
            Manage Schedules
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {upcomingDates.map((item) => (
            <div
              key={item.groupId}
              className="flex items-center justify-between rounded-2xl bg-[#F8F6F2] px-4 py-3"
            >
              <div className="min-w-0 pr-3">
                <p className="text-xs font-semibold text-[#1F1F1F] truncate">
                  {item.groupName}
                </p>
                <p className="text-[11px] text-[#7A7A7A] capitalize">
                  Due {formatDate(item.nextDate)} · {item.frequency}
                </p>
              </div>
              <span className="font-display text-sm font-bold text-[#0E5A46] tabular-nums shrink-0">
                {formatINR(item.amount)}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
