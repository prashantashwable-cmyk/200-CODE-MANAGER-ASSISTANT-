import { useTranslation } from 'react-i18next';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { ChatCircleText, ChatDots, Phone, WarningCircle } from '@phosphor-icons/react';
import {
  Badge,
  Card,
  ErrorState,
  LoadingState,
  Screen,
  ScreenHeader,
  StatTile,
  formatINR,
  formatPercent,
} from '@/design-system';
import type { CommChannel } from '@/data/types';
import { useCommAnalytics } from './useCommAnalytics';
import { COMM_ANALYTICS_KEYS as K } from './comm-analytics.types';

const CHANNEL_ICON: Record<CommChannel, React.ReactNode> = {
  whatsapp: <ChatCircleText size={18} className="t-emerald" />,
  sms: <ChatDots size={18} className="t-emerald" />,
  call: <Phone size={18} className="t-emerald" />,
  in_app: <ChatDots size={18} className="t-emerald" />,
};

export function CommAnalyticsView() {
  const { t } = useTranslation();
  const s = useCommAnalytics();

  if (s.status === 'loading') {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <LoadingState label={t(K.loading)} variant="stats" rows={4} />
      </Screen>
    );
  }

  if (s.status === 'error') {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={() => void s.reload()} />
      </Screen>
    );
  }

  if (s.totals.totalSent === 0) {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />
        <div className="ds-state">
          <span className="ds-state__title">{t(K.empty.title)}</span>
          <p className="ds-state__body">{t(K.empty.body)}</p>
        </div>
      </Screen>
    );
  }

  return (
    <Screen width="wide">
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />

      {s.outageNoteKey && (
        <Card className="mb-4">
          <p className="t-sm t-warning row gap-2 items-center">
            <WarningCircle size={16} />
            {t(s.outageNoteKey)}
          </p>
        </Card>
      )}

      <div className="grid-auto mb-4" style={{ ['--min' as string]: '150px' }}>
        <Card>
          <StatTile label={t(K.kpi.totalSent)} value={<span className="num">{s.totals.totalSent}</span>} large />
        </Card>
        <Card>
          <StatTile label={t(K.kpi.responseRate)} value={<span className="num">{formatPercent(s.totals.overallResponseRatePct, 0)}</span>} large />
        </Card>
        <Card>
          <StatTile label={t(K.kpi.slaCompliance)} value={<span className="num">{formatPercent(s.slaCompliancePct, 0)}</span>} large />
        </Card>
        <Card>
          <StatTile label={t(K.kpi.totalCost)} value={<span className="num">{formatINR(s.totals.totalCost)}</span>} large />
        </Card>
      </div>

      <h2 className="t-lg mb-2">{t(K.channelHeading)}</h2>
      <div className="stack gap-2 mb-4">
        {s.channelStats.map((c) => (
          <Card key={c.channel}>
            <div className="row between items-center gap-3">
              <div className="row gap-2 items-center">
                {CHANNEL_ICON[c.channel]}
                <span className="t-sm t-medium">{t(`commChannel.${c.channel}`)}</span>
              </div>
              <div className="row gap-4">
                <span className="t-xs t-muted">{t(K.channelSent, { count: c.totalSent })}</span>
                <span className="t-xs t-muted">{t(K.channelResponseRate, { pct: Math.round(c.responseRatePct * 100) })}</span>
                <span className="t-xs t-muted">{t(K.channelCost, { amount: formatINR(c.cost) })}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <h2 className="t-lg mb-1">{t(K.volumeHeading)}</h2>
      <p className="t-sm t-muted mb-3">{t(K.volumeSubtitle)}</p>
      <Card className="mb-4">
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={s.volumeTrend}>
            <defs>
              <linearGradient id="commVolume" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-accent-primary)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--color-accent-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke="var(--color-accent-primary)" strokeWidth={2} fill="url(#commVolume)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <h2 className="t-lg mb-1">{t(K.templateHeading)}</h2>
      <p className="t-sm t-muted mb-2">{t(K.templateSubtitle)}</p>
      <div className="row gap-4 mb-3">
        <span className="t-xs t-muted">{t(K.averageLabel, { pct: Math.round(s.averageResponseRatePct * 100) })}</span>
        <span className="t-xs t-muted">{t(K.medianLabel, { pct: Math.round(s.medianResponseRatePct * 100) })}</span>
      </div>

      <div className="stack gap-2 mb-4">
        {s.templateStats.map((tpl) => {
          const isPoor = s.poorPerformers.some((p) => p.templateGroupId === tpl.templateGroupId);
          return (
            <Card key={tpl.templateGroupId}>
              <div className="row between items-start gap-3 mb-1">
                <div className="row gap-2 items-center" style={{ minWidth: 0 }}>
                  {CHANNEL_ICON[tpl.channel]}
                  <span className="t-sm t-semibold truncate">{tpl.templateName}</span>
                </div>
                {tpl.earlyData && <Badge tone="neutral">{t(K.earlyDataBadge)}</Badge>}
              </div>
              <div className="row wrap gap-4">
                <span className="t-xs t-muted">{t(K.sentCount, { count: tpl.totalSent })}</span>
                <span className="t-xs t-muted">{t(K.channelResponseRate, { pct: Math.round(tpl.responseRatePct * 100) })}</span>
                <span className="t-xs t-muted">{t(K.conversionInfluence, { score: tpl.conversionInfluenceScore })}</span>
              </div>
              {isPoor && (
                <p className="t-xs t-error row gap-1 items-center mt-2">
                  <WarningCircle size={13} />
                  {t(K.poorPerformerWarning)}
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </Screen>
  );
}
