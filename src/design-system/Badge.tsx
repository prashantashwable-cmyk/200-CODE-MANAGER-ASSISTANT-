import type { ReactNode } from 'react';

export type BadgeTone = 'accent' | 'emerald' | 'success' | 'warning' | 'error' | 'neutral';

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  /** Shows a status dot; `live` makes it pulse (use only for genuinely live data). */
  dot?: boolean | 'live';
  className?: string;
}

export function Badge({ children, tone = 'accent', dot, className = '' }: BadgeProps) {
  const toneClass = tone === 'accent' ? '' : `ds-badge--${tone}`;
  return (
    <span className={`ds-badge ${toneClass} ${className}`.trim()}>
      {dot && (
        <span
          aria-hidden="true"
          className={`ds-badge__dot ${dot === 'live' ? 'ds-badge__dot--live' : ''}`}
        />
      )}
      {children}
    </span>
  );
}
