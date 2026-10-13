import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { X } from '@phosphor-icons/react';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  /** Already translated. */
  title: string;
  closeLabel: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Bottom sheet on mobile, centred dialog on wide screens. */
export function Sheet({ open, onClose, title, closeLabel, children, footer }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    // Stop the page behind from scrolling while the sheet owns the screen.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="ds-sheet__scrim"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="ds-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={panelRef}
      >
        <div className="ds-sheet__grabber" aria-hidden="true" />
        <div className="row between gap-3 mb-3">
          <h2 className="t-lg">{title}</h2>
          <button type="button" className="tappable shrink-0" onClick={onClose} aria-label={closeLabel}>
            <X size={20} />
          </button>
        </div>
        {children}
        {footer && <div className="mt-4">{footer}</div>}
      </div>
    </div>
  );
}
