import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/src/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 rounded-xl text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E5A46]/40 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-[#0E5A46] text-white hover:bg-[#0B4737] shadow-sm',
        dark: 'bg-[#1F1F1F] text-white hover:bg-[#333333] shadow-sm',
        gold: 'bg-[#C8A45A] text-[#1F1F1F] hover:bg-[#B8944C] font-semibold',
        outline:
          'border border-[#E2DFD7] bg-white text-[#1F1F1F] hover:bg-[#F8F6F2]',
        secondary:
          'bg-[#F3F1EC] text-[#1F1F1F] hover:bg-[#E7E4DC]',
        ghost: 'text-[#555555] hover:bg-[#F3F1EC] hover:text-[#1F1F1F]',
        destructive: 'bg-[#B91C1C] text-white hover:bg-[#991B1B]',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-lg px-3 text-xs',
        lg: 'h-11 rounded-xl px-6 text-sm',
        icon: 'h-10 w-10 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
