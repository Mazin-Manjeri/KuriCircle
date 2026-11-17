import React from 'react';
import { Toaster } from 'sonner';
import { PublicShell } from '@/src/components/layout/PublicShell';
import { WorkspaceShell } from '@/src/components/layout/WorkspaceShell';
import { KuriProvider, useKuri } from '@/src/lib/store';
import {
  AdminActivityPage,
  AdminDisputesPage,
  AdminGroupsPage,
  AdminOverviewPage,
  AdminUsersPage,
} from '@/src/pages/AdminPages';
import { AuditLedgerPage, VerifyHistoryPage } from '@/src/pages/AuditPages';
import {
  LoginPage,
  RegisterPage,
  ResetPasswordPage,
} from '@/src/pages/AuthPages';
import {
  ContributionsPage,
  TransactionDetailsPage,
} from '@/src/pages/ContributionsPages';
import { DashboardPage } from '@/src/pages/DashboardPage';
import {
  CreateGroupPage,
  GroupDetailsPage,
  MyGroupsPage,
} from '@/src/pages/GroupsPages';
import { LandingPage } from '@/src/pages/LandingPage';
import { MembersPage } from '@/src/pages/MembersPage';
import {
  AboutPage,
  FeaturesPage,
  HowItWorksPage,
  SecurityPage,
} from '@/src/pages/PublicInfoPages';
import { ReportsPage } from '@/src/pages/ReportsPage';
import {
  DisputesPage,
  NotificationsPage,
  ProfilePage,
  SettingsPage,
} from '@/src/pages/SupportPages';

const RouterView: React.FC = () => {
  const { activeRoute, currentUser } = useKuri();

  // Public routes
  if (activeRoute === 'landing') {
    return (
      <PublicShell>
        <LandingPage />
      </PublicShell>
    );
  }
  if (activeRoute === 'about') {
    return (
      <PublicShell>
        <AboutPage />
      </PublicShell>
    );
  }
  if (activeRoute === 'features') {
    return (
      <PublicShell>
        <FeaturesPage />
      </PublicShell>
    );
  }
  if (activeRoute === 'how-it-works') {
    return (
      <PublicShell>
        <HowItWorksPage />
      </PublicShell>
    );
  }
  if (activeRoute === 'security') {
    return (
      <PublicShell>
        <SecurityPage />
      </PublicShell>
    );
  }
  if (activeRoute === 'login') {
    return (
      <PublicShell>
        <LoginPage />
      </PublicShell>
    );
  }
  if (activeRoute === 'register') {
    return (
      <PublicShell>
        <RegisterPage />
      </PublicShell>
    );
  }
  if (activeRoute === 'reset-password') {
    return (
      <PublicShell>
        <ResetPasswordPage />
      </PublicShell>
    );
  }

  // Fallback to login if unauthenticated
  if (!currentUser) {
    return (
      <PublicShell>
        <LoginPage />
      </PublicShell>
    );
  }

  // Authenticated & Administrator workspace routes
  const renderWorkspacePage = () => {
    switch (activeRoute) {
      case 'dashboard':
        return <DashboardPage />;
      case 'groups':
        return <MyGroupsPage />;
      case 'group-details':
        return <GroupDetailsPage />;
      case 'create-group':
        return <CreateGroupPage />;
      case 'members':
        return <MembersPage />;
      case 'contributions':
        return <ContributionsPage />;
      case 'transaction-details':
        return <TransactionDetailsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'audit-ledger':
        return <AuditLedgerPage />;
      case 'verify-history':
        return <VerifyHistoryPage />;
      case 'notifications':
        return <NotificationsPage />;
      case 'disputes':
        return <DisputesPage />;
      case 'profile':
        return <ProfilePage />;
      case 'settings':
        return <SettingsPage />;
      case 'admin-overview':
        return <AdminOverviewPage />;
      case 'admin-users':
        return <AdminUsersPage />;
      case 'admin-groups':
        return <AdminGroupsPage />;
      case 'admin-disputes':
        return <AdminDisputesPage />;
      case 'admin-activity':
        return <AdminActivityPage />;
      default:
        return <DashboardPage />;
    }
  };

  return <WorkspaceShell>{renderWorkspacePage()}</WorkspaceShell>;
};

export default function App() {
  return (
    <KuriProvider>
      <Toaster position="top-right" richColors />
      <RouterView />
    </KuriProvider>
  );
}
