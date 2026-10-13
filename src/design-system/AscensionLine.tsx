import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Check, Lock, Warning } from '@phosphor-icons/react';

export type AscensionStepStatus = 'complete' | 'current' | 'upcoming' | 'blocked';

export interface AscensionStep {
  id: string;
  /** Already translated by the caller — this component never calls t(). */
  label: string;
  meta?: string;
  status: AscensionStepStatus;
  onClick?: () => void;
  trailing?: ReactNode;
}

interface AscensionLineProps {
  steps: AscensionStep[];
  /** Vertical on phones, horizontal is available for wide layouts. */
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

/**
 * THE signature element — a stylized elevator floor-indicator used as the
 * progress language for every stage-based flow in AIEC: CRM pipeline stages,
 * installation SOP steps, delivery checklists, onboarding wizards, training
 * paths, negotiation rounds, and the customer-facing lifecycle timeline.
 *
 * Built once, here. Screens must reuse this rather than inventing their own
 * stepper — that consistency is what makes a 200-screen app read as one product.
 */
export function AscensionLine({
  steps,
  orientation = 'vertical',
  className = '',
}: AscensionLineProps) {
  const completedCount = steps.filter((s) => s.status === 'complete').length;
  const previousCompleted = useRef(completedCount);
  const [glowIndex, setGlowIndex] = useState<number | null>(null);

  // A node glows warmly for a moment at the instant it completes — the one
  // piece of motion this element gets.
  useEffect(() => {
    const advanced = completedCount > previousCompleted.current;
    // Track every change, not just forward ones — otherwise undoing a step
    // leaves a stale baseline and the next completion glows the wrong node.
    previousCompleted.current = completedCount;
    if (!advanced) return undefined;
    setGlowIndex(completedCount - 1);
    const timer = window.setTimeout(() => setGlowIndex(null), 400);
    return () => window.clearTimeout(timer);
  }, [completedCount]);

  return (
    <ol
      className={`ds-ascension ds-ascension--${orientation} ${className}`}
      style={{ listStyle: 'none', margin: 0, padding: 0 }}
    >
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        // The rail segment leaving this node is gold once this node is done.
        const railFilled = step.status === 'complete';
        const Interactive = step.onClick ? 'button' : 'div';

        return (
          <li
            key={step.id}
            className={`ds-ascension__step ds-ascension__step--${step.status}`}
          >
            {!isLast && (
              <span
                aria-hidden="true"
                className={`ds-ascension__rail ${
                  railFilled ? 'ds-ascension__rail--filled' : ''
                }`}
              />
            )}
            <span
              className={[
                'ds-ascension__node',
                `ds-ascension__node--${step.status}`,
                glowIndex === index ? 'ds-ascension__node--just-completed' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {step.status === 'complete' && <Check size={13} weight="bold" />}
              {step.status === 'blocked' && <Warning size={13} weight="bold" />}
              {step.status === 'upcoming' && <Lock size={11} />}
            </span>
            <Interactive
              className="grow stack gap-1"
              style={
                step.onClick
                  ? { background: 'none', border: 0, textAlign: 'left', cursor: 'pointer', color: 'inherit', padding: 0 }
                  : undefined
              }
              onClick={step.onClick}
              {...(step.onClick ? { type: 'button' as const } : {})}
            >
              <span className="ds-ascension__label">{step.label}</span>
              {step.meta && <span className="ds-ascension__meta">{step.meta}</span>}
            </Interactive>
            {step.trailing}
          </li>
        );
      })}
    </ol>
  );
}
