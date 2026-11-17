import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { createLinkedAuditEvent, verifyAuditChain } from '@/src/lib/crypto';
import { buildInitialSeedData, DEMO_GROUP_IMAGES } from '@/src/lib/seedData';
import type {
  AuditEvent,
  AuditEventType,
  AuditVerificationReport,
  ContributionFrequency,
  ContributionRecord,
  DisputeCategory,
  DisputeStatus,
  GroupVisibility,
  KuriDatabaseState,
  NotificationPreferences,
  PageRoute,
  PlatformSettings,
  Profile,
  SavingsGroup,
  SavingsPurpose,
  UserRole,
} from '@/src/types/kuri';

const STORAGE_KEY = 'kuricircle_demo_db_v2';
const SESSION_KEY = 'kuricircle_session_user_id_v2';
const PREFS_KEY = 'kuricircle_notif_prefs_v2';

interface CreateGroupInput {
  name: string;
  description: string;
  purpose: SavingsPurpose;
  imageUrl?: string;
  maxMembers: number;
  targetAmount: number;
  frequency: ContributionFrequency;
  proposedContribution: number;
  startDate: string;
  endDate: string;
  rules: string;
  visibility: GroupVisibility;
  confirmedNotChitFund: boolean;
}

interface RecordContributionInput {
  groupId: string;
  memberId: string;
  amount: number;
  transactionDate: string;
  contributionPeriod: string;
  notes?: string;
  autoVerify?: boolean;
}

interface KuriContextValue {
  isReady: boolean;
  db: KuriDatabaseState;
  currentUser: Profile | null;
  activeRoute: PageRoute;
  selectedGroupId: string | null;
  selectedTransactionId: string | null;
  searchQuery: string;
  verificationReport: AuditVerificationReport | null;
  notifPrefs: NotificationPreferences;
  navigate: (
    route: PageRoute,
    options?: { groupId?: string | null; transactionId?: string | null }
  ) => void;
  setSearchQuery: (q: string) => void;
  setNotifPrefs: (prefs: NotificationPreferences) => void;
  // Auth
  login: (email: string, password: string) => { ok: boolean; error?: string };
  register: (input: {
    fullName: string;
    email: string;
    phone: string;
    city: string;
    role: 'organizer' | 'member';
    password: string;
  }) => { ok: boolean; error?: string };
  resetPassword: (email: string) => { ok: boolean; message: string };
  switchDemoUser: (userId: string) => void;
  logout: () => void;
  updateProfile: (patch: Partial<Pick<Profile, 'fullName' | 'phone' | 'city' | 'avatarUrl'>>) => void;
  // Groups & Members
  createGroup: (input: CreateGroupInput) => { ok: boolean; groupId?: string; error?: string };
  joinGroupByCode: (inviteCode: string) => { ok: boolean; error?: string };
  handleMembershipRequest: (
    memberRecordId: string,
    decision: 'active' | 'rejected'
  ) => void;
  updateMemberPermissions: (
    memberRecordId: string,
    patch: { canViewPeerTotals?: boolean; canRecordDrafts?: boolean; status?: 'active' | 'suspended' }
  ) => void;
  inviteMemberByEmail: (groupId: string, email: string) => { ok: boolean; error?: string };
  postAnnouncement: (groupId: string, title: string, body: string) => void;
  // Contributions
  recordContribution: (
    input: RecordContributionInput
  ) => Promise<{ ok: boolean; record?: ContributionRecord; error?: string }>;
  verifyOrRejectContribution: (
    contributionId: string,
    decision: 'verified' | 'rejected'
  ) => Promise<void>;
  // Audit & Verification
  runAuditVerification: () => Promise<AuditVerificationReport>;
  simulateTamperOnEvent: (eventId: string) => Promise<void>;
  restoreAuditChain: () => Promise<void>;
  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  // Disputes
  submitDispute: (input: {
    groupId: string;
    contributionId?: string;
    category: DisputeCategory;
    description: string;
  }) => Promise<void>;
  respondDispute: (
    disputeId: string,
    message: string,
    newStatus?: DisputeStatus,
    actionTaken?: string
  ) => Promise<void>;
  // Admin
  toggleUserActive: (userId: string) => void;
  changeUserRole: (userId: string, role: UserRole) => void;
  toggleGroupFlag: (groupId: string, reason?: string) => void;
  updatePlatformSettings: (patch: Partial<PlatformSettings>) => void;
  resetDemoEnvironment: () => Promise<void>;
  // Authoritative Calculators
  getGroupTotalSaved: (groupId: string) => number;
  getGroupPendingTotal: (groupId: string) => number;
  getGroupMembersList: (groupId: string) => Array<{
    membership: KuriDatabaseState['groupMembers'][number];
    profile: Profile;
    totalVerified: number;
    totalPending: number;
  }>;
  getVisibleGroupsForUser: (user: Profile | null) => SavingsGroup[];
}

const KuriContext = createContext<KuriContextValue | null>(null);

const PUBLIC_ROUTES: PageRoute[] = [
  'landing',
  'about',
  'features',
  'how-it-works',
  'security',
  'login',
  'register',
  'reset-password',
];

const ADMIN_ROUTES: PageRoute[] = [
  'admin-overview',
  'admin-users',
  'admin-groups',
  'admin-disputes',
  'admin-activity',
];

