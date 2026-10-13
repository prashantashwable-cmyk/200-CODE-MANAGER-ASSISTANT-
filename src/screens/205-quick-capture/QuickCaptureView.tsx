import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, Field, Input, MapCanvas, Screen, ScreenHeader, formatDateTime } from '@/design-system';
import type { MapMarker } from '@/design-system';
import { isIndianMobile } from '@/features/validation/india';
import { useQuickCapture } from './useQuickCapture';

type T = ReturnType<typeof useTranslation>['t'];
const STATUS_TONE = { pending: 'warning', synced: 'success', failed: 'error', conflict: 'error' } as const;

export function QuickCaptureScreen() {
  const { t, i18n } = useTranslation();
  const q = useQuickCapture();
  const [siteName, setSiteName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [city, setCity] = useState('Pune');
  const [point, setPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [accuracyM, setAccuracyM] = useState<number | null>(null);
  const [locating, setLocating] = useState<'idle' | 'busy' | 'denied'>('idle');
  const [tried, setTried] = useState(false);

  const phoneBad = contactPhone.trim() !== '' && !isIndianMobile(contactPhone);
  const problem = !siteName.trim() ? 'site' : !point ? 'point' : phoneBad ? 'phone' : null;

  const locate = () => {
    if (!('geolocation' in navigator)) { setLocating('denied'); return; }
    setLocating('busy');
    navigator.geolocation.getCurrentPosition(
      (p) => { setPoint({ lat: p.coords.latitude, lng: p.coords.longitude }); setAccuracyM(Math.round(p.coords.accuracy)); setLocating('idle'); },
      () => setLocating('denied'),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10_000 },
    );
  };
  const submit = async () => {
    setTried(true);
    if (problem) return;
    await q.capture({ siteName, contactName, contactPhone, city, location: point, accuracyM });
    setSiteName(''); setContactName(''); setContactPhone(''); setTried(false);
  };
  const markers: MapMarker[] = point ? [{ id: 'new', lat: point.lat, lng: point.lng, tone: 'accent', label: t('quickCapture.pinLabel'), selected: true }] : [];

  return (
    <Screen width="wide">
      <ScreenHeader title={t('quickCapture.title')} subtitle={t('quickCapture.subtitle')} />
      <div className="stack gap-3" role="status" aria-live="polite">
        {!q.online && <Badge tone="warning">{t('quickCapture.offline')}</Badge>}
        {q.waiting > 0 && <p className="t-sm">{t('quickCapture.waiting', { count: q.waiting })}</p>}
      </div>
      <div className="main-aside" style={{ marginTop: 'var(--space-3)' }}>
        <div className="stack gap-4">
          <MapCanvas label={t('quickCapture.mapLabel')} markers={markers} height={320} onMapClick={(p) => { setPoint(p); setAccuracyM(null); }} />
          <div className="row gap-2 wrap">
            <Button variant="ghost" loading={locating === 'busy'} onClick={locate}>{t('quickCapture.useMyLocation')}</Button>
            <span className="t-sm t-muted">{point ? (accuracyM != null ? t('quickCapture.pinSet', { acc: accuracyM }) : t('quickCapture.pinByHand')) : t('quickCapture.tapMap')}</span>
          </div>
          {locating === 'denied' && <p className="t-sm t-muted" role="alert">{t('quickCapture.locationDenied')}</p>}
          {accuracyM != null && accuracyM > 30 && <p className="t-sm t-muted">{t('quickCapture.poorFix', { m: accuracyM })}</p>}
        </div>
        <Card title={t('quickCapture.formTitle')}>
          <div className="stack gap-3">
            <Field label={t('quickCapture.siteName')} required error={tried && problem === 'site' ? t('quickCapture.error.site') : undefined}>{({ id }) => <Input id={id} value={siteName} onChange={(e) => setSiteName(e.target.value)} autoComplete="off" />}</Field>
            <Field label={t('quickCapture.contactName')}>{({ id }) => <Input id={id} value={contactName} onChange={(e) => setContactName(e.target.value)} autoComplete="off" />}</Field>
            <Field label={t('quickCapture.contactPhone')} hint={t('quickCapture.phoneHint')} error={phoneBad ? t('quickCapture.error.phone') : undefined}>{({ id }) => <Input id={id} inputMode="tel" mono value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />}</Field>
            <Field label={t('quickCapture.city')}>{({ id }) => <Input id={id} value={city} onChange={(e) => setCity(e.target.value)} />}</Field>
            {tried && problem === 'point' && <p className="t-error t-sm" role="alert">{t('quickCapture.error.point')}</p>}
            <Button block onClick={() => void submit()}>{t('quickCapture.save')}</Button>
          </div>
        </Card>
      </div>

      {q.outcomes.length > 0 && (
        <div className="stack gap-2" style={{ marginTop: 'var(--space-4)' }}>
          <h2 className="t-md t-semibold">{t('quickCapture.results')}</h2>
          {q.outcomes.map((o) => <Card key={o.clientEventId} title={o.siteName} body={t(`quickCapture.outcome.${o.result.outcome}`, { code: o.result.lead.code })} />)}
        </div>
      )}
      {q.queue.length > 0 && (
        <div className="stack gap-2" style={{ marginTop: 'var(--space-4)' }}>
          <div className="row between"><h2 className="t-md t-semibold">{t('quickCapture.onPhone')}</h2>{q.queue.some((i) => i.status === 'synced') && <Button size="sm" variant="ghost" onClick={q.clearSent}>{t('quickCapture.clearSent')}</Button>}</div>
          {q.queue.map((i) => (
            <Card key={i.clientEventId} title={String((i.payload as { siteName?: string }).siteName ?? i.kind)} aside={<Badge tone={STATUS_TONE[i.status]}>{t(`quickCapture.status.${i.status}`)}</Badge>}>
              <p className="t-xs t-muted">{t('quickCapture.capturedAt', { when: formatDateTime(i.capturedAt, i18n.language) })}{i.lastError ? ` · ${errorText(t, i.lastError)}` : ''}</p>
              {i.status === 'failed' && <div className="row gap-2" style={{ marginTop: 'var(--space-2)' }}><Button size="sm" onClick={q.retry}>{t('quickCapture.retry')}</Button><Button size="sm" variant="ghost" onClick={() => q.discard(i.clientEventId)}>{t('quickCapture.discard')}</Button></div>}
            </Card>
          ))}
        </div>
      )}
    </Screen>
  );
}

const errorText = (t: T, code: string) => t(`quickCapture.error.${code}`, { defaultValue: t('quickCapture.error.generic') });
