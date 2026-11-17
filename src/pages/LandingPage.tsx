import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  FileCheck2,
  Lock,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { DEMO_GROUP_IMAGES } from '@/src/lib/seedData';
import { useKuri } from '@/src/lib/store';

const USE_CASES = [
  {
    title: 'Community Development',
    example: 'Greenfield Ward Solar & Water Pool',
    detail: 'Track neighbourhood infrastructure pledges with shared visibility across every household.',
  },
  {
    title: 'Education Reserves',
    example: 'Malabar Scholars Circle',
    detail: 'Coordinate tuition, exam fee, and scholarship pools with clear monthly contribution milestones.',
  },
  {
    title: 'Small Business Capital',
    example: 'Kochi Artisans Equipment Pool',
    detail: 'Help local makers and shopkeepers track shared tool and workshop savings goals.',
  },
  {
    title: 'Medical Emergencies',
    example: 'Trusted Family Reserve',
    detail: 'Maintain an auditable emergency coordination ledger accessible to designated family members.',
  },
  {
    title: 'Weddings & Milestones',
    example: 'Extended Family Goal Circle',
    detail: 'Replace handwritten notebooks with verified digital receipts and transparent progress charts.',
  },
  {
    title: 'Family Savings',
    example: 'Annual Home Maintenance Fund',
    detail: 'Keep every contributor aligned on dates, pending dues, and goal completion percentages.',
  },
];

