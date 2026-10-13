import { SandboxBanner } from '@/features/integrations/SandboxBanner';
import { SecurityGate } from '@/features/security/SecurityGate';
import { useBrand } from '@/features/brand/BrandProvider';
import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/session/SessionProvider';
import { AssistantBell, AssistantDrawer } from '@/features/work/AssistantDrawer';
import { useFollowUpHeartbeat } from '@/features/work/useFollowUpHeartbeat';
import { NAV_BY_ROLE } from './navConfig';
import { screenRoutes } from './registry';

/**
 * The role-aware shell. Bottom tab bar on a phone, left sidebar from 1024px —
 * the same navigation reflowed, not two different navigations.
 */
export function AppShell() {
  const { t } = useTranslation();
  const { brand } = useBrand();
  const { user, role, isDemo, signOut, serverSession } = useSession();
  const location = useLocation();
  // The app's one clock, and every role's assistant — see features/work.
  const heartbeat = useFollowUpHeartbeat(user?.id);
  const [assistantOpen, setAssistantOpen] = useState(false);

  // Publishes the sticky top area's live height (the demo banner wraps on a
  // phone) so a screen's own sticky filter bar can pin just below it.
  // …and the bottom tab bar's (0 on desktop, where it's hidden), so a
  // screen's sticky action bar sits above it instead of behind it.
  const topRef = useRef<HTMLDivElement>(null);
  const tabbarRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const top = topRef.current;
    const tabbar = tabbarRef.current;
    if (!top || !tabbar) return undefined;
    const root = document.documentElement.style;
    const publish = () => {
      root.setProperty('--shell-top-height', `${top.offsetHeight}px`);
      root.setProperty('--shell-bottom-height', `${tabbar.offsetHeight}px`);
    };
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(top);
    observer.observe(tabbar);
    window.addEventListener('resize', publish);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', publish);
    };
  }, []);

  // When the tab bar scrolls, keep the current screen's tab in view (e.g. Logistics, far to the right).
  useEffect(() => {
    const active = tabbarRef.current?.querySelector<HTMLElement>('[aria-current="page"]');
    active?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [location.pathname]);

  const items = role ? NAV_BY_ROLE[role] : [];

  // Highlight by the route's declared tab, so a deep screen like
  // /admin/analytics/revenue still lights up the Analytics tab.
  const activeRoute = screenRoutes.find((r) => {
    if (r.path === location.pathname) return true;
    const pattern = new RegExp(`^${r.path.replace(/:[^/]+/g, '[^/]+')}$`);
    return pattern.test(location.pathname);
  });
  const declaredTab = activeRoute?.tab;
  const activeTab = typeof declaredTab === 'string' ? declaredTab : role ? declaredTab?.[role] : undefined;

  // The shell alone decides what's lit — a NavLink's own prefix matching used
  // to light Home (/admin) on every admin page and ignore declared tabs.
  const isActive = (itemId: string, itemPath: string) =>
    activeTab
      ? activeTab === itemId
      : location.pathname === itemPath || (itemId !== 'home' && location.pathname.startsWith(`${itemPath}/`));

  return (
    <div className="shell">
      <div className="shell__top" ref={topRef}>
        {isDemo && (
          <div className="shell__demo-banner" role="status">
            <span>{t('demo.banner')}</span>
            <button
              type="button"
              onClick={signOut}
              className="ds-btn ds-btn--quiet ds-btn--sm"
              style={{ minHeight: 28, color: 'inherit', textDecoration: 'underline' }}
            >
              {t('demo.exit')}
            </button>
          </div>
        )}
        {serverSession && (
          <div className="shell__demo-banner" role="status" data-server-sample>
            <span>{t('demo.serverSample')}</span>
          </div>
        )}
        {role === 'admin' && user && <SandboxBanner userId={user.id} tick={heartbeat.tick} />}
        <SecurityGate />
        <div className="shell__topbar">
          <span className="row gap-2">
            {brand?.logo ? <img className="shell__brand-logo" src={brand.logo.dataUrl} alt="" aria-hidden="true" /> : (
            <span className="brand-shaft" aria-hidden="true">
              <span className="brand-shaft__floor brand-shaft__floor--lit" />
              <span className="brand-shaft__floor brand-shaft__floor--lit" />
              <span className="brand-shaft__floor" />
            </span>)}
            <span className="shell__brand-mark">{t('app.name')}</span>
          </span>
          <AssistantBell variant="topbar" unread={heartbeat.unread} onClick={() => setAssistantOpen(true)} />
        </div>
      </div>

      <div className="shell__body">
        <nav className="shell__sidebar" aria-label={t('nav.menu')}>
          <div className="shell__brand">
            {brand?.logo ? <img className="shell__brand-logo" src={brand.logo.dataUrl} alt="" aria-hidden="true" /> : (
            <span className="brand-shaft" aria-hidden="true">
              <span className="brand-shaft__floor brand-shaft__floor--lit" />
              <span className="brand-shaft__floor brand-shaft__floor--lit" />
              <span className="brand-shaft__floor" />
            </span>)}
            <span className="shell__brand-mark">{t('app.name')}</span>
          </div>
          <AssistantBell variant="sidebar" unread={heartbeat.unread} onClick={() => setAssistantOpen(true)} />
          {items.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className="shell__side-item"
              aria-current={isActive(item.id, item.path) ? 'page' : undefined}
            >
              {item.icon}
              <span>{t(item.labelKey)}</span>
            </Link>
          ))}
          <div className="shell__side-footer">
            <button type="button" className="ds-btn ds-btn--quiet ds-btn--block" onClick={signOut}>
              {t('action.signOut')}
            </button>
          </div>
        </nav>

        <main className="shell__main">
          <Outlet />
        </main>
        <AssistantDrawer
          open={assistantOpen}
          onClose={() => setAssistantOpen(false)}
          user={user}
          role={role}
          tick={heartbeat.tick}
          onRead={heartbeat.refreshUnread}
        />
      </div>

      <nav className="shell__tabbar" aria-label={t('nav.menu')} ref={tabbarRef}>
        {items.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className="shell__tab"
            aria-current={isActive(item.id, item.path) ? 'page' : undefined}
          >
            {item.icon}
            <span className="ds-nav__label">{t(item.labelKey)}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
