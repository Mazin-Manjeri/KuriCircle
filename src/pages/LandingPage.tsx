import React, { useMemo, useState } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { DEMO_GROUP_IMAGES } from '@/src/lib/seedData';
import { useKuri } from '@/src/lib/store';
import { formatINR, shortHash } from '@/src/lib/utils';

const USE_CASES = [
  {
    title: 'Community Development',
    detail: 'Track neighbourhood infrastructure pledges with shared visibility across every household.',
  },
  {
    title: 'Education Reserves',
    detail: 'Coordinate tuition, exam fee, and scholarship pools with clear monthly contribution milestones.',
  },
  {
    title: 'Small Business Capital',
    detail: 'Help local makers and shopkeepers track shared tool and workshop savings goals.',
  },
  {
    title: 'Medical Emergencies',
    detail: 'Maintain an auditable emergency coordination ledger accessible to designated family members.',
  },
  {
    title: 'Weddings & Milestones',
    detail: 'Replace handwritten notebooks with verified digital receipts and transparent progress charts.',
  },
  {
    title: 'Family Savings',
    detail: 'Keep every contributor aligned on dates, pending dues, and goal completion percentages.',
  },
];

const FAQS = [
  {
    q: 'Does KuriCircle collect or custody real money?',
    a: 'No. KuriCircle is a community savings coordination and audit platform. It does not custody real deposits or disburse cash payouts.',
  },
  {
    q: 'How is this different from a regulated rotating chit fund?',
    a: 'KuriCircle coordinates goal-based community savings tracking and transparent recordkeeping. It does not operate rotating prize auctions or claim regulatory authorization.',
  },
  {
    q: 'How does the tamper-evident audit ledger work?',
    a: 'Each recorded contribution, approval, or dispute action computes a cryptographic SHA-256 hash combining the event payload with the previous event’s hash. Any unauthorized edit breaks the hash chain immediately.',
  },
  {
    q: 'Can members verify transaction history themselves?',
    a: 'Yes. Any permitted group member can open the Verify History page to recompute every SHA-256 hash client-side and confirm that no historical entry has been altered.',
  },
];

