import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Siren, WarningOctagon } from '@phosphor-icons/react';
import { Button, Card } from '@/design-system';
import type { FieldSosView } from '@/data/repository';
import { secondsLeft, sosPhaseOf } from '@/features/safety/sos';

/**
 * The field SOS, shared by every field role. It is always on screen (fixed above the tab bar), one tap starts it, and a short
 * countdown lets an accidental press be cancelled before Admin hears. Once sent, the person can see whether Admin has seen it.
 * Text lives in the shared `sos.*` namespace; the repository decides when it is actually sent.
 */
const FLOAT: CSSProperties = {
  position: 'fixed',
  insetInlineEnd: 'var(--space-4)',
  bottom: 'calc(var(--shell-bottom-height, 0px) + var(--space-4))',
  zIndex: 30,
  boxShadow: 'var(--shadow-lg, 0 8px 24px rgba(0,0,0,0.25))',
  minHeight: 56,
  minWidth: 56,
  borderRadius: 999,
};

export function SosButton({ attempt, busy, onBegin }: { attempt: FieldSosView | null; busy: boolean; onBegin: () => void }) {
  const { t } = useTranslation();
  // While an SOS is in hand the banner is the control, so the button steps aside.
  if (attempt && attempt.status !== 'cancelled') return null;
  return (
    <Button variant="danger" style={FLOAT} disabled={busy} onClick={onBegin} aria-label={`${t('sos.button')}. ${t('sos.buttonHint')}`} icon={<Siren size={22} weight="fill" aria-hidden="true" />}>
      {t('sos.button')}
    </Button>
  );
}

export function SosStatus({ attempt, busy, onCancel, onElapsed }: { attempt: FieldSosView | null; busy: boolean; onCancel: () => void; onElapsed: () => void }) {
  const { t } = useTranslation();
  const [now, setNow] = useState(Date.now());
  const pending = attempt?.status === 'pending';
  const sendsAt = attempt?.sendsAt;
  useEffect(() => {
    if (!pending || !sendsAt) return undefined;
    const tick = window.setInterval(() => setNow(Date.now()), 250);
    // A moment after the window closes the repository has sent it: read it back.
    const done = window.setTimeout(onElapsed, Math.max(0, new Date(sendsAt).getTime() - Date.now()) + 400);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(done);
    };
  }, [pending, sendsAt, onElapsed]);

  if (!attempt) return null;
  const phase = sosPhaseOf(attempt);
  if (phase === 'cancelled') return null;

  if (phase === 'sending') {
    return (
      <Card className="mb-3" style={{ borderColor: 'var(--color-error)' }}>
        <div className="stack gap-2" role="alert">
          <div className="row gap-2" style={{ alignItems: 'center' }}>
            <WarningOctagon size={26} color="var(--color-error)" aria-hidden="true" />
            <strong className="t-md">{t('sos.sending', { seconds: secondsLeft(attempt.sendsAt, now) })}</strong>
          </div>
          <p className="t-sm t-muted">{t('sos.sendingBody')}</p>
          <Button variant="secondary" block disabled={busy} onClick={onCancel}>
            {t('sos.cancel')}
          </Button>
        </div>
      </Card>
    );
  }

  const body = attempt.alertStatus === 'resolved' ? 'sos.sentResolved' : attempt.alertStatus === 'acknowledged' ? 'sos.sentAcknowledged' : 'sos.sentOpen';
  return (
    <Card className="mb-3" style={{ borderColor: 'var(--color-error)' }}>
      <div className="row-top gap-2" role="status">
        <Siren size={24} color="var(--color-error)" weight="fill" aria-hidden="true" />
        <div className="stack gap-1">
          <strong className="t-md">{t('sos.sent')}</strong>
          <p className="t-sm">{t(body)}</p>
        </div>
      </div>
    </Card>
  );
}
