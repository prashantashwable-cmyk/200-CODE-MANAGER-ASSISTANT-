import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { WarningOctagon } from '@phosphor-icons/react';
import { useData } from '@/data/DataProvider';

export const INTEGRATIONS_CHANGED = 'aiec:integrations-changed';

/**
 * Shown to Admin on every screen while the app serves real customers (production) and any connection is still in test mode (189): the serious mistake of real customers being served by a test
 * configuration should be impossible to miss. It is silent otherwise, and in a demo build it never shows.
 */
export function SandboxBanner({ userId, tick }: { userId: string; tick: number }) {
  const repository = useData();
  const { t } = useTranslation();
  const [ids, setIds] = useState<string[]>([]);
  const [changed, setChanged] = useState(0);
  // The integrations screen says so the moment the environment or a mode changes, so the banner never waits for the next heartbeat.
  useEffect(() => { const on = () => setChanged((n) => n + 1); window.addEventListener(INTEGRATIONS_CHANGED, on); return () => window.removeEventListener(INTEGRATIONS_CHANGED, on); }, []);
  useEffect(() => {
    let live = true;
    void repository.getSandboxWarning(userId).then((w) => { if (live) setIds(w.environment === 'production' ? w.ids : []); }).catch(() => { if (live) setIds([]); });
    return () => { live = false; };
  }, [repository, userId, tick, changed]);
  if (ids.length === 0) return null;
  return (
    <div role="alert" data-sandbox-banner style={{ background: 'var(--color-surface)', borderBottom: '2px solid var(--color-error)', color: 'var(--color-error)', padding: '8px 16px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <WarningOctagon size={18} aria-hidden="true" />
      <span className="t-xs t-semibold">{t('integrationManagement.banner.title')}</span>
      <Link to="/integrations" className="t-xs" style={{ color: 'inherit', textDecoration: 'underline' }}>{t('integrationManagement.banner.open')}</Link>
    </div>
  );
}