const FAQS = [
  {
    q: 'Does KuriCircle collect or custody real money?',
    a: 'No. KuriCircle is an educational and hackathon demonstration prototype. All amounts, transactions, and balances are simulated demonstration records only.',
  },
  {
    q: 'How is this different from a regulated rotating chit fund?',
    a: 'KuriCircle coordinates goal-based community savings tracking and transparent recordkeeping. It does not operate rotating prize auctions, collect real deposits, or claim regulatory authorization.',
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
  const { navigate, switchDemoUser } = useKuri();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const launchInstantDemo = () => {
    switchDemoUser('usr-org-01');
  };

  return (
    <div className="bg-[#F8F6F2]">
      {/* 1. Hero Section */}
      <section className="mx-auto max-w-7xl px-6 pt-12 pb-16 lg:pt-16 lg:pb-24">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#0E5A46]">
              <span>Traditional Trust. Digital Transparency.</span>
              <span aria-hidden="true" className="text-[#C8A45A]">·</span>
              <span className="text-[#7A7A7A]">Simulated Demonstration Prototype</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#1F1F1F] leading-[1.12] [text-wrap:balance]">
              Your Community. Your Savings. Complete Transparency.
            </h1>

            <p className="max-w-xl text-base sm:text-lg leading-relaxed text-[#555555]">
              Bring traditional community savings into a smarter digital
              experience. Track contributions, monitor goals, and verify every
              recorded transaction.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button size="lg" onClick={launchInstantDemo} className="gap-2">
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
                Role Login Options
              </button>
            </div>

            <p className="text-xs text-[#7A7A7A] max-w-lg leading-relaxed">
              Prototype Notice: KuriCircle demonstrates transparent digital
              recordkeeping using simulated transactions only. Not an authorized
              financial institution or operating chit fund.
            </p>
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
              <div className="absolute inset-0 bg-gradient-to-t from-[#1F1F1F]/70 via-[#1F1F1F]/15 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/95 backdrop-blur-sm p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-[#7A7A7A]">
                      Featured Demo Group · Greenfield Community Savings
                    </p>
                    <p className="font-display text-base font-semibold text-[#1F1F1F] tabular-nums">
                      ₹40,000 simulated progress of ₹1,00,000 goal
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#0E5A46] tabular-nums">
                    40% Verified · 10 Members
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Claim-to-Proof Metrics Strip directly below hero */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[20px] bg-white p-5 shadow-[0_2px_14px_rgba(31,31,31,0.03)]">
            <p className="text-xs text-[#7A7A7A]">Audit Chain Algorithm</p>
            <p className="mt-1 font-display text-xl font-bold text-[#1F1F1F] font-mono">
              SHA-256
            </p>
            <p className="mt-1 text-xs text-[#0E5A46]">
              Sequential hash linkage per event
            </p>
          </div>
          <div className="rounded-[20px] bg-white p-5 shadow-[0_2px_14px_rgba(31,31,31,0.03)]">
            <p className="text-xs text-[#7A7A7A]">Access Governance</p>
            <p className="mt-1 font-display text-xl font-bold text-[#1F1F1F]">
              3 Distinct Roles
            </p>
            <p className="mt-1 text-xs text-[#7A7A7A]">
              Organizer · Member · Platform Admin
            </p>
          </div>
          <div className="rounded-[20px] bg-white p-5 shadow-[0_2px_14px_rgba(31,31,31,0.03)]">
            <p className="text-xs text-[#7A7A7A]">Demo Pool Progress</p>
            <p className="mt-1 font-display text-xl font-bold text-[#1F1F1F] tabular-nums">
              ₹83,000
            </p>
            <p className="mt-1 text-xs text-[#7A7A7A]">
              Across 3 simulated community circles
            </p>
          </div>
          <div className="rounded-[20px] bg-[#0E5A46] p-5 text-white shadow-[0_2px_14px_rgba(14,90,70,0.18)]">
            <p className="text-xs text-white/75">Custody & Legal Model</p>
            <p className="mt-1 font-display text-xl font-bold">
              Zero Custody MVP
            </p>
            <p className="mt-1 text-xs text-white/85">
              Simulated coordination ledger only
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
                <p className="text-xs font-semibold text-[#9A6B16]">
                  01. The Traditional Challenge
                </p>
                <h3 className="font-display text-xl font-semibold text-[#1F1F1F]">
                  Paper notebooks and informal chat threads break down at scale
                </h3>
                <ul className="space-y-3 text-sm text-[#555555]">
                  <li className="flex items-start gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#C8A45A] shrink-0" />
                    <span>
                      Contributors lack real-time visibility into verified balances and
                      group goal progress.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#C8A45A] shrink-0" />
                    <span>
                      Handwritten entries can be overwritten or lost without an audit
                      trail of who made changes.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#C8A45A] shrink-0" />
                    <span>
                      Disputes over dates, missed cycles, or amounts rely on memory
                      rather than verifiable receipts.
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-[#0E5A46] text-white shadow-none">
              <CardContent className="p-7 space-y-4">
                <p className="text-xs font-semibold text-[#E5C98B]">
                  02. The KuriCircle Approach
                </p>
                <h3 className="font-display text-xl font-semibold text-white">
                  Structured goal tracking paired with a SHA-256 linked audit log
                </h3>
                <ul className="space-y-3 text-sm text-white/90">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#E5C98B] shrink-0" />
                    <span>
                      Every simulated contribution receives a unique Transaction ID,
                      verification status, and printable receipt.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#E5C98B] shrink-0" />
                    <span>
                      Append-only audit records chain each event hash to the previous
                      hash so tampering is immediately detectable.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#E5C98B] shrink-0" />
                    <span>
                      Built-in dispute resolution and CSV financial exports keep
                      organizers and members aligned.
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 3. Three-Step Workflow & Bento Preview */}
      <section className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-xl space-y-2">
            <p className="text-xs font-semibold text-[#0E5A46]">Three-Step Flow</p>
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
              title: 'Log simulated contributions',
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

        {/* Interactive Dashboard Preview Card (Inspired by Reference Layout) */}
        <div className="mt-14 rounded-[28px] bg-[#EAE8E2] p-5 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-semibold text-[#0E5A46]">
                Workspace Preview
              </p>
              <h3 className="font-display text-2xl font-bold text-[#1F1F1F]">
                Designed for clarity across non-technical members and organizers
              </h3>
            </div>
            <Button onClick={launchInstantDemo}>Open Live Interactive Demo</Button>
          </div>

          <div className="grid gap-4 md:grid-cols-12">
            <div className="md:col-span-3 rounded-[20px] bg-white p-5">
              <p className="text-xs text-[#7A7A7A]">Greenfield Simulated Pool</p>
              <p className="mt-2 font-display text-2xl font-bold text-[#1F1F1F] tabular-nums">
                ₹40,000
              </p>
              <p className="mt-1 text-xs text-[#0E5A46]">40% of ₹1,00,000 target</p>
            </div>
            <div className="md:col-span-3 rounded-[20px] bg-white p-5">
              <p className="text-xs text-[#7A7A7A]">Active Participants</p>
              <p className="mt-2 font-display text-2xl font-bold text-[#1F1F1F] tabular-nums">
                10 Members
              </p>
              <p className="mt-1 text-xs text-[#7A7A7A]">₹1,000 monthly cycle</p>
            </div>
            <div className="md:col-span-3 rounded-[20px] bg-white p-5">
              <p className="text-xs text-[#7A7A7A]">Audit Events Linked</p>
              <p className="mt-2 font-display text-2xl font-bold text-[#1F1F1F] tabular-nums">
                17 Records
              </p>
              <p className="mt-1 text-xs text-[#0E5A46]">SHA-256 Chain Verified</p>
            </div>
            <div className="md:col-span-3 rounded-[20px] bg-gradient-to-br from-[#527C6E] to-[#0E5A46] p-5 text-white">
              <p className="text-xs text-white/80">Completion Rate</p>
              <p className="mt-2 font-display text-2xl font-bold tabular-nums">
                100%
              </p>
              <p className="mt-1 text-xs text-white/85">Cycle 4 verified on time</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Transparent Ledger Explainer & Community Use Cases */}
      <section className="bg-white py-16 lg:py-20 border-y border-[#ECEAE3]">
        <div className="mx-auto max-w-7xl px-6 space-y-16">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5 space-y-4">
              <p className="text-xs font-semibold text-[#0E5A46]">
                Cryptographically Linked Audit Ledger
              </p>
              <h2 className="font-display text-3xl font-bold tracking-tight text-[#1F1F1F] [text-wrap:balance]">
                Every transaction anchors to the record before it
              </h2>
              <p className="text-sm leading-relaxed text-[#555555]">
                We do not make false claims about decentralized blockchains.
                Instead, KuriCircle implements a practical, append-only
                cryptographic audit log using SHA-256 hashing so unauthorized edits
                to historical records are immediately exposed.
              </p>
              <Button variant="outline" onClick={() => navigate('security')}>
                Inspect Verification Architecture
              </Button>
            </div>

            <div className="lg:col-span-7 grid gap-4 sm:grid-cols-3">
              {[
                {
                  label: '01. Previous Hash',
                  icon: Lock,
                  code: '7a4c9f10...e8b12d',
                  desc: 'References the cryptographic fingerprint of the preceding audit event.',
                },
                {
                  label: '02. Event Payload',
                  icon: FileCheck2,
                  code: 'SIM-GRN-1035 · ₹1,000',
                  desc: 'Canonical record of transaction ID, actor, amount, and timestamp.',
                },
                {
                  label: '03. Current Hash',
                  icon: ShieldCheck,
                  code: 'd3918a04...5f2c90',
                  desc: 'Deterministic SHA-256 digest verified anytime in the browser.',
                },
              ].map((block) => {
                const Icon = block.icon;
                return (
                  <div
                    key={block.label}
                    className="rounded-[20px] bg-[#F8F6F2] p-5 border border-[#E7E4DC] space-y-3"
                  >
                    <Icon className="h-5 w-5 text-[#0E5A46]" />
                    <p className="font-display text-sm font-semibold text-[#1F1F1F]">
                      {block.label}
                    </p>
                    <p className="font-mono text-xs text-[#0E5A46] bg-white rounded-lg px-2.5 py-1.5 border border-[#ECEAE3] truncate">
                      {block.code}
                    </p>
                    <p className="text-xs leading-relaxed text-[#7A7A7A]">
                      {block.desc}
                    </p>
                  </div>
                );
              })}
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
                  <p className="text-xs font-medium text-[#0E5A46]">{u.example}</p>
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

      {/* 5. Security, FAQ & Final CTA */}
      <section className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5 space-y-5">
            <p className="text-xs font-semibold text-[#0E5A46]">
              Security & Regulatory Clarity
            </p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-[#1F1F1F]">
              Built with database isolation and honest scope boundaries
            </h2>
            <div className="space-y-3 text-sm text-[#555555]">
              <div className="flex items-start gap-2.5">
                <Users className="h-4 w-4 text-[#0E5A46] mt-0.5 shrink-0" />
                <span>
                  Row Level Security policies isolate group data so unauthorized
                  users cannot read private circles.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <TrendingUp className="h-4 w-4 text-[#0E5A46] mt-0.5 shrink-0" />
                <span>
                  Authoritative totals are computed strictly from verified ledger
                  records, never arbitrary client balances.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-[#0E5A46] mt-0.5 shrink-0" />
                <span>
                  No regulatory claims or guaranteed financial returns. Designed
                  for hackathon demonstration and future compliance review.
                </span>
              </div>
            </div>
            <div className="pt-2">
              <Button onClick={() => navigate('register')}>
                Create Demo Account
              </Button>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-3">
            <p className="text-xs font-semibold text-[#0E5A46] mb-2">
              Frequently Asked Questions
            </p>
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
        </div>
      </section>
    </div>
  );
};
