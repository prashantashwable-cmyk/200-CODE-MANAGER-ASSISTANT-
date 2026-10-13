import type { CSSProperties, ReactNode } from 'react';

interface CardProps {
  children?: ReactNode;
  title?: ReactNode;
  body?: ReactNode;
  action?: ReactNode;
  aside?: ReactNode;
  /** Removes padding — for cards that host a flush list or a map. */
  flush?: boolean;
  padLarge?: boolean;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
  /** Staggers the fade-and-rise so a grid of cards doesn't pop in as one block. */
  riseIndex?: number;
}

/**
 * The one Card in the app. 16-20px radius, soft ambient shadow, gold hairline
 * border — all from tokens, so it is correct in all 7 appearance modes.
 * Screens extend this rather than building a second, inconsistent card.
 */
export function Card({
  children,
  title,
  body,
  action,
  aside,
  flush,
  padLarge,
  selected,
  onClick,
  className = '',
  style,
  riseIndex,
}: CardProps) {
  const classes = [
    'ds-card',
    flush ? 'ds-card--flush' : '',
    padLarge ? 'ds-card--pad-lg' : '',
    onClick ? 'ds-card--interactive' : '',
    selected ? 'ds-card--selected' : '',
    riseIndex !== undefined ? 'rise' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const mergedStyle: CSSProperties = {
    ...style,
    ...(riseIndex !== undefined
      ? { animationDelay: `${Math.min(riseIndex, 8) * 40}ms` }
      : null),
  };

  const inner = (
    <>
      {(title || aside) && (
        <div className="ds-card__header">
          {title && <div className="ds-card__title">{title}</div>}
          {aside && <div className="shrink-0">{aside}</div>}
        </div>
      )}
      {body && <div className="ds-card__body mt-2">{body}</div>}
      {children}
      {action && <div className="mt-3">{action}</div>}
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={classes} style={mergedStyle} onClick={onClick}>
        {inner}
      </button>
    );
  }

  return (
    <div className={classes} style={mergedStyle}>
      {inner}
    </div>
  );
}
