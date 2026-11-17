export type UserRole = 'organizer' | 'member' | 'platform_admin';

export type PageRoute =
  // Public pages (1-7)
  | 'landing'
  | 'about'
  | 'features'
  | 'how-it-works'
  | 'security'
  | 'login'
  | 'register'
  | 'reset-password'
  // Authenticated pages (8-21)
  | 'dashboard'
  | 'groups'
  | 'group-details'
  | 'create-group'
  | 'members'
  | 'contributions'
  | 'transaction-details'
  | 'reports'
  | 'audit-ledger'
  | 'verify-history'
  | 'notifications'
  | 'disputes'
  | 'profile'
  | 'settings'
  // Platform Administrator pages (22-26)
  | 'admin-overview'
  | 'admin-users'
  | 'admin-groups'
  | 'admin-disputes'
  | 'admin-activity';

export type SavingsPurpose =
  | 'Community development'
  | 'Education'
  | 'Medical emergencies'
  | 'Weddings'
  | 'Small business development'
  | 'Family savings';

export type ContributionFrequency = 'weekly' | 'biweekly' | 'monthly';
export type GroupVisibility = 'private_invite' | 'community_directory';
export type MembershipStatus = 'pending' | 'active' | 'rejected' | 'suspended';
export type PaymentStatus = 'pending' | 'submitted' | 'verified' | 'rejected';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type DisputeStatus = 'open' | 'under_review' | 'escalated' | 'resolved' | 'dismissed';

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string;
  role: UserRole;
  isActive: boolean;
  city: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsGroup {
  id: string;
  organizerId: string;
  name: string;
  description: string;
  purpose: SavingsPurpose;
  imageUrl: string;
  arrangementType: 'goal_based_savings';
  maxMembers: number;
  targetAmount: number;
  frequency: ContributionFrequency;
  proposedContribution: number;
  startDate: string;
  endDate: string;
  rules: string;
  visibility: GroupVisibility;
  inviteCode: string;
  isFlagged: boolean;
  flagReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  status: MembershipStatus;
  canViewPeerTotals: boolean;
  canRecordDrafts: boolean;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroupInvitation {
  id: string;
  groupId: string;
  invitedBy: string;
  inviteeEmail: string;
  inviteCode: string;
  accepted: boolean;
  expiresAt: string;
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  groupId: string;
  title: string;
  targetAmount: number;
  targetDate: string;
  milestones: number[]; // percentages e.g. [25, 50, 75, 100]
  createdAt: string;
  updatedAt: string;
}

export interface ContributionRecord {
  id: string;
  transactionId: string;
  groupId: string;
  memberId: string;
  amount: number;
  transactionDate: string;
  contributionPeriod: string; // e.g. "2026-08"
  paymentStatus: PaymentStatus;
  verificationStatus: VerificationStatus;
  recordedBy: string;
  notes?: string;
  isSimulated: true;
  createdAt: string;
  updatedAt: string;
}

export type AuditEventType =
  | 'GROUP_CREATED'
  | 'MEMBER_JOINED'
  | 'MEMBER_APPROVED'
  | 'CONTRIBUTION_RECORDED'
  | 'CONTRIBUTION_VERIFIED'
  | 'CONTRIBUTION_REJECTED'
  | 'DISPUTE_OPENED'
  | 'DISPUTE_RESPONDED'
  | 'DISPUTE_ESCALATED'
  | 'DISPUTE_RESOLVED'
  | 'GROUP_FLAGGED'
  | 'ANNOUNCEMENT_POSTED';

export interface AuditEvent {
  id: string;
  sequenceNumber: number;
  groupId: string | null;
  transactionReference: string;
  eventType: AuditEventType;
  amount: number | null;
  details: string;
  actorId: string;
  timestamp: string;
  previousEventHash: string;
  currentEventHash: string;
}

export interface AuditVerificationItem {
  eventId: string;
  sequenceNumber: number;
  transactionReference: string;
  storedPreviousHash: string;
  expectedPreviousHash: string;
  storedCurrentHash: string;
  recalculatedHash: string;
  isLinkValid: boolean;
  isHashValid: boolean;
  isValid: boolean;
}

export interface AuditVerificationReport {
  verifiedAt: string;
  totalEvents: number;
  validEvents: number;
  brokenEvents: number;
  isChainIntact: boolean;
  firstBrokenEventId: string | null;
  items: AuditVerificationItem[];
}

export interface NotificationItem {
  id: string;
  userId: string;
  groupId?: string;
  title: string;
  message: string;
  category: 'contribution' | 'announcement' | 'membership' | 'dispute' | 'reminder';
  isRead: boolean;
  createdAt: string;
}

export interface GroupAnnouncement {
  id: string;
  groupId: string;
  authorId: string;
  title: string;
  body: string;
  createdAt: string;
}

export type DisputeCategory =
  | 'Missing contribution record'
  | 'Incorrect amount'
  | 'Incorrect transaction date'
  | 'Unauthorized record change'
  | 'Other discrepancy';

export interface Dispute {
  id: string;
  groupId: string;
  contributionId?: string;
  reportedBy: string;
  category: DisputeCategory;
  description: string;
  status: DisputeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DisputeResponse {
  id: string;
  disputeId: string;
  responderId: string;
  message: string;
  actionTaken?: string;
  createdAt: string;
}

export interface UserActivityLog {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: string;
  createdAt: string;
}

export interface PlatformSettings {
  demonstrationNoticeEnabled: boolean;
  allowPublicDirectory: boolean;
  requireDualVerificationThreshold: number;
  maxMembersPerGroupLimit: number;
  autoAuditVerificationIntervalMinutes: number;
}

export interface NotificationPreferences {
  upcomingReminders: boolean;
  contributionUpdates: boolean;
  disputeAlerts: boolean;
  groupAnnouncements: boolean;
}

export interface KuriDatabaseState {
  profiles: Profile[];
  groups: SavingsGroup[];
  groupMembers: GroupMember[];
  invitations: GroupInvitation[];
  goals: SavingsGoal[];
  contributions: ContributionRecord[];
  auditEvents: AuditEvent[];
  notifications: NotificationItem[];
  announcements: GroupAnnouncement[];
  disputes: Dispute[];
  disputeResponses: DisputeResponse[];
  activityLogs: UserActivityLog[];
  platformSettings: PlatformSettings;
  tamperedSnapshot: AuditEvent[] | null;
}
