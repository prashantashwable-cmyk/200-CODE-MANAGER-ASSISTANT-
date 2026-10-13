import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'quiet' | 'danger';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  children?: ReactNode;
  variant?: Variant;
  size?: 'md' | 'sm';
  block?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  className?: string;
}

/**
 * The one Button. Gold fill for the primary action, full-width on mobile via
 * `block`. Colour comes from tokens only.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  block,
  loading,
  icon,
  className = '',
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = [
    'ds-btn',
    `ds-btn--${variant}`,
    size === 'sm' ? 'ds-btn--sm' : '',
    block ? 'ds-btn--block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className="ds-btn__spinner" aria-hidden="true" /> : icon}
      {children}
    </button>
  );
}
