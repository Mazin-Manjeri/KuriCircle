import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Download,
  FileText,
  MessageSquareWarning,
  Plus,
  ShieldCheck,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/src/components/ui/dialog';
import { Input, Textarea } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/primitives';
import { useKuri } from '@/src/lib/store';
import { formatDate, formatDateTime, formatINR } from '@/src/lib/utils';
import type { PaymentStatus } from '@/src/types/kuri';

export const ContributionsPage: React.FC = () => {
  const {
    db,
    currentUser,
    searchQuery,
    navigate,
    getVisibleGroupsForUser,
    recordContribution,
    verifyOrRejectContribution,
  } = useKuri();

  const visibleGroups = useMemo(
    () => getVisibleGroupsForUser(currentUser),
    [db.groups, db.groupMembers, currentUser]
  );

  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [modalOpen, setModalOpen] = useState(false);

  // Form state for recording simulated contribution
  const [formGroupId, setFormGroupId] = useState(
    visibleGroups[0]?.id ?? 'grp-greenfield'
  );
  const [formMemberId, setFormMemberId] = useState(currentUser?.id ?? '');
  const [formAmount, setFormAmount] = useState('1000');
  const [formPeriod, setFormPeriod] = useState('2026-12');
  const [formDate, setFormDate] = useState('2026-12-05');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const visibleGroupIds = new Set(visibleGroups.map((g) => g.id));

  const filteredRecords = useMemo(() => {
    return db.contributions
      .filter((c) => {
        if (!visibleGroupIds.has(c.groupId)) return false;
        if (groupFilter !== 'all' && c.groupId !== groupFilter) return false;
        if (statusFilter !== 'all' && c.paymentStatus !== statusFilter) {
          return false;
        }
        if (currentUser?.role === 'member' && c.memberId !== currentUser.id) {
          const membership = db.groupMembers.find(
            (gm) =>
              gm.groupId === c.groupId &&
              gm.userId === currentUser.id &&
              gm.status === 'active'
          );
          if (!membership?.canViewPeerTotals) return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const member = db.profiles.find((p) => p.id === c.memberId);
          const group = db.groups.find((g) => g.id === c.groupId);
          return (
            c.transactionId.toLowerCase().includes(q) ||
            c.contributionPeriod.toLowerCase().includes(q) ||
            (member?.fullName.toLowerCase().includes(q) ?? false) ||
            (group?.name.toLowerCase().includes(q) ?? false)
          );
        }
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [
    db.contributions,
    db.profiles,
    db.groups,
    db.groupMembers,
    groupFilter,
    statusFilter,
    searchQuery,
    currentUser,
    visibleGroups,
  ]);

  const activeFormGroup =
    visibleGroups.find((g) => g.id === formGroupId) ?? visibleGroups[0];
  const isOrganizerForFormGroup =
    activeFormGroup &&
    (activeFormGroup.organizerId === currentUser?.id ||
      currentUser?.role === 'platform_admin');

  const formMembers = useMemo(() => {
    if (!activeFormGroup) return [];
    return db.groupMembers
      .filter(
        (gm) => gm.groupId === activeFormGroup.id && gm.status === 'active'
      )
      .map((gm) => db.profiles.find((p) => p.id === gm.userId))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
  }, [activeFormGroup, db.groupMembers, db.profiles]);

  const handleOpenModal = () => {
    setFormError(null);
    if (activeFormGroup) {
      setFormAmount(String(activeFormGroup.proposedContribution));
      if (!isOrganizerForFormGroup && currentUser) {
        setFormMemberId(currentUser.id);
      } else if (formMembers.length > 0 && !formMembers.some((m) => m.id === formMemberId)) {
        setFormMemberId(formMembers[0].id);
      }
    }
    setModalOpen(true);
  };

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    const res = await recordContribution({
      groupId: formGroupId,
      memberId: formMemberId || currentUser?.id || '',
      amount: Number(formAmount),
      transactionDate: formDate,
      contributionPeriod: formPeriod,
      notes: formNotes,
      autoVerify: Boolean(isOrganizerForFormGroup),
    });
    setSubmitting(false);
    if (!res.ok) {
      setFormError(res.error || 'Could not record contribution');
      return;
    }
    setFormNotes('');
    setModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-xl bg-white p-1 shadow-sm overflow-x-auto">
            {(['all', 'pending', 'submitted', 'verified', 'rejected'] as const).map(
              (st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize whitespace-nowrap transition-colors cursor-pointer ${
                    statusFilter === st
                      ? 'bg-[#1F1F1F] text-white'
                      : 'text-[#7A7A7A] hover:text-[#1F1F1F]'
                  }`}
                >
                  {st}
                </button>
              )
            )}
          </div>

          <div className="w-56">
            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger className="h-9 bg-white text-xs">
                <SelectValue placeholder="All groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Permitted Groups</SelectItem>
                {visibleGroups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenModal} className="gap-2">
              <Plus className="h-4 w-4" />
              <span>Record Simulated Contribution</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Simulated Contribution</DialogTitle>
              <DialogDescription>
                Logs a demonstration entry with duplicate-period idempotency
                validation and appends a SHA-256 audit event.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRecordSubmit} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <Label>Savings Group</Label>
                <Select
                  value={formGroupId}
                  onValueChange={(gid) => {
                    setFormGroupId(gid);
                    const g = visibleGroups.find((x) => x.id === gid);
                    if (g) setFormAmount(String(g.proposedContribution));
                  }}
                >
                  <SelectTrigger>
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

              <div className="space-y-1.5">
                <Label>Member</Label>
                {isOrganizerForFormGroup ? (
                  <Select value={formMemberId} onValueChange={setFormMemberId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select active member" />
                    </SelectTrigger>
                    <SelectContent>
                      {formMembers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={currentUser?.fullName ?? ''} disabled />
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="c-amt">Amount (₹)</Label>
                  <Input
                    id="c-amt"
                    type="number"
                    min={1}
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-period">Period (YYYY-MM)</Label>
                  <Input
                    id="c-period"
                    value={formPeriod}
                    onChange={(e) => setFormPeriod(e.target.value)}
                    placeholder="2026-12"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-date">Date</Label>
                  <Input
                    id="c-date"
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="c-notes">Notes (Optional)</Label>
                <Textarea
                  id="c-notes"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Cycle reference or simulated acknowledgement..."
                  className="min-h-[64px]"
                />
              </div>

              {formError && (
                <p className="rounded-xl bg-[#FEE2E2] px-3.5 py-2.5 text-xs font-medium text-[#B91C1C]">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Hashing & Saving...' : 'Save Simulated Entry'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Data Table */}
      <Card className="overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="font-display text-base font-semibold text-[#1F1F1F]">
              No matching contribution records
            </p>
            <p className="text-xs text-[#7A7A7A]">
              Adjust your filters or record a new simulated contribution.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#ECEAE3] bg-[#F8F6F2] text-[11px] font-semibold text-[#7A7A7A]">
                  <th className="py-3.5 px-4">Transaction ID</th>
                  <th className="py-3.5 px-4">Member</th>
                  <th className="py-3.5 px-4">Savings Group</th>
                  <th className="py-3.5 px-4">Period</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Simulated Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2EFE8] text-xs">
                {filteredRecords.map((c) => {
                  const member = db.profiles.find((p) => p.id === c.memberId);
                  const group = db.groups.find((g) => g.id === c.groupId);
                  const canVerify =
                    group &&
                    (group.organizerId === currentUser?.id ||
                      currentUser?.role === 'platform_admin') &&
                    (c.paymentStatus === 'pending' ||
                      c.paymentStatus === 'submitted');

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-[#F8F6F2]/70 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-[#0E5A46]">
                        <button
                          type="button"
                          onClick={() =>
                            navigate('transaction-details', {
                              transactionId: c.id,
                            })
                          }
                          className="hover:underline cursor-pointer"
                        >
                          {c.transactionId}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <UserAvatar
                            name={member?.fullName ?? 'Member'}
                            src={member?.avatarUrl}
                            size="sm"
                            className="h-7 w-7 text-[10px]"
                          />
                          <span className="font-medium text-[#1F1F1F]">
                            {member?.fullName ?? c.memberId}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#555555]">
                        {group?.name ?? c.groupId}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-[#555555]">
                        {c.contributionPeriod}
                      </td>
                      <td className="py-3 px-4 tabular-nums text-[#7A7A7A]">
                        {formatDate(c.transactionDate)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#1F1F1F] tabular-nums">
                        {formatINR(c.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <SemanticStatusText status={c.paymentStatus} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {canVerify && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  verifyOrRejectContribution(c.id, 'verified')
                                }
                                title="Verify Record"
                                className="rounded-lg bg-[#E8F0ED] p-1.5 text-[#0E5A46] hover:bg-[#0E5A46] hover:text-white transition-colors cursor-pointer"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  verifyOrRejectContribution(c.id, 'rejected')
                                }
                                title="Reject Record"
                                className="rounded-lg bg-[#FEE2E2] p-1.5 text-[#B91C1C] hover:bg-[#B91C1C] hover:text-white transition-colors cursor-pointer"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              navigate('transaction-details', {
                                transactionId: c.id,
                              })
                            }
                            className="rounded-lg px-2.5 py-1 text-[11px] font-medium text-[#555555] hover:bg-[#EAE8E2] cursor-pointer"
                          >
                            Receipt
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export const TransactionDetailsPage: React.FC = () => {
  const { db, selectedTransactionId, navigate } = useKuri();

  const tx =
    db.contributions.find((c) => c.id === selectedTransactionId) ??
    db.contributions[0] ??
    null;

  if (!tx) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-[#7A7A7A]">No transaction selected.</p>
      </Card>
    );
  }

  const member = db.profiles.find((p) => p.id === tx.memberId);
  const recorder = db.profiles.find((p) => p.id === tx.recordedBy);
  const group = db.groups.find((g) => g.id === tx.groupId);
  const auditAnchor = db.auditEvents.find(
    (e) => e.transactionReference === tx.transactionId
  );

  const downloadReceipt = () => {
    const receiptText = [
      '====================================================',
      'KURICIRCLE — SIMULATED CONTRIBUTION RECEIPT',
      'Demonstration Environment · No Real Monetary Custody',
      '====================================================',
      `Transaction ID      : ${tx.transactionId}`,
      `Savings Group       : ${group?.name ?? tx.groupId}`,
      `Member              : ${member?.fullName ?? tx.memberId}`,
      `Simulated Amount    : INR ${tx.amount.toLocaleString('en-IN')}`,
      `Contribution Period : ${tx.contributionPeriod}`,
      `Transaction Date    : ${tx.transactionDate}`,
      `Payment Status      : ${tx.paymentStatus.toUpperCase()}`,
      `Verification Status : ${tx.verificationStatus.toUpperCase()}`,
      `Recorded By         : ${recorder?.fullName ?? tx.recordedBy}`,
      `Audit Event Hash    : ${auditAnchor?.currentEventHash ?? 'Linked in batch'}`,
      `Notes               : ${tx.notes ?? '—'}`,
      '====================================================',
    ].join('\n');

    const blob = new Blob([receiptText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tx.transactionId}_receipt.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded receipt ${tx.transactionId}_receipt.txt`);
  };

  return (
    <div className="max-w-3xl space-y-5">
      <button
        type="button"
        onClick={() => navigate('contributions')}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#555555] hover:text-[#1F1F1F] cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Contributions</span>
      </button>

      <Card className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#ECEAE3] pb-5">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[#0E5A46]">
              Simulated Contribution Receipt
            </p>
            <h2 className="font-display text-2xl font-bold text-[#1F1F1F] font-mono">
              {tx.transactionId}
            </h2>
            <p className="text-xs text-[#7A7A7A]">
              Created {formatDateTime(tx.createdAt)}
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl font-bold text-[#0E5A46] tabular-nums">
              {formatINR(tx.amount)}
            </p>
            <SemanticStatusText
              status={tx.verificationStatus}
              className="mt-1 justify-end"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 text-xs">
          <div className="rounded-2xl bg-[#F8F6F2] p-4 space-y-1">
            <p className="text-[#7A7A7A]">Member</p>
            <p className="font-semibold text-sm text-[#1F1F1F]">
              {member?.fullName ?? tx.memberId}
            </p>
            <p className="text-[#7A7A7A]">{member?.email}</p>
          </div>
          <div className="rounded-2xl bg-[#F8F6F2] p-4 space-y-1">
            <p className="text-[#7A7A7A]">Savings Group</p>
            <p className="font-semibold text-sm text-[#1F1F1F]">
              {group?.name ?? tx.groupId}
            </p>
            <p className="text-[#7A7A7A]">
              Period {tx.contributionPeriod} · Date {formatDate(tx.transactionDate)}
            </p>
          </div>
          <div className="rounded-2xl bg-[#F8F6F2] p-4 space-y-1">
            <p className="text-[#7A7A7A]">Recorded By</p>
            <p className="font-semibold text-[#1F1F1F]">
              {recorder?.fullName ?? tx.recordedBy}
            </p>
          </div>
          <div className="rounded-2xl bg-[#F8F6F2] p-4 space-y-1">
            <p className="text-[#7A7A7A]">Notes</p>
            <p className="font-medium text-[#1F1F1F]">
              {tx.notes || 'Simulated demonstration contribution'}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E7E4DC] p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0E5A46]">
            <ShieldCheck className="h-4 w-4" />
            <span>SHA-256 Audit Anchor</span>
          </div>
          {auditAnchor ? (
            <div className="space-y-1 text-xs">
              <p className="text-[#7A7A7A]">
                Sequence #{auditAnchor.sequenceNumber} · {auditAnchor.eventType}
              </p>
              <p className="font-mono text-[11px] break-all text-[#1F1F1F] bg-[#F8F6F2] p-2.5 rounded-xl">
                {auditAnchor.currentEventHash}
              </p>
            </div>
          ) : (
            <p className="text-xs text-[#7A7A7A]">
              Recorded in seeded demonstration ledger baseline.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button variant="outline" onClick={downloadReceipt} className="gap-2">
            <Download className="h-4 w-4" />
            <span>Download Receipt</span>
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate('disputes')}
              className="gap-2 text-[#9A6B16]"
            >
              <MessageSquareWarning className="h-4 w-4" />
              <span>Report Discrepancy</span>
            </Button>
            <Button onClick={() => navigate('verify-history')} className="gap-2">
              <FileText className="h-4 w-4" />
              <span>Verify in Audit Chain</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
