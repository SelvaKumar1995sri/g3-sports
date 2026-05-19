import Link from 'next/link';
import { clsx } from 'clsx';

interface GradientButtonProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'cyan' | 'lime' | 'outline';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function GradientButton({
  href,
  onClick,
  children,
  variant = 'cyan',
  className = '',
  disabled = false,
  type = 'button',
}: GradientButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-bold rounded-full px-7 py-3.5 text-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:opacity-50';

  const variants = {
    cyan: 'bg-gradient-to-r from-cyan to-lime text-bg hover:opacity-90 hover:scale-105',
    lime: 'bg-lime text-bg hover:opacity-90 hover:scale-105',
    outline: 'border border-cyan/40 text-cyan hover:bg-cyan/10 hover:border-cyan/60',
  };

  const classes = clsx(base, variants[variant], className);

  if (href) {
    return <Link href={href} className={classes}>{children}</Link>;
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}
