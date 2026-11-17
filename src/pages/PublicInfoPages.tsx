import React from 'react';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Database,
  FileCheck2,
  Lock,
  MessageSquareWarning,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { useKuri } from '@/src/lib/store';

export const AboutPage: React.FC = () => {
  const { navigate, switchDemoUser } = useKuri();
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-14 space-y-8 sm:space-y-10">
      <div className="space-y-4">
        <p className="text-xs font-semibold text-[#0E5A46]">About KuriCircle</p>
        <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#1F1F1F] [text-wrap:balance]">
          Traditional Trust. Digital Transparency.
        </h1>
        <p className="text-base leading-relaxed text-[#555555]">
          KuriCircle is inspired by Kerala’s centuries-old Kuri (കുറി) tradition
          of mutual community support. Our demonstration platform explores how
          modern recordkeeping, automated cycle reminders, and cryptographic
          audit logs can strengthen trust in community-organized savings goals.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6 space-y-3">
          <h2 className="font-display text-xl font-semibold text-[#1F1F1F]">
            Educational & Hackathon Scope
          </h2>
          <p className="text-sm leading-relaxed text-[#555555]">
            This prototype strictly simulates community savings coordination. It
            does not collect deposits, hold real money, distribute prize pools,
            or act as a regulated chit fund operator.
          </p>
        </Card>
        <Card className="p-6 space-y-3">
          <h2 className="font-display text-xl font-semibold text-[#1F1F1F]">
            Built for Future Compliance Review
          </h2>
          <p className="text-sm leading-relaxed text-[#555555]">
            By separating goal tracking, verification logs, and role-based access
            controls at the database level, KuriCircle provides an auditable
            foundation for future authorized operators to evaluate.
          </p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => switchDemoUser('usr-mazin-01')}>
          Launch Interactive Demo
        </Button>
        <Button variant="outline" onClick={() => navigate('security')}>
          Review Security Architecture
        </Button>
      </div>
    </div>
  );
};

