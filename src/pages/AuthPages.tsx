import React, { useState } from 'react';
import { ArrowRight, KeyRound, ShieldCheck, UserCheck } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/primitives';
import { UserAvatar } from '@/src/components/shared/KuriBrand';
import { useKuri } from '@/src/lib/store';

export const LoginPage: React.FC = () => {
  const { db, login, navigate, switchDemoUser } = useKuri();
  const [email, setEmail] = useState('mohyadden.mazin@kuricircle.demo');
  const [password, setPassword] = useState('demo-pass-2026');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = login(email, password);
    if (!res.ok) setError(res.error || 'Unable to sign in');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
      <div className="grid gap-6 sm:gap-8 lg:grid-cols-12 items-start">
        <Card className="lg:col-span-6 p-5 sm:p-8 min-w-0">
          <div className="space-y-2 mb-6">
            <p className="text-xs font-semibold text-[#0E5A46]">
              Workspace Access
            </p>
            <h1 className="font-display text-2xl font-bold text-[#1F1F1F]">
              Sign in to KuriCircle
            </h1>
            <p className="text-sm text-[#7A7A7A]">
              Sign in with your registered account or select an active profile.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login-email">Email Address</Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mohyadden.mazin@kuricircle.demo"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password">Password</Label>
                <button
                  type="button"
                  onClick={() => navigate('reset-password')}
                  className="text-xs font-medium text-[#0E5A46] hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>

            {error && (
              <p className="rounded-xl bg-[#FEE2E2] px-3.5 py-2.5 text-xs font-medium text-[#B91C1C]">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-[#7A7A7A]">
            New user?{' '}
            <button
              type="button"
              onClick={() => navigate('register')}
              className="font-semibold text-[#0E5A46] hover:underline cursor-pointer"
            >
              Create an account
            </button>
          </p>
        </Card>

        <div className="lg:col-span-6 space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[#0E5A46]">
              Quick Workspace Entry
            </p>
            <h2 className="font-display text-lg font-semibold text-[#1F1F1F]">
              Registered Accounts ({db.profiles.length})
            </h2>
            <p className="text-xs text-[#7A7A7A]">
              Enter directly with an existing profile or register additional members.
            </p>
          </div>

          {db.profiles.map((profile) => (
            <Card
              key={profile.id}
              className="transition-all hover:shadow-md border border-[#ECEAE3]"
            >
              <CardContent className="p-4 sm:p-5 flex flex-col min-[400px]:flex-row min-[400px]:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <UserAvatar
                    name={profile.fullName}
                    src={profile.avatarUrl}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#0E5A46] capitalize">
                      {profile.role.replace('_', ' ')}
                    </p>
                    <p className="font-display text-sm font-semibold text-[#1F1F1F] truncate">
                      {profile.fullName}
                    </p>
                    <p className="text-xs text-[#7A7A7A] truncate">
                      {profile.email}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => switchDemoUser(profile.id)}
                  className="shrink-0 gap-1"
                >
                  <span>Enter</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export const RegisterPage: React.FC = () => {
  const { register, navigate } = useKuri();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Manjeri, Kerala');
  const [role, setRole] = useState<'member' | 'organizer'>('member');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = register({ fullName, email, phone, city, role, password });
    if (!res.ok) setError(res.error || 'Registration failed');
  };

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-8 sm:py-12">
      <Card className="p-5 sm:p-8">
        <div className="space-y-1.5 mb-6">
          <p className="text-xs font-semibold text-[#0E5A46]">
            Account Registration
          </p>
          <h1 className="font-display text-2xl font-bold text-[#1F1F1F]">
            Create a KuriCircle Account
          </h1>
          <p className="text-sm text-[#7A7A7A]">
            Register as a Community Member or Group Organizer.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="reg-name">Full Name</Label>
              <Input
                id="reg-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Mohyadden Mazin"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-phone">Phone Number</Label>
              <Input
                id="reg-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98470 00000"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="reg-email">Email Address</Label>
              <Input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mohyadden.mazin@example.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-city">City / Community</Label>
              <Input
                id="reg-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Manjeri, Kerala"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Select Role</Label>
            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
              {[
                {
                  id: 'member' as const,
                  title: 'Community Member',
                  sub: 'Join via code & track records',
                },
                {
                  id: 'organizer' as const,
                  title: 'Group Organizer',
                  sub: 'Create groups & verify entries',
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRole(opt.id)}
                  className={`rounded-xl border p-3 text-left transition-all cursor-pointer ${
                    role === opt.id
                      ? 'border-[#0E5A46] bg-[#E8F0ED]/60'
                      : 'border-[#E2DFD7] bg-white hover:bg-[#F8F6F2]'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#1F1F1F]">
                    <UserCheck className="h-3.5 w-3.5 text-[#0E5A46]" />
                    <span>{opt.title}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#7A7A7A]">{opt.sub}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reg-pass">Password (min 6 characters)</Label>
            <Input
              id="reg-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create password"
              required
            />
          </div>

          {error && (
            <p className="rounded-xl bg-[#FEE2E2] px-3.5 py-2.5 text-xs font-medium text-[#B91C1C]">
              {error}
            </p>
          )}

          <div className="flex items-center gap-2 rounded-xl bg-[#F8F6F2] p-3 text-xs text-[#7A7A7A]">
            <ShieldCheck className="h-4 w-4 text-[#0E5A46] shrink-0" />
            <span>
              Demonstration coordination platform with zero real monetary custody.
            </span>
          </div>

          <Button type="submit" className="w-full">
            Create Account & Enter Workspace
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-[#7A7A7A]">
          Already registered?{' '}
          <button
            type="button"
            onClick={() => navigate('login')}
            className="font-semibold text-[#0E5A46] hover:underline cursor-pointer"
          >
            Sign in
          </button>
        </p>
      </Card>
    </div>
  );
};

export const ResetPasswordPage: React.FC = () => {
  const { resetPassword, navigate } = useKuri();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(
    null
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(resetPassword(email));
  };

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-10 sm:py-16">
      <Card className="p-5 sm:p-7 space-y-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E8F0ED] text-[#0E5A46]">
          <KeyRound className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h1 className="font-display text-xl font-bold text-[#1F1F1F]">
            Reset Password
          </h1>
          <p className="text-sm text-[#7A7A7A]">
            Enter your account email to request password recovery.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reset-email">Email Address</Label>
            <Input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mohyadden.mazin@kuricircle.demo"
              required
            />
          </div>
          {status && (
            <p
              className={`rounded-xl px-3.5 py-2.5 text-xs font-medium ${
                status.ok
                  ? 'bg-[#E8F0ED] text-[#0E5A46]'
                  : 'bg-[#FEE2E2] text-[#B91C1C]'
              }`}
            >
              {status.message}
            </p>
          )}
          <Button type="submit" className="w-full">
            Send Recovery Instructions
          </Button>
        </form>

        <button
          type="button"
          onClick={() => navigate('login')}
          className="w-full text-center text-xs font-medium text-[#0E5A46] hover:underline cursor-pointer"
        >
          Back to Sign In
        </button>
      </Card>
    </div>
  );
};
