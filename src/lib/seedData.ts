import type { KuriDatabaseState, Profile } from '@/src/types/kuri';

export const DEMO_AVATARS = {
  organizer: '/src/assets/images/avatar_member_1794934568879.jpg',
  member: '/src/assets/images/avatar_member_1794934568879.jpg',
};

export const DEMO_GROUP_IMAGES = {
  greenfield: '/src/assets/images/group_greenfield_community_1794934568404.jpg',
  education: '/src/assets/images/group_education_fund_1794934568348.jpg',
  hero: '/src/assets/images/hero_community_savings_1794934567187.jpg',
};

export async function buildInitialSeedData(): Promise<KuriDatabaseState> {
  const now = new Date().toISOString();

  const starterProfile: Profile = {
    id: 'usr-mazin-01',
    fullName: 'Mohyadden Mazin',
    email: 'mohyadden.mazin@kuricircle.demo',
    phone: '+91 98470 00000',
    avatarUrl: DEMO_AVATARS.organizer,
    role: 'organizer',
    isActive: true,
    city: 'Manjeri, Kerala',
    createdAt: now,
    updatedAt: now,
  };

  return {
    profiles: [starterProfile],
    groups: [],
    groupMembers: [],
    invitations: [],
    goals: [],
    contributions: [],
    auditEvents: [],
    notifications: [],
    announcements: [],
    disputes: [],
    disputeResponses: [],
    activityLogs: [],
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
