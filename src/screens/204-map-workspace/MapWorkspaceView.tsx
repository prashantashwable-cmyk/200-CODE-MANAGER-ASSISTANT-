import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, EmptyState, ErrorState, Input, ListRow, LoadingState, MapCanvas, Screen, ScreenHeader } from '@/design-system';
import type { MapHeatCell, MapMarker } from '@/design-system';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { MapSitePin, MapSitesView } from '@/data/repository';

const LEVEL_TONE = { exact: 'emerald', fuzzed: 'warning', density: 'muted', none: 'muted' } as const;
const metres = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`);

export function MapWorkspaceScreen() {
  const { t } = useTranslation();
  const repository = useData();
  const { user, role } = useSession();
  const navigate = useNavigate();
  const uid = user?.id ?? '';
  const [view, setView] = useState<MapSitesView | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [here, setHere] = useState<{ lat: number; lng: number } | undefined>(undefined);

  // Where the person is only sharpens the distance shown for an approximate pin; refusing is fine.
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition((p) => setHere({ lat: p.coords.latitude, lng: p.coords.longitude }), () => undefined, { maximumAge: 300_000, timeout: 4000 });
  }, []);

  const read = useCallback(async () => {
    if (!uid) return;
    try { const v = await repository.listMapSites(uid, here); setView(v); setState('ready'); } catch { setState((s) => (s === 'ready' ? s : 'error')); }
  }, [repository, uid, here]);
  useEffect(() => { setState((s) => (s === 'ready' ? s : 'loading')); void read(); }, [read]);

  const shown = useMemo(() => (view?.pins ?? []).filter((p) => !q.trim() || `${p.label} ${p.code}`.toLowerCase().includes(q.trim().toLowerCase())), [view, q]);
  const markers = useMemo<MapMarker[]>(() => shown.filter((p): p is MapSitePin & { point: { lat: number; lng: number } } => !!p.point).map((p) => ({ id: p.id, lat: p.point.lat, lng: p.point.lng, tone: LEVEL_TONE[p.level], label: `${p.label} (${t(`mapWork.level.${p.level}`)})`, selected: selected === p.id, onClick: () => setSelected(p.id) })), [shown, selected, t]);
  const heat = useMemo<MapHeatCell[]>(() => { const max = Math.max(1, ...(view?.density ?? []).map((c) => c.count)); return (view?.density ?? []).map((c, i) => ({ id: `d${i}`, lat: c.lat, lng: c.lng, weight: c.count / max })); }, [view]);

  return (
    <Screen width="wide">
      <ScreenHeader title={t('mapWork.title')} subtitle={t(role === 'admin' ? 'mapWork.subtitleAdmin' : 'mapWork.subtitle')} action={role === 'surveyor' || role === 'owner' ? <Button size="sm" onClick={() => navigate('/capture')}>{t('mapWork.capture')}</Button> : undefined} />
      {state === 'loading' && <LoadingState label={t('mapWork.loading')} rows={3} variant="block" />}
      {state === 'error' && <ErrorState title={t('mapWork.error.title')} body={t('mapWork.error.body')} retryLabel={t('mapWork.error.retry')} onRetry={() => void read()} />}
      {state === 'ready' && view && (
        <div className="stack gap-4">
          <MapCanvas label={t('mapWork.mapLabel')} markers={markers} heat={heat} height={420} />
          {role === 'admin' && view.density.length > 0 && <p className="t-sm t-muted">{t('mapWork.densityNote', { n: view.density.length })}</p>}
          {role === 'admin' && view.density.length === 0 && <EmptyState title={t('mapWork.noAreas.title')} body={t('mapWork.noAreas.body')} />}
          {view.pins.some((p) => p.level === 'fuzzed') && <p className="t-sm t-muted">{t('mapWork.fuzzNote', { m: view.fuzzRadiusM })}</p>}
          {role !== 'admin' && view.pins.length === 0 && <EmptyState title={t('mapWork.empty.title')} body={t('mapWork.empty.body')} />}
          {view.pins.length > 0 && (
            <Card title={t('mapWork.listTitle', { n: shown.length })}>
              <div className="stack gap-3">
                <Input aria-label={t('mapWork.search')} placeholder={t('mapWork.search')} value={q} onChange={(e) => setQ(e.target.value)} />
                {shown.length === 0 ? <EmptyState title={t('mapWork.noMatch.title')} body={t('mapWork.noMatch.body')} /> : shown.map((p) => (
                  <ListRow
                    key={p.id}
                    title={p.label}
                    subtitle={`${p.code} · ${t(`stage.${p.stage}`)}${p.distanceM != null ? ` · ${t('mapWork.away', { d: metres(p.distanceM) })}` : ''} · ${t(`mapWork.contact.${p.contact}`)}`}
                    trailing={<Badge tone={p.level === 'exact' ? 'success' : 'warning'}>{t(`mapWork.level.${p.level}`)}</Badge>}
                    onClick={() => setSelected(p.id)}
                  />
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </Screen>
  );
}