export const LandingPage: React.FC = () => {
  const { db, verificationReport, navigate, switchDemoUser, currentUser } = useKuri();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  // Live metrics derived directly from the database (never hardcoded mock figures)
  const totalVerifiedPool = useMemo(
    () =>
      db.contributions
        .filter((c) => c.verificationStatus === 'verified')
        .reduce((s, c) => s + c.amount, 0),
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

  const handleExploreClick = () => {
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
    <div className="bg-[#F8F6F2]">
      {/* 1. Hero Section */}
      <section className="mx-auto max-w-7xl px-6 pt-12 pb-16 lg:pt-16 lg:pb-24">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
            <p className="text-xs font-semibold text-[#0E5A46]">
              Traditional Trust · Digital Transparency
            </p>

            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#1F1F1F] leading-[1.12] [text-wrap:balance]">
              Your Community. Your Savings. Complete Transparency.
            </h1>

            <p className="max-w-xl text-base sm:text-lg leading-relaxed text-[#555555]">
              Bring traditional community savings into a smarter digital
              experience. Track contributions, monitor goals, and verify every
              recorded transaction.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button size="lg" onClick={handleExploreClick} className="gap-2">
                <span>Explore the Demo</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('how-it-works')}
              >
                How It Works
              </Button>
              <button
                type="button"
                onClick={() => navigate('login')}
                className="px-3 py-2 text-sm font-medium text-[#0E5A46] hover:underline underline-offset-4 cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative h-full min-h-[340px] overflow-hidden rounded-[26px] bg-[#E8F0ED] shadow-[0_8px_32px_rgba(31,31,31,0.06)]">
              {!heroImgFailed ? (
                <img
                  src={DEMO_GROUP_IMAGES.hero}
                  alt="Community members reviewing shared savings records around a table"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImgFailed(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center p-10 text-[#0E5A46]">
                  <span className="font-display text-lg font-semibold">
                    KuriCircle Community Coordination
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1F1F1F]/65 via-[#1F1F1F]/10 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/95 backdrop-blur-sm p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-[#7A7A7A]">Live Ledger Snapshot</p>
                    <p className="font-display text-base font-semibold text-[#1F1F1F] tabular-nums">
                      {formatINR(totalVerifiedPool)} verified across {db.groups.length} groups
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#0E5A46] tabular-nums">
                    {activeMembersCount} Active Members
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Platform Metrics Strip */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[20px] bg-white p-5 shadow-[0_2px_14px_rgba(31,31,31,0.03)]">
            <p className="text-xs text-[#7A7A7A]">Active Savings Groups</p>
            <p className="mt-1 font-display text-xl font-bold text-[#1F1F1F] tabular-nums">
              {db.groups.length}
            </p>
            <p className="mt-1 text-xs text-[#7A7A7A]">
              Goal-based community pools
            </p>
          </div>
          <div className="rounded-[20px] bg-white p-5 shadow-[0_2px_14px_rgba(31,31,31,0.03)]">
            <p className="text-xs text-[#7A7A7A]">Verified Contributions</p>
            <p className="mt-1 font-display text-xl font-bold text-[#1F1F1F] tabular-nums">
              {formatINR(totalVerifiedPool)}
            </p>
            <p className="mt-1 text-xs text-[#7A7A7A] tabular-nums">
              {db.contributions.length} total entries
            </p>
          </div>
          <div className="rounded-[20px] bg-white p-5 shadow-[0_2px_14px_rgba(31,31,31,0.03)]">
            <p className="text-xs text-[#7A7A7A]">Audit Events Chained</p>
            <p className="mt-1 font-display text-xl font-bold text-[#1F1F1F] tabular-nums">
              {verificationReport?.totalEvents ?? 0}
            </p>
            <p className="mt-1 text-xs text-[#0E5A46]">
              SHA-256 hash verification
            </p>
          </div>
          <div className="rounded-[20px] bg-[#0E5A46] p-5 text-white shadow-[0_2px_14px_rgba(14,90,70,0.18)]">
            <p className="text-xs text-white/75">Access Governance</p>
            <p className="mt-1 font-display text-xl font-bold">
              Role-Enforced
            </p>
            <p className="mt-1 text-xs text-white/85">
              Organizer · Member · Admin
            </p>
          </div>
        </div>
      </section>

      {/* 2. Problem & Solution */}
      <section className="bg-white py-16 lg:py-20 border-y border-[#ECEAE3]">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-semibold text-[#0E5A46]">
              Why Digital Transparency Matters
            </p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-[#1F1F1F] [text-wrap:balance]">
              Preserving Kerala’s community trust while eliminating manual ledger ambiguity
            </h2>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <Card className="bg-[#F8F6F2] shadow-none border border-[#E7E4DC]">
              <CardContent className="p-7 space-y-4">
                <h3 className="font-display text-xl font-semibold text-[#1F1F1F]">
                  The Traditional Challenge
                </h3>
                <ul className="space-y-3 text-sm text-[#555555]">
                  <li>
                    Contributors lack real-time visibility into verified balances
                    and group goal progress.
                  </li>
                  <li>
                    Handwritten entries can be overwritten or lost without an
                    audit trail of who made changes.
                  </li>
                  <li>
                    Disputes over dates, missed cycles, or amounts rely on
                    memory rather than verifiable receipts.
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-[#0E5A46] text-white shadow-none">
              <CardContent className="p-7 space-y-4">
                <h3 className="font-display text-xl font-semibold text-white">
                  The KuriCircle Approach
                </h3>
                <ul className="space-y-3 text-sm text-white/90">
                  <li>
                    Every recorded contribution receives a unique Transaction ID,
                    verification status, and downloadable receipt.
                  </li>
                  <li>
                    Append-only audit records chain each SHA-256 event hash to
                    the previous hash so tampering is immediately detectable.
                  </li>
                  <li>
                    Built-in dispute resolution and CSV financial exports keep
                    organizers and members aligned.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 3. Three-Step Workflow */}
      <section className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-xl space-y-2">
            <p className="text-xs font-semibold text-[#0E5A46]">Workflow</p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-[#1F1F1F]">
              From group setup to cryptographic verification
            </h2>
          </div>
          <Button variant="outline" onClick={() => navigate('how-it-works')}>
            Detailed Walkthrough
          </Button>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              step: '01. Create & Invite',
              title: 'Configure a goal-based circle',
              body: 'Organizers define the savings purpose, target amount, cycle schedule, and rules, generating a unique invitation code.',
            },
            {
              step: '02. Record & Verify',
              title: 'Log contributions',
              body: 'Period idempotency prevents duplicate entries. Organizers verify records while members view individual receipts.',
            },
            {
              step: '03. Audit & Export',
              title: 'Verify the SHA-256 chain',
              body: 'Each event links cryptographically to the previous event. Any member can recompute hashes and export CSV reports.',
            },
          ].map((item) => (
            <Card key={item.step} className="p-6">
              <p className="text-xs font-semibold text-[#0E5A46]">{item.step}</p>
              <h3 className="mt-2 font-display text-lg font-semibold text-[#1F1F1F]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#7A7A7A]">
                {item.body}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* 4. Cryptographic Ledger & Use Cases */}
      <section className="bg-white py-16 lg:py-20 border-y border-[#ECEAE3]">
        <div className="mx-auto max-w-7xl px-6 space-y-16">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-6 space-y-4">
              <p className="text-xs font-semibold text-[#0E5A46]">
                Cryptographically Linked Audit Ledger
              </p>
              <h2 className="font-display text-3xl font-bold tracking-tight text-[#1F1F1F] [text-wrap:balance]">
                Every transaction anchors to the record before it
              </h2>
              <p className="text-sm leading-relaxed text-[#555555]">
                KuriCircle implements an append-only cryptographic audit log
                using Web Crypto SHA-256 hashing so unauthorized edits to
                historical records are immediately exposed during verification.
              </p>
              <Button variant="outline" onClick={() => navigate('security')}>
                Inspect Verification Architecture
              </Button>
            </div>

            <div className="lg:col-span-6 rounded-[22px] bg-[#F8F6F2] p-6 border border-[#E7E4DC] space-y-3">
              <p className="text-xs font-semibold text-[#1F1F1F]">
                Latest Live Ledger Anchor
              </p>
              {latestAuditEvent ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#7A7A7A]">Sequence</span>
                    <span className="font-mono font-semibold">
                      #{latestAuditEvent.sequenceNumber} · {latestAuditEvent.eventType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7A7A7A]">Previous Hash</span>
                    <span className="font-mono text-[#555555]">
                      {shortHash(latestAuditEvent.previousEventHash)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7A7A7A]">Current Hash</span>
                    <span className="font-mono font-semibold text-[#0E5A46]">
                      {shortHash(latestAuditEvent.currentEventHash)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#7A7A7A] leading-relaxed">
                  No audit events have been recorded yet. Create a savings group
                  or record a contribution inside the workspace to generate the
                  genesis SHA-256 anchor in real time.
                </p>
              )}
            </div>
          </div>

          <div>
            <div className="max-w-2xl space-y-2 mb-8">
              <p className="text-xs font-semibold text-[#0E5A46]">
                Community Use Cases
              </p>
              <h2 className="font-display text-3xl font-bold tracking-tight text-[#1F1F1F]">
                Built for trusted neighbourhood, family, and cooperative goals
              </h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {USE_CASES.map((u) => (
                <div
                  key={u.title}
                  className="rounded-[20px] bg-[#F8F6F2] p-6 border border-[#ECEAE3] space-y-2"
                >
                  <h3 className="font-display text-lg font-semibold text-[#1F1F1F]">
                    {u.title}
                  </h3>
                  <p className="text-sm text-[#7A7A7A] leading-relaxed">
                    {u.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQ */}
      <section className="mx-auto max-w-4xl px-6 py-16 lg:py-20 space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#0E5A46]">
            Frequently Asked Questions
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-[#1F1F1F]">
            Scope, verification, and governance clarity
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={item.q}
                className="rounded-[20px] bg-white border border-[#ECEAE3] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left font-display text-sm sm:text-base font-semibold text-[#1F1F1F] cursor-pointer"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-[#7A7A7A] shrink-0 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm leading-relaxed text-[#555555]">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
