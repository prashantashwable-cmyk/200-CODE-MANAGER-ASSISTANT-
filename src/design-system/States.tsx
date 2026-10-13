import type { ReactNode } from 'react';
import { Warning, Tray } from '@phosphor-icons/react';
import { Button } from './Button';

/**
 * Loading / empty / error states, designed with the same care as populated
 * states. Every screen in this build renders all of these explicitly — a bare
 * `return null` or a lone spinner is not an acceptable branch.
 */

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: string;
  className?: string;
}

export function Skeleton({ width = '100%', height = 14, radius, className = '' }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={`ds-skeleton ${className}`.trim()}
      style={{
        display: 'block',
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        ...(radius ? { borderRadius: radius } : null),
      }}
    />
  );
}

interface LoadingStateProps {
  /** Already-translated status text, announced to screen readers. */
  label: string;
  /** Number of skeleton rows to draw — match the real content's shape. */
  rows?: number;
  variant?: 'list' | 'cards' | 'stats' | 'block';
}

export function LoadingState({ label, rows = 4, variant = 'list' }: LoadingStateProps) {
  const items = Array.from({ length: rows }, (_, i) => i);

  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {variant === 'stats' && (
        <div className="grid-auto" style={{ ['--min' as string]: '150px' }}>
          {items.map((i) => (
            <div key={i} className="ds-card stack gap-2">
              <Skeleton width="55%" height={10} />
              <Skeleton width="75%" height={26} />
            </div>
          ))}
        </div>
      )}
      {variant === 'cards' && (
        <div className="grid-auto">
          {items.map((i) => (
            <div key={i} className="ds-card stack gap-2">
              <Skeleton width="65%" height={16} />
              <Skeleton width="90%" />
              <Skeleton width="40%" />
            </div>
          ))}
        </div>
      )}
      {variant === 'list' && (
        <div className="ds-card ds-card--flush">
          {items.map((i) => (
            <div key={i} className="row gap-3 p-3 hairline-top">
              <Skeleton width={40} height={40} radius="50%" />
              <div className="grow stack gap-2">
                <Skeleton width="60%" height={13} />
                <Skeleton width="35%" height={11} />
              </div>
            </div>
          ))}
        </div>
      )}
      {variant === 'block' && <Skeleton height={220} radius="var(--radius-card)" />}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  body: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, body, icon, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="ds-state">
      <span className="ds-state__icon">{icon ?? <Tray size={26} />}</span>
      <span className="ds-state__title">{title}</span>
      <p className="ds-state__body">{body}</p>
      {actionLabel && onAction && (
        <Button variant="ghost" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title: string;
  body: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export function ErrorState({ title, body, retryLabel, onRetry }: ErrorStateProps) {
  return (
    <div className="ds-state" role="alert">
      <span className="ds-state__icon ds-state__icon--error">
        <Warning size={26} />
      </span>
      <span className="ds-state__title">{title}</span>
      <p className="ds-state__body">{body}</p>
      {retryLabel && onRetry && (
        <Button variant="ghost" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
