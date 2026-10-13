import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Broadcast,
  CaretRight,
  CheckCircle,
  Package,
  Phone,
  Plus,
  Truck,
  WarningOctagon,
} from "@phosphor-icons/react";
import {
  ActionBar,
  Badge,
  Button,
  Card,
  Checkbox,
  Chip,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Screen,
  ScreenHeader,
  Sheet,
  StatTile,
  Tabs,
  TextArea,
  Toggle,
  formatDate,
  formatDateTime,
  formatINR,
  useToast,
} from "@/design-system";
import type { BadgeTone } from "@/design-system";
import type {
  BookablePo,
  LateDeliveryView,
  PartnerOption,
  PartnerRow,
} from "@/data/repository";
import type {
  Responsibility,
  TrackingMode,
} from "@/features/logistics/partnerPerformance";
import { MIN_RATED_TRIPS } from "@/features/logistics/partnerPerformance";
import { useDeliveryPartnerManagement } from "./useDeliveryPartnerManagement";
import type {
  ActionResult,
  PartnerMgmtState,
} from "./useDeliveryPartnerManagement";
import {
  CAUSE_FILTERS,
  PARTNER_FILTERS,
  PARTNER_KEYS as K,
  PARTNER_TABS,
  RESPONSIBILITIES,
} from "./delivery-partner-management.types";

type T = ReturnType<typeof useTranslation>["t"];
type Report = (
  r: ActionResult,
  success?: string,
  params?: Record<string, unknown>,
) => void;

const errorKey = (code?: string) =>
  code && code in K.problem
    ? K.problem[code as keyof typeof K.problem]
    : K.problem.generic;
const MODE_TONE: Record<TrackingMode, BadgeTone> = {
  live: "emerald",
  manual: "neutral",
  fallback: "warning",
};
const RESPONSIBILITY_TONE: Record<Responsibility, BadgeTone> = {
  partner: "error",
  supplier: "warning",
  shared: "accent",
  external: "neutral",
};

/** "45 minutes" / "6 hours": minutes below two hours, hours after. */
function duration(t: T, min: number): string {
  const m = Math.max(0, Math.round(min));
  return m < 120
    ? t(K.duration.minutes, { count: m })
    : t(K.duration.hours, { count: Math.round(m / 60) });
}

/**
 * Screen 109 — Delivery Partner Management. Third-party carriers are a different relationship from
 * suppliers, so they are judged by a different promise: their own estimate at dispatch. That one
 * choice is what lets a late delivery be told apart as the supplier's late hand-over or the carrier's
 * slow transit, and what a live-tracking outage is measured against.
 */
export function DeliveryPartnerManagementView() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const s = useDeliveryPartnerManagement();

  const report: Report = (r, success, params) => {
    if (!r.ok) {
      toast.push(t(errorKey(r.code)), "error");
      return;
    }
    if (success) toast.push(t(success, params), "success");
  };

  if (s.status === "loading") {
    return (
      <Screen width="default">
        <ScreenHeader title={t(K.title)} />
        <LoadingState label={t(K.loading)} variant="list" rows={5} />
      </Screen>
    );
  }
  if (s.status === "error" || !s.board) {
    return (
      <Screen width="default">
        <ScreenHeader title={t(K.title)} />
        <ErrorState
          title={t(K.error.title)}
          body={t(K.error.body)}
          retryLabel={t("action.retry")}
          onRetry={s.reload}
        />
      </Screen>
    );
  }

  const lang = i18n.language;
  const sheets = <Sheets s={s} t={t} report={report} />;

  if (s.partnerParam) {
    if (!s.current) {
      return (
        <Screen width="narrow">
          <ScreenHeader
            title={t(K.title)}
            back={s.closePartner}
            backLabel={t("action.back")}
          />
          <EmptyState
            icon={<Truck size={32} />}
            title={t(K.list.notFound)}
            body={t(K.list.emptyBody)}
            actionLabel={t(K.list.back)}
            onAction={s.closePartner}
          />
        </Screen>
      );
    }
    return (
      <>
        <PartnerDetail p={s.current} s={s} t={t} lang={lang} />
        {sheets}
      </>
    );
  }

  return (
    <Screen width="default">
      <ScreenHeader
        title={t(K.title)}
        subtitle={t(K.subtitle)}
        action={
          <Button size="sm" onClick={s.openCreate}>
            <Plus size={14} aria-hidden="true" /> {t(K.add)}
          </Button>
        }
      />
      <Tabs
        label={t(K.tab.label)}
        value={s.tab}
        onChange={(id) => s.setTab(id as (typeof PARTNER_TABS)[number])}
        items={PARTNER_TABS.map((id) => ({
          id,
          label:
            id === "book"
              ? `${t(K.tab[id])}${s.bookable.length ? ` · ${s.bookable.length}` : ""}`
              : t(K.tab[id]),
        }))}
        className="mb-3"
      />
      {s.tab === "partners" && <PartnerList s={s} t={t} />}
      {s.tab === "book" && <BookTab s={s} t={t} lang={lang} report={report} />}
      {s.tab === "delays" && <DelaysTab s={s} t={t} lang={lang} />}
      {sheets}
    </Screen>
  );
}

