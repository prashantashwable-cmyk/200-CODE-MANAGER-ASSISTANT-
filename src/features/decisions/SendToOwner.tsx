import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, Field, Input, TextArea, useToast } from '@/design-system';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { DecisionKind } from '@/features/authority/authority';

const TITLE_MIN = 8;
const SUMMARY_MIN = 20;

/**
 * Shown to Admin on a screen whose actions are the Owner's to take (master prompt P1): the actions there are refused
 * for Admin (`admin_cannot_decide`), and this card sends a request to the Owner's Decision Desk instead.
 */
export function SendToOwner({ kind }: { kind: DecisionKind }) {
  const { t } = useTranslation();
  const repository = useData();
  const { user } = useSession();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  if (user?.role !== 'admin') return null;
  const ok = title.trim().length >= TITLE_MIN && summary.trim().length >= SUMMARY_MIN;
  const send = async () => {
    setBusy(true);
    try {
      const card = await repository.prepareDecisionPacket(user.id, { kind, title: title.trim(), summary: summary.trim() });
      setSent(card.code); setTitle(''); setSummary('');
      toast.push(t('sendToOwner.sent', { code: card.code }));
    } catch { toast.push(t('sendToOwner.error')); } finally { setBusy(false); }
  };
  return (
    <Card title={t('sendToOwner.title')}>
      <div className="stack gap-2" data-testid="send-to-owner">
        <p className="text-sm">{t('sendToOwner.body')}</p>
        {sent && <p className="text-sm" data-testid="send-to-owner-sent">{t('sendToOwner.sent', { code: sent })}</p>}
        <Field label={t('sendToOwner.what')} hint={t('sendToOwner.whatHint', { min: TITLE_MIN })}>{({ id }) => <Input id={id} value={title} onChange={(e) => setTitle(e.target.value)} />}</Field>
        <Field label={t('sendToOwner.why')} hint={t('sendToOwner.whyHint', { min: SUMMARY_MIN })}>{({ id }) => <TextArea id={id} rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} />}</Field>
        <Button disabled={busy || !ok} onClick={() => void send()}>{t('sendToOwner.send')}</Button>
      </div>
    </Card>
  );
}
