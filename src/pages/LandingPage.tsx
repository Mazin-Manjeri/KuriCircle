import React, { useMemo, useState } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { DEMO_GROUP_IMAGES } from '@/src/lib/seedData';
import { useKuri } from '@/src/lib/store';
import { formatINR, shortHash } from '@/src/lib/utils';

const WORKFLOW_STEPS = [
  {
    step: '01. Create & Invite',
    title: 'Configure a goal-based circle',
    body: 'Define a shared community savings purpose, target amount, cycle cadence, and rules, then share a single invitation code with trusted participants.',
  },
  {
    step: '02. Record & Verify',
    title: 'Log contributions with idempotency',
    body: 'Duplicate-period safeguards prevent double entries. Organizers verify submitted records while members view individual receipts anytime.',
  },
  {
    step: '03. Audit & Export',
    title: 'Verify the SHA-256 audit chain',
    body: 'Every action computes a SHA-256 digest linked to the preceding event. Members can recompute every hash client-side or export CSV ledgers.',
  },
];

const USE_CASES = [
  {
    title: 'Community Development',
    context: 'Neighbourhood infrastructure pledges',
    detail: 'Track shared street-light, drainage, or reading-room pledges with open visibility across every participating household.',
  },
  {
    title: 'Education Reserves',
    context: 'Tuition & scholarship pools',
    detail: 'Coordinate annual school fee and exam reserves with clear monthly targets and verifiable member contribution receipts.',
  },
  {
    title: 'Small Business Capital',
    context: 'Local workshop & artisan pools',
    detail: 'Help local makers and shopkeepers track equipment and inventory savings milestones without handwritten notebook disputes.',
  },
  {
    title: 'Medical Emergencies',
    context: 'Designated family reserve',
    detail: 'Maintain an auditable emergency coordination ledger accessible to trusted relatives across cities.',
  },
  {
    title: 'Weddings & Milestones',
    context: 'Family milestone coordination',
    detail: 'Replace informal spreadsheet fragments with verified contribution dates, pending summaries, and downloadable receipts.',
  },
  {
    title: 'Family Savings',
    context: 'Multi-household annual goals',
    detail: 'Keep every contributor aligned on due dates, verified totals, and milestone completion percentages.',
  },
];

const FAQS = [
  {
    q: 'Does KuriCircle collect or custody real money?',
    a: 'No. KuriCircle is an educational and hackathon demonstration platform for community savings coordination and audit verification. It does not accept real deposits, custody funds, or disburse cash payouts.',
  },
  {
    q: 'How is this distinct from a regulated rotating chit fund?',
    a: 'KuriCircle coordinates goal-based community savings tracking and transparent recordkeeping only. It does not operate rotating prize auctions or claim regulatory authorization.',
  },
  {
    q: 'How does the SHA-256 tamper-evident audit ledger work?',
    a: 'Each group creation, contribution verification, or dispute resolution computes a Web Crypto SHA-256 digest combining the canonical record payload with the previous event’s hash. Any unauthorized edit immediately breaks verification.',
  },
  {
    q: 'Can individual members inspect and verify history themselves?',
    a: 'Yes. Any permitted group member can open the Verify History screen to recompute every SHA-256 digest directly in the browser and download CSV reports.',
  },
];