export const FeaturesPage: React.FC = () => {
  const { switchDemoUser } = useKuri();
  const features = [
    {
      icon: Users,
      title: 'Role-Based Group Governance',
      desc: 'Separate Organizer, Member, and Platform Administrator workflows with strict policy checks.',
    },
    {
      icon: FileCheck2,
      title: 'Idempotent Contribution Tracking',
      desc: 'Prevent duplicate cycle entries while tracking Pending, Submitted, Verified, and Rejected states.',
    },
    {
      icon: ShieldCheck,
      title: 'SHA-256 Audit Ledger',
      desc: 'Every financial and dispute event links to the preceding event hash for tamper detection.',
    },
    {
      icon: BarChart3,
      title: 'Analytics & CSV Exports',
      desc: 'Visual goal milestones, monthly collection trends, and downloadable CSV financial reports.',
    },
    {
      icon: MessageSquareWarning,
      title: 'Dispute Resolution Center',
      desc: 'Members can flag missing or incorrect records; organizers respond and admins review escalations.',
    },
    {
      icon: Database,
      title: 'Normalized PostgreSQL Schema',
      desc: '12-table architecture with UUID primary keys, foreign key constraints, and Row Level Security.',
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14 space-y-8 sm:space-y-10">
      <div className="max-w-2xl space-y-3">
        <p className="text-xs font-semibold text-[#0E5A46]">Platform Capabilities</p>
        <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#1F1F1F] [text-wrap:balance]">
          Purpose-built modules for accountable community coordination
        </h1>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <Card key={f.title}>
              <CardContent className="p-6 space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F0ED] text-[#0E5A46]">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="font-display text-lg font-semibold text-[#1F1F1F]">
                  {f.title}
                </h2>
                <p className="text-sm leading-relaxed text-[#7A7A7A]">
                  {f.desc}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Button onClick={() => switchDemoUser('usr-mazin-01')} className="gap-2">
        <span>Try All Features in Live Demo</span>
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export const HowItWorksPage: React.FC = () => {
  const { navigate, switchDemoUser } = useKuri();
  const steps = [
    {
      num: '01',
      title: 'Create a Goal-Based Savings Group',
      detail:
        'An organizer defines the savings purpose, target amount (e.g., ₹1,00,000), monthly contribution amount, member cap, and clear community rules—explicitly distinguishing the group from a regulated rotating chit fund.',
    },
    {
      num: '02',
      title: 'Invite & Approve Trusted Members',
      detail:
        'Members join using a unique invitation code like KURI-GRN-2026. Organizers review membership requests and configure peer visibility permissions.',
    },
    {
      num: '03',
      title: 'Record & Verify Simulated Contributions',
      detail:
        'Monthly entries are logged with unique Transaction IDs and period idempotency checks. Once verified by the organizer, totals and goal gauges update automatically.',
    },
    {
      num: '04',
      title: 'Verify SHA-256 Chain & Export Reports',
      detail:
        'Every action appends an immutable-style audit event linking to the prior hash. Any member can run client-side SHA-256 verification or export CSV reports.',
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-14 space-y-8 sm:space-y-10">
      <div className="space-y-3">
        <p className="text-xs font-semibold text-[#0E5A46]">How KuriCircle Works</p>
        <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#1F1F1F] [text-wrap:balance]">
          Transparent coordination in four structured steps
        </h1>
      </div>

      <div className="space-y-4">
        {steps.map((s) => (
          <Card key={s.num}>
            <CardContent className="p-6 flex flex-col sm:flex-row gap-4 sm:items-start">
              <span className="font-display text-2xl font-bold text-[#0E5A46] tabular-nums shrink-0">
                {s.num}.
              </span>
              <div className="space-y-1.5">
                <h2 className="font-display text-lg font-semibold text-[#1F1F1F]">
                  {s.title}
                </h2>
                <p className="text-sm leading-relaxed text-[#555555]">{s.detail}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => switchDemoUser('usr-mazin-01')}>
          Open Workspace
        </Button>
        <Button variant="ghost" onClick={() => navigate('landing')}>
          Back to Home
        </Button>
      </div>
    </div>
  );
};

export const SecurityPage: React.FC = () => {
  const { switchDemoUser } = useKuri();
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-14 space-y-8 sm:space-y-10">
      <div className="space-y-3">
        <p className="text-xs font-semibold text-[#0E5A46]">
          Security & Cryptographic Audit Architecture
        </p>
        <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#1F1F1F] [text-wrap:balance]">
          Tamper-evident ledger verification without cryptocurrency hype
        </h1>
        <p className="text-base leading-relaxed text-[#555555]">
          KuriCircle uses standard Web Crypto SHA-256 hashing to connect audit
          records sequentially. We present this transparently as a
          cryptographically linked audit ledger—not a decentralized blockchain.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-6 space-y-3">
            <Lock className="h-5 w-5 text-[#0E5A46]" />
            <h2 className="font-display text-lg font-semibold text-[#1F1F1F]">
              Append-Only Ledger Discipline
            </h2>
            <p className="text-sm text-[#555555] leading-relaxed">
              Historical audit entries cannot be edited. Corrections and dispute
              resolutions are appended as new events referencing the original
              transaction ID.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 space-y-3">
            <CheckCircle2 className="h-5 w-5 text-[#0E5A46]" />
            <h2 className="font-display text-lg font-semibold text-[#1F1F1F]">
              Interactive Tamper Detection Demo
            </h2>
            <p className="text-sm text-[#555555] leading-relaxed">
              Inside the Verify History page, you can simulate tampering with an
              archived record and immediately watch SHA-256 verification pinpoint
              the broken hash link.
            </p>
          </CardContent>
        </Card>
      </div>

      <Button onClick={() => switchDemoUser('usr-mazin-01')}>
        Test Audit Verification
      </Button>
    </div>
  );
};
