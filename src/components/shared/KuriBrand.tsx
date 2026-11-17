import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

export const KuriLogoMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn('h-8 w-8 shrink-0', className)}
    aria-hidden="true"
  >
    {Array.from({ length: 12 }).map((_, i) => {
      const angle = i * 30;
      return (
        <rect
          key={i}
          x="16.7"
          y="3"
          width="2.6"
          height="8.2"
          rx="1.3"
          fill="#0E5A46"
          opacity={i % 2 === 0 ? 1 : 0.72}
          transform={`rotate(${angle} 18 18)`}
        />
      );
    })}
    <circle cx="18" cy="18" r="3.4" fill="#C8A45A" />
  </svg>
);

export const UserAvatar: React.FC<{
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ name, src, size = 'md', className }) => {
  const [failed, setFailed] = React.useState(false);
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');

  const sizeClass = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-xs',
    lg: 'h-14 w-14 text-base',
    xl: 'h-20 w-20 text-xl',
  }[size];

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={cn(
          'rounded-full object-cover bg-[#E8F0ED] shrink-0',
          sizeClass,
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-[#E8F0ED] text-[#0E5A46] font-display font-semibold flex items-center justify-center shrink-0',
        sizeClass,
        className
      )}
      aria-label={name}
    >
      {initials || 'KC'}
    </div>
  );
};

export const SemanticStatusText: React.FC<{
  status: string;
  className?: string;
}> = ({ status, className }) => {
  const normalized = status.toLowerCase();
  let Icon = Clock;
  let color = 'text-[#7A7A7A]';

  if (
    normalized === 'verified' ||
    normalized === 'active' ||
    normalized === 'resolved' ||
    normalized === 'intact'
  ) {
    Icon = CheckCircle2;
    color = 'text-[#0E5A46]';
  } else if (
    normalized === 'rejected' ||
    normalized === 'suspended' ||
    normalized === 'tampered' ||
    normalized === 'broken'
  ) {
    Icon = XCircle;
    color = 'text-[#B91C1C]';
  } else if (
    normalized === 'escalated' ||
    normalized === 'open' ||
    normalized === 'pending' ||
    normalized === 'submitted' ||
    normalized === 'under_review'
  ) {
    Icon = AlertTriangle;
    color = 'text-[#9A6B16]';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium capitalize whitespace-nowrap',
        color,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{status.replace(/_/g, ' ')}</span>
    </span>
  );
};

export const DemoDisclosureBanner: React.FC<{ compact?: boolean }> = ({
  compact = false,
}) => (
  <div
    className={cn(
      'flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#F8F6F2] px-4 py-2 text-xs text-[#555555] border border-[#E6E2D8]',
      compact && 'py-1.5 px-3.5'
    )}
  >
    <div className="flex items-center gap-2">
      <ShieldCheck className="h-4 w-4 text-[#0E5A46] shrink-0" />
      <span>
        <strong className="font-semibold text-[#1F1F1F]">
          Demonstration Environment · Simulated Data Only
        </strong>{' '}
        — No real deposits, custody, or rotating chit payouts occur on this prototype.
      </span>
    </div>
    <span className="text-[11px] text-[#7A7A7A] whitespace-nowrap">
      SHA-256 Linked Audit Ledger Active
    </span>
  </div>
);
