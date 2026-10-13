import type { ReactNode } from 'react';
import { TrendDown, TrendUp } from '@phosphor-icons/react';

/* ---------------------------------------------------------------- StatTile */

interface StatTileProps {
  /** Already translated. */
  label: string;
  value: ReactNode;
  /** Signed percentage or absolute change; positive is not always "good". */
  delta?: { value: string; direction: 'up' | 'down'; tone: 'success' | 'error' | 'neutral' };
  caption?: string;
  large?: boolean;
}

export function StatTile({ label, value, delta, caption, large }: StatTileProps) {
  const toneClass =
    delta?.tone === 'success' ? 't-success' : delta?.tone === 'error' ? 't-error' : 't-muted';
  return (
    <div className="ds-stat">
      <span className="ds-stat__label">{label}</span>
      <span className={`ds-stat__value ${large ? 'ds-stat__value--lg' : ''}`.trim()}>{value}</span>
      {delta && (
        <span className={`ds-stat__delta ${toneClass}`}>
          {delta.direction === 'up' ? <TrendUp size={13} /> : <TrendDown size={13} />}
          {delta.value}
        </span>
      )}
      {caption && <span className="t-xs t-muted">{caption}</span>}
    </div>
  );
}

/* ----------------------------------------------------------------- ListRow */

interface ListRowProps {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
}

export function ListRow({ leading, title, subtitle, trailing, onClick }: ListRowProps) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      className={`ds-listrow ${onClick ? '' : 'ds-listrow--static'}`.trim()}
      onClick={onClick}
      {...(onClick ? { type: 'button' as const } : {})}
    >
      {leading}
      <span className="grow stack gap-1" style={{ minWidth: 0 }}>
        <span className="t-medium truncate">{title}</span>
        {subtitle && <span className="t-xs t-muted truncate">{subtitle}</span>}
      </span>
      {trailing && <span className="shrink-0">{trailing}</span>}
    </Tag>
  );
}

/* ------------------------------------------------------------------ Avatar */

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  src?: string;
}

export function Avatar({ name, size = 'md', src }: AvatarProps) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  const sizeClass = size === 'md' ? '' : `ds-avatar--${size}`;
  return (
    <span className={`ds-avatar ${sizeClass}`.trim()} aria-hidden="true">
      {src ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
    </span>
  );
}

/* ------------------------------------------------------------- ProgressBar */

interface ProgressBarProps {
  /** 0..1 */
  value: number;
  tone?: 'accent' | 'success' | 'warning' | 'error';
  label?: string;
}

export function ProgressBar({ value, tone = 'accent', label }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, value));
  const toneClass = tone === 'accent' ? '' : `ds-progress__fill--${tone}`;
  return (
    <div
      className="ds-progress"
      role="progressbar"
      aria-valuenow={Math.round(pct * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <span className={`ds-progress__fill ${toneClass}`.trim()} style={{ width: `${pct * 100}%` }} />
    </div>
  );
}
