import { createLinkedAuditEvent } from '@/src/lib/crypto';
import type {
  AuditEvent,
  ContributionRecord,
  GroupAnnouncement,
  GroupInvitation,
  GroupMember,
  KuriDatabaseState,
  NotificationItem,
  Profile,
  SavingsGoal,
  SavingsGroup,
  UserActivityLog,
  Dispute,
  DisputeResponse,
} from '@/src/types/kuri';

export const DEMO_AVATARS = {
  organizer: '/src/assets/images/avatar_organizer_1794934568243.jpg',
  member: '/src/assets/images/avatar_member_1794934568879.jpg',
};

export const DEMO_GROUP_IMAGES = {
  greenfield: '/src/assets/images/group_greenfield_community_1794934568404.jpg',
  education: '/src/assets/images/group_education_fund_1794934568348.jpg',
  hero: '/src/assets/images/hero_community_savings_1794934567187.jpg',
};

export async function buildInitialSeedData(): Promise<KuriDatabaseState> {
  const profiles: Profile[] = [
    {
      id: 'usr-org-01',
      fullName: 'Ananya Menon',
      email: 'ananya.menon@kuricircle.demo',
      phone: '+91 98470 41290',
      avatarUrl: DEMO_AVATARS.organizer,
      role: 'organizer',
      isActive: true,
      city: 'Kochi, Kerala',
      createdAt: '2026-07-01T09:00:00Z',
      updatedAt: '2026-11-10T10:30:00Z',
    },
    {
      id: 'usr-mem-01',
      fullName: 'Arjun Nair',
      email: 'arjun.nair@kuricircle.demo',
      phone: '+91 94471 88321',
      avatarUrl: DEMO_AVATARS.member,
      role: 'member',
      isActive: true,
      city: 'Kochi, Kerala',
      createdAt: '2026-07-02T11:15:00Z',
      updatedAt: '2026-11-12T14:20:00Z',
    },
    {
      id: 'usr-adm-01',
      fullName: 'Devika Krishnan',
      email: 'admin@kuricircle.demo',
      phone: '+91 98950 11204',
      avatarUrl: '',
      role: 'platform_admin',
      isActive: true,
      city: 'Thiruvananthapuram, Kerala',
      createdAt: '2026-06-15T08:00:00Z',
      updatedAt: '2026-11-15T09:00:00Z',
    },
    {
      id: 'usr-mem-02',
      fullName: 'Lakshmi Pillai',
      email: 'lakshmi.pillai@kuricircle.demo',
      phone: '+91 98472 30119',
      avatarUrl: '',
      role: 'member',
      isActive: true,
      city: 'Thrissur, Kerala',
      createdAt: '2026-07-02T12:00:00Z',
      updatedAt: '2026-11-05T10:00:00Z',
    },
    {
      id: 'usr-mem-03',
      fullName: 'Rahul Varma',
      email: 'rahul.varma@kuricircle.demo',
      phone: '+91 97450 22914',
      avatarUrl: '',
      role: 'member',
      isActive: true,
      city: 'Kochi, Kerala',
      createdAt: '2026-07-03T09:30:00Z',
      updatedAt: '2026-11-05T10:00:00Z',
    },
    {
      id: 'usr-mem-04',
      fullName: 'Meera Kurian',
      email: 'meera.kurian@kuricircle.demo',
      phone: '+91 94460 77812',
      avatarUrl: '',
      role: 'member',
      isActive: true,
      city: 'Kottayam, Kerala',
      createdAt: '2026-07-03T10:15:00Z',
      updatedAt: '2026-11-05T10:00:00Z',
    },
    {
      id: 'usr-mem-05',
      fullName: 'Suresh Babu',
      email: 'suresh.babu@kuricircle.demo',
      phone: '+91 98951 64502',
      avatarUrl: '',
      role: 'member',
      isActive: true,
      city: 'Alappuzha, Kerala',
      createdAt: '2026-07-04T08:45:00Z',
      updatedAt: '2026-11-05T10:00:00Z',
    },
    {
      id: 'usr-mem-06',
      fullName: 'Fathima Beevi',
      email: 'fathima.b@kuricircle.demo',
      phone: '+91 94952 99102',
      avatarUrl: '',
      role: 'member',
      isActive: true,
      city: 'Kozhikode, Kerala',
      createdAt: '2026-07-04T15:10:00Z',
      updatedAt: '2026-11-05T10:00:00Z',
    },
    {
      id: 'usr-mem-07',
      fullName: 'Thomas Mathew',
      email: 'thomas.mathew@kuricircle.demo',
      phone: '+91 98463 11408',
      avatarUrl: '',
      role: 'member',
      isActive: true,
      city: 'Ernakulam, Kerala',
      createdAt: '2026-07-05T09:00:00Z',
      updatedAt: '2026-11-05T10:00:00Z',
    },
    {
      id: 'usr-mem-08',
      fullName: 'Divya Krishnan',
      email: 'divya.k@kuricircle.demo',
      phone: '+91 97461 55290',
      avatarUrl: '',
      role: 'member',
      isActive: true,
      city: 'Palakkad, Kerala',
      createdAt: '2026-07-05T11:20:00Z',
      updatedAt: '2026-11-05T10:00:00Z',
    },
    {
      id: 'usr-mem-09',
      fullName: 'Nikhil Raj',
      email: 'nikhil.raj@kuricircle.demo',
      phone: '+91 94477 60841',
      avatarUrl: '',
      role: 'member',
      isActive: true,
      city: 'Kochi, Kerala',
      createdAt: '2026-07-06T14:00:00Z',
      updatedAt: '2026-11-05T10:00:00Z',
    },
    {
      id: 'usr-mem-10',
      fullName: 'Priya Sankar',
      email: 'priya.sankar@kuricircle.demo',
      phone: '+91 98956 32018',
      avatarUrl: '',
      role: 'member',
      isActive: true,
      city: 'Kannur, Kerala',
      createdAt: '2026-07-10T10:00:00Z',
      updatedAt: '2026-11-05T10:00:00Z',
    },
  ];

  const groups: SavingsGroup[] = [
    {
      id: 'grp-greenfield',
      organizerId: 'usr-org-01',
      name: 'Greenfield Community Savings',
      description:
        'A transparent 10-member neighbourhood goal pool coordinating solar micro-lighting and rainwater harvesting upgrades for Greenfield Ward.',
      purpose: 'Community development',
      imageUrl: DEMO_GROUP_IMAGES.greenfield,
      arrangementType: 'goal_based_savings',
      maxMembers: 10,
      targetAmount: 100000,
      frequency: 'monthly',
      proposedContribution: 1000,
      startDate: '2026-08-01',
      endDate: '2027-05-31',
      rules:
        '1. Simulated monthly target of ₹1,000 per member by the 10th of each month.\n2. This is a goal-based community coordination demo, not a regulated rotating chit fund.\n3. All recorded entries are verified by the group organizer and linked via SHA-256 audit hashes.',
      visibility: 'community_directory',
      inviteCode: 'KURI-GRN-2026',
      isFlagged: false,
      createdAt: '2026-07-20T09:00:00Z',
      updatedAt: '2026-11-12T09:00:00Z',
    },
    {
      id: 'grp-scholars',
      organizerId: 'usr-org-01',
      name: 'Malabar Scholars Education Circle',
      description:
        'Collaborative family and alumni savings tracker supporting university tuition and exam readiness stipends.',
      purpose: 'Education',
      imageUrl: DEMO_GROUP_IMAGES.education,
      arrangementType: 'goal_based_savings',
      maxMembers: 12,
      targetAmount: 150000,
      frequency: 'monthly',
      proposedContribution: 1500,
      startDate: '2026-09-01',
      endDate: '2027-08-31',
      rules:
        '1. Goal-based educational reserve tracked transparently.\n2. Monthly simulated contribution target: ₹1,500.\n3. Any discrepancy must be reported via the Dispute Center within 7 days.',
      visibility: 'community_directory',
      inviteCode: 'KURI-EDU-4091',
      isFlagged: false,
      createdAt: '2026-08-18T10:00:00Z',
      updatedAt: '2026-11-10T10:00:00Z',
    },
    {
      id: 'grp-artisans',
      organizerId: 'usr-org-01',
      name: 'Kochi Artisans Equipment Pool',
      description:
        'Small-business cooperative demonstration circle helping local weavers and woodcraft studios track shared equipment savings.',
      purpose: 'Small business development',
      imageUrl: DEMO_GROUP_IMAGES.hero,
      arrangementType: 'goal_based_savings',
      maxMembers: 8,
      targetAmount: 80000,
      frequency: 'monthly',
      proposedContribution: 2000,
      startDate: '2026-09-15',
      endDate: '2027-03-15',
      rules:
        '1. Cooperative goal tracking for shared kiln and loom maintenance.\n2. Simulated contribution target: ₹2,000 per month.\n3. No real deposits are collected in this prototype.',
      visibility: 'private_invite',
      inviteCode: 'KURI-ART-8820',
      isFlagged: false,
      createdAt: '2026-09-01T11:00:00Z',
      updatedAt: '2026-11-11T11:00:00Z',
    },
  ];

  // Greenfield has 10 active members (organizer + 9 members) + 1 pending join request (Priya Sankar)
  const greenfieldMemberIds = [
    'usr-org-01',
    'usr-mem-01',
    'usr-mem-02',
    'usr-mem-03',
    'usr-mem-04',
    'usr-mem-05',
    'usr-mem-06',
    'usr-mem-07',
    'usr-mem-08',
    'usr-mem-09',
  ];

  const groupMembers: GroupMember[] = [
    ...greenfieldMemberIds.map((userId, idx) => ({
      id: `gm-grn-${idx + 1}`,
      groupId: 'grp-greenfield',
      userId,
      status: 'active' as const,
      canViewPeerTotals: true,
      canRecordDrafts: userId === 'usr-org-01',
      joinedAt: '2026-07-25T10:00:00Z',
      createdAt: '2026-07-25T10:00:00Z',
      updatedAt: '2026-07-25T10:00:00Z',
    })),
    {
      id: 'gm-grn-pending-1',
      groupId: 'grp-greenfield',
      userId: 'usr-mem-10',
      status: 'pending',
      canViewPeerTotals: true,
      canRecordDrafts: false,
      joinedAt: '',
      createdAt: '2026-11-14T16:10:00Z',
      updatedAt: '2026-11-14T16:10:00Z',
    },
    // Malabar Scholars members
    ...['usr-org-01', 'usr-mem-01', 'usr-mem-02', 'usr-mem-04', 'usr-mem-06', 'usr-mem-08'].map(
      (userId, idx) => ({
        id: `gm-edu-${idx + 1}`,
        groupId: 'grp-scholars',
        userId,
        status: 'active' as const,
        canViewPeerTotals: true,
        canRecordDrafts: userId === 'usr-org-01',
        joinedAt: '2026-08-22T10:00:00Z',
        createdAt: '2026-08-22T10:00:00Z',
        updatedAt: '2026-08-22T10:00:00Z',
      })
    ),
    // Kochi Artisans members
    ...['usr-org-01', 'usr-mem-03', 'usr-mem-05', 'usr-mem-07'].map((userId, idx) => ({
      id: `gm-art-${idx + 1}`,
      groupId: 'grp-artisans',
      userId,
      status: 'active' as const,
      canViewPeerTotals: true,
      canRecordDrafts: userId === 'usr-org-01',
      joinedAt: '2026-09-05T10:00:00Z',
      createdAt: '2026-09-05T10:00:00Z',
      updatedAt: '2026-09-05T10:00:00Z',
    })),
  ];

  const goals: SavingsGoal[] = [
    {
      id: 'goal-grn-01',
      groupId: 'grp-greenfield',
      title: 'Greenfield Solar & Rainwater Reserve',
      targetAmount: 100000,
      targetDate: '2027-05-31',
      milestones: [25, 50, 75, 100],
      createdAt: '2026-07-20T09:00:00Z',
      updatedAt: '2026-11-12T09:00:00Z',
    },
    {
      id: 'goal-edu-01',
      groupId: 'grp-scholars',
      title: 'Annual Scholarship & Books Pool',
      targetAmount: 150000,
      targetDate: '2027-08-31',
      milestones: [25, 50, 75, 100],
      createdAt: '2026-08-18T10:00:00Z',
      updatedAt: '2026-11-10T10:00:00Z',
    },
    {
      id: 'goal-art-01',
      groupId: 'grp-artisans',
      title: 'Shared Workshop Loom Upgrade',
      targetAmount: 80000,
      targetDate: '2027-03-15',
      milestones: [25, 50, 75, 100],
      createdAt: '2026-09-01T11:00:00Z',
      updatedAt: '2026-11-11T11:00:00Z',
    },
  ];

  // Exact ₹40,000 verified demonstration progress for Greenfield Community Savings:
  // 10 members × 4 monthly cycles (2026-08, 2026-09, 2026-10, 2026-11) × ₹1,000 = ₹40,000!
  const periods = ['2026-08', '2026-09', '2026-10', '2026-11'];
  const contributions: ContributionRecord[] = [];
  let txCounter = 1001;

  periods.forEach((period, pIdx) => {
    greenfieldMemberIds.forEach((memberId, mIdx) => {
      const day = String(Math.min(10, mIdx + 2)).padStart(2, '0');
      const txId = `SIM-GRN-${txCounter++}`;
      const dateStr = `${period}-${day}`;
      contributions.push({
        id: `contrib-grn-${pIdx}-${mIdx}`,
        transactionId: txId,
        groupId: 'grp-greenfield',
        memberId,
        amount: 1000,
        transactionDate: dateStr,
        contributionPeriod: period,
        paymentStatus: 'verified',
        verificationStatus: 'verified',
        recordedBy: 'usr-org-01',
        notes: `Cycle ${pIdx + 1} simulated community contribution`,
        isSimulated: true,
        createdAt: `${dateStr}T10:${String(10 + mIdx).padStart(2, '0')}:00Z`,
        updatedAt: `${dateStr}T12:00:00Z`,
      });
    });
  });

  // Malabar Scholars: 6 members × 3 cycles × ₹1,500 = ₹27,000 verified + 2 submitted pending verification
  const eduMembers = ['usr-org-01', 'usr-mem-01', 'usr-mem-02', 'usr-mem-04', 'usr-mem-06', 'usr-mem-08'];
  ['2026-09', '2026-10', '2026-11'].forEach((period, pIdx) => {
    eduMembers.forEach((memberId, mIdx) => {
      const day = String(5 + mIdx).padStart(2, '0');
      const isPendingSample = period === '2026-11' && mIdx >= 4;
      contributions.push({
        id: `contrib-edu-${pIdx}-${mIdx}`,
        transactionId: `SIM-EDU-${txCounter++}`,
        groupId: 'grp-scholars',
        memberId,
        amount: 1500,
        transactionDate: `${period}-${day}`,
        contributionPeriod: period,
        paymentStatus: isPendingSample ? 'submitted' : 'verified',
        verificationStatus: isPendingSample ? 'pending' : 'verified',
        recordedBy: 'usr-org-01',
        notes: isPendingSample
          ? 'Awaiting organizer verification'
          : `Education circle cycle ${pIdx + 1}`,
        isSimulated: true,
        createdAt: `${period}-${day}T11:00:00Z`,
        updatedAt: `${period}-${day}T14:00:00Z`,
      });
    });
  });

  // Kochi Artisans: 4 members × 2 cycles × ₹2,000 = ₹16,000 verified
  ['2026-10', '2026-11'].forEach((period, pIdx) => {
    ['usr-org-01', 'usr-mem-03', 'usr-mem-05', 'usr-mem-07'].forEach((memberId, mIdx) => {
      const day = String(7 + mIdx).padStart(2, '0');
      contributions.push({
        id: `contrib-art-${pIdx}-${mIdx}`,
        transactionId: `SIM-ART-${txCounter++}`,
        groupId: 'grp-artisans',
        memberId,
        amount: 2000,
        transactionDate: `${period}-${day}`,
        contributionPeriod: period,
        paymentStatus: 'verified',
        verificationStatus: 'verified',
        recordedBy: 'usr-org-01',
        notes: `Artisans pool cycle ${pIdx + 1}`,
        isSimulated: true,
        createdAt: `${period}-${day}T09:30:00Z`,
        updatedAt: `${period}-${day}T13:00:00Z`,
      });
    });
  });

  const invitations: GroupInvitation[] = [
    {
      id: 'inv-01',
      groupId: 'grp-greenfield',
      invitedBy: 'usr-org-01',
      inviteeEmail: 'kavya.menon@example.org',
      inviteCode: 'KURI-GRN-2026',
      accepted: false,
      expiresAt: '2026-12-31T23:59:59Z',
      createdAt: '2026-11-01T10:00:00Z',
    },
  ];

  const announcements: GroupAnnouncement[] = [
    {
      id: 'ann-01',
      groupId: 'grp-greenfield',
      authorId: 'usr-org-01',
      title: '40% Milestone Achieved — ₹40,000 Verified',
      body: 'Thank you all 10 members for completing Cycle 4 (November 2026) on schedule. Every simulated entry has been cryptographically chained into the audit ledger.',
      createdAt: '2026-11-12T10:00:00Z',
    },
    {
      id: 'ann-02',
      groupId: 'grp-greenfield',
      authorId: 'usr-org-01',
      title: 'December 2026 Cycle Reminder',
      body: 'Cycle 5 simulated contribution recording opens on December 1st. Please inspect your individual receipt records beforehand.',
      createdAt: '2026-11-15T14:30:00Z',
    },
    {
      id: 'ann-03',
      groupId: 'grp-scholars',
      authorId: 'usr-org-01',
      title: 'November Pending Verifications',
      body: 'Two November simulated records are currently in Submitted state awaiting final organizer verification.',
      createdAt: '2026-11-14T09:00:00Z',
    },
  ];

  const notifications: NotificationItem[] = [
    {
      id: 'notif-01',
      userId: 'usr-org-01',
      groupId: 'grp-greenfield',
      title: 'New Membership Request',
      message: 'Priya Sankar requested to join Greenfield Community Savings using code KURI-GRN-2026.',
      category: 'membership',
      isRead: false,
      createdAt: '2026-11-14T16:10:00Z',
    },
    {
      id: 'notif-02',
      userId: 'usr-org-01',
      groupId: 'grp-scholars',
      title: 'Pending Verification Reminder',
      message: '2 simulated contributions in Malabar Scholars Education Circle require verification.',
      category: 'contribution',
      isRead: false,
      createdAt: '2026-11-15T08:30:00Z',
    },
    {
      id: 'notif-03',
      userId: 'usr-mem-01',
      groupId: 'grp-greenfield',
      title: 'Contribution Verified',
      message: 'Your November 2026 simulated contribution of ₹1,000 was verified and appended to the SHA-256 ledger.',
      category: 'contribution',
      isRead: false,
      createdAt: '2026-11-12T12:05:00Z',
    },
    {
      id: 'notif-04',
      userId: 'usr-mem-01',
      groupId: 'grp-greenfield',
      title: 'Upcoming Cycle Date',
      message: 'Cycle 5 (December 2026) target recording date for Greenfield Community Savings is Dec 10, 2026.',
      category: 'reminder',
      isRead: true,
      createdAt: '2026-11-10T09:00:00Z',
    },
    {
      id: 'notif-05',
      userId: 'usr-adm-01',
      groupId: 'grp-scholars',
      title: 'Escalated Dispute Pending Review',
      message: 'Dispute DSP-2026-02 regarding a transaction date discrepancy is marked for platform admin visibility.',
      category: 'dispute',
      isRead: false,
      createdAt: '2026-11-13T11:20:00Z',
    },
  ];

  const disputes: Dispute[] = [
    {
      id: 'dsp-01',
      groupId: 'grp-greenfield',
      contributionId: 'contrib-grn-3-1',
      reportedBy: 'usr-mem-01',
      category: 'Incorrect transaction date',
      description:
        'My November simulated contribution was recorded under 2026-11-03, whereas my personal note shows 2026-11-02. Requesting a ledger clarification note.',
      status: 'resolved',
      createdAt: '2026-11-06T09:15:00Z',
      updatedAt: '2026-11-07T16:00:00Z',
    },
    {
      id: 'dsp-02',
      groupId: 'grp-scholars',
      contributionId: 'contrib-edu-2-1',
      reportedBy: 'usr-mem-04',
      category: 'Missing contribution record',
      description:
        'A submitted simulated entry for November 2026 is still marked pending verification after 48 hours. Requesting review.',
      status: 'escalated',
      createdAt: '2026-11-13T10:45:00Z',
      updatedAt: '2026-11-13T11:20:00Z',
    },
  ];

  const disputeResponses: DisputeResponse[] = [
    {
      id: 'dspr-01',
      disputeId: 'dsp-01',
      responderId: 'usr-org-01',
      message:
        'Confirmed batch entry timestamp vs receipt date. Appended a clarifying audit event without mutating the original record.',
      actionTaken: 'Clarification Logged',
      createdAt: '2026-11-07T16:00:00Z',
    },
    {
      id: 'dspr-02',
      disputeId: 'dsp-02',
      responderId: 'usr-org-01',
      message: 'Escalating to Platform Administrator for dual-check on batch timestamps.',
      actionTaken: 'Escalated to Admin',
      createdAt: '2026-11-13T11:20:00Z',
    },
  ];

  // Build genuine SHA-256 hash-linked audit_events sequence
  const auditEvents: AuditEvent[] = [];
  let prev: AuditEvent | null = null;

  const pushAudit = async (params: {
    id: string;
    groupId: string | null;
    transactionReference: string;
    eventType: AuditEvent['eventType'];
    amount: number | null;
    details: string;
    actorId: string;
    timestamp: string;
  }) => {
    const ev = await createLinkedAuditEvent({
      ...params,
      previousEvent: prev,
    });
    auditEvents.push(ev);
    prev = ev;
  };

  await pushAudit({
    id: 'aud-001',
    groupId: 'grp-greenfield',
    transactionReference: 'GRP-GRN-INIT',
    eventType: 'GROUP_CREATED',
    amount: 100000,
    details: 'Created Greenfield Community Savings (Goal-Based Savings Pool)',
    actorId: 'usr-org-01',
    timestamp: '2026-07-20T09:00:00Z',
  });

  await pushAudit({
    id: 'aud-002',
    groupId: 'grp-scholars',
    transactionReference: 'GRP-EDU-INIT',
    eventType: 'GROUP_CREATED',
    amount: 150000,
    details: 'Created Malabar Scholars Education Circle (Goal-Based Savings Pool)',
    actorId: 'usr-org-01',
    timestamp: '2026-08-18T10:00:00Z',
  });

  await pushAudit({
    id: 'aud-003',
    groupId: 'grp-artisans',
    transactionReference: 'GRP-ART-INIT',
    eventType: 'GROUP_CREATED',
    amount: 80000,
    details: 'Created Kochi Artisans Equipment Pool (Goal-Based Savings Pool)',
    actorId: 'usr-org-01',
    timestamp: '2026-09-01T11:00:00Z',
  });

  // Link recent key verified contributions into the cryptographic audit stream
  const featuredAuditContribs = contributions.slice(30, 42);
  for (let i = 0; i < featuredAuditContribs.length; i++) {
    const c = featuredAuditContribs[i];
    const member = profiles.find((p) => p.id === c.memberId);
    await pushAudit({
      id: `aud-tx-${i + 1}`,
      groupId: c.groupId,
      transactionReference: c.transactionId,
      eventType:
        c.verificationStatus === 'verified'
          ? 'CONTRIBUTION_VERIFIED'
          : 'CONTRIBUTION_RECORDED',
      amount: c.amount,
      details: `${member?.fullName ?? c.memberId} · Period ${c.contributionPeriod} (${c.paymentStatus})`,
      actorId: c.recordedBy,
      timestamp: c.updatedAt,
    });
  }

  await pushAudit({
    id: 'aud-dsp-01',
    groupId: 'grp-greenfield',
    transactionReference: 'DSP-2026-01',
    eventType: 'DISPUTE_RESOLVED',
    amount: null,
    details: 'Dispute DSP-2026-01 clarified and resolved by Group Organizer',
    actorId: 'usr-org-01',
    timestamp: '2026-11-07T16:00:00Z',
  });

  await pushAudit({
    id: 'aud-dsp-02',
    groupId: 'grp-scholars',
    transactionReference: 'DSP-2026-02',
    eventType: 'DISPUTE_ESCALATED',
    amount: null,
    details: 'Dispute DSP-2026-02 escalated to Platform Administrator',
    actorId: 'usr-org-01',
    timestamp: '2026-11-13T11:20:00Z',
  });

  const activityLogs: UserActivityLog[] = [
    {
      id: 'act-01',
      userId: 'usr-org-01',
      action: 'Verified Cycle 4 Contributions',
      resourceType: 'contribution_records',
      resourceId: 'grp-greenfield',
      details: 'Verified 10 simulated entries totaling ₹10,000 for 2026-11',
      createdAt: '2026-11-12T12:00:00Z',
    },
    {
      id: 'act-02',
      userId: 'usr-mem-01',
      action: 'Inspected SHA-256 Ledger',
      resourceType: 'audit_events',
      resourceId: 'grp-greenfield',
      details: 'Ran full hash-chain integrity check (17/17 events valid)',
      createdAt: '2026-11-13T09:40:00Z',
    },
    {
      id: 'act-03',
      userId: 'usr-org-01',
      action: 'Escalated Dispute',
      resourceType: 'disputes',
      resourceId: 'dsp-02',
      details: 'Escalated DSP-2026-02 for Platform Administrator review',
      createdAt: '2026-11-13T11:20:00Z',
    },
    {
      id: 'act-04',
      userId: 'usr-mem-10',
      action: 'Submitted Join Request',
      resourceType: 'group_members',
      resourceId: 'grp-greenfield',
      details: 'Requested membership via invitation code KURI-GRN-2026',
      createdAt: '2026-11-14T16:10:00Z',
    },
  ];

  return {
    profiles,
    groups,
    groupMembers,
    invitations,
    goals,
    contributions,
    auditEvents,
    notifications,
    announcements,
    disputes,
    disputeResponses,
    activityLogs,
    platformSettings: {
      demonstrationNoticeEnabled: true,
      allowPublicDirectory: true,
      requireDualVerificationThreshold: 25000,
      maxMembersPerGroupLimit: 50,
      autoAuditVerificationIntervalMinutes: 15,
    },
    tamperedSnapshot: null,
  };
}
