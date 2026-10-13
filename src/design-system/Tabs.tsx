import type { ReactNode } from 'react';

export interface TabItem {
  id: string;
  /** Already translated by the caller. */
  label: string;
  icon?: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  /** Accessible name for the tablist. */
  label: string;
  className?: string;
}

/** Pill tabs — used for top-level switches like Login / Try Demo. */
export function Tabs({ items, value, onChange, label, className = '' }: TabsProps) {
  return (
    <div className={`ds-tabs ${className}`.trim()} role="tablist" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={value === item.id}
          className="ds-tabs__tab"
          onClick={() => onChange(item.id)}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}

/** Underlined section switcher, for in-page sections on a detail screen. */
export function SegBar({ items, value, onChange, label, className = '' }: TabsProps) {
  return (
    <div className={`ds-segbar ${className}`.trim()} role="tablist" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={value === item.id}
          className="ds-segbar__item"
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

interface ChipProps {
  children: ReactNode;
  pressed?: boolean;
  onClick?: () => void;
  icon?: ReactNode;
}

/** Filter chip. Multi-select filter rows across list and map screens. */
export function Chip({ children, pressed, onClick, icon }: ChipProps) {
  return (
    <button type="button" className="ds-chip" aria-pressed={pressed} onClick={onClick}>
      {icon}
      {children}
    </button>
  );
}
