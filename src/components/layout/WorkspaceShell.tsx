import React, { useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  Bell,
  FileCheck2,
  FolderKanban,
  LayoutGrid,
  LogOut,
  Menu,
  MessageSquareWarning,
  PlusCircle,
  ReceiptIndianRupee,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  User as UserIcon,
  Users,
  X,
} from 'lucide-react';
import {
  DemoDisclosureBanner,
  KuriLogoMark,
  UserAvatar,
} from '@/src/components/shared/KuriBrand';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/src/components/ui/controls';
import { useKuri } from '@/src/lib/store';
import type { PageRoute } from '@/src/types/kuri';

interface NavDef {
  route: PageRoute;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const MAIN_NAV: NavDef[] = [
  { route: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { route: 'groups', label: 'Savings Groups', icon: FolderKanban },
  { route: 'contributions', label: 'Contributions', icon: ReceiptIndianRupee },
  { route: 'reports', label: 'Financial Reports', icon: BarChart3 },
  { route: 'members', label: 'Member Directory', icon: Users },
  { route: 'audit-ledger', label: 'Audit Ledger', icon: ShieldCheck },
  { route: 'verify-history', label: 'Verify History', icon: FileCheck2 },
  { route: 'disputes', label: 'Disputes', icon: MessageSquareWarning },
];

const ADMIN_NAV: NavDef[] = [
  { route: 'admin-overview', label: 'Platform Overview', icon: Shield, adminOnly: true },
  { route: 'admin-users', label: 'User Management', icon: Users, adminOnly: true },
  { route: 'admin-groups', label: 'Group Monitoring', icon: FolderKanban, adminOnly: true },
  { route: 'admin-disputes', label: 'Dispute Monitoring', icon: AlertCircle, adminOnly: true },
  { route: 'admin-activity', label: 'System Activity', icon: FileCheck2, adminOnly: true },
];

const PAGE_TITLES: Record<PageRoute, { title: string; subtitle: string }> = {
  landing: { title: 'KuriCircle', subtitle: 'Traditional Trust. Digital Transparency.' },
  about: { title: 'About KuriCircle', subtitle: 'Community savings heritage modernized' },
  features: { title: 'Platform Features', subtitle: 'Built for accountability' },
  'how-it-works': { title: 'How It Works', subtitle: 'Three steps to transparent records' },
  security: { title: 'Security & Ledger', subtitle: 'SHA-256 verification architecture' },
  login: { title: 'Sign In', subtitle: 'Access your savings circles' },
  register: { title: 'Create Account', subtitle: 'Join KuriCircle' },
  'reset-password': { title: 'Reset Password', subtitle: 'Account recovery' },
  dashboard: {
    title: 'Overview',
    subtitle: 'Explore simulated savings activity and ledger health across your circles',
  },
  groups: {
    title: 'My Savings Groups',
    subtitle: 'Coordinate goal-based community savings pools and invite codes',
  },
  'group-details': {
    title: 'Group Workspace',
    subtitle: 'Inspect savings milestones, rules, announcements, and member ledger',
  },
  'create-group': {
    title: 'Create Savings Group',
    subtitle: 'Configure a goal-based demonstration pool with clear community rules',
  },
  members: {
    title: 'Member Directory',
    subtitle: 'Manage active members, join requests, and contribution standings',
  },
  contributions: {
    title: 'Simulated Contributions',
    subtitle: 'Record, verify, and inspect monthly community contribution entries',
  },
  'transaction-details': {
    title: 'Transaction Receipt',
    subtitle: 'Full simulated transaction metadata and SHA-256 ledger anchor',
  },
  reports: {
    title: 'Financial Reports & Analytics',
    subtitle: 'Interactive charts and CSV exports derived from ledger records',
  },
  'audit-ledger': {
    title: 'Tamper-Evident Audit Ledger',
    subtitle: 'Append-only sequence of cryptographically linked community events',
  },
  'verify-history': {
    title: 'Verify Transaction History',
    subtitle: 'Recompute SHA-256 hashes client-side to confirm record integrity',
  },
  notifications: {
    title: 'Notifications',
    subtitle: 'Cycle reminders, approvals, verifications, and dispute updates',
  },
  disputes: {
    title: 'Dispute Resolution Center',
    subtitle: 'Report discrepancies and review organizer or administrator responses',
  },
  profile: {
    title: 'User Profile',
    subtitle: 'Manage your identity details and role membership overview',
  },
  settings: {
    title: 'Workspace Settings',
    subtitle: 'Configure notification preferences and demonstration environment controls',
  },
  'admin-overview': {
    title: 'Platform Admin Overview',
    subtitle: 'Monitor platform-wide demonstration groups, disputes, and ledger integrity',
  },
  'admin-users': {
    title: 'User Management',
    subtitle: 'Review user accounts, roles, and access status',
  },
  'admin-groups': {
    title: 'Group Monitoring',
    subtitle: 'Inspect active demonstration pools and compliance flags',
  },
  'admin-disputes': {
    title: 'Escalated Dispute Queue',
    subtitle: 'Review and adjudicate disputes escalated by group organizers',
  },
  'admin-activity': {
    title: 'System Activity & Settings',
    subtitle: 'Inspect audit logs and configure platform demonstration policies',
  },
};

export const WorkspaceShell: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const {
    db,
    currentUser,
    activeRoute,
    navigate,
    searchQuery,
    setSearchQuery,
    switchDemoUser,
    logout,
    verificationReport,
  } = useKuri();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (!currentUser) return null;

  const unreadNotifs = db.notifications.filter(
    (n) => n.userId === currentUser.id && !n.isRead
  ).length;
  const openDisputesCount = db.disputes.filter(
    (d) => d.status === 'open' || d.status === 'escalated'
  ).length;

  const demoAccounts = [
    db.profiles.find((p) => p.id === 'usr-org-01'),
    db.profiles.find((p) => p.id === 'usr-mem-01'),
    db.profiles.find((p) => p.id === 'usr-adm-01'),
  ].filter(Boolean);

  const navItems =
    currentUser.role === 'platform_admin'
      ? [...ADMIN_NAV, ...MAIN_NAV.slice(0, 6)]
      : MAIN_NAV;

  const meta = PAGE_TITLES[activeRoute];
  const firstName = currentUser.fullName.split(' ')[0];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      activeRoute !== 'contributions' &&
      activeRoute !== 'groups' &&
      activeRoute !== 'members' &&
      activeRoute !== 'audit-ledger'
    ) {
      navigate('contributions');
    }
  };

  return (
    <TooltipProvider delayDuration={120}>
      <div className="min-h-screen bg-[#EAE8E2] text-[#1F1F1F] p-2.5 sm:p-4 lg:p-6">
        <div className="mx-auto max-w-[1440px] rounded-[30px] bg-[#F4F2EC] p-3 sm:p-5 lg:p-6 shadow-[0_6px_30px_rgba(31,31,31,0.04)] flex gap-5 lg:gap-6 min-h-[calc(100vh-3rem)]">
          {/* Desktop Floating Slim Vertical Icon Rail (Reference Layout) */}
          <aside className="hidden lg:flex w-[72px] shrink-0 flex-col items-center justify-between rounded-[28px] bg-white py-5 shadow-[0_2px_14px_rgba(31,31,31,0.035)] sticky top-6 h-[calc(100vh-4.5rem)]">
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('landing')}
                className="mb-3 p-1.5 rounded-xl hover:bg-[#F3F1EC] transition-colors cursor-pointer"
                title="KuriCircle Public Home"
              >
                <KuriLogoMark className="h-7 w-7" />
              </button>

              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  activeRoute === item.route ||
                  (item.route === 'groups' &&
                    (activeRoute === 'group-details' ||
                      activeRoute === 'create-group')) ||
                  (item.route === 'contributions' &&
                    activeRoute === 'transaction-details');

                return (
                  <Tooltip key={item.route}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => navigate(item.route)}
                        aria-label={item.label}
                        className={`flex h-11 w-11 items-center justify-center rounded-full transition-all duration-150 cursor-pointer ${
                          isActive
                            ? 'bg-[#1F1F1F] text-white shadow-sm'
                            : 'text-[#6A6862] hover:bg-[#F3F1EC] hover:text-[#1F1F1F]'
                        }`}
                      >
                        <Icon className="h-[19px] w-[19px]" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                );
              })}

              {(currentUser.role === 'organizer' ||
                currentUser.role === 'platform_admin') && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => navigate('create-group')}
                      aria-label="Create Savings Group"
                      className={`flex h-11 w-11 items-center justify-center rounded-full transition-all duration-150 cursor-pointer ${
                        activeRoute === 'create-group'
                          ? 'bg-[#0E5A46] text-white'
                          : 'text-[#0E5A46] hover:bg-[#E8F0ED]'
                      }`}
                    >
                      <PlusCircle className="h-[19px] w-[19px]" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Create Savings Group</TooltipContent>
                </Tooltip>
              )}
            </div>

            <div className="flex flex-col items-center gap-2 pt-3 border-t border-[#ECEAE3]">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => navigate('settings')}
                    aria-label="Settings"
                    className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors cursor-pointer ${
                      activeRoute === 'settings'
                        ? 'bg-[#1F1F1F] text-white'
                        : 'text-[#6A6862] hover:bg-[#F3F1EC]'
                    }`}
                  >
                    <Settings className="h-[18px] w-[18px]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Settings</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={logout}
                    aria-label="Sign Out"
                    className="flex h-10 w-10 items-center justify-center rounded-full text-[#6A6862] hover:bg-[#FEE2E2] hover:text-[#B91C1C] transition-colors cursor-pointer"
                  >
                    <LogOut className="h-[18px] w-[18px]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Sign Out</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => navigate('profile')}
                    className="mt-1 rounded-full ring-2 ring-[#E8F0ED] hover:ring-[#0E5A46] transition-all cursor-pointer"
                    aria-label="Profile"
                  >
                    <UserAvatar
                      name={currentUser.fullName}
                      src={currentUser.avatarUrl}
                      size="sm"
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {currentUser.fullName} · Profile
                </TooltipContent>
              </Tooltip>
            </div>
          </aside>

          {/* Main Workspace Content Column */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">
            {/* Workspace Top Header (Modeled after attached reference layout) */}
            <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <button
                    type="button"
                    onClick={() => setMobileNavOpen(true)}
                    className="lg:hidden flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1F1F1F] shadow-sm"
                    aria-label="Open navigation menu"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                  <div className="lg:hidden">
                    <KuriLogoMark className="h-7 w-7" />
                  </div>
                  <div>
                    <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#1F1F1F]">
                      {activeRoute === 'dashboard'
                        ? `Hello, ${firstName}!`
                        : meta.title}
                    </h1>
                    <p className="text-xs sm:text-sm text-[#7A7A7A]">
                      {meta.subtitle}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Controls: Pill Search + Circular Icon Buttons + Role Switcher */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                <form
                  onSubmit={handleSearchSubmit}
                  className="relative flex items-center flex-1 sm:flex-initial"
                >
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search groups, members, or TX ID..."
                    className="h-11 w-full sm:w-64 rounded-full bg-white pl-4 pr-12 text-xs sm:text-sm text-[#1F1F1F] placeholder:text-[#9A9891] shadow-[0_2px_10px_rgba(31,31,31,0.03)] focus:outline-none focus:ring-2 focus:ring-[#0E5A46]/30"
                  />
                  <button
                    type="submit"
                    aria-label="Search"
                    className="absolute right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#1F1F1F] text-white hover:bg-[#0E5A46] transition-colors cursor-pointer"
                  >
                    <Search className="h-3.5 w-3.5" />
                  </button>
                </form>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => navigate('disputes')}
                      aria-label="Disputes"
                      className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#1F1F1F] shadow-[0_2px_10px_rgba(31,31,31,0.03)] hover:bg-[#F8F6F2] transition-colors cursor-pointer"
                    >
                      <MessageSquareWarning className="h-[18px] w-[18px]" />
                      {openDisputesCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#C8A45A] px-1 text-[10px] font-bold text-[#1F1F1F] tabular-nums">
                          {openDisputesCount}
                        </span>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Dispute Center</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => navigate('notifications')}
                      aria-label="Notifications"
                      className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#1F1F1F] shadow-[0_2px_10px_rgba(31,31,31,0.03)] hover:bg-[#F8F6F2] transition-colors cursor-pointer"
                    >
                      <Bell className="h-[18px] w-[18px]" />
                      {unreadNotifs > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#0E5A46] px-1 text-[10px] font-bold text-white tabular-nums">
                          {unreadNotifs}
                        </span>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Notifications ({unreadNotifs} unread)</TooltipContent>
                </Tooltip>

                {/* Role / Demo Account Switcher */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex h-11 items-center gap-2.5 rounded-full bg-white pl-1.5 pr-3.5 shadow-[0_2px_10px_rgba(31,31,31,0.03)] hover:bg-[#F8F6F2] transition-colors cursor-pointer"
                    >
                      <UserAvatar
                        name={currentUser.fullName}
                        src={currentUser.avatarUrl}
                        size="sm"
                      />
                      <div className="hidden sm:block text-left leading-tight">
                        <p className="text-xs font-semibold text-[#1F1F1F] whitespace-nowrap">
                          {currentUser.fullName}
                        </p>
                        <p className="text-[11px] text-[#0E5A46] capitalize whitespace-nowrap">
                          {currentUser.role.replace('_', ' ')}
                        </p>
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <div className="px-3 py-2 border-b border-[#ECEAE3]">
                      <p className="text-xs font-semibold text-[#1F1F1F]">
                        Switch Demo Role
                      </p>
                      <p className="text-[11px] text-[#7A7A7A]">
                        Test RBAC permissions instantly
                      </p>
                    </div>
                    {demoAccounts.map((acc) =>
                      acc ? (
                        <DropdownMenuItem
                          key={acc.id}
                          onClick={() => switchDemoUser(acc.id)}
                          className={
                            acc.id === currentUser.id ? 'bg-[#E8F0ED]/70 font-medium' : ''
                          }
                        >
                          <UserAvatar
                            name={acc.fullName}
                            src={acc.avatarUrl}
                            size="sm"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-[#1F1F1F] truncate">
                              {acc.fullName}
                            </p>
                            <p className="text-[11px] text-[#7A7A7A] capitalize">
                              {acc.role.replace('_', ' ')}
                            </p>
                          </div>
                        </DropdownMenuItem>
                      ) : null
                    )}
                    <div className="my-1 border-t border-[#ECEAE3]" />
                    <DropdownMenuItem onClick={() => navigate('profile')}>
                      <UserIcon className="h-4 w-4 text-[#7A7A7A]" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('settings')}>
                      <Settings className="h-4 w-4 text-[#7A7A7A]" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={logout}
                      className="text-[#B91C1C] focus:text-[#B91C1C]"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>

            {/* Quick Sub-Navigation Strip for fast 1-click access to all core modules */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {navItems.map((item) => {
                  const isActive = activeRoute === item.route;
                  return (
                    <button
                      key={item.route}
                      type="button"
                      onClick={() => navigate(item.route)}
                      className={`whitespace-nowrap shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#0E5A46] text-white'
                          : 'bg-white/75 text-[#555555] hover:bg-white hover:text-[#1F1F1F]'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {verificationReport && !verificationReport.isChainIntact && (
                <button
                  type="button"
                  onClick={() => navigate('verify-history')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#FEE2E2] px-3 py-1.5 text-xs font-semibold text-[#B91C1C] cursor-pointer"
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Audit Hash Mismatch Detected — Inspect</span>
                </button>
              )}
            </div>

            {db.platformSettings.demonstrationNoticeEnabled && (
              <DemoDisclosureBanner compact />
            )}

            {/* Main Viewport */}
            <main className="flex-1 pb-6">{children}</main>
          </div>
        </div>

        {/* Mobile Drawer Navigation */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-[#1F1F1F]/40"
              onClick={() => setMobileNavOpen(false)}
            />
            <div className="relative z-10 w-72 max-w-[85vw] bg-white h-full p-5 flex flex-col justify-between overflow-y-auto shadow-xl">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <KuriLogoMark className="h-7 w-7" />
                    <span className="font-display text-lg font-bold text-[#1F1F1F]">
                      KuriCircle
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileNavOpen(false)}
                    className="rounded-full p-1.5 hover:bg-[#F3F1EC]"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeRoute === item.route;
                    return (
                      <button
                        key={item.route}
                        type="button"
                        onClick={() => {
                          navigate(item.route);
                          setMobileNavOpen(false);
                        }}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                          isActive
                            ? 'bg-[#0E5A46] text-white'
                            : 'text-[#4A4945] hover:bg-[#F3F1EC]'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                  {(currentUser.role === 'organizer' ||
                    currentUser.role === 'platform_admin') && (
                    <button
                      type="button"
                      onClick={() => {
                        navigate('create-group');
                        setMobileNavOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#0E5A46] hover:bg-[#E8F0ED]"
                    >
                      <PlusCircle className="h-4 w-4" />
                      <span>Create Savings Group</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-[#ECEAE3] space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    navigate('profile');
                    setMobileNavOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-[#4A4945] hover:bg-[#F3F1EC]"
                >
                  <UserIcon className="h-4 w-4" />
                  <span>Profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigate('settings');
                    setMobileNavOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-[#4A4945] hover:bg-[#F3F1EC]"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-[#B91C1C] hover:bg-[#FEE2E2]"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};
