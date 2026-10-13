import type { ReactNode } from 'react';

interface ScreenProps {
  children: ReactNode;
  /** narrow = auth/wizard/form; wide = admin map and analytics. */
  width?: 'default' | 'narrow' | 'wide';
  className?: string;
}

export function Screen({ children, width = 'default', className = '' }: ScreenProps) {
  const widthClass = width === 'default' ? '' : `ds-screen--${width}`;
  return <div className={`ds-screen ${widthClass} ${className}`.trim()}>{children}</div>;
}

interface ScreenHeaderProps {
  /** Already translated. */
  title: string;
  subtitle?: string;
  action?: ReactNode;
  back?: () => void;
  backLabel?: string;
}

export function ScreenHeader({ title, subtitle, action, back, backLabel }: ScreenHeaderProps) {
  return (
    <div className="row between gap-3 ds-screen-header">
      <div className="row gap-2 grow" style={{ alignItems: 'flex-start' }}>
        {back && (
          <button
            type="button"
            className="tappable shrink-0"
            onClick={back}
            aria-label={backLabel ?? 'Back'}
            style={{ marginLeft: 'calc(var(--space-2) * -1)' }}
          >
            <span aria-hidden="true" style={{ fontSize: '1.25rem', lineHeight: 1 }}>
              ‹
            </span>
          </button>
        )}
        <div className="stack gap-1 grow">
          <h1 className="ds-screen-header__title t-balance">{title}</h1>
          {subtitle && <p className="ds-screen-header__subtitle">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/**
 * Sticky bottom action bar for a screen's primary CTA — thumb-reachable, as
 * the design system requires for any screen with a single main action.
 * Pair with `pb-action-bar` on the scrolling content above it.
 */
export function ActionBar({ children }: { children: ReactNode }) {
  return <div className="ds-action-bar">{children}</div>;
}
