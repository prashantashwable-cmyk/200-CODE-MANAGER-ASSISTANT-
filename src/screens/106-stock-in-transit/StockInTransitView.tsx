import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CaretDown, CaretRight, CheckCircle, Factory, Package, Truck, Warning } from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Screen,
  ScreenHeader,
  Select,
  Sheet,
  StatTile,
  Tabs,
  TextArea,
  formatDate,
  formatINR,
  formatINRCompact,
  useToast,
} from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { CapacityDealRow, OrphanRow, TransitInsight, TransitLine } from '@/data/repository';
import type { DelaySeverity } from '@/data/types';
import type { ReadinessStatus } from '@/features/logistics/transit';
import { useStockInTransit } from './useStockInTransit';
import type { ActionResult, StockInTransitState, TransitGroup } from './useStockInTransit';
import { STOCK_IN_TRANSIT_KEYS as K, ROWS_PER_GROUP, TRANSIT_GROUPINGS, TRANSIT_TABS, WINDOW_FILTERS } from './stock-in-transit.types';

type T = ReturnType<typeof useTranslation>['t'];

const SEVERITY_TONE: Record<DelaySeverity, BadgeTone> = { critical: 'error', late: 'warning', watch: 'neutral' };
const READINESS_TONE: Record<ReadinessStatus, BadgeTone> = { conflict: 'error', unordered: 'warning', no_job: 'neutral', on_track: 'success', ready: 'success' };
const errorKey = (code?: string) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);

/** A component category's label: the shared `partCategory.*` names, or the raw key if a new one has none yet. */
function categoryLabel(t: T, i18nExists: (key: string) => boolean, category: string): string {
  const key = `partCategory.${category}`;
  return i18nExists(key) ? t(key) : category;
}

/**
 * Screen 106 — Inventory / Stock-in-Transit. AIEC keeps no warehouse, so this is
 * only ever parts on their way to a particular customer's site: money committed
 * to suppliers that has not yet become a billable installation. It is a
 * summary first (grouped, filtered, opened a few groups at a time), and it
 * shows what no single order can: the supply pattern across suppliers, what
 * can really be installed in the coming weeks, and parts whose deal is gone.
 */
export function StockInTransitView() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const toast = useToast();
  const s = useStockInTransit();
  const exists = (key: string) => i18n.exists(key);

  const report = (r: ActionResult) => {
    if (!r.ok) {
      toast.push(t(errorKey(r.code)), 'error');
      return;
    }
    toast.push(t(r.kind === 'redirect' ? K.toast.redirected : K.toast.returned), 'success');
  };

  if (s.status === 'loading') {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} />
        <LoadingState label={t(K.loading)} variant="stats" rows={4} />
        <div className="mt-3">
          <LoadingState label={t(K.loading)} variant="list" rows={5} />
        </div>
      </Screen>
    );
  }
  if (s.status === 'error' || !s.board) {
    return (
      <Screen width="wide">
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} />
      </Screen>
    );
  }

  const totals = s.board.totals;
  return (
    <Screen width="wide">
      <ScreenHeader title={t(K.title)} subtitle={t(K.subtitle)} />

      <div className="grid-auto mb-2" style={{ ['--min' as string]: '150px' }}>
        <Card>
          <StatTile label={t(K.kpi.total)} value={<span className="num">{formatINRCompact(totals.value)}</span>} caption={t(K.kpi.caption, { count: totals.lineCount, orders: totals.orderCount })} large />
        </Card>
        <Card>
          <StatTile label={t(K.kpi.road)} value={<span className="num">{formatINRCompact(totals.onTheRoadValue)}</span>} />
        </Card>
        <Card>
          <StatTile label={t(K.kpi.made)} value={<span className="num">{formatINRCompact(totals.notShippedValue)}</span>} />
        </Card>
        <Card>
          <StatTile label={t(K.kpi.risk)} value={<span className={`num ${totals.atRiskValue > 0 ? 't-warning' : ''}`}>{formatINRCompact(totals.atRiskValue)}</span>} />
        </Card>
      </div>
      <p className="t-xs t-muted mb-3">{t(K.note)}</p>

      <div className="mb-3">
        <Tabs
          label={t(K.tab.label)}
          value={s.tab}
          onChange={(id) => s.setTab(id as typeof s.tab)}
          items={TRANSIT_TABS.map((id) => ({ id, label: id === 'attention' && s.attentionCount > 0 ? `${t(K.tab[id])} · ${s.attentionCount}` : t(K.tab[id]) }))}
        />
      </div>

      {s.tab === 'stock' && <StockTab s={s} t={t} lang={lang} exists={exists} />}
      {s.tab === 'capacity' && <CapacityTab s={s} t={t} lang={lang} />}
      {s.tab === 'attention' && <AttentionTab s={s} t={t} lang={lang} exists={exists} />}
      <DecisionSheet s={s} t={t} report={report} />
    </Screen>
  );
}