export const LandingPage: React.FC = () => {
  const { db, verificationReport, navigate, switchDemoUser, currentUser } = useKuri();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const totalVerifiedPool = useMemo(
    () =>
      db.contributions
        .filter((c) => c.verificationStatus === 'verified')
        .reduce((sum, c) => sum + c.amount, 0),
    [db.contributions]
  );

  const activeMembersCount = useMemo(
    () =>
      new Set(
        db.groupMembers
          .filter((gm) => gm.status === 'active')
          .map((gm) => gm.userId)
      ).size,
    [db.groupMembers]
  );

  const latestAuditEvent =
    db.auditEvents.length > 0
      ? db.auditEvents[db.auditEvents.length - 1]
      : null;

  const handlePrimaryAction = () => {
    if (currentUser) {
      navigate('dashboard');
      return;
    }
    const starter = db.profiles[0];
    if (starter) {
      switchDemoUser(starter.id);
    } else {
      navigate('login');
    }
  };

  return (
    <div className="bg-[#F8F6F2] text-[#1F1F1F]">
      {/* 1. Hero Proposition & Live Ledger Visual */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-8 pb-12 sm:pt-12 sm:pb-16 lg:pt-16 lg:pb-20">
        <div className="grid gap-8 lg:gap-12 lg:grid-cols-12 lg:items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center space-y-5 sm:space-y-6 min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-[#0E5A46]">
              Traditional Trust · Digital Transparency
            </p>

            <h1 className="font-display text-[clamp(2rem,4.3vw,3.5rem)] font-bold tracking-tight text-[#1F1F1F] leading-[1.1] [text-wrap:balance]">
              Community savings coordination with verifiable digital ledgers.
            </h1>

            <p className="max-w-xl text-sm sm:text-base lg:text-lg leading-relaxed text-[#555555]">
              Inspired by Kerala’s Kuri heritage, KuriCircle helps trusted circles
              coordinate goal-based savings, track verified contributions, and
              audit every record against a SHA-256 linked ledger.
            </p>

            <div className="flex flex-col min-[420px]:flex-row min-[420px]:flex-wrap items-stretch min-[420px]:items-center gap-3 pt-1">
              <Button
                size="lg"
                onClick={handlePrimaryAction}
                className="gap-2 min-h-[44px] justify-center whitespace-nowrap"
              >
                <span>{currentUser ? 'Open Workspace' : 'Explore the Demo'}</span>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('how-it-works')}
                className="min-h-[44px] justify-center whitespace-nowrap"
              >
                How It Works
              </Button>
              <button
                type="button"
                onClick={() => navigate('login')}
                className="min-h-[44px] px-3 py-2 text-sm font-medium text-[#0E5A46] hover:underline underline-offset-4 cursor-pointer text-center whitespace-nowrap"
              >
                Sign In
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 min-w-0">
            <div className="relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-auto lg:h-full lg:min-h-[380px] overflow-hidden rounded-2xl sm:rounded-[26px] bg-[#E8F0ED] shadow-[0_8px_32px_rgba(31,31,31,0.06)]">
              {!heroImgFailed ? (
                <img
                  src={DEMO_GROUP_IMAGES.hero}
                  alt="Community members reviewing shared savings records around a table"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImgFailed(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center p-8 text-[#0E5A46] bg-gradient-to-br from-[#E8F0ED] to-[#DCE6E1]">
                  <span className="font-display text-lg font-semibold text-center">
                    KuriCircle Community Coordination
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1F1F1F]/80 via-[#1F1F1F]/20 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 sm:bottom-5 sm:left-5 sm:right-5 rounded-xl sm:rounded-2xl bg-white/95 backdrop-blur-sm p-3.5 sm:p-4 shadow-sm">
                <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] sm:text-xs text-[#7A7A7A]">
                      Live Neon Ledger Snapshot
                    </p>
                    <p className="font-display text-sm sm:text-base font-semibold text-[#1F1F1F] tabular-nums truncate">
                      {formatINR(totalVerifiedPool)} verified across {db.groups.length} circles
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#0E5A46] tabular-nums whitespace-nowrap shrink-0">
                    {activeMembersCount} Active Members
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Real-Time Database KPI Strip */}
        <div className="mt-6 sm:mt-10 grid gap-3.5 sm:gap-4 grid-cols-1 min-[400px]:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl sm:rounded-[20px] bg-white p-4 sm:p-5 border border-[#ECEAE3]">
            <p className="text-xs text-[#7A7A7A]">Savings Groups</p>
            <p className="mt-1 font-display text-xl sm:text-2xl font-bold text-[#1F1F1F] tabular-nums">
              {db.groups.length}
            </p>
            <p className="mt-1 text-xs text-[#7A7A7A]">
              Goal-based community pools
            </p>
          </div>

          <div className="rounded-2xl sm:rounded-[20px] bg-white p-4 sm:p-5 border border-[#ECEAE3]">
            <p className="text-xs text-[#7A7A7A]">Verified Contributions</p>
            <p className="mt-1 font-display text-xl sm:text-2xl font-bold text-[#1F1F1F] tabular-nums">
              {formatINR(totalVerifiedPool)}
            </p>
            <p className="mt-1 text-xs text-[#7A7A7A] tabular-nums">
              {db.contributions.length} recorded entries
            </p>
          </div>

          <div className="rounded-2xl sm:rounded-[20px] bg-white p-4 sm:p-5 border border-[#ECEAE3]">
            <p className="text-xs text-[#7A7A7A]">Audit Events Chained</p>
            <p className="mt-1 font-display text-xl sm:text-2xl font-bold text-[#1F1F1F] tabular-nums">
              {verificationReport?.totalEvents ?? 0}
            </p>
            <p className="mt-1 text-xs text-[#0E5A46]">
              SHA-256 client-verifiable
            </p>
          </div>

          <div className="rounded-2xl sm:rounded-[20px] bg-[#0E5A46] p-4 sm:p-5 text-white">
            <p className="text-xs text-white/75">Role Governance</p>
            <p className="mt-1 font-display text-xl sm:text-2xl font-bold">
              3 Perspectives
            </p>
            <p className="mt-1 text-xs text-white/85">
              Organizer · Member · Admin
            </p>
          </div>
        </div>
      </section>

      {/* 2. Why Digital Transparency Matters */}
      <section className="bg-white py-12 sm:py-16 lg:py-20 border-y border-[#ECEAE3]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-semibold text-[#0E5A46]">
              Why Digital Transparency Matters
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#1F1F1F] [text-wrap:balance]">
              Preserving community trust while eliminating handwritten ledger ambiguity
            </h2>
          </div>

          <div className="mt-8 sm:mt-10 grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5 rounded-2xl bg-[#F8F6F2] border border-[#E7E4DC] p-6 sm:p-7 space-y-4">
              <h3 className="font-display text-lg sm:text-xl font-semibold text-[#1F1F1F]">
                The Manual Ledger Gap
              </h3>
              <div className="divide-y divide-[#E7E4DC] text-sm text-[#555555]">
                <p className="pb-3 leading-relaxed">
                  Contributors lack real-time visibility into verified pool totals and upcoming cycle dates.
                </p>
                <p className="py-3 leading-relaxed">
                  Paper notebooks can be misplaced or altered without any record of when an edit happened.
                </p>
                <p className="pt-3 leading-relaxed">
                  Disputes over amounts or missed periods depend on recollection instead of signed digital receipts.
                </p>
              </div>
            </div>

            <div className="lg:col-span-7 rounded-2xl bg-[#0E5A46] text-white p-6 sm:p-7 space-y-4">
              <h3 className="font-display text-lg sm:text-xl font-semibold text-white">
                The KuriCircle Ledger Architecture
              </h3>
              <div className="divide-y divide-white/15 text-sm text-white/90">
                <p className="pb-3 leading-relaxed">
                  Every recorded contribution generates a unique Transaction ID, period lock, verification state, and downloadable receipt.
                </p>
                <p className="py-3 leading-relaxed">
                  Append-only audit events chain each SHA-256 digest to the previous block so tampering is flagged immediately.
                </p>
                <p className="pt-3 leading-relaxed">
                  Structured dispute threads, group announcements, and CSV exports keep organizers and members aligned.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Structured Workflow & Live Ledger Anchor */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16 lg:py-20 space-y-10 sm:space-y-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="max-w-xl space-y-2">
            <p className="text-xs font-semibold text-[#0E5A46]">Workflow</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#1F1F1F] [text-wrap:balance]">
              From group setup to cryptographic verification
            </h2>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('how-it-works')}
            className="self-start sm:self-auto whitespace-nowrap"
          >
            Detailed Walkthrough
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {WORKFLOW_STEPS.map((item) => (
            <div
              key={item.step}
              className="rounded-2xl bg-white p-6 border border-[#ECEAE3] space-y-2.5"
            >
              <p className="text-xs font-semibold text-[#0E5A46]">{item.step}</p>
              <h3 className="font-display text-lg font-semibold text-[#1F1F1F]">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-[#666666]">
                {item.body}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-white border border-[#E7E4DC] p-6 sm:p-8 grid gap-6 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6 space-y-3 min-w-0">
            <p className="text-xs font-semibold text-[#0E5A46]">
              Cryptographically Linked Audit Ledger
            </p>
            <h3 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#1F1F1F] [text-wrap:balance]">
              Every record anchors to the digest before it
            </h3>
            <p className="text-sm leading-relaxed text-[#555555]">
              KuriCircle connects audit records with Web Crypto SHA-256 digests
              and persists them in PostgreSQL—honestly engineered as a
              tamper-evident audit ledger rather than speculative cryptocurrency.
            </p>
            <div className="pt-1">
              <Button variant="outline" onClick={() => navigate('security')}>
                Inspect Verification Architecture
              </Button>
            </div>
          </div>

          <div className="lg:col-span-6 rounded-2xl bg-[#F8F6F2] p-5 border border-[#E7E4DC] space-y-3 min-w-0">
            <p className="text-xs font-semibold text-[#1F1F1F]">
              Latest Live Ledger Anchor
            </p>
            {latestAuditEvent ? (
              <div className="space-y-2.5 text-xs">
                <div className="flex flex-col min-[420px]:flex-row min-[420px]:justify-between gap-1">
                  <span className="text-[#7A7A7A]">Sequence</span>
                  <span className="font-mono font-semibold text-[#1F1F1F] break-all">
                    #{latestAuditEvent.sequenceNumber} · {latestAuditEvent.eventType}
                  </span>
                </div>
                <div className="flex flex-col min-[420px]:flex-row min-[420px]:justify-between gap-1">
                  <span className="text-[#7A7A7A]">Previous Hash</span>
                  <span className="font-mono text-[#555555] break-all">
                    {shortHash(latestAuditEvent.previousEventHash)}
                  </span>
                </div>
                <div className="flex flex-col min-[420px]:flex-row min-[420px]:justify-between gap-1">
                  <span className="text-[#7A7A7A]">Current Hash</span>
                  <span className="font-mono font-semibold text-[#0E5A46] break-all">
                    {shortHash(latestAuditEvent.currentEventHash)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#666666] leading-relaxed">
                Zero audit events recorded yet. Create a savings group or log a
                contribution inside the workspace to generate your genesis SHA-256
                anchor live.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 4. Community Use Cases */}
      <section className="bg-white py-12 sm:py-16 lg:py-20 border-y border-[#ECEAE3]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl space-y-2 mb-8 sm:mb-10">
            <p className="text-xs font-semibold text-[#0E5A46]">
              Community Use Cases
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#1F1F1F] [text-wrap:balance]">
              Built for trusted neighbourhood, family, and cooperative goals
            </h2>
          </div>

          <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {USE_CASES.map((u) => (
              <div
                key={u.title}
                className="rounded-2xl bg-[#F8F6F2] p-5 sm:p-6 border border-[#ECEAE3] space-y-2"
              >
                <p className="text-xs font-medium text-[#0E5A46]">{u.context}</p>
                <h3 className="font-display text-lg font-semibold text-[#1F1F1F]">
                  {u.title}
                </h3>
                <p className="text-sm text-[#666666] leading-relaxed">
                  {u.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Governance Clarity & FAQ */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-12 sm:py-16 lg:py-20 space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#0E5A46]">
            Frequently Asked Questions
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#1F1F1F] [text-wrap:balance]">
            Scope, verification, and governance clarity
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={item.q}
                className="rounded-2xl bg-white border border-[#ECEAE3] overflow-hidden"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="flex w-full min-h-[52px] items-center justify-between gap-4 p-4 sm:p-5 text-left font-display text-sm sm:text-base font-semibold text-[#1F1F1F] cursor-pointer hover:bg-[#F8F6F2]/50 transition-colors"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-[#7A7A7A] shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-sm leading-relaxed text-[#555555]">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-[#0E5A46] p-6 sm:p-7 text-white">
          <div className="space-y-1">
            <h3 className="font-display text-lg sm:text-xl font-bold">
              Ready to explore the live PostgreSQL workspace?
            </h3>
            <p className="text-xs sm:text-sm text-white/85">
              Create your first goal-based circle, record simulated entries, and verify SHA-256 hashes.
            </p>
          </div>
          <Button
            variant="secondary"
            size="lg"
            onClick={handlePrimaryAction}
            className="gap-2 whitespace-nowrap shrink-0"
          >
            <span>{currentUser ? 'Open Workspace' : 'Start Interactive Demo'}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  );
};