export const KuriProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isReady, setIsReady] = useState(false);
  const [db, setDb] = useState<KuriDatabaseState | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeRoute, setActiveRoute] = useState<PageRoute>('landing');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [verificationReport, setVerificationReport] =
    useState<AuditVerificationReport | null>(null);
  const [notifPrefs, setNotifPrefsState] = useState<NotificationPreferences>(() => {
    try {
      const saved = localStorage.getItem(PREFS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      upcomingReminders: true,
      contributionUpdates: true,
      disputeAlerts: true,
      groupAnnouncements: true,
    };
  });

  useEffect(() => {
    let mounted = true;
    async function init() {
      let initialDb: KuriDatabaseState | null = null;
      try {
        const res = await fetch('/api/state');
        if (res.ok) {
          const data = (await res.json()) as { state?: KuriDatabaseState };
          if (data?.state && Array.isArray(data.state.profiles)) {
            initialDb = data.state;
          }
        }
      } catch {
        // fallback to localStorage if static host without API
      }

      if (!initialDb) {
        try {
          const cached = localStorage.getItem(STORAGE_KEY);
          if (cached) {
            initialDb = JSON.parse(cached) as KuriDatabaseState;
          }
        } catch {
          initialDb = null;
        }
      }

      if (!initialDb || !initialDb.profiles?.length) {
        initialDb = await buildInitialSeedData();
      }

      const savedSession = localStorage.getItem(SESSION_KEY);
      const userExists = savedSession
        ? initialDb.profiles.some((p) => p.id === savedSession && p.isActive)
        : false;

      const report = await verifyAuditChain(initialDb.auditEvents);

      if (!mounted) return;
      setDb(initialDb);
      setVerificationReport(report);
      if (userExists && savedSession) {
        setCurrentUserId(savedSession);
        setActiveRoute('dashboard');
      }
      setIsReady(true);
    }
    init();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (db && isReady) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
      } catch {
        // storage quota fallback
      }
      fetch('/api/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: db }),
      }).catch(() => {
        // silent offline/static fallback
      });
    }
  }, [db, isReady]);

  const currentUser = useMemo(() => {
    if (!db || !currentUserId) return null;
    return db.profiles.find((p) => p.id === currentUserId) ?? null;
  }, [db, currentUserId]);

  const setNotifPrefs = (prefs: NotificationPreferences) => {
    setNotifPrefsState(prefs);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // ignore
    }
    toast.success('Notification preferences saved');
  };

  const navigate: KuriContextValue['navigate'] = (route, options) => {
    if (!PUBLIC_ROUTES.includes(route) && !currentUser) {
      setActiveRoute('login');
      toast.info('Please sign in to access your KuriCircle workspace.');
      return;
    }
    if (ADMIN_ROUTES.includes(route) && currentUser?.role !== 'platform_admin') {
      toast.error('Platform Administrator privileges are required for this view.');
      return;
    }
    if (options?.groupId !== undefined) setSelectedGroupId(options.groupId);
    if (options?.transactionId !== undefined) {
      setSelectedTransactionId(options.transactionId);
    }
    setActiveRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const appendAuditAndVerify = async (
    prevDb: KuriDatabaseState,
    params: {
      groupId: string | null;
      transactionReference: string;
      eventType: AuditEventType;
      amount: number | null;
      details: string;
      actorId: string;
    }
  ): Promise<{ events: AuditEvent[]; report: AuditVerificationReport }> => {
    const ordered = [...prevDb.auditEvents].sort(
      (a, b) => a.sequenceNumber - b.sequenceNumber
    );
    const lastEvent = ordered[ordered.length - 1] ?? null;
    const newEvent = await createLinkedAuditEvent({
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      previousEvent: lastEvent,
      groupId: params.groupId,
      transactionReference: params.transactionReference,
      eventType: params.eventType,
      amount: params.amount,
      details: params.details,
      actorId: params.actorId,
      timestamp: new Date().toISOString(),
    });
    const nextEvents = [...ordered, newEvent];
    const report = await verifyAuditChain(nextEvents);
    return { events: nextEvents, report };
  };

  const login = (email: string, password: string) => {
    if (!db) return { ok: false, error: 'Database initializing' };
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password || password.length < 4) {
      return { ok: false, error: 'Enter a valid email and password (min 4 chars).' };
    }
    const found = db.profiles.find((p) => p.email.toLowerCase() === cleanEmail);
    if (!found) {
      return { ok: false, error: 'No account found with that email address.' };
    }
    if (!found.isActive) {
      return { ok: false, error: 'This account has been suspended by an administrator.' };
    }
    setCurrentUserId(found.id);
    localStorage.setItem(SESSION_KEY, found.id);
    setActiveRoute(found.role === 'platform_admin' ? 'admin-overview' : 'dashboard');
    toast.success(`Welcome back, ${found.fullName}`);
    return { ok: true };
  };

  const register: KuriContextValue['register'] = (input) => {
    if (!db) return { ok: false, error: 'Initializing...' };
    const email = input.email.trim().toLowerCase();
    if (!input.fullName.trim() || !email.includes('@') || input.password.length < 6) {
      return {
        ok: false,
        error: 'Provide full name, valid email, and a password of at least 6 characters.',
      };
    }
    if (db.profiles.some((p) => p.email.toLowerCase() === email)) {
      return { ok: false, error: 'An account with this email already exists.' };
    }
    const now = new Date().toISOString();
    const newProfile: Profile = {
      id: `usr-${Date.now()}`,
      fullName: input.fullName.trim(),
      email,
      phone: input.phone.trim() || '+91 90000 00000',
      avatarUrl: '',
      role: input.role,
      isActive: true,
      city: input.city.trim() || 'Kochi, Kerala',
      createdAt: now,
      updatedAt: now,
    };

    setDb((prev) =>
      prev
        ? {
            ...prev,
            profiles: [newProfile, ...prev.profiles],
            activityLogs: [
              {
                id: `act-${Date.now()}`,
                userId: newProfile.id,
                action: 'Account Registered',
                resourceType: 'profiles',
                resourceId: newProfile.id,
                details: `Registered as ${newProfile.role}`,
                createdAt: now,
              },
              ...prev.activityLogs,
            ],
          }
        : prev
    );

    setCurrentUserId(newProfile.id);
    localStorage.setItem(SESSION_KEY, newProfile.id);
    setActiveRoute('dashboard');
    toast.success('Account created! Welcome to KuriCircle.');
    return { ok: true };
  };

  const resetPassword = (email: string) => {
    if (!email.includes('@')) {
      return { ok: false, message: 'Please enter a valid email address.' };
    }
    return {
      ok: true,
      message: `If an account exists for ${email}, a simulated password reset link has been logged in this demo environment.`,
    };
  };

  const switchDemoUser = (userId: string) => {
    if (!db) return;
    const target = db.profiles.find((p) => p.id === userId);
    if (!target) return;
    setCurrentUserId(target.id);
    localStorage.setItem(SESSION_KEY, target.id);
    setActiveRoute(target.role === 'platform_admin' ? 'admin-overview' : 'dashboard');
    toast.success(`Switched demo session to ${target.fullName} (${target.role.replace('_', ' ')})`);
  };

  const logout = () => {
    setCurrentUserId(null);
    localStorage.removeItem(SESSION_KEY);
    setActiveRoute('landing');
    toast.info('Signed out of KuriCircle.');
  };

  const updateProfile: KuriContextValue['updateProfile'] = (patch) => {
    if (!db || !currentUser) return;
    const now = new Date().toISOString();
    setDb((prev) =>
      prev
        ? {
            ...prev,
            profiles: prev.profiles.map((p) =>
              p.id === currentUser.id ? { ...p, ...patch, updatedAt: now } : p
            ),
          }
        : prev
    );
    toast.success('Profile updated');
  };

  const createGroup: KuriContextValue['createGroup'] = (input) => {
    if (!db || !currentUser) return { ok: false, error: 'Authentication required' };
    if (currentUser.role !== 'organizer' && currentUser.role !== 'platform_admin') {
      return {
        ok: false,
        error: 'Only Group Organizers or Platform Administrators can create savings groups.',
      };
    }
    if (!input.confirmedNotChitFund) {
      return {
        ok: false,
        error:
          'You must acknowledge that this is a simulated goal-based coordination group, not a regulated rotating chit arrangement.',
      };
    }
    if (!input.name.trim() || input.targetAmount <= 0 || input.proposedContribution <= 0) {
      return { ok: false, error: 'Please complete all required financial target fields.' };
    }

    const now = new Date().toISOString();
    const id = `grp-${Date.now()}`;
    const codePrefix = input.name
      .replace(/[^a-zA-Z]/g, '')
      .slice(0, 3)
      .toUpperCase()
      .padEnd(3, 'X');
    const inviteCode = `KURI-${codePrefix}-${Math.floor(1000 + Math.random() * 8999)}`;

    const newGroup: SavingsGroup = {
      id,
      organizerId: currentUser.id,
      name: input.name.trim(),
      description: input.description.trim(),
      purpose: input.purpose,
      imageUrl: input.imageUrl || DEMO_GROUP_IMAGES.greenfield,
      arrangementType: 'goal_based_savings',
      maxMembers: Math.min(
        input.maxMembers,
        db.platformSettings.maxMembersPerGroupLimit
      ),
      targetAmount: input.targetAmount,
      frequency: input.frequency,
      proposedContribution: input.proposedContribution,
      startDate: input.startDate,
      endDate: input.endDate,
      rules: input.rules.trim(),
      visibility: input.visibility,
      inviteCode,
      isFlagged: false,
      createdAt: now,
      updatedAt: now,
    };

    const organizerMembership = {
      id: `gm-${Date.now()}`,
      groupId: id,
      userId: currentUser.id,
      status: 'active' as const,
      canViewPeerTotals: true,
      canRecordDrafts: true,
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    const newGoal = {
      id: `goal-${Date.now()}`,
      groupId: id,
      title: `${newGroup.name} Savings Target`,
      targetAmount: newGroup.targetAmount,
      targetDate: newGroup.endDate,
      milestones: [25, 50, 75, 100],
      createdAt: now,
      updatedAt: now,
    };

    // Append audit event asynchronously
    appendAuditAndVerify(db, {
      groupId: id,
      transactionReference: inviteCode,
      eventType: 'GROUP_CREATED',
      amount: newGroup.targetAmount,
      details: `Created goal-based savings group "${newGroup.name}"`,
      actorId: currentUser.id,
    }).then(({ events, report }) => {
      setDb((prev) =>
        prev
          ? {
              ...prev,
              groups: [newGroup, ...prev.groups],
              groupMembers: [organizerMembership, ...prev.groupMembers],
              goals: [newGoal, ...prev.goals],
              auditEvents: events,
              activityLogs: [
                {
                  id: `act-${Date.now()}`,
                  userId: currentUser.id,
                  action: 'Created Savings Group',
                  resourceType: 'savings_groups',
                  resourceId: id,
                  details: `${newGroup.name} (${inviteCode})`,
                  createdAt: now,
                },
                ...prev.activityLogs,
              ],
            }
          : prev
      );
      setVerificationReport(report);
    });

    setSelectedGroupId(id);
    toast.success(`Savings group created! Invite code: ${inviteCode}`);
    return { ok: true, groupId: id };
  };

  const joinGroupByCode = (inviteCode: string) => {
    if (!db || !currentUser) return { ok: false, error: 'Sign in required' };
    const code = inviteCode.trim().toUpperCase();
    const group = db.groups.find((g) => g.inviteCode.toUpperCase() === code);
    if (!group) {
      return { ok: false, error: 'Invalid invitation code. Check the code and try again.' };
    }
    const existing = db.groupMembers.find(
      (gm) => gm.groupId === group.id && gm.userId === currentUser.id
    );
    if (existing) {
      return {
        ok: false,
        error: `You already have a "${existing.status}" membership record for ${group.name}.`,
      };
    }
    const activeCount = db.groupMembers.filter(
      (gm) => gm.groupId === group.id && gm.status === 'active'
    ).length;
    if (activeCount >= group.maxMembers) {
      return { ok: false, error: 'This group has reached its maximum member limit.' };
    }

    const now = new Date().toISOString();
    const newMembership = {
      id: `gm-${Date.now()}`,
      groupId: group.id,
      userId: currentUser.id,
      status: 'pending' as const,
      canViewPeerTotals: true,
      canRecordDrafts: false,
      joinedAt: '',
      createdAt: now,
      updatedAt: now,
    };

    const organizerNotif = {
      id: `notif-${Date.now()}`,
      userId: group.organizerId,
      groupId: group.id,
      title: 'Membership Request Received',
      message: `${currentUser.fullName} requested to join ${group.name} using code ${code}.`,
      category: 'membership' as const,
      isRead: false,
      createdAt: now,
    };

    appendAuditAndVerify(db, {
      groupId: group.id,
      transactionReference: code,
      eventType: 'MEMBER_JOINED',
      amount: null,
      details: `${currentUser.fullName} submitted a join request via invite code`,
      actorId: currentUser.id,
    }).then(({ events, report }) => {
      setDb((prev) =>
        prev
          ? {
              ...prev,
              groupMembers: [...prev.groupMembers, newMembership],
              notifications: [organizerNotif, ...prev.notifications],
              auditEvents: events,
            }
          : prev
      );
      setVerificationReport(report);
    });

    toast.success(`Join request sent to ${group.name}'s organizer!`);
    return { ok: true };
  };

  const handleMembershipRequest = (
    memberRecordId: string,
    decision: 'active' | 'rejected'
  ) => {
    if (!db || !currentUser) return;
    const record = db.groupMembers.find((gm) => gm.id === memberRecordId);
    if (!record) return;
    const group = db.groups.find((g) => g.id === record.groupId);
    if (
      !group ||
      (group.organizerId !== currentUser.id && currentUser.role !== 'platform_admin')
    ) {
      toast.error('Only the group organizer can approve or reject requests.');
      return;
    }

    const now = new Date().toISOString();
    const memberProfile = db.profiles.find((p) => p.id === record.userId);

    appendAuditAndVerify(db, {
      groupId: group.id,
      transactionReference: `MEM-${record.id.slice(-6).toUpperCase()}`,
      eventType: 'MEMBER_APPROVED',
      amount: null,
      details: `${memberProfile?.fullName ?? record.userId} membership marked "${decision}"`,
      actorId: currentUser.id,
    }).then(({ events, report }) => {
      setDb((prev) =>
        prev
          ? {
              ...prev,
              groupMembers: prev.groupMembers.map((gm) =>
                gm.id === memberRecordId
                  ? {
                      ...gm,
                      status: decision,
                      joinedAt: decision === 'active' ? now : gm.joinedAt,
                      updatedAt: now,
                    }
                  : gm
              ),
              notifications: [
                {
                  id: `notif-${Date.now()}`,
                  userId: record.userId,
                  groupId: group.id,
                  title:
                    decision === 'active'
                      ? 'Membership Approved'
                      : 'Membership Request Declined',
                  message:
                    decision === 'active'
                      ? `You are now an active member of ${group.name}.`
                      : `Your request to join ${group.name} was declined by the organizer.`,
                  category: 'membership',
                  isRead: false,
                  createdAt: now,
                },
                ...prev.notifications,
              ],
              auditEvents: events,
            }
          : prev
      );
      setVerificationReport(report);
    });

    toast.success(
      decision === 'active' ? 'Member approved and added to group' : 'Request rejected'
    );
  };

  const updateMemberPermissions: KuriContextValue['updateMemberPermissions'] = (
    memberRecordId,
    patch
  ) => {
    if (!db || !currentUser) return;
    const record = db.groupMembers.find((gm) => gm.id === memberRecordId);
    if (!record) return;
    const group = db.groups.find((g) => g.id === record.groupId);
    if (
      !group ||
      (group.organizerId !== currentUser.id && currentUser.role !== 'platform_admin')
    ) {
      toast.error('Insufficient permissions to modify member access.');
      return;
    }
    const now = new Date().toISOString();
    setDb((prev) =>
      prev
        ? {
            ...prev,
            groupMembers: prev.groupMembers.map((gm) =>
              gm.id === memberRecordId ? { ...gm, ...patch, updatedAt: now } : gm
            ),
          }
        : prev
    );
    toast.success('Member permissions updated');
  };

  const inviteMemberByEmail = (groupId: string, email: string) => {
    if (!db || !currentUser) return { ok: false, error: 'Auth required' };
    const clean = email.trim().toLowerCase();
    if (!clean.includes('@')) return { ok: false, error: 'Enter a valid email address.' };
    const group = db.groups.find((g) => g.id === groupId);
    if (!group) return { ok: false, error: 'Group not found' };

    const now = new Date().toISOString();
    const inv = {
      id: `inv-${Date.now()}`,
      groupId,
      invitedBy: currentUser.id,
      inviteeEmail: clean,
      inviteCode: group.inviteCode,
      accepted: false,
      expiresAt: new Date(Date.now() + 14 * 86400000).toISOString(),
      createdAt: now,
    };

    setDb((prev) =>
      prev ? { ...prev, invitations: [inv, ...prev.invitations] } : prev
    );
    toast.success(`Invitation code ${group.inviteCode} logged for ${clean}`);
    return { ok: true };
  };

  const postAnnouncement = (groupId: string, title: string, body: string) => {
    if (!db || !currentUser) return;
    const group = db.groups.find((g) => g.id === groupId);
    if (!group) return;
    if (group.organizerId !== currentUser.id && currentUser.role !== 'platform_admin') {
      toast.error('Only group organizers can post announcements.');
      return;
    }
    const now = new Date().toISOString();
    const activeMembers = db.groupMembers.filter(
      (gm) => gm.groupId === groupId && gm.status === 'active' && gm.userId !== currentUser.id
    );

    appendAuditAndVerify(db, {
      groupId,
      transactionReference: `ANN-${Date.now().toString().slice(-5)}`,
      eventType: 'ANNOUNCEMENT_POSTED',
      amount: null,
      details: `Announcement posted: "${title.trim()}"`,
      actorId: currentUser.id,
    }).then(({ events, report }) => {
      setDb((prev) =>
        prev
          ? {
              ...prev,
              announcements: [
                {
                  id: `ann-${Date.now()}`,
                  groupId,
                  authorId: currentUser.id,
                  title: title.trim(),
                  body: body.trim(),
                  createdAt: now,
                },
                ...prev.announcements,
              ],
              notifications: [
                ...activeMembers.map((m) => ({
                  id: `notif-${Date.now()}-${m.userId}`,
                  userId: m.userId,
                  groupId,
                  title: `${group.name}: ${title.trim()}`,
                  message: body.trim().slice(0, 120),
                  category: 'announcement' as const,
                  isRead: false,
                  createdAt: now,
                })),
                ...prev.notifications,
              ],
              auditEvents: events,
            }
          : prev
      );
      setVerificationReport(report);
    });
    toast.success('Announcement published to group members');
  };

  const recordContribution: KuriContextValue['recordContribution'] = async (
    input
  ) => {
    if (!db || !currentUser) return { ok: false, error: 'Authentication required' };
    const group = db.groups.find((g) => g.id === input.groupId);
    if (!group) return { ok: false, error: 'Group not found' };

    const isOrganizer =
      group.organizerId === currentUser.id || currentUser.role === 'platform_admin';
    const membership = db.groupMembers.find(
      (gm) =>
        gm.groupId === input.groupId &&
        gm.userId === input.memberId &&
        gm.status === 'active'
    );
    if (!membership) {
      return {
        ok: false,
        error: 'Selected user is not an active member of this group.',
      };
    }
    if (!isOrganizer && input.memberId !== currentUser.id) {
      return {
        ok: false,
        error: 'Members can only submit their own simulated contribution records.',
      };
    }

    // Idempotency check: prevent duplicate record for same group + member + period
    const duplicate = db.contributions.find(
      (c) =>
        c.groupId === input.groupId &&
        c.memberId === input.memberId &&
        c.contributionPeriod === input.contributionPeriod &&
        c.paymentStatus !== 'rejected'
    );
    if (duplicate) {
      return {
        ok: false,
        error: `Duplicate blocked (idempotency check): A simulated contribution (${duplicate.transactionId}) already exists for period ${input.contributionPeriod}.`,
      };
    }

    if (input.amount <= 0) {
      return { ok: false, error: 'Simulated amount must be greater than zero.' };
    }

    const now = new Date().toISOString();
    const shouldVerify = Boolean(isOrganizer && (input.autoVerify ?? true));
    const txId = `SIM-${Date.now().toString().slice(-6)}`;
    const newRecord: ContributionRecord = {
      id: `contrib-${Date.now()}`,
      transactionId: txId,
      groupId: input.groupId,
      memberId: input.memberId,
      amount: Number(input.amount),
      transactionDate: input.transactionDate,
      contributionPeriod: input.contributionPeriod,
      paymentStatus: shouldVerify ? 'verified' : 'submitted',
      verificationStatus: shouldVerify ? 'verified' : 'pending',
      recordedBy: currentUser.id,
      notes: input.notes?.trim() || 'Simulated demonstration contribution',
      isSimulated: true,
      createdAt: now,
      updatedAt: now,
    };

    const memberProfile = db.profiles.find((p) => p.id === input.memberId);

    const { events, report } = await appendAuditAndVerify(db, {
      groupId: input.groupId,
      transactionReference: txId,
      eventType: shouldVerify ? 'CONTRIBUTION_VERIFIED' : 'CONTRIBUTION_RECORDED',
      amount: newRecord.amount,
      details: `${memberProfile?.fullName ?? input.memberId} · Period ${input.contributionPeriod} (${newRecord.paymentStatus})`,
      actorId: currentUser.id,
    });

    setDb((prev) =>
      prev
        ? {
            ...prev,
            contributions: [newRecord, ...prev.contributions],
            auditEvents: events,
            notifications: [
              {
                id: `notif-${Date.now()}`,
                userId: input.memberId,
                groupId: input.groupId,
                title: shouldVerify
                  ? 'Simulated Contribution Verified'
                  : 'Simulated Contribution Submitted',
                message: `${txId}: ₹${newRecord.amount.toLocaleString('en-IN')} for ${input.contributionPeriod} in ${group.name}.`,
                category: 'contribution',
                isRead: false,
                createdAt: now,
              },
              ...prev.notifications,
            ],
            activityLogs: [
              {
                id: `act-${Date.now()}`,
                userId: currentUser.id,
                action: shouldVerify
                  ? 'Recorded & Verified Contribution'
                  : 'Submitted Contribution',
                resourceType: 'contribution_records',
                resourceId: txId,
                details: `₹${newRecord.amount} for ${memberProfile?.fullName ?? input.memberId}`,
                createdAt: now,
              },
              ...prev.activityLogs,
            ],
          }
        : prev
    );
    setVerificationReport(report);
    toast.success(`Contribution ${txId} recorded and hashed into audit ledger`);
    return { ok: true, record: newRecord };
  };

  const verifyOrRejectContribution = async (
    contributionId: string,
    decision: 'verified' | 'rejected'
  ) => {
    if (!db || !currentUser) return;
    const record = db.contributions.find((c) => c.id === contributionId);
    if (!record) return;
    const group = db.groups.find((g) => g.id === record.groupId);
    if (
      !group ||
      (group.organizerId !== currentUser.id && currentUser.role !== 'platform_admin')
    ) {
      toast.error('Only the group organizer can verify or reject records.');
      return;
    }

    const now = new Date().toISOString();
    const memberProfile = db.profiles.find((p) => p.id === record.memberId);

    const { events, report } = await appendAuditAndVerify(db, {
      groupId: record.groupId,
      transactionReference: record.transactionId,
      eventType:
        decision === 'verified' ? 'CONTRIBUTION_VERIFIED' : 'CONTRIBUTION_REJECTED',
      amount: record.amount,
      details: `${memberProfile?.fullName ?? record.memberId} · ${record.contributionPeriod} marked ${decision}`,
      actorId: currentUser.id,
    });

    setDb((prev) =>
      prev
        ? {
            ...prev,
            contributions: prev.contributions.map((c) =>
              c.id === contributionId
                ? {
                    ...c,
                    paymentStatus: decision,
                    verificationStatus: decision,
                    updatedAt: now,
                  }
                : c
            ),
            auditEvents: events,
            notifications: [
              {
                id: `notif-${Date.now()}`,
                userId: record.memberId,
                groupId: record.groupId,
                title:
                  decision === 'verified'
                    ? 'Contribution Verified'
                    : 'Contribution Rejected',
                message: `Record ${record.transactionId} (₹${record.amount.toLocaleString('en-IN')}) was ${decision} by ${currentUser.fullName}.`,
                category: 'contribution',
                isRead: false,
                createdAt: now,
              },
              ...prev.notifications,
            ],
          }
        : prev
    );
    setVerificationReport(report);
    toast.success(`Transaction ${record.transactionId} marked ${decision}`);
  };

  const runAuditVerification = async () => {
    if (!db) {
      return {
        verifiedAt: new Date().toISOString(),
        totalEvents: 0,
        validEvents: 0,
        brokenEvents: 0,
        isChainIntact: false,
        firstBrokenEventId: null,
        items: [],
      };
    }
    const report = await verifyAuditChain(db.auditEvents);
    setVerificationReport(report);
    if (report.isChainIntact) {
      toast.success(
        `SHA-256 verification passed (${report.validEvents}/${report.totalEvents} events intact)`
      );
    } else {
      toast.error(
        `Integrity breach detected! ${report.brokenEvents} event(s) failed SHA-256 verification.`
      );
    }
    return report;
  };

  const simulateTamperOnEvent = async (eventId: string) => {
    if (!db) return;
    const snapshot = db.tamperedSnapshot ?? [...db.auditEvents];
    const tamperedEvents = db.auditEvents.map((ev) => {
      if (ev.id !== eventId) return ev;
      const originalAmt = ev.amount ?? 1000;
      return {
        ...ev,
        amount: originalAmt + 5000,
        details: `${ev.details} [SIMULATED UNAUTHORIZED EDIT: +₹5,000]`,
      };
    });

    const report = await verifyAuditChain(tamperedEvents);
    setDb((prev) =>
      prev
        ? {
            ...prev,
            tamperedSnapshot: snapshot,
            auditEvents: tamperedEvents,
          }
        : prev
    );
    setVerificationReport(report);
    toast.error(
      'Simulated tampering applied! Recomputed SHA-256 hash no longer matches stored event hash.'
    );
  };

  const restoreAuditChain = async () => {
    if (!db || !db.tamperedSnapshot) return;
    const restored = [...db.tamperedSnapshot];
    const report = await verifyAuditChain(restored);
    setDb((prev) =>
      prev
        ? {
            ...prev,
            auditEvents: restored,
            tamperedSnapshot: null,
          }
        : prev
    );
    setVerificationReport(report);
    toast.success('Clean cryptographic ledger restored and verified.');
  };

  const markNotificationRead = (id: string) => {
    setDb((prev) =>
      prev
        ? {
            ...prev,
            notifications: prev.notifications.map((n) =>
              n.id === id ? { ...n, isRead: true } : n
            ),
          }
        : prev
    );
  };

  const markAllNotificationsRead = () => {
    if (!currentUser) return;
    setDb((prev) =>
      prev
        ? {
            ...prev,
            notifications: prev.notifications.map((n) =>
              n.userId === currentUser.id ? { ...n, isRead: true } : n
            ),
          }
        : prev
    );
    toast.success('All notifications marked as read');
  };

  const submitDispute: KuriContextValue['submitDispute'] = async (input) => {
    if (!db || !currentUser) return;
    const group = db.groups.find((g) => g.id === input.groupId);
    if (!group) return;
    const now = new Date().toISOString();
    const id = `dsp-${Date.now()}`;
    const ref = `DSP-${Date.now().toString().slice(-5)}`;

    const { events, report } = await appendAuditAndVerify(db, {
      groupId: input.groupId,
      transactionReference: ref,
      eventType: 'DISPUTE_OPENED',
      amount: null,
      details: `${input.category} raised by ${currentUser.fullName}`,
      actorId: currentUser.id,
    });

    setDb((prev) =>
      prev
        ? {
            ...prev,
            disputes: [
              {
                id,
                groupId: input.groupId,
                contributionId: input.contributionId || undefined,
                reportedBy: currentUser.id,
                category: input.category,
                description: input.description.trim(),
                status: 'open',
                createdAt: now,
                updatedAt: now,
              },
              ...prev.disputes,
            ],
            notifications: [
              {
                id: `notif-${Date.now()}`,
                userId: group.organizerId,
                groupId: group.id,
                title: `New Dispute Filed (${input.category})`,
                message: `${currentUser.fullName} raised a discrepancy report in ${group.name}.`,
                category: 'dispute',
                isRead: false,
                createdAt: now,
              },
              ...prev.notifications,
            ],
            auditEvents: events,
          }
        : prev
    );
    setVerificationReport(report);
    toast.success('Dispute submitted and logged in the audit ledger');
  };

  const respondDispute: KuriContextValue['respondDispute'] = async (
    disputeId,
    message,
    newStatus,
    actionTaken
  ) => {
    if (!db || !currentUser) return;
    const dispute = db.disputes.find((d) => d.id === disputeId);
    if (!dispute) return;
    const now = new Date().toISOString();
    const resolvedStatus = newStatus ?? dispute.status;

    const eventType: AuditEventType =
      resolvedStatus === 'escalated'
        ? 'DISPUTE_ESCALATED'
        : resolvedStatus === 'resolved' || resolvedStatus === 'dismissed'
        ? 'DISPUTE_RESOLVED'
        : 'DISPUTE_RESPONDED';

    const { events, report } = await appendAuditAndVerify(db, {
      groupId: dispute.groupId,
      transactionReference: dispute.id.toUpperCase(),
      eventType,
      amount: null,
      details: `${actionTaken || 'Response'}: ${message.slice(0, 90)}`,
      actorId: currentUser.id,
    });

    setDb((prev) =>
      prev
        ? {
            ...prev,
            disputes: prev.disputes.map((d) =>
              d.id === disputeId
                ? { ...d, status: resolvedStatus, updatedAt: now }
                : d
            ),
            disputeResponses: [
              ...prev.disputeResponses,
              {
                id: `dspr-${Date.now()}`,
                disputeId,
                responderId: currentUser.id,
                message: message.trim(),
                actionTaken,
                createdAt: now,
              },
            ],
            notifications: [
              {
                id: `notif-${Date.now()}`,
                userId: dispute.reportedBy,
                groupId: dispute.groupId,
                title: `Dispute Updated (${resolvedStatus.replace('_', ' ')})`,
                message: `${currentUser.fullName} responded: ${message.trim().slice(0, 90)}`,
                category: 'dispute',
                isRead: false,
                createdAt: now,
              },
              ...prev.notifications,
            ],
            auditEvents: events,
          }
        : prev
    );
    setVerificationReport(report);
    toast.success('Dispute updated and recorded in SHA-256 audit log');
  };

  const toggleUserActive = (userId: string) => {
    if (!db || currentUser?.role !== 'platform_admin') return;
    if (userId === currentUser.id) {
      toast.error('Cannot suspend your own active admin session.');
      return;
    }
    setDb((prev) =>
      prev
        ? {
            ...prev,
            profiles: prev.profiles.map((p) =>
              p.id === userId ? { ...p, isActive: !p.isActive } : p
            ),
          }
        : prev
    );
    toast.success('User account status updated');
  };

  const changeUserRole = (userId: string, role: UserRole) => {
    if (!db) return;
    if (
      currentUser?.role !== 'platform_admin' &&
      currentUser?.id !== userId
    ) {
      return;
    }
    setDb((prev) =>
      prev
        ? {
            ...prev,
            profiles: prev.profiles.map((p) =>
              p.id === userId ? { ...p, role } : p
            ),
          }
        : prev
    );
    toast.success(`Role updated to ${role.replace('_', ' ')}`);
  };

  const toggleGroupFlag = (groupId: string, reason?: string) => {
    if (!db || !currentUser) return;
    if (currentUser.role !== 'platform_admin' && currentUser.role !== 'organizer') {
      return;
    }
    const group = db.groups.find((g) => g.id === groupId);
    if (!group) return;
    const nextFlag = !group.isFlagged;

    appendAuditAndVerify(db, {
      groupId,
      transactionReference: group.inviteCode,
      eventType: 'GROUP_FLAGGED',
      amount: null,
      details: nextFlag
        ? `Flagged for review: ${reason || 'Unusual activity check'}`
        : 'Review flag cleared',
      actorId: currentUser.id,
    }).then(({ events, report }) => {
      setDb((prev) =>
        prev
          ? {
              ...prev,
              groups: prev.groups.map((g) =>
                g.id === groupId
                  ? {
                      ...g,
                      isFlagged: nextFlag,
                      flagReason: nextFlag ? reason || 'Flagged for audit review' : undefined,
                    }
                  : g
              ),
              auditEvents: events,
            }
          : prev
      );
      setVerificationReport(report);
    });

    toast.info(nextFlag ? 'Group flagged for compliance review' : 'Group flag cleared');
  };

  const updatePlatformSettings = (patch: Partial<PlatformSettings>) => {
    if (currentUser?.role !== 'platform_admin') return;
    setDb((prev) =>
      prev
        ? {
            ...prev,
            platformSettings: { ...prev.platformSettings, ...patch },
          }
        : prev
    );
    toast.success('Platform settings saved');
  };

  const resetDemoEnvironment = async () => {
    let fresh: KuriDatabaseState | null = null;
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        const data = (await res.json()) as { state?: KuriDatabaseState };
        if (data?.state) fresh = data.state;
      }
    } catch {
      // static fallback
    }
    if (!fresh) {
      fresh = await buildInitialSeedData();
    }
    const report = await verifyAuditChain(fresh.auditEvents);
    setDb(fresh);
    setVerificationReport(report);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    toast.success('All data reset to clean zero baseline');
  };

  // Authoritative server-style aggregation selectors
  const getGroupTotalSaved = (groupId: string) => {
    if (!db) return 0;
    return db.contributions
      .filter((c) => c.groupId === groupId && c.verificationStatus === 'verified')
      .reduce((sum, c) => sum + c.amount, 0);
  };

  const getGroupPendingTotal = (groupId: string) => {
    if (!db) return 0;
    return db.contributions
      .filter(
        (c) =>
          c.groupId === groupId &&
          (c.paymentStatus === 'pending' || c.paymentStatus === 'submitted')
      )
      .reduce((sum, c) => sum + c.amount, 0);
  };

  const getGroupMembersList: KuriContextValue['getGroupMembersList'] = (groupId) => {
    if (!db) return [];
    return db.groupMembers
      .filter((gm) => gm.groupId === groupId)
      .map((gm) => {
        const profile = db.profiles.find((p) => p.id === gm.userId);
        if (!profile) return null;
        const totalVerified = db.contributions
          .filter(
            (c) =>
              c.groupId === groupId &&
              c.memberId === gm.userId &&
              c.verificationStatus === 'verified'
          )
          .reduce((s, c) => s + c.amount, 0);
        const totalPending = db.contributions
          .filter(
            (c) =>
              c.groupId === groupId &&
              c.memberId === gm.userId &&
              (c.paymentStatus === 'pending' || c.paymentStatus === 'submitted')
          )
          .reduce((s, c) => s + c.amount, 0);
        return { membership: gm, profile, totalVerified, totalPending };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  };

  const getVisibleGroupsForUser = (user: Profile | null): SavingsGroup[] => {
    if (!db || !user) return [];
    if (user.role === 'platform_admin') return db.groups;
    const memberGroupIds = new Set(
      db.groupMembers
        .filter((gm) => gm.userId === user.id && gm.status === 'active')
        .map((gm) => gm.groupId)
    );
    return db.groups.filter(
      (g) => g.organizerId === user.id || memberGroupIds.has(g.id)
    );
  };

  if (!isReady || !db) {
    return (
      <div className="min-h-screen bg-[#EAE8E2] flex items-center justify-center p-6">
        <div className="bento-card p-8 flex flex-col items-center gap-3">
          <div className="h-9 w-9 rounded-full border-2 border-[#0E5A46] border-t-transparent animate-spin" />
          <p className="text-sm font-medium text-[#1F1F1F]">
            Initializing KuriCircle Audit Ledger...
          </p>
        </div>
      </div>
    );
  }

  return (
    <KuriContext.Provider
      value={{
        isReady,
        db,
        currentUser,
        activeRoute,
        selectedGroupId,
        selectedTransactionId,
        searchQuery,
        verificationReport,
        notifPrefs,
        navigate,
        setSearchQuery,
        setNotifPrefs,
        login,
        register,
        resetPassword,
        switchDemoUser,
        logout,
        updateProfile,
        createGroup,
        joinGroupByCode,
        handleMembershipRequest,
        updateMemberPermissions,
        inviteMemberByEmail,
        postAnnouncement,
        recordContribution,
        verifyOrRejectContribution,
        runAuditVerification,
        simulateTamperOnEvent,
        restoreAuditChain,
        markNotificationRead,
        markAllNotificationsRead,
        submitDispute,
        respondDispute,
        toggleUserActive,
        changeUserRole,
        toggleGroupFlag,
        updatePlatformSettings,
        resetDemoEnvironment,
        getGroupTotalSaved,
        getGroupPendingTotal,
        getGroupMembersList,
        getVisibleGroupsForUser,
      }}
    >
      {children}
    </KuriContext.Provider>
  );
};

export function useKuri() {
  const ctx = useContext(KuriContext);
  if (!ctx) throw new Error('useKuri must be used inside KuriProvider');
  return ctx;
}
