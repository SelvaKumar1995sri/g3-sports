import { clsx } from 'clsx';

interface SectionHeadingProps {
  label?: string;
  title: string;
  highlight?: string;
  subtitle?: string;
  align?: 'left' | 'center';
}

export function SectionHeading({
  label,
  title,
  highlight,
  subtitle,
  align = 'center',
}: SectionHeadingProps) {
  return (
    <div className={clsx('mb-12', align === 'center' ? 'text-center' : 'text-left')}>
      {label && (
        <p className="text-xs font-bold text-cyan uppercase tracking-[3px] mb-3">{label}</p>
      )}
      <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
        {title}{' '}
        {highlight && <span className="text-gradient-cyan">{highlight}</span>}
      </h2>
      {subtitle && (
        <p className={clsx('mt-4 text-muted text-lg max-w-2xl leading-relaxed', align === 'center' && 'mx-auto')}>{subtitle}</p>
      )}
    </div>
  );
}
