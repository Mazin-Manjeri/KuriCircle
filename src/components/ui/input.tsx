import * as React from 'react';
import { cn } from '@/src/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-xl border border-[#E2DFD7] bg-[#FDFCFA] px-3.5 py-2 text-sm text-[#1F1F1F] transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#9A9891] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E5A46]/30 focus-visible:border-[#0E5A46] disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[88px] w-full rounded-xl border border-[#E2DFD7] bg-[#FDFCFA] px-3.5 py-2.5 text-sm text-[#1F1F1F] transition-colors placeholder:text-[#9A9891] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E5A46]/30 focus-visible:border-[#0E5A46] disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Input, Textarea };
