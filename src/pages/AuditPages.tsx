import React, { useMemo, useState } from 'react';
import {
  AlertOctagon,
  CheckCircle2,
  Copy,
  FileCheck2,
  Link2,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/src/components/ui/button';
import { Card } from '@/src/components/ui/card';
import { useKuri } from '@/src/lib/store';
import { formatDateTime, formatINR, shortHash } from '@/src/lib/utils';

export const AuditLedgerPage: React.FC = () => {
  const { db, searchQuery, navigate, verificationReport } = useKuri();

  const events = useMemo(() => {
    return [...db.auditEvents]
      .sort((a, b) => b.sequenceNumber - a.sequenceNumber)
      .filter((e) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          e.transactionReference.toLowerCase().includes(q) ||
          e.eventType.toLowerCase().includes(q) ||
          e.details.toLowerCase().includes(q) ||
          e.currentEventHash.toLowerCase().includes(q)
        );
      });
  }, [db.auditEvents, searchQuery]);

  const copyHash = (hash: string) => {
    navigator.clipboard?.writeText(hash);
    toast.success('Copied SHA-256 hash to clipboard');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="rounded-2xl bg-white px-4 py-3 text-xs text-[#555555] shadow-sm flex items-center gap-2.5">
          <ShieldCheck className="h-4 w-4 text-[#0E5A46] shrink-0" />
          <span>
            <strong>Cryptographically Linked Audit Ledger</strong> — Append-only
            sequence. Historical records cannot be edited; corrections are
            appended as new events.
          </span>
        </div>

        <Button onClick={() => navigate('verify-history')} className="gap-2">
          <FileCheck2 className="h-4 w-4" />
          <span>Run Hash Verification</span>
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#ECEAE3] bg-[#F8F6F2] text-[#7A7A7A]">
                <th className="py-3.5 px-4 font-semibold">Seq #</th>
                <th className="py-3.5 px-4 font-semibold">Event Type</th>
                <th className="py-3.5 px-4 font-semibold">Reference</th>
                <th className="py-3.5 px-4 font-semibold">Actor & Details</th>
                <th className="py-3.5 px-4 font-semibold text-right">Amount</th>
                <th className="py-3.5 px-4 font-semibold">Previous Hash</th>
                <th className="py-3.5 px-4 font-semibold">Current SHA-256 Hash</th>
                <th className="py-3.5 px-4 font-semibold">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EFE8]">
              {events.map((ev) => {
                const actor = db.profiles.find((p) => p.id === ev.actorId);
                const check = verificationReport?.items.find(
                  (i) => i.eventId === ev.id
                );
                const isBroken = check && !check.isValid;

                return (
                  <tr
                    key={ev.id}
                    className={
                      isBroken ? 'bg-[#FEE2E2]/45' : 'hover:bg-[#F8F6F2]/70'
                    }
                  >
                    <td className="py-3 px-4 font-mono font-bold tabular-nums text-[#1F1F1F]">
                      #{ev.sequenceNumber}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#0E5A46]">
                      {ev.eventType.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#1F1F1F]">
                      {ev.transactionReference}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-medium text-[#1F1F1F] truncate">
                        {ev.details}
                      </p>
                      <p className="text-[11px] text-[#7A7A7A]">
                        Actor: {actor?.fullName ?? ev.actorId}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold tabular-nums">
                      {ev.amount !== null ? formatINR(ev.amount) : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#7A7A7A]">
                      {shortHash(ev.previousEventHash)}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => copyHash(ev.currentEventHash)}
                        className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#0E5A46] hover:underline cursor-pointer"
                        title={ev.currentEventHash}
                      >
                        <span>{shortHash(ev.currentEventHash)}</span>
                        <Copy className="h-3 w-3" />
                      </button>
                    </td>
                    <td className="py-3 px-4 text-[#7A7A7A] whitespace-nowrap tabular-nums">
                      {formatDateTime(ev.timestamp)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export const VerifyHistoryPage: React.FC = () => {
  const {
    db,
    verificationReport,
    runAuditVerification,
    simulateTamperOnEvent,
    restoreAuditChain,
  } = useKuri();

  const [verifying, setVerifying] = useState(false);

  const handleRunVerify = async () => {
    setVerifying(true);
    await runAuditVerification();
    setVerifying(false);
  };

  const orderedEvents = useMemo(
    () =>
      [...db.auditEvents].sort((a, b) => a.sequenceNumber - b.sequenceNumber),
    [db.auditEvents]
  );

  // Pick a middle transaction event for tamper simulation
  const sampleTargetEvent =
    orderedEvents.find((e) => e.eventType === 'CONTRIBUTION_VERIFIED') ??
    orderedEvents[Math.min(3, orderedEvents.length - 1)];

  const isEmpty = orderedEvents.length === 0;
  const isIntact = isEmpty || (verificationReport?.isChainIntact ?? true);

  return (
    <div className="space-y-5">
      {/* Status Banner Card */}
      <Card
        className={`p-6 sm:p-7 ${
          isIntact
            ? 'bg-gradient-to-br from-[#2B6150] to-[#0E5A46] text-white'
            : 'bg-[#FEF2F2] border border-[#FECACA] text-[#1F1F1F]'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl shrink-0 ${
                isIntact
                  ? 'bg-white/15 text-white'
                  : 'bg-[#B91C1C] text-white'
              }`}
            >
              {isIntact ? (
                <ShieldCheck className="h-6 w-6" />
              ) : (
                <ShieldAlert className="h-6 w-6" />
              )}
            </div>
            <div className="space-y-1">
              <h2 className="font-display text-xl font-bold">
                {isEmpty
                  ? 'Audit Chain Ready — 0 Events Recorded'
                  : isIntact
                  ? 'Verification Passed — Cryptographic Chain Intact'
                  : 'Tampering Detected — Hash Chain Broken'}
              </h2>
              <p
                className={`text-xs sm:text-sm ${
                  isIntact ? 'text-white/85' : 'text-[#7F1D1D]'
                }`}
              >
                {isEmpty
                  ? 'Create a savings group or record a simulated contribution to generate your first SHA-256 linked audit block.'
                  : isIntact
                  ? `All ${verificationReport?.validEvents ?? 0} of ${verificationReport?.totalEvents ?? 0} sequential SHA-256 audit digests matched client-side recomputation.`
                  : `${verificationReport?.brokenEvents ?? 1} event(s) failed verification. A stored payload no longer matches its recorded SHA-256 hash.`}
              </p>
              {verificationReport && (
                <p
                  className={`text-[11px] tabular-nums ${
                    isIntact ? 'text-white/70' : 'text-[#991B1B]'
                  }`}
                >
                  Last verified: {formatDateTime(verificationReport.verifiedAt)}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <Button
              variant={isIntact ? 'secondary' : 'default'}
              onClick={handleRunVerify}
              disabled={verifying}
              className="gap-2"
            >
              <FileCheck2 className="h-4 w-4" />
              <span>
                {verifying ? 'Verifying...' : 'Recompute All SHA-256 Hashes'}
              </span>
            </Button>

            {db.tamperedSnapshot ? (
              <Button
                variant="outline"
                onClick={restoreAuditChain}
                className="gap-2 bg-white"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Restore Clean Ledger</span>
              </Button>
            ) : (
              sampleTargetEvent && (
                <Button
                  variant="destructive"
                  onClick={() => simulateTamperOnEvent(sampleTargetEvent.id)}
                  className="gap-2"
                >
                  <AlertOctagon className="h-4 w-4" />
                  <span>Simulate Tamper Attack</span>
                </Button>
              )
            )}
          </div>
        </div>
      </Card>

      {/* Chain Inspector */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-base font-semibold text-[#1F1F1F]">
              Sequential Hash-Link Verification Inspector
            </h3>
            <p className="text-xs text-[#7A7A7A]">
              Formula: SHA-256(Previous Event Hash + Canonical Event Payload) =
              Current Event Hash
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {verificationReport?.items.map((item) => {
            const ev = orderedEvents.find((e) => e.id === item.eventId);
            if (!ev) return null;
            return (
              <div
                key={item.eventId}
                className={`rounded-2xl p-4 border transition-colors ${
                  item.isValid
                    ? 'border-[#ECEAE3] bg-[#F8F6F2]'
                    : 'border-[#FCA5A5] bg-[#FEF2F2]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {item.isValid ? (
                      <CheckCircle2 className="h-4 w-4 text-[#0E5A46] shrink-0" />
                    ) : (
                      <ShieldAlert className="h-4 w-4 text-[#B91C1C] shrink-0" />
                    )}
                    <span className="font-mono text-xs font-bold text-[#1F1F1F]">
                      #{item.sequenceNumber} · {item.transactionReference}
                    </span>
                    <span className="text-xs text-[#555555]">
                      {ev.details}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      item.isValid ? 'text-[#0E5A46]' : 'text-[#B91C1C]'
                    }`}
                  >
                    {item.isValid ? 'Hash Valid' : 'Hash Mismatch'}
                  </span>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2 text-[11px] font-mono">
                  <div className="rounded-xl bg-white p-2.5 border border-[#ECEAE3]">
                    <span className="text-[#7A7A7A] block mb-0.5 flex items-center gap-1">
                      <Link2 className="h-3 w-3" /> Stored Current Hash
                    </span>
                    <span className="break-all text-[#1F1F1F]">
                      {item.storedCurrentHash}
                    </span>
                  </div>
                  <div className="rounded-xl bg-white p-2.5 border border-[#ECEAE3]">
                    <span className="text-[#7A7A7A] block mb-0.5">
                      Recalculated SHA-256 Digest
                    </span>
                    <span
                      className={`break-all ${
                        item.isHashValid ? 'text-[#0E5A46]' : 'text-[#B91C1C] font-bold'
                      }`}
                    >
                      {item.recalculatedHash}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