/* --------------------------------------------------------------- stock tab */

function StockTab({ s, t, lang, exists }: { s: StockInTransitState; t: T; lang: string; exists: (key: string) => boolean }) {
  const groupLabel = (g: TransitGroup): string => {
    if (g.label) return g.label;
    if (g.labelKey === 'overdue') return t(K.group.overdue);
    if (g.labelKey === 'weekOf') return t(K.group.weekOf, { date: formatDate(`${g.labelParams?.date}T12:00:00`, lang) });
    if (g.labelKey === 'category') return categoryLabel(t, exists, g.labelParams?.category ?? '');
    return g.key;
  };
  return (
    <div className="stack gap-3">
      <div className="sticky-under-shell stack gap-2">
        <Input aria-label={t(K.filter.search)} placeholder={t(K.filter.search)} value={s.query} onChange={(e) => s.setQuery(e.target.value)} />
        <div className="row gap-2 wrap" role="group" aria-label={t(K.filter.label)}>
          <Select aria-label={t(K.filter.window)} value={s.windowFilter} onChange={(e) => s.setWindowFilter(e.target.value as typeof s.windowFilter)} style={{ width: 'auto' }}>
            {WINDOW_FILTERS.map((w) => (
              <option key={w} value={w}>
                {t(K.window[w])}
              </option>
            ))}
          </Select>
          <Select aria-label={t(K.filter.allSuppliers)} value={s.supplierFilter} onChange={(e) => s.setSupplierFilter(e.target.value)} style={{ width: 'auto' }}>
            <option value="">{t(K.filter.allSuppliers)}</option>
            {s.suppliers.map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.name}
              </option>
            ))}
          </Select>
          <Select aria-label={t(K.filter.allCategories)} value={s.categoryFilter} onChange={(e) => s.setCategoryFilter(e.target.value)} style={{ width: 'auto' }}>
            <option value="">{t(K.filter.allCategories)}</option>
            {s.categories.map((c) => (
              <option key={c} value={c}>
                {categoryLabel(t, exists, c)}
              </option>
            ))}
          </Select>
        </div>
        <Tabs
          label={t(K.filter.groupBy)}
          value={s.grouping}
          onChange={(id) => s.setGrouping(id as typeof s.grouping)}
          items={TRANSIT_GROUPINGS.map((g) => ({ id: g, label: t(K.group[g]) }))}
        />
      </div>

      {s.groups.length === 0 ? (
        <EmptyState
          icon={<Truck size={30} />}
          title={t(s.filtered ? K.empty.filteredTitle : K.empty.title)}
          body={t(s.filtered ? K.empty.filteredBody : K.empty.body)}
          actionLabel={s.filtered ? t(K.filter.clear) : undefined}
          onAction={s.filtered ? s.clearFilters : undefined}
        />
      ) : (
        <div className="stack gap-2">
          {s.groups.map((g, index) => {
            const open = s.isOpen(g, index);
            const expanded = s.isExpanded(g);
            const rows = expanded ? g.lines : g.lines.slice(0, ROWS_PER_GROUP);
            return (
              <Card key={g.key} className="ds-card--flush">
                <button
                  type="button"
                  className="row between gap-3 full-w"
                  style={{ minHeight: 56, padding: 'var(--space-3)', background: 'none', border: 0, color: 'inherit', textAlign: 'left', cursor: 'pointer' }}
                  aria-expanded={open}
                  onClick={() => s.toggleGroup(g, index)}
                >
                  <span className="row gap-2">
                    {open ? <CaretDown size={16} aria-hidden="true" /> : <CaretRight size={16} aria-hidden="true" />}
                    <span className="stack">
                      <span className="t-md t-semibold">{groupLabel(g)}</span>
                      <span className="t-xs t-muted">{t(K.group.lines, { count: g.lines.length })}</span>
                    </span>
                  </span>
                  <span className="num t-semibold">{formatINRCompact(g.value)}</span>
                </button>
                {open && (
                  <div>
                    {rows.map((l) => (
                      <TransitRow key={l.key} line={l} t={t} lang={lang} exists={exists} />
                    ))}
                    {g.lines.length > ROWS_PER_GROUP && (
                      <div style={{ padding: 'var(--space-2) var(--space-3)' }}>
                        <Button size="sm" variant="ghost" onClick={() => s.toggleExpanded(g)}>
                          {expanded ? t(K.group.showLess) : t(K.group.showAll, { count: g.lines.length })}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** The one row anatomy: leading, primary, secondary, tertiary, trailing value. Never truncated. */
function Row({ leading, title, trailing, children }: { leading: ReactNode; title: string; trailing: ReactNode; children: ReactNode }) {
  return (
    <div className="ds-listrow ds-listrow--static" style={{ alignItems: 'flex-start' }}>
      <span className="shrink-0" style={{ minHeight: 24, display: 'inline-flex', alignItems: 'center' }}>
        {leading}
      </span>
      <span className="grow stack gap-1" style={{ minWidth: 0 }}>
        <span className="t-medium">{title}</span>
        {children}
      </span>
      <span className="shrink-0 num t-semibold">{trailing}</span>
    </div>
  );
}

function TransitRow({ line, t, lang, exists }: { line: TransitLine; t: T; lang: string; exists: (key: string) => boolean }) {
  const sev = line.delaySeverity;
  return (
    <Row
      leading={line.onTheRoad ? <Truck size={24} aria-hidden="true" color="var(--color-accent-primary)" /> : <Factory size={24} aria-hidden="true" color="var(--color-text-secondary)" />}
      title={`${line.quantity > 1 ? `${t(K.row.qty, { count: line.quantity })} ` : ''}${line.description}`}
      trailing={formatINR(line.value)}
    >
      <span className="t-xs t-muted">
        {line.siteName} · {line.supplierName} · {line.poCode}
      </span>
      <span className="t-xs">
        {t(K.row.arrives, { date: formatDate(line.arrivalAt, lang) })} · <span className="t-muted">{t(K.row[`source_${line.arrivalSource}`])}</span>
        {line.vehicleLabel ? <span className="t-muted"> · {line.vehicleLabel}</span> : null}
      </span>
      <span className="row gap-2 wrap">
        <Badge tone={line.onTheRoad ? 'accent' : 'neutral'}>{t(`fulfilmentStage.${line.stage}`)}</Badge>
        <Badge tone="neutral">{categoryLabel(t, exists, line.category)}</Badge>
        {sev && <Badge tone={SEVERITY_TONE[sev]}>{t(K.row[sev])}</Badge>}
      </span>
    </Row>
  );
}

/* ------------------------------------------------------------ capacity tab */

function CapacityTab({ s, t, lang }: { s: StockInTransitState; t: T; lang: string }) {
  const { weeks, deals } = s.board!.capacity;
  return (
    <div className="stack gap-4">
      <p className="t-sm t-muted">{t(K.capacity.intro)}</p>
      <section className="stack gap-2" aria-labelledby="weeks-heading">
        <h2 id="weeks-heading" className="t-md t-semibold">
          {t(K.capacity.weeksHeading)}
        </h2>
        <div className="grid-auto" style={{ ['--min' as string]: '220px' }}>
          {weeks.map((w, i) => (
            <Card key={w.weekStart}>
              <div className="stack gap-2">
                <div className="row between gap-2">
                  <span className="t-semibold">{i === 0 ? t(K.capacity.thisWeek) : t(K.capacity.week, { date: formatDate(`${w.weekStart}T12:00:00`, lang) })}</span>
                  {w.conflicts > 0 && <Badge tone="error">{t(K.capacity.conflicts, { count: w.conflicts })}</Badge>}
                </div>
                <dl className="stack gap-1 t-sm">
                  <div className="row between gap-3">
                    <dt className="t-muted">{t(K.capacity.ready)}</dt>
                    <dd className="num t-semibold">{w.readyByEnd}</dd>
                  </div>
                  <div className="row between gap-3">
                    <dt className="t-muted">{t(K.capacity.newly)}</dt>
                    <dd className="num">{w.newlyReady}</dd>
                  </div>
                  <div className="row between gap-3">
                    <dt className="t-muted">{t(K.capacity.booked)}</dt>
                    <dd className="num">{w.scheduledStarts}</dd>
                  </div>
                </dl>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="stack gap-2" aria-labelledby="deals-heading">
        <h2 id="deals-heading" className="t-md t-semibold">
          {t(K.capacity.dealsHeading)}
        </h2>
        {deals.length === 0 ? (
          <EmptyState icon={<Package size={30} />} title={t(K.capacity.emptyTitle)} body={t(K.capacity.emptyBody)} />
        ) : (
          <Card className="ds-card--flush">
            {deals.map((d) => (
              <CapacityRow key={d.dealId} deal={d} t={t} lang={lang} />
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}

function CapacityRow({ deal, t, lang }: { deal: CapacityDealRow; t: T; lang: string }) {
  const readyText = deal.readyBy && new Date(deal.readyBy).getTime() > Date.now() ? t(K.capacity.readyBy, { date: formatDate(deal.readyBy, lang) }) : deal.status === 'unordered' ? t(K.capacity.unknown) : t(K.capacity.readyNow);
  return (
    <Row
      leading={deal.status === 'conflict' ? <Warning size={24} aria-hidden="true" color="var(--color-error)" /> : deal.status === 'ready' || deal.status === 'on_track' ? <CheckCircle size={24} aria-hidden="true" weight="fill" color="var(--color-success)" /> : <Package size={24} aria-hidden="true" color="var(--color-text-secondary)" />}
      title={deal.siteName}
      trailing={<Badge tone={READINESS_TONE[deal.status]}>{t(K.capacity.status[deal.status])}</Badge>}
    >
      <span className="t-xs t-muted">{deal.customerName}</span>
      <span className="t-xs">
        {readyText} · <span className="t-muted">{t(K.capacity[`confidence_${deal.confidence}`])}</span>
        {deal.partCount > 0 ? <span className="t-muted"> · {t(K.capacity.parts, { count: deal.partCount })}</span> : null}
      </span>
      <span className="t-xs">{deal.installStart ? t(K.capacity.starts, { code: deal.installCode ?? '', date: formatDate(deal.installStart, lang) }) : t(K.capacity.noStart)}</span>
      <span className={`t-xs ${deal.status === 'conflict' ? 't-error' : 't-muted'}`}>{t(K.capacity.statusBody[deal.status])}</span>
    </Row>
  );
}

/* ---------------------------------------------------------- attention tab */

function AttentionTab({ s, t, lang, exists }: { s: StockInTransitState; t: T; lang: string; exists: (key: string) => boolean }) {
  const navigate = useNavigate();
  if (s.insights.length === 0 && s.orphans.length === 0) {
    return <EmptyState icon={<CheckCircle size={30} />} title={t(K.attention.emptyTitle)} body={t(K.attention.emptyBody)} />;
  }
  return (
    <div className="stack gap-4">
      {s.insights.length > 0 && (
        <section className="stack gap-2" aria-labelledby="insights-heading">
          <div className="stack">
            <h2 id="insights-heading" className="t-md t-semibold">
              {t(K.attention.insightsHeading)}
            </h2>
            <p className="t-xs t-muted">{t(K.attention.insightsHint)}</p>
          </div>
          {s.insights.map((i) => (
            <InsightCard key={i.category} insight={i} t={t} exists={exists} onSee={() => navigate('/delivery-delays')} />
          ))}
        </section>
      )}
      {s.orphans.length > 0 && (
        <section className="stack gap-2" aria-labelledby="orphans-heading">
          <div className="stack">
            <h2 id="orphans-heading" className="t-md t-semibold">
              {t(K.attention.orphansHeading)}
            </h2>
            <p className="t-xs t-muted">{t(K.attention.orphansHint)}</p>
          </div>
          {s.orphans.map((o) => (
            <OrphanCard key={o.poId} row={o} s={s} t={t} lang={lang} />
          ))}
        </section>
      )}
    </div>
  );
}

function InsightCard({ insight, t, exists, onSee }: { insight: TransitInsight; t: T; exists: (key: string) => boolean; onSee: () => void }) {
  const category = categoryLabel(t, exists, insight.category);
  return (
    <Card>
      <div className="stack gap-2">
        <p className="t-md t-semibold row gap-2">
          <Warning size={18} aria-hidden="true" color="var(--color-warning)" /> {t(K.attention.insightTitle, { category, count: insight.suppliers.length })}
        </p>
        <p className="t-sm">{t(K.attention.insightBody, { suppliers: insight.suppliers.map((sp) => sp.name).join(', '), orders: insight.orderCount })}</p>
        <p className="t-xs t-muted">{t(K.attention.insightAdvice)}</p>
        <div>
          <Button size="sm" variant="secondary" onClick={onSee}>
            {t(K.attention.seeDelays)}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function OrphanCard({ row, s, t, lang }: { row: OrphanRow; s: StockInTransitState; t: T; lang: string }) {
  const resolution = row.resolution;
  return (
    <Card>
      <div className="stack gap-2">
        <div className="row between gap-2 wrap">
          <span className="t-semibold">{row.poCode}</span>
          <Badge tone={resolution ? 'success' : 'error'}>{resolution ? t(resolution.kind === 'redirect' ? K.attention.redirected : K.attention.returned) : t(K.attention.dealState[row.dealStatus])}</Badge>
        </div>
        <p className="t-sm">{t(K.attention.orphanTitle, { supplier: row.supplierName, deal: row.dealCode, site: row.siteName })}</p>
        <p className="t-xs t-muted">{row.lineSummary}</p>
        <p className="t-xs">{t(K.attention.orphanBody, { value: formatINR(row.value), stage: t(`fulfilmentStage.${row.stage}`) })}</p>
        {resolution ? (
          <p className="t-xs t-muted">
            {t(K.attention.decidedBy, { name: resolution.decidedByName, date: formatDate(resolution.decidedAt, lang) })}
            {resolution.note ? ` “${resolution.note}”` : ''}
          </p>
        ) : (
          <div>
            <Button size="sm" onClick={() => s.startDecision(row)}>
              {t(K.attention.decide)}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

function DecisionSheet({ s, t, report }: { s: StockInTransitState; t: T; report: (r: ActionResult) => void }) {
  const row = s.deciding;
  const d = s.decision;
  const targets = s.board?.redirectTargets ?? [];
  return (
    <Sheet open={!!row} onClose={() => s.setDeciding(null)} title={t(K.decision.title)} closeLabel={t('action.close')}>
      {row && (
        <div className="stack gap-3">
          <p className="t-sm t-muted">{t(K.decision.intro, { code: row.poCode, deal: row.dealCode })}</p>
          <Tabs
            label={t(K.decision.title)}
            value={d.kind}
            onChange={(id) => s.patchDecision({ kind: id as typeof d.kind })}
            items={[
              { id: 'redirect', label: t(K.decision.redirect) },
              { id: 'return', label: t(K.decision.return) },
            ]}
          />
          <p className="t-xs t-muted">{t(d.kind === 'redirect' ? K.decision.redirectHint : K.decision.returnHint)}</p>
          {d.kind === 'redirect' && (
            <Field label={t(K.decision.deal)} required>
              {({ id }) => (
                <Select id={id} value={d.toDealId} onChange={(e) => s.patchDecision({ toDealId: e.target.value })}>
                  <option value="">{t(K.decision.pickDeal)}</option>
                  {targets
                    .filter((tg) => tg.dealId !== row.dealId)
                    .map((tg) => (
                      <option key={tg.dealId} value={tg.dealId}>
                        {tg.code} · {tg.siteName}
                      </option>
                    ))}
                </Select>
              )}
            </Field>
          )}
          {d.kind === 'return' && !row.supplierHasLogin && <p className="t-xs t-warning">{t(K.decision.noLogin)}</p>}
          <Field label={t(K.decision.note)} hint={t(d.kind === 'return' ? K.decision.noteHintReturn : K.decision.noteHintRedirect)} required={d.kind === 'return'}>
            {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={2} value={d.note} onChange={(e) => s.patchDecision({ note: e.target.value })} />}
          </Field>
          <div className="row gap-2">
            <Button disabled={!s.canDecide} loading={s.busy} onClick={() => void s.resolve().then(report)}>
              {t(d.kind === 'redirect' ? K.decision.submitRedirect : K.decision.submitReturn)}
            </Button>
            <Button variant="ghost" onClick={() => s.setDeciding(null)}>
              {t('action.cancel')}
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
