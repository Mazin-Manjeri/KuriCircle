import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { KuriLogoMark } from '@/src/components/shared/KuriBrand';
import { Button } from '@/src/components/ui/button';
import { useKuri } from '@/src/lib/store';
import type { PageRoute } from '@/src/types/kuri';

export const PublicShell: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { activeRoute, navigate, currentUser } = useKuri();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: { label: string; route: PageRoute }[] = [
    { label: 'Features', route: 'features' },
    { label: 'How It Works', route: 'how-it-works' },
    { label: 'Security', route: 'security' },
    { label: 'About', route: 'about' },
  ];

  const handleNav = (route: PageRoute) => {
    setMobileOpen(false);
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#1F1F1F] flex flex-col">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 border-b border-[#E7E4DC] bg-[#F8F6F2]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-6 py-4">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={() => handleNav('landing')}
            className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none"
          >
            <KuriLogoMark className="h-7 w-7" />
            <span className="font-display text-lg font-bold tracking-tight text-[#1F1F1F]">
              KuriCircle
            </span>
          </button>

          {/* Zone 2: Concise Single-Line Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#555555]">
            {navItems.map((item) => (
              <button
                key={item.route}
                type="button"
                onClick={() => handleNav(item.route)}
                className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#0E5A46] cursor-pointer ${
                  activeRoute === item.route
                    ? 'text-[#0E5A46] underline decoration-[#C8A45A] underline-offset-8'
                    : ''
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <Button
              onClick={() =>
                handleNav(currentUser ? 'dashboard' : 'login')
              }
              className="rounded-xl px-5"
            >
              {currentUser ? 'Open Workspace' : 'Explore the Demo'}
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden rounded-xl p-2 text-[#1F1F1F] hover:bg-[#EAE8E2]"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-[#E7E4DC] bg-white px-6 py-4 space-y-3">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.route}
                  type="button"
                  onClick={() => handleNav(item.route)}
                  className="text-left py-2 text-sm font-medium text-[#1F1F1F] hover:text-[#0E5A46]"
                >
                  {item.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleNav('register')}
                className="text-left py-2 text-sm font-medium text-[#555555]"
              >
                Register Account
              </button>
            </div>
            <Button
              className="w-full"
              onClick={() => handleNav(currentUser ? 'dashboard' : 'login')}
            >
              {currentUser ? 'Open Workspace' : 'Explore the Demo'}
            </Button>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      {/* Quiet Institutional Footer */}
      <footer className="border-t border-[#E4E0D6] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2.5">
                <KuriLogoMark className="h-6 w-6" />
                <span className="font-display text-base font-bold text-[#1F1F1F]">
                  KuriCircle
                </span>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-[#7A7A7A]">
                Traditional Trust. Digital Transparency. An educational and hackathon
                demonstration platform exploring transparent community savings
                coordination and SHA-256 verifiable audit records.
              </p>
              <p className="text-xs text-[#7A7A7A]">
                Legal Notice: KuriCircle is a demonstration prototype. It is not an
                authorized financial institution, does not custody real funds, and
                does not operate regulated chit fund arrangements.
              </p>
            </div>

            <div className="space-y-2.5 text-sm">
              <p className="font-display font-semibold text-[#1F1F1F]">Platform</p>
              <div className="flex flex-col items-start gap-2 text-[#7A7A7A]">
                <button
                  type="button"
                  onClick={() => navigate('features')}
                  className="hover:text-[#0E5A46] cursor-pointer"
                >
                  Features
                </button>
                <button
                  type="button"
                  onClick={() => navigate('how-it-works')}
                  className="hover:text-[#0E5A46] cursor-pointer"
                >
                  How It Works
                </button>
                <button
                  type="button"
                  onClick={() => navigate('security')}
                  className="hover:text-[#0E5A46] cursor-pointer"
                >
                  Security & Ledger
                </button>
                <button
                  type="button"
                  onClick={() => navigate('about')}
                  className="hover:text-[#0E5A46] cursor-pointer"
                >
                  About KuriCircle
                </button>
              </div>
            </div>

            <div className="space-y-2.5 text-sm">
              <p className="font-display font-semibold text-[#1F1F1F]">Access Demo</p>
              <div className="flex flex-col items-start gap-2 text-[#7A7A7A]">
                <button
                  type="button"
                  onClick={() => navigate('login')}
                  className="hover:text-[#0E5A46] cursor-pointer"
                >
                  Sign In to Demo
                </button>
                <button
                  type="button"
                  onClick={() => navigate('register')}
                  className="hover:text-[#0E5A46] cursor-pointer"
                >
                  Create Demo Account
                </button>
                <button
                  type="button"
                  onClick={() => navigate('reset-password')}
                  className="hover:text-[#0E5A46] cursor-pointer"
                >
                  Password Recovery
                </button>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[#ECEAE3] pt-6 text-xs text-[#7A7A7A]">
            <span>© 2026 KuriCircle Prototype. Educational Demonstration Build.</span>
            <span>Simulated Records Only · Zero Real Monetary Custody</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
