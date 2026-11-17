import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
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
import { downloadCSV, formatINR } from '@/src/lib/utils';

export const ReportsPage: React.FC = () => {
  const {
    db,
    currentUser,
    verificationReport,
    getVisibleGroupsForUser,
    getGroupTotalSaved,
    getGroupPendingTotal,
  } = useKuri();

  const visibleGroups = useMemo(
    () => getVisibleGroupsForUser(currentUser),
    [db.groups, db.groupMembers, currentUser]
  );

  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');

  const relevantContribs = useMemo(() => {
    const ids = new Set(visibleGroups.map((g) => g.id));
    return db.contributions.filter(
      (c) =>
        ids.has(c.groupId) &&
        (selectedGroupId === 'all' || c.groupId === selectedGroupId)
    );
  }, [db.contributions, visibleGroups, selectedGroupId]);

  const monthlySeries = useMemo(() => {
    const map = new Map<
      string,
      { period: string; verified: number; pending: number }
    >();
    relevantContribs.forEach((c) => {
      const entry = map.get(c.contributionPeriod) ?? {
        period: c.contributionPeriod,
        verified: 0,
        pending: 0,
      };
      if (c.verificationStatus === 'verified') entry.verified += c.amount;
      else if (c.paymentStatus !== 'rejected') entry.pending += c.amount;
      map.set(c.contributionPeriod, entry);
    });
    return Array.from(map.values()).sort((a, b) =>
      a.period.localeCompare(b.period)
    );
  }, [relevantContribs]);

  const memberReportRows = useMemo(() => {
    const map = new Map<
      string,
      { name: string; email: string; verified: number; pending: number; count: number }
    >();
    relevantContribs.forEach((c) => {
      const p = db.profiles.find((u) => u.id === c.memberId);
      const curr = map.get(c.memberId) ?? {
        name: p?.fullName ?? c.memberId,
        email: p?.email ?? '',
        verified: 0,
        pending: 0,
        count: 0,
      };
      if (c.verificationStatus === 'verified') curr.verified += c.amount;
      else if (c.paymentStatus !== 'rejected') curr.pending += c.amount;
      curr.count += 1;
      map.set(c.memberId, curr);
    });
    return Array.from(map.values()).sort((a, b) => b.verified - a.verified);
  }, [relevantContribs, db.profiles]);

  const exportTransactionsCSV = () => {
    downloadCSV(
      `kuricircle_transactions_${selectedGroupId}.csv`,
      [
        'Transaction ID',
        'Group',
        'Member',
        'Period',
        'Date',
        'Simulated Amount (INR)',
        'Payment Status',
        'Verification Status',
      ],
      relevantContribs.map((c) => [
        c.transactionId,
        db.groups.find((g) => g.id === c.groupId)?.name ?? c.groupId,
        db.profiles.find((p) => p.id === c.memberId)?.fullName ?? c.memberId,
        c.contributionPeriod,
        c.transactionDate,
        c.amount,
        c.paymentStatus,
        c.verificationStatus,
      ])
    );
    toast.success('Exported transactions CSV report');
  };

  const exportGroupsSummaryCSV = () => {
    downloadCSV(
      'kuricircle_group_goals_report.csv',
      [
        'Group Name',
        'Purpose',
        'Target Amount (INR)',
        'Verified Simulated Total (INR)',
        'Pending Amount (INR)',
        'Goal Progress (%)',
        'Frequency',
      ],
      visibleGroups.map((g) => {
        const saved = getGroupTotalSaved(g.id);
        const pending = getGroupPendingTotal(g.id);
        return [
          g.name,
          g.purpose,
          g.targetAmount,
          saved,
          pending,
          Math.round((saved / g.targetAmount) * 100),
          g.frequency,
        ];
      })
    );
    toast.success('Exported group goal progress CSV');
  };

  const exportMemberReportCSV = () => {
    downloadCSV(
      'kuricircle_member_contributions.csv',
      ['Member Name', 'Email', 'Records Count', 'Verified (INR)', 'Pending (INR)'],
      memberReportRows.map((r) => [
        r.name,
        r.email,
        r.count,
        r.verified,
        r.pending,
      ])
    );
    toast.success('Exported member breakdown CSV');
  };

  const exportAuditReportCSV = () => {
    downloadCSV(
      'kuricircle_audit_verification_report.csv',
      [
        'Sequence',
        'Transaction Ref',
        'Event Type',
        'Amount',
        'Timestamp',
        'Previous Hash',
        'Current Hash',
      ],
      db.auditEvents.map((e) => [
        e.sequenceNumber,
        e.transactionReference,
        e.eventType,
        e.amount ?? '',
        e.timestamp,
        e.previousEventHash,
        e.currentEventHash,
      ])
    );
    toast.success('Exported SHA-256 audit verification CSV');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="w-full sm:w-64">
          <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Permitted Savings Groups</SelectItem>
              {visibleGroups.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full lg:w-auto">
          <Button variant="outline" size="sm" onClick={exportTransactionsCSV} className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            <span>Transactions CSV</span>
          </Button>
          <Button variant="outline" size="sm" onClick={exportGroupsSummaryCSV} className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            <span>Group Goals CSV</span>
          </Button>
          <Button variant="outline" size="sm" onClick={exportMemberReportCSV} className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            <span>Member Report CSV</span>
          </Button>
          <Button size="sm" onClick={exportAuditReportCSV} className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            <span>Audit Ledger CSV</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        {/* Monthly Collection Report Chart */}
        <Card className="lg:col-span-7 p-4 sm:p-6 space-y-4 min-w-0">
          <div>
            <h2 className="font-display text-base font-semibold text-[#1F1F1F]">
              Monthly Simulated Collection Report
            </h2>
            <p className="text-xs text-[#7A7A7A]">
              Verified vs pending simulated contributions derived from database records
            </p>
          </div>
          <div className="h-56 sm:h-64 w-full">
            {monthlySeries.length === 0 ? (
              <div className="h-full rounded-2xl bg-[#F8F6F2] flex items-center justify-center p-6 text-center text-xs text-[#7A7A7A]">
                No contribution cycles recorded yet. Record contributions to populate monthly charts.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySeries} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECEAE3" />
                  <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: '#7A7A7A', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#7A7A7A', fontSize: 11 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <RechartsTooltip
                    formatter={(v) => formatINR(Number(v ?? 0))}
                    contentStyle={{ borderRadius: '14px', border: '1px solid #E7E4DC', fontSize: '12px' }}
                  />
                  <Bar dataKey="verified" name="Verified (Simulated)" fill="#0E5A46" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="pending" name="Pending Verification" fill="#C8A45A" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Goal Progress & Audit Summary */}
        <Card className="lg:col-span-5 p-4 sm:p-6 space-y-5 min-w-0">
          <div>
            <h2 className="font-display text-base font-semibold text-[#1F1F1F]">
              Savings Goal Progress Summary
            </h2>
            <p className="text-xs text-[#7A7A7A]">
              Target completion across your active circles
            </p>
          </div>
          <div className="space-y-4">
            {visibleGroups.length === 0 ? (
              <p className="text-xs text-[#7A7A7A]">
                No savings groups created yet.
              </p>
            ) : (
              visibleGroups.map((g) => {
                const saved = getGroupTotalSaved(g.id);
                const pct = Math.min(100, Math.round((saved / g.targetAmount) * 100));
                return (
                  <div key={g.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs gap-2">
                      <span className="font-semibold text-[#1F1F1F] truncate">
                        {g.name}
                      </span>
                      <span className="tabular-nums text-[#0E5A46] font-semibold shrink-0">
                        {formatINR(saved)} / {formatINR(g.targetAmount)} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#ECEAE3] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#0E5A46]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="rounded-2xl bg-[#F8F6F2] p-4 space-y-1 text-xs">
            <p className="font-semibold text-[#1F1F1F]">
              Audit Verification Snapshot
            </p>
            <p className="text-[#555555] tabular-nums">
              {verificationReport?.validEvents ?? 0} of{' '}
              {verificationReport?.totalEvents ?? 0} events verified intact ·
              Chain status:{' '}
              <strong
                className={
                  verificationReport?.isChainIntact
                    ? 'text-[#0E5A46]'
                    : 'text-[#B91C1C]'
                }
              >
                {verificationReport?.isChainIntact ? 'INTACT' : 'BROKEN'}
              </strong>
            </p>
          </div>
        </Card>
      </div>

      {/* Member Contribution Table */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-[#ECEAE3] flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-[#1F1F1F]">
            Member Contribution Breakdown
          </h2>
          <span className="text-xs text-[#7A7A7A] tabular-nums">
            {memberReportRows.length} contributors
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#ECEAE3] bg-[#F8F6F2] text-[#7A7A7A]">
                <th className="py-3 px-4 font-semibold">Member</th>
                <th className="py-3 px-4 font-semibold">Entries</th>
                <th className="py-3 px-4 font-semibold text-right">
                  Verified Simulated Total
                </th>
                <th className="py-3 px-4 font-semibold text-right">
                  Pending / Submitted
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EFE8]">
              {memberReportRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 px-4 text-center text-[#7A7A7A]">
                    No contributor records yet.
                  </td>
                </tr>
              ) : (
                memberReportRows.map((row) => (
                  <tr key={row.name} className="hover:bg-[#F8F6F2]/60">
                    <td className="py-3 px-4 font-medium text-[#1F1F1F] whitespace-nowrap">
                      {row.name}
                    </td>
                    <td className="py-3 px-4 tabular-nums text-[#7A7A7A]">
                      {row.count}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-[#0E5A46] tabular-nums whitespace-nowrap">
                      {formatINR(row.verified)}
                    </td>
                    <td className="py-3 px-4 text-right text-[#9A6B16] tabular-nums whitespace-nowrap">
                      {formatINR(row.pending)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