/* ------------------------------------------------------------------ list */

function RatingText({ p, t }: { p: PartnerRow; t: T }) {
  return p.stats.rated ? (
    <strong className="t-md" style={{ fontVariantNumeric: "tabular-nums" }}>
      {p.stats.onTimeRatePct}%
    </strong>
  ) : (
    <span className="t-xs t-muted">{t(K.list.notRated)}</span>
  );
}

function PartnerList({ s, t }: { s: PartnerMgmtState; t: T }) {
  if (s.partners.length === 0)
    return (
      <EmptyState
        icon={<Truck size={32} />}
        title={t(K.list.emptyTitle)}
        body={t(K.list.emptyBody)}
        actionLabel={t(K.add)}
        onAction={s.openCreate}
      />
    );
  return (
    <>
      <div className="sticky-under-shell stack gap-2 mb-3">
        <Input
          aria-label={t(K.filter.search)}
          placeholder={t(K.filter.search)}
          value={s.query}
          onChange={(e) => s.setQuery(e.target.value)}
        />
        <div
          className="row gap-2 ds-tabs--scroll"
          style={{ overflowX: "auto" }}
          role="group"
          aria-label={t(K.filter.label)}
        >
          {PARTNER_FILTERS.map((f) => (
            <Chip
              key={f}
              pressed={s.filter === f}
              onClick={() => s.setFilter(f)}
            >
              {t(K.filter[f])} · {s.counts[f]}
            </Chip>
          ))}
        </div>
      </div>
      {s.shown.length === 0 ? (
        <EmptyState
          icon={<Truck size={28} />}
          title={t(K.list.emptyFilteredTitle)}
          body={t(K.list.emptyFilteredBody)}
          actionLabel={t(K.list.clear)}
          onAction={() => {
            s.setFilter("all");
            s.setQuery("");
          }}
        />
      ) : (
        <Card className="ds-card--flush">
          {s.shown.map((p) => (
            <button
              key={p.id}
              type="button"
              className="ds-listrow"
              style={{ width: "100%", textAlign: "start" }}
              onClick={() => s.openPartner(p.id)}
            >
              <span className="ds-listrow__lead" aria-hidden="true">
                <Truck
                  size={22}
                  color={
                    p.status === "paused"
                      ? "var(--color-text-secondary)"
                      : "var(--color-accent-secondary)"
                  }
                />
              </span>
              <span className="stack grow" style={{ minWidth: 0 }}>
                <span
                  className="row gap-2 wrap"
                  style={{ alignItems: "center" }}
                >
                  <strong className="t-sm">{p.name}</strong>
                  {p.status === "paused" && (
                    <Badge tone="neutral">{t(K.status.paused)}</Badge>
                  )}
                  {p.feedStatus === "outage" && (
                    <Badge tone="warning">
                      <WarningOctagon size={12} aria-hidden="true" />{" "}
                      {t(K.list.feedDown)}
                    </Badge>
                  )}
                </span>
                <span className="t-xs t-muted">
                  {t(K.list.areas, { areas: p.serviceAreas.join(", ") })}
                </span>
                <span className="t-xs t-muted">
                  {t(K.list.deliveries, { count: p.stats.trips })}
                  {!p.stats.rated
                    ? ` · ${t(K.list.buildingHistory, { done: p.stats.trips, needed: MIN_RATED_TRIPS })}`
                    : ""}
                </span>
              </span>
              <span
                className="stack"
                style={{ alignItems: "flex-end", flexShrink: 0 }}
              >
                <RatingText p={p} t={t} />
                <Badge tone={MODE_TONE[p.trackingMode]}>
                  {t(K.tracking[p.trackingMode])}
                </Badge>
              </span>
              <CaretRight size={16} aria-hidden="true" />
            </button>
          ))}
        </Card>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- detail */

function PartnerDetail({
  p,
  s,
  t,
  lang,
}: {
  p: PartnerRow;
  s: PartnerMgmtState;
  t: T;
  lang: string;
}) {
  const navigate = useNavigate();
  const causes = p.stats.responsibility;
  const causeTotal = RESPONSIBILITIES.reduce((n, r) => n + causes[r], 0);
  return (
    <Screen width="default">
      <ScreenHeader
        title={p.name}
        subtitle={t(K.detail.rateRef, { ref: p.rateCardRef })}
        back={s.closePartner}
        backLabel={t("action.back")}
        action={
          <div className="row gap-1 wrap">
            <Badge tone={p.status === "active" ? "success" : "neutral"}>
              {t(K.status[p.status])}
            </Badge>
            <Badge tone={MODE_TONE[p.trackingMode]}>
              {t(K.tracking[p.trackingMode])}
            </Badge>
          </div>
        }
      />
      {p.status === "paused" && (
        <Card className="mb-3">
          <p className="t-sm">{t(K.detail.pausedBanner)}</p>
        </Card>
      )}
      <div className="grid-auto">
        <Card>
          <div className="stack gap-2">
            <div className="row between gap-2">
              <h2 className="t-md t-semibold">{t(K.detail.contact)}</h2>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => s.openEdit(p)}
              >
                {t(K.detail.edit)}
              </Button>
            </div>
            <p className="t-sm">{p.contactName}</p>
            <a
              className="t-sm row gap-1"
              href={`tel:${p.phone}`}
              style={{ alignItems: "center" }}
            >
              <Phone size={14} aria-hidden="true" /> {p.phone}
            </a>
            {p.email && <span className="t-xs t-muted">{p.email}</span>}
            <div className="stack gap-1">
              <span className="t-xs t-muted">{t(K.detail.areas)}</span>
              <div className="row gap-1 wrap">
                {p.serviceAreas.map((a) => (
                  <Badge key={a} tone="neutral">
                    {a}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="row gap-2 wrap">
              <Button
                size="sm"
                onClick={() => navigate("/delivery-partners?tab=book")}
                disabled={p.status === "paused"}
              >
                {t(K.detail.book)}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  s.openReason(p.status === "active" ? "pause" : "resume")
                }
              >
                {t(p.status === "active" ? K.detail.pause : K.detail.resume)}
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="stack gap-3">
            <div className="stack">
              <h2 className="t-md t-semibold">{t(K.detail.performance)}</h2>
              <p className="t-xs t-muted">{t(K.detail.performanceHint)}</p>
            </div>
            {p.stats.rated ? (
              <div className="grid-2">
                <StatTile
                  label={t(K.detail.onTimeRate)}
                  value={`${p.stats.onTimeRatePct}%`}
                  large
                />
                <StatTile
                  label={t(K.detail.lateLoads)}
                  value={p.stats.lateCount}
                  caption={
                    p.stats.lateCount
                      ? t(K.detail.avgLate, {
                          time: duration(t, p.stats.avgLateMin),
                        })
                      : undefined
                  }
                />
              </div>
            ) : (
              <div className="stack gap-1" role="note">
                <strong className="t-sm">
                  {t(K.detail.newTitle, {
                    done: p.stats.trips,
                    needed: MIN_RATED_TRIPS,
                  })}
                </strong>
                <span className="t-xs t-muted">{t(K.detail.newBody)}</span>
              </div>
            )}
            {p.stats.trips > 0 && (
              <div className="stack gap-1">
                <h3 className="t-sm t-semibold">{t(K.detail.causeHeading)}</h3>
                <p className="t-xs t-muted">{t(K.detail.causeHint)}</p>
                {causeTotal === 0 ? (
                  <span className="t-xs t-muted">{t(K.detail.causeNone)}</span>
                ) : (
                  <div className="row gap-1 wrap">
                    {RESPONSIBILITIES.filter((r) => causes[r] > 0).map((r) => (
                      <Badge key={r} tone={RESPONSIBILITY_TONE[r]}>
                        {t(K.responsibility[r])} · {causes[r]}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="stack gap-2">
            <div className="row between gap-2">
              <div className="stack">
                <h2 className="t-md t-semibold">{t(K.detail.rateCard)}</h2>
                <span className="t-xs t-muted">
                  {p.rateCardRef} ·{" "}
                  {t(K.detail.rateFrom, {
                    date: formatDate(p.rateCardEffectiveFrom, lang),
                  })}
                </span>
              </div>
              <Button size="sm" variant="secondary" onClick={s.openLane}>
                <Plus size={14} aria-hidden="true" /> {t(K.detail.addLane)}
              </Button>
            </div>
            {p.lanes.length === 0 ? (
              <p className="t-sm t-muted">{t(K.detail.noLanes)}</p>
            ) : (
              <div className="stack">
                {p.lanes.map((l) => (
                  <div
                    key={l.id}
                    className="row between gap-2"
                    style={{
                      padding: "var(--space-2) 0",
                      borderTop: "1px solid var(--color-border)",
                      alignItems: "baseline",
                    }}
                  >
                    <span className="stack">
                      <span className="t-sm">
                        {l.originCity} → {l.destinationCity}
                      </span>
                      <span className="t-xs t-muted">
                        {l.distanceKm} km ·{" "}
                        {t(K.detail.days, { count: l.transitDays })} ·{" "}
                        {t(K.detail.perKm, {
                          rate: formatINR(
                            Math.round(l.ratePerTrip / l.distanceKm),
                          ),
                        })}
                      </span>
                    </span>
                    <strong
                      className="t-sm"
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {formatINR(l.ratePerTrip)}
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="stack gap-2">
            <h2 className="t-md t-semibold">{t(K.detail.integration)}</h2>
            <div className="row gap-2 wrap" style={{ alignItems: "center" }}>
              <Badge tone={MODE_TONE[p.trackingMode]}>
                {t(K.tracking[p.trackingMode])}
              </Badge>
              {p.feedBrokenSince && (
                <span className="t-xs t-muted">
                  {t(K.detail.feedSince, {
                    when: formatDateTime(p.feedBrokenSince, lang),
                  })}
                </span>
              )}
            </div>
            <p className="t-sm">{t(K.trackingBody[p.trackingMode])}</p>
            {p.liveTrackingSupported && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  s.openReason(p.feedStatus === "connected" ? "outage" : "back")
                }
              >
                <Broadcast size={14} aria-hidden="true" />{" "}
                {t(
                  p.feedStatus === "connected"
                    ? K.detail.reportFeed
                    : K.detail.feedBack,
                )}
              </Button>
            )}
            <h3 className="t-sm t-semibold mt-2">{t(K.detail.inFlight)}</h3>
            {p.inFlight.length === 0 ? (
              <span className="t-xs t-muted">{t(K.detail.noInFlight)}</span>
            ) : (
              p.inFlight.map((f) => (
                <div
                  key={f.legId}
                  className="row between gap-2 wrap"
                  style={{ alignItems: "center" }}
                >
                  <span className="t-sm">
                    {f.poCode} · {f.siteName}
                  </span>
                  <span className="row gap-2" style={{ alignItems: "center" }}>
                    <Badge tone={f.feed === "live" ? "emerald" : "warning"}>
                      {t(K.detail.inFlightFeed[f.feed])}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/shipments?leg=${f.legId}`)}
                    >
                      {t(K.detail.openShipment)}
                    </Button>
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <div className="stack gap-2">
            <h2 className="t-md t-semibold">{t(K.detail.recentTrips)}</h2>
            {p.trips.length === 0 ? (
              <p className="t-sm t-muted">{t(K.detail.noTrips)}</p>
            ) : (
              p.trips.map((tr) => (
                <div
                  key={tr.id}
                  className="row between gap-2"
                  style={{
                    padding: "var(--space-2) 0",
                    borderTop: "1px solid var(--color-border)",
                    alignItems: "flex-start",
                  }}
                >
                  <span className="stack" style={{ minWidth: 0 }}>
                    <span className="t-sm">
                      {tr.poCode} · {tr.siteName}
                    </span>
                    <span className="t-xs t-muted">
                      {tr.laneLabel} · {formatDate(tr.arrivedAt, lang)}
                    </span>
                  </span>
                  <span
                    className="stack"
                    style={{ alignItems: "flex-end", flexShrink: 0 }}
                  >
                    <Badge tone={tr.onTime ? "success" : "error"}>
                      {tr.onTime
                        ? t(K.detail.onTimeTrip)
                        : t(K.detail.lateTrip, {
                            time: duration(t, tr.lateMin),
                          })}
                    </Badge>
                    {tr.responsibility && (
                      <Badge tone={RESPONSIBILITY_TONE[tr.responsibility]}>
                        {t(K.responsibility[tr.responsibility])}
                      </Badge>
                    )}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <div className="stack gap-2">
            <h2 className="t-md t-semibold">{t(K.detail.activity)}</h2>
            {p.events.map((e) => (
              <div
                key={e.id}
                className="stack"
                style={{
                  padding: "var(--space-2) 0",
                  borderTop: "1px solid var(--color-border)",
                }}
              >
                <span className="t-sm">{t(K.event[e.kind])}</span>
                <span className="t-xs t-muted">
                  {t(K.detail.by, { name: e.byName })} ·{" "}
                  {formatDateTime(e.at, lang)}
                  {e.note ? ` · ${e.note}` : ""}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Screen>
  );
}

/* ---------------------------------------------------------------- forms */

function Sheets({
  s,
  t,
  report,
}: {
  s: PartnerMgmtState;
  t: T;
  report: Report;
}) {
  const cities = s.board?.knownCities ?? [];
  const d = s.draft;
  const toggleCity = (c: string) =>
    s.patchDraft({
      serviceAreas: d.serviceAreas.includes(c)
        ? d.serviceAreas.filter((x) => x !== c)
        : [...d.serviceAreas, c],
    });
  const extra = d.serviceAreas.filter(
    (a) => !cities.some((c) => c.toLowerCase() === a.toLowerCase()),
  );
  const lane = s.lane;
  const reasonKey =
    s.reasonOpen === "pause"
      ? "pause"
      : s.reasonOpen === "resume"
        ? "resume"
        : s.reasonOpen === "outage"
          ? "feed"
          : "back";
  return (
    <>
      <Sheet
        open={s.formOpen !== null}
        onClose={s.closeForm}
        title={t(s.formOpen === "edit" ? K.form.editTitle : K.form.createTitle)}
        closeLabel={t("action.close")}
      >
        <div className="stack gap-3">
          {s.formOpen === "create" && (
            <p className="t-sm t-muted">{t(K.form.intro)}</p>
          )}
          <Field label={t(K.form.name)} required>
            {({ id }) => (
              <Input
                id={id}
                value={d.name}
                onChange={(e) => s.patchDraft({ name: e.target.value })}
              />
            )}
          </Field>
          <Field label={t(K.form.contact)} required>
            {({ id }) => (
              <Input
                id={id}
                value={d.contactName}
                onChange={(e) => s.patchDraft({ contactName: e.target.value })}
              />
            )}
          </Field>
          <Field label={t(K.form.phone)} required>
            {({ id }) => (
              <Input
                id={id}
                type="tel"
                inputMode="tel"
                value={d.phone}
                onChange={(e) => s.patchDraft({ phone: e.target.value })}
              />
            )}
          </Field>
          <Field label={t(K.form.email)}>
            {({ id }) => (
              <Input
                id={id}
                type="email"
                value={d.email}
                onChange={(e) => s.patchDraft({ email: e.target.value })}
              />
            )}
          </Field>
          <div className="stack gap-2">
            <span className="t-sm t-semibold">{t(K.form.areas)} *</span>
            <span className="t-xs t-muted">{t(K.form.areasHint)}</span>
            <div
              className="row gap-1 wrap"
              role="group"
              aria-label={t(K.form.areas)}
            >
              {[...cities, ...extra].map((c) => (
                <Chip
                  key={c}
                  pressed={d.serviceAreas.some(
                    (a) => a.toLowerCase() === c.toLowerCase(),
                  )}
                  onClick={() => toggleCity(c)}
                >
                  {c}
                </Chip>
              ))}
            </div>
            <OtherCity
              t={t}
              onAdd={(c) =>
                !d.serviceAreas.some(
                  (a) => a.toLowerCase() === c.toLowerCase(),
                ) && s.patchDraft({ serviceAreas: [...d.serviceAreas, c] })
              }
            />
          </div>
          <Toggle
            label={t(K.form.live)}
            description={t(K.form.liveHint)}
            checked={d.liveTrackingSupported}
            onChange={(on) => s.patchDraft({ liveTrackingSupported: on })}
          />
          <Field
            label={t(K.form.rateRef)}
            hint={t(K.form.rateRefHint)}
            required
          >
            {({ id, describedBy }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                value={d.rateCardRef}
                onChange={(e) => s.patchDraft({ rateCardRef: e.target.value })}
              />
            )}
          </Field>
          <Button
            disabled={!s.canSaveDraft || s.busy}
            onClick={async () =>
              report(
                await s.saveDraft(),
                s.formOpen === "edit" ? K.toast.saved : K.toast.created,
              )
            }
          >
            {t(s.formOpen === "edit" ? K.form.save : K.form.create)}
          </Button>
        </div>
      </Sheet>

      <Sheet
        open={s.laneOpen}
        onClose={() => s.setLaneOpen(false)}
        title={t(K.lane.title)}
        closeLabel={t("action.close")}
      >
        <div className="stack gap-3">
          <p className="t-sm t-muted">{t(K.lane.intro)}</p>
          <Field label={t(K.lane.origin)} required>
            {({ id }) => (
              <Input
                id={id}
                value={lane.originCity}
                onChange={(e) => s.patchLane({ originCity: e.target.value })}
              />
            )}
          </Field>
          <Field label={t(K.lane.destination)} required>
            {({ id }) => (
              <Input
                id={id}
                value={lane.destinationCity}
                onChange={(e) =>
                  s.patchLane({ destinationCity: e.target.value })
                }
              />
            )}
          </Field>
          <div className="grid-2">
            <Field label={t(K.lane.km)} required>
              {({ id }) => (
                <Input
                  id={id}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={lane.distanceKm}
                  onChange={(e) => s.patchLane({ distanceKm: e.target.value })}
                />
              )}
            </Field>
            <Field label={t(K.lane.days)} required>
              {({ id }) => (
                <Input
                  id={id}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={lane.transitDays}
                  onChange={(e) => s.patchLane({ transitDays: e.target.value })}
                />
              )}
            </Field>
          </div>
          <Field label={t(K.lane.rate)} required>
            {({ id }) => (
              <Input
                id={id}
                type="number"
                inputMode="decimal"
                min={1}
                value={lane.ratePerTrip}
                onChange={(e) => s.patchLane({ ratePerTrip: e.target.value })}
              />
            )}
          </Field>
          {s.laneReplaces && (
            <p className="t-xs t-muted">{t(K.lane.replaces)}</p>
          )}
          <Button
            disabled={!s.canSaveLane || s.busy}
            onClick={async () => report(await s.saveLane(), K.toast.laneSaved)}
          >
            {t(K.lane.save)}
          </Button>
        </div>
      </Sheet>

      <Sheet
        open={s.reasonOpen !== null}
        onClose={() => s.setReasonOpen(null)}
        title={t(K.reason[`${reasonKey}Title` as "pauseTitle"])}
        closeLabel={t("action.close")}
      >
        <div className="stack gap-3">
          <p className="t-sm t-muted">
            {t(K.reason[`${reasonKey}Intro` as "pauseIntro"])}
          </p>
          <Field
            label={t(K.reason.note)}
            hint={s.needsReason ? t(K.reason.noteHint) : undefined}
            required={s.needsReason}
          >
            {({ id, describedBy }) => (
              <TextArea
                id={id}
                aria-describedby={describedBy}
                rows={3}
                value={s.reason}
                onChange={(e) => s.setReason(e.target.value)}
              />
            )}
          </Field>
          <Button
            disabled={!s.canConfirmReason || s.busy}
            onClick={async () => {
              const which = s.reasonOpen;
              report(
                await s.confirmReason(),
                which === "pause"
                  ? K.toast.paused
                  : which === "resume"
                    ? K.toast.resumed
                    : which === "outage"
                      ? K.toast.feedDown
                      : K.toast.feedBack,
              );
            }}
          >
            {t(K.reason.confirm)}
          </Button>
        </div>
      </Sheet>
    </>
  );
}

function OtherCity({ t, onAdd }: { t: T; onAdd: (city: string) => void }) {
  return (
    <form
      className="row gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const input = e.currentTarget.elements.namedItem(
          "other",
        ) as HTMLInputElement;
        const value = input.value.trim();
        if (value.length >= 2) onAdd(value);
        input.value = "";
      }}
    >
      <Input
        name="other"
        aria-label={t(K.form.otherCity)}
        placeholder={t(K.form.otherCity)}
      />
      <Button type="submit" variant="secondary" size="sm">
        {t(K.form.addCity)}
      </Button>
    </form>
  );
}

/* ---------------------------------------------------------------- booking */

function OptionCard({
  o,
  chosen,
  onPick,
  t,
}: {
  o: PartnerOption;
  chosen: boolean;
  onPick: () => void;
  t: T;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={chosen}
      className="ds-card ds-card--interactive"
      style={{
        textAlign: "start",
        width: "100%",
        outline: chosen ? "2px solid var(--color-accent-primary)" : undefined,
      }}
      onClick={onPick}
    >
      <div className="stack gap-1">
        <div className="row between gap-2 wrap">
          <strong className="t-sm">{o.name}</strong>
          <Badge tone={MODE_TONE[o.trackingMode]}>
            {t(K.tracking[o.trackingMode])}
          </Badge>
        </div>
        <span className="t-sm" style={{ fontVariantNumeric: "tabular-nums" }}>
          {o.ratePerTrip !== null
            ? t(K.book.rate, {
                rate: formatINR(o.ratePerTrip),
                km: o.distanceKm ?? 0,
              })
            : t(K.book.noRate)}
          {o.transitDays !== null
            ? ` · ${t(K.book.transit, { count: o.transitDays })}`
            : ""}
        </span>
        <span className="t-xs t-muted">
          {o.stats.rated
            ? t(K.book.historyLine, {
                pct: o.stats.onTimeRatePct ?? 0,
                count: o.stats.trips,
              })
            : t(K.book.newBadge, {
                done: o.stats.trips,
                needed: MIN_RATED_TRIPS,
              })}
        </span>
      </div>
    </button>
  );
}

function BookTab({
  s,
  t,
  lang,
  report,
}: {
  s: PartnerMgmtState;
  t: T;
  lang: string;
  report: Report;
}) {
  const navigate = useNavigate();
  void lang;
  const po = s.bookingPo;
  return (
    <div className="stack gap-3">
      {s.bookable.length === 0 ? (
        <EmptyState
          icon={<Package size={32} />}
          title={t(K.book.emptyTitle)}
          body={t(K.book.emptyBody)}
        />
      ) : (
        <p className="t-sm t-muted">{t(K.book.intro)}</p>
      )}
      <div className="grid-auto">
        {s.bookable.map((b: BookablePo) => (
          <button
            key={b.poId}
            type="button"
            className="ds-card ds-card--interactive"
            style={{ textAlign: "start", width: "100%" }}
            onClick={() => s.openBooking(b)}
          >
            <div className="stack gap-1">
              <strong className="t-md">{b.poCode}</strong>
              <span className="t-sm">
                {t(K.book.forSite, { site: b.siteName, city: b.siteCity })}
              </span>
              <span className="t-xs t-muted">
                {b.supplierName} · {t(K.book.parts, { count: b.lines.length })}
              </span>
              <Badge tone={b.eligible.length ? "success" : "error"}>
                {t(K.book.carriers, { count: b.eligible.length })}
              </Badge>
            </div>
          </button>
        ))}
      </div>

      <Sheet
        open={!!po}
        onClose={s.closeBooking}
        title={po ? t(K.book.title, { code: po.poCode }) : ""}
        closeLabel={t("action.close")}
      >
        {po && s.booked ? (
          <div className="stack gap-3" role="status">
            <p className="t-md t-semibold row gap-2">
              <CheckCircle size={20} weight="fill" aria-hidden="true" />{" "}
              {t(K.book.done)}
            </p>
            <p className="t-sm">
              {t(
                s.booked.trackingMode === "live"
                  ? K.book.doneLive
                  : K.book.doneMilestones,
              )}
            </p>
            {s.booked.freightCost !== null && (
              <p className="t-sm">
                {t(K.book.rate, {
                  rate: formatINR(s.booked.freightCost),
                  km: s.chosen?.distanceKm ?? 0,
                })}
              </p>
            )}
            <div className="row gap-2 wrap">
              <Button
                onClick={() => navigate(`/shipments?leg=${s.booked!.legId}`)}
              >
                {t(K.book.track)}
              </Button>
              <Button variant="secondary" onClick={s.closeBooking}>
                {t(K.book.another)}
              </Button>
            </div>
          </div>
        ) : po ? (
          <div className="stack gap-3">
            <p className="t-sm t-muted">
              {t(K.book.forSite, { site: po.siteName, city: po.siteCity })}
            </p>
            <fieldset
              className="stack gap-1"
              style={{ border: 0, padding: 0, margin: 0 }}
            >
              <legend className="t-sm t-semibold mb-1">
                {t(K.book.lines)}
              </legend>
              {po.lines.map((l) => (
                <Checkbox
                  key={l.id}
                  label={l.description}
                  checked={s.book.lineIds.includes(l.id)}
                  onChange={() => s.toggleLine(l.id)}
                />
              ))}
              {s.book.lineIds.length === 0 && (
                <span className="t-xs t-error">{t(K.book.linesNone)}</span>
              )}
            </fieldset>
            <div className="stack gap-2">
              <span className="t-sm t-semibold">
                {t(K.book.carriers, { count: po.eligible.length })}
              </span>
              <span className="t-xs t-muted">
                {t(K.book.carriersHint, { city: po.siteCity })}
              </span>
              {po.eligible.length === 0 ? (
                <div className="stack gap-1" role="note">
                  <strong className="t-sm">
                    {t(K.book.noneEligibleTitle, { city: po.siteCity })}
                  </strong>
                  <span className="t-xs t-muted">
                    {t(K.book.noneEligibleBody)}
                  </span>
                </div>
              ) : (
                <div
                  className="stack gap-2"
                  role="radiogroup"
                  aria-label={t(K.book.choose)}
                >
                  {po.eligible.map((o, i) => (
                    <div key={o.partnerId} className="stack gap-1">
                      {i === 0 && po.eligible.length > 1 && (
                        <span className="t-xs t-muted">{t(K.book.best)}</span>
                      )}
                      <OptionCard
                        o={o}
                        chosen={s.book.partnerId === o.partnerId}
                        onPick={() => s.patchBook({ partnerId: o.partnerId })}
                        t={t}
                      />
                    </div>
                  ))}
                </div>
              )}
              {po.unavailable.length > 0 && (
                <details>
                  <summary className="t-xs t-muted">
                    {t(K.book.unavailable, {
                      count: po.unavailable.length,
                      city: po.siteCity,
                    })}
                  </summary>
                  <ul className="stack gap-1 t-xs t-muted mt-1">
                    {po.unavailable.map((u) => (
                      <li key={u.partnerId}>
                        {u.name}:{" "}
                        {t(
                          u.reason === "area"
                            ? K.book.unavailable_area
                            : K.book.unavailable_paused,
                          { city: po.siteCity },
                        )}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
            {s.chosen && (
              <p className="t-xs t-muted" role="note">
                {t(
                  s.chosen.trackingMode === "live"
                    ? K.book.liveNote
                    : s.chosen.trackingMode === "fallback"
                      ? K.book.fallbackWarn
                      : K.book.manualNote,
                )}
              </p>
            )}
            <Field
              label={t(K.book.vehicle)}
              hint={t(K.book.vehicleHint)}
              required
            >
              {({ id, describedBy }) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  value={s.book.vehicleLabel}
                  onChange={(e) =>
                    s.patchBook({ vehicleLabel: e.target.value })
                  }
                />
              )}
            </Field>
            <Field label={t(K.book.driver)} required>
              {({ id }) => (
                <Input
                  id={id}
                  value={s.book.driverName}
                  onChange={(e) => s.patchBook({ driverName: e.target.value })}
                />
              )}
            </Field>
            <Field label={t(K.book.driverPhone)}>
              {({ id }) => (
                <Input
                  id={id}
                  type="tel"
                  inputMode="tel"
                  value={s.book.driverPhone}
                  onChange={(e) => s.patchBook({ driverPhone: e.target.value })}
                />
              )}
            </Field>
            <ActionBar>
              <Button
                disabled={!s.canBook || s.busy}
                loading={s.busy}
                onClick={async () => report(await s.submitBooking())}
              >
                {t(K.book.submit, { name: s.chosen?.name ?? "" })}
              </Button>
            </ActionBar>
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}

/* ------------------------------------------------------------ delay causes */

function SplitBar({ l, t }: { l: LateDeliveryView; t: T }) {
  const total = Math.max(1, l.supplierMin + l.partnerMin);
  return (
    <div className="stack gap-1">
      <div
        className="row"
        style={{
          height: 8,
          borderRadius: 4,
          overflow: "hidden",
          background: "var(--color-border)",
        }}
        role="img"
        aria-label={t(K.delays.split, {
          supplier: duration(t, l.supplierMin),
          partner: duration(t, l.partnerMin),
        })}
      >
        <div
          style={{
            width: `${(l.supplierMin / total) * 100}%`,
            background: "var(--color-warning)",
          }}
        />
        <div
          style={{
            width: `${(l.partnerMin / total) * 100}%`,
            background: "var(--color-accent-secondary)",
          }}
        />
      </div>
      <span className="t-xs t-muted">
        {t(K.delays.split, {
          supplier: duration(t, l.supplierMin),
          partner: duration(t, l.partnerMin),
        })}
      </span>
    </div>
  );
}

function DelaysTab({
  s,
  t,
  lang,
}: {
  s: PartnerMgmtState;
  t: T;
  lang: string;
}) {
  const a = s.board!.analysis;
  const late = a.late.length;
  return (
    <div className="stack gap-3">
      <p className="t-sm t-muted">{t(K.delays.intro)}</p>
      {late === 0 ? (
        <EmptyState
          icon={<CheckCircle size={32} />}
          title={t(K.delays.noneTitle)}
          body={t(K.delays.noneBody)}
        />
      ) : (
        <>
          <p className="t-sm">
            {t(K.delays.summary, { late, total: a.deliveries })}
          </p>
          <div className="grid-auto">
            {RESPONSIBILITIES.map((r) => (
              <StatTile
                key={r}
                label={t(K.responsibility[r])}
                value={a.totals[r]}
                caption={t(K.delays.fix[r])}
              />
            ))}
          </div>
          <div
            className="row gap-2 ds-tabs--scroll"
            style={{ overflowX: "auto" }}
            role="group"
            aria-label={t(K.delays.filter.label)}
          >
            {CAUSE_FILTERS.map((f) => (
              <Chip
                key={f}
                pressed={s.causeFilter === f}
                onClick={() => s.setCauseFilter(f)}
              >
                {t(K.delays.filter[f])}
              </Chip>
            ))}
          </div>
          <div
            className="row gap-3 wrap t-xs t-muted"
            aria-label={t(K.delays.legend)}
          >
            <span className="row gap-1" style={{ alignItems: "center" }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: "var(--color-warning)",
                }}
              />{" "}
              {t(K.delays.supplierPart)}
            </span>
            <span className="row gap-1" style={{ alignItems: "center" }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: "var(--color-accent-secondary)",
                }}
              />{" "}
              {t(K.delays.partnerPart)}
            </span>
          </div>
          {s.lateShown.length === 0 ? (
            <p className="t-sm t-muted">{t(K.delays.emptyFiltered)}</p>
          ) : (
            <div className="grid-auto">
              {s.lateShown.map((l) => (
                <Card key={l.id}>
                  <div className="stack gap-2">
                    <div className="row between gap-2 wrap">
                      <strong className="t-sm">
                        {l.poCode} · {l.siteName}
                      </strong>
                      <Badge tone={RESPONSIBILITY_TONE[l.responsibility]}>
                        {t(K.responsibility[l.responsibility])}
                      </Badge>
                    </div>
                    <span className="t-xs t-muted">
                      {formatDate(l.arrivedAt, lang)} ·{" "}
                      {t(K.delays.lateBy, { time: duration(t, l.lateMin) })}
                    </span>
                    {l.responsibility !== "external" && (
                      <SplitBar l={l} t={t} />
                    )}
                    <button
                      type="button"
                      className="t-xs"
                      style={{
                        textAlign: "start",
                        color: "var(--color-accent-primary)",
                        background: "none",
                        border: 0,
                        padding: 0,
                      }}
                      onClick={() => s.openPartner(l.partnerId)}
                    >
                      {l.partnerName}
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
