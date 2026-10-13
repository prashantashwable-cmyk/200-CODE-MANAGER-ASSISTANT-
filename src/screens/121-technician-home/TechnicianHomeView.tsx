import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  CalendarBlank,
  CheckCircle,
  Coffee,
  MapPin,
  PauseCircle,
  Truck,
  UsersThree,
  Warning,
  WifiSlash,
} from "@phosphor-icons/react";
import {
  AscensionLine,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  ListRow,
  LoadingState,
  ProgressBar,
  Screen,
  StatTile,
  formatDateTime,
  formatINR,
  formatPercent,
  formatTime,
  relativeTimeParts,
} from "@/design-system";
import type { AscensionStep, BadgeTone } from "@/design-system";
import type { TechnicianJobView } from "@/data/repository";
import { SosButton, SosStatus } from "@/features/safety/SosButton";
import { useSession } from "@/session/SessionProvider";
import { useTechnicianHome } from "./useTechnicianHome";
import { HOME_KEYS as K, jobPath } from "./technician-home.types";

const STATUS_TONE: Record<TechnicianJobView["status"], BadgeTone> = {
  scheduled: "accent",
  materials_pending: "warning",
  in_progress: "success",
  qc_pending: "accent",
  handover_pending: "accent",
  completed: "neutral",
  on_hold: "error",
};

type T = ReturnType<typeof useTranslation>["t"];

const dayLabel = (iso: string, lang: string) =>
  new Intl.DateTimeFormat(lang, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(iso));

/**
 * Screen 121 — Technician Home / My Jobs. One tap from opening the app to the job in hand. The day is read from the same job
 * records delivery scheduling creates, so there is no second calendar. A technician who is not the lead sees their own part of the
 * job and who leads it, never the lead's whole view; two jobs booked for one day are said plainly, not drawn as an impossible
 * schedule; a light day is a calm empty state. The quality score is the number 024's leaderboard shows.
 */
export function TechnicianHomeView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useSession();
  const s = useTechnicianHome();
  const lang = i18n.language;
  const first = user?.name.split(" ")[0] ?? "";

  if (s.status === "loading" && !s.home) {
    return (
      <Screen>
        <div className="mt-4 mb-4">
          <h1 className="t-2xl t-balance">{t(K.greeting, { name: first })}</h1>
        </div>
        <LoadingState label={t(K.loading)} variant="cards" rows={3} />
      </Screen>
    );
  }
  if (s.status === "error" || !s.home) {
    return (
      <Screen>
        <ErrorState
          title={t(K.error.title)}
          body={t(K.error.body)}
          retryLabel={t("action.retry")}
          onRetry={s.reload}
        />
      </Screen>
    );
  }

  const h = s.home;
  const relative = relativeTimeParts(s.lastSyncedAt);
  const [primary, ...others] = h.todays;
  const firstDay =
    h.todays.length === 0 &&
    h.upcoming.length === 0 &&
    h.stats.completedThisMonth === 0 &&
    h.stats.pendingPayoutCount === 0;
  const sosBanner = h.sos && h.sos.status !== "cancelled";

  return (
    <Screen className="pb-action-bar">
      <div className="mt-4 mb-3">
        <div
          className="row between gap-2 wrap"
          style={{ alignItems: "center" }}
        >
          <h1 className="t-2xl t-balance">{t(K.greeting, { name: first })}</h1>
          <Badge tone={h.onDuty ? "success" : "neutral"}>
            {t(h.onDuty ? K.onDuty : K.offDuty)}
          </Badge>
        </div>
        {!s.isOnline && (
          <p className="t-xs t-warning row gap-2 mt-2">
            <WifiSlash size={14} className="shrink-0" />
            {t(K.offlineNote, {
              time: t(relative.key, { count: relative.count }),
            })}
          </p>
        )}
      </div>

      <div className="mb-3 row gap-2 wrap"><Button size="sm" variant="secondary" data-open-rewards onClick={() => navigate("/rewards-leaderboard")}>{t("rewardsLeaderboard.link.open")}</Button><Button size="sm" variant="secondary" data-open-badges onClick={() => navigate("/badges")}>{t("badges.link.open")}</Button><Button size="sm" variant="secondary" data-open-tds onClick={() => navigate("/tds-statement")}>{t("tdsStatement.link.open")}</Button><Button size="sm" variant="secondary" data-open-history onClick={() => navigate("/payout-history")}>{t("payoutHistory.link.open")}</Button></div>

      {sosBanner && (
        <SosStatus
          attempt={h.sos}
          busy={s.busy}
          onCancel={() => h.sos && void s.cancelSos(h.sos)}
          onElapsed={() => void s.refresh()}
        />
      )}

      {h.checkedIn && (
        <Card className="mb-3" style={{ borderColor: h.checkedIn.stale ? "var(--color-warning)" : "var(--color-success)" }}>
          <div className="row-top gap-3">
            <Warning size={22} color={h.checkedIn.stale ? "var(--color-warning)" : "var(--color-success)"} aria-hidden="true" />
            <div className="stack gap-2 grow">
              <strong className="t-sm">{h.checkedIn.stale ? t(K.checkIn.staleTitle) : t(K.checkIn.onSite, { site: h.checkedIn.siteName, time: formatTime(h.checkedIn.since, lang) })}</strong>
              {h.checkedIn.stale && <p className="t-sm">{t(K.checkIn.staleBody, { site: h.checkedIn.siteName, since: formatDateTime(h.checkedIn.since, lang) })}</p>}
              <div>
                <Button size="sm" variant="secondary" onClick={() => navigate(`/technician/jobs/${h.checkedIn!.jobId}/checkin`)}>
                  {h.checkedIn.stale ? t(K.checkIn.staleAction) : t(K.checkIn.open)}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {h.clashes.length > 0 && (
        <Card className="mb-3" style={{ borderColor: "var(--color-warning)" }}>
          <div className="row-top gap-3">
            <Warning
              size={22}
              color="var(--color-warning)"
              aria-hidden="true"
            />
            <div className="stack gap-1">
              <strong className="t-sm">{t(K.clash.title)}</strong>
              {h.clashes.map((c) => (
                <p key={c.date} className="t-sm">
                  {t(K.clash.body, {
                    codes: c.codes.join(" · "),
                    date: dayLabel(c.date, lang),
                  })}
                </p>
              ))}
            </div>
          </div>
        </Card>
      )}

      <div className="main-aside">
        <div>
          <h2 className="t-lg mb-2">{t(K.today.heading)}</h2>
          {!primary ? (
            <EmptyState
              icon={<Coffee size={28} />}
              title={t(K.today.emptyTitle)}
              body={
                h.upcoming[0]
                  ? t(K.today.nextUp, {
                      site: h.upcoming[0].siteName,
                      date: dayLabel(h.upcoming[0].scheduledFor, lang),
                    })
                  : t(K.today.emptyBody)
              }
            />
          ) : (
            <div className="stack gap-3">
              <JobHero
                job={primary}
                t={t}
                lang={lang}
                onOpen={() => navigate(jobPath(primary.id))}
              />
              {others.length > 0 && (
                <div
                  className="grid-auto"
                  style={{ ["--min" as string]: "260px" } as CSSProperties}
                >
                  {others.map((j) => (
                    <JobHero
                      key={j.id}
                      job={j}
                      t={t}
                      lang={lang}
                      compact
                      onOpen={() => navigate(jobPath(j.id))}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {firstDay && (
            <Card className="mt-4">
              <p className="t-md t-semibold">{t(K.firstDay.title)}</p>
              <p className="t-sm t-muted mt-1">{t(K.firstDay.body)}</p>
            </Card>
          )}
        </div>
        <div className="stack gap-4">
          <div
            className="grid-auto"
            style={{ ["--min" as string]: "140px" } as CSSProperties}
          >
            <Card>
              <StatTile
                label={t(K.stat.completed)}
                value={
                  <span className="num">{h.stats.completedThisMonth}</span>
                }
              />
            </Card>
            <Card>
              <StatTile
                label={t(K.stat.quality)}
                value={
                  <span className="num">
                    {h.stats.qualityScore === null
                      ? "—"
                      : formatPercent(h.stats.qualityScore, 0)}
                  </span>
                }
                caption={t(
                  h.stats.qualityScore === null
                    ? K.stat.qualityNone
                    : K.stat.qualityHint,
                )}
              />
            </Card>
            <Card>
              <StatTile
                label={t(K.stat.payout)}
                value={
                  <span className="num">
                    {formatINR(h.stats.pendingPayout)}
                  </span>
                }
                caption={
                  h.stats.pendingPayoutCount > 0
                    ? t(K.stat.payoutCount, {
                        count: h.stats.pendingPayoutCount,
                      })
                    : t(K.stat.payoutNone)
                }
              />
            </Card>
          </div>

          {s.qcOpen > 0 && (
            <Card flush className="mb-4">
              <ListRow
                title={t("qcAssignment.board.mine")}
                subtitle={t("qcAssignment.board.mineBody")}
                trailing={<Badge tone="accent">{s.qcOpen}</Badge>}
                onClick={() => navigate("/qc-assignments")}
              />
            </Card>
          )}

          {s.serviceOpen > 0 && (
            <Card flush className="mb-4">
              <ListRow
                title={t("serviceTickets.visits.mine")}
                subtitle={t("serviceTickets.visits.mineBody")}
                trailing={<Badge tone="accent">{s.serviceOpen}</Badge>}
                onClick={() => navigate("/service-requests")}
              />
            </Card>
          )}

          {s.reworkOpen > 0 && (
            <Card flush className="mb-4">
              <ListRow
                title={t("rework.list.mine")}
                subtitle={t("rework.list.heading")}
                trailing={<Badge tone="accent">{s.reworkOpen}</Badge>}
                onClick={() => navigate("/rework")}
              />
            </Card>
          )}

          <h2 className="t-lg mb-2">{t(K.upcoming.heading)}</h2>
          {h.upcoming.length === 0 ? (
            <Card body={t(K.upcoming.empty)} />
          ) : (
            <Card flush>
              {h.upcoming.map((j) => (
                <ListRow
                  key={j.id}
                  title={j.siteName}
                  subtitle={`${dayLabel(j.scheduledFor, lang)}${j.role === "assistant" && j.leadName ? ` · ${t(K.upcoming.assisting, { name: j.leadName })}` : ""}`}
                  trailing={
                    <span
                      className="stack"
                      style={{ alignItems: "flex-end", gap: 4 }}
                    >
                      {j.clashesWith.length > 0 && (
                        <Badge tone="warning">{t(K.upcoming.clash)}</Badge>
                      )}
                      {j.status === "materials_pending" && (
                        <Badge tone="warning">{t(K.upcoming.waiting)}</Badge>
                      )}
                      <Badge tone={j.role === "lead" ? "accent" : "neutral"}>
                        {t(K.role[j.role])}
                      </Badge>
                    </span>
                  }
                  onClick={() => navigate(jobPath(j.id))}
                />
              ))}
            </Card>
          )}
        </div>
      </div>

      <p className="t-xs t-muted mt-4">
        {t(K.lastSynced, { time: formatDateTime(s.lastSyncedAt, lang) })}
      </p>

      <SosButton
        attempt={h.sos}
        busy={s.busy}
        onBegin={() => void s.beginSos()}
      />
    </Screen>
  );
}

/* --------------------------------------------------------------------- a job */

function JobHero({
  job,
  t,
  lang,
  compact,
  onOpen,
}: {
  job: TechnicianJobView;
  t: T;
  lang: string;
  compact?: boolean;
  onOpen: () => void;
}) {
  const assistant = job.role === "assistant";
  const tasks: AscensionStep[] = job.myTasks.map((task) => ({
    id: task.id,
    label: t(task.labelKey),
    meta: t(K.stepStatus[task.status]),
    status: task.status,
  }));
  const actionKey =
    assistant && (job.action === "continue" || job.action === "start")
      ? K.action.openMine
      : K.action[job.action];
  const blocked =
    job.action === "waiting_materials" || job.action === "on_hold";
  return (
    <Card
      style={{
        borderColor:
          job.action === "on_hold" ? "var(--color-error)" : undefined,
      }}
    >
      <div className="stack gap-3">
        <div className="row gap-2 wrap" style={{ alignItems: "center" }}>
          <Badge tone={job.role === "lead" ? "accent" : "neutral"}>
            {t(K.role[job.role])}
          </Badge>
          <Badge tone={STATUS_TONE[job.status]}>
            {t(K.status[job.status])}
          </Badge>
          <span className="t-xs t-muted">{job.code}</span>
        </div>

        <div className="stack gap-1">
          <h3 className={compact ? "t-md t-semibold" : "t-xl t-semibold"}>
            {job.siteName}
          </h3>
          <span
            className="t-sm t-muted row gap-1"
            style={{ alignItems: "center" }}
          >
            <MapPin size={14} aria-hidden="true" /> {job.address}
          </span>
          {job.customerName && (
            <span className="t-sm">
              {t(K.today.customer, { name: job.customerName })}
            </span>
          )}
        </div>

        {assistant && (
          <div className="stack gap-2">
            {job.leadName && (
              <p className="t-sm row gap-2" style={{ alignItems: "center" }}>
                <UsersThree size={16} aria-hidden="true" />{" "}
                {t(K.role.assisting, { name: job.leadName })}
              </p>
            )}
            <strong className="t-sm">{t(K.role.yourPart)}</strong>
            {tasks.length > 0 ? <AscensionLine steps={tasks} /> : null}
            {job.stage === null && (
              <p className="t-sm t-success row gap-1">
                <CheckCircle size={16} aria-hidden="true" />{" "}
                {t(K.role.partDone)}
              </p>
            )}
          </div>
        )}

        {!assistant && (
          <div className="stack gap-1">
            {job.stage ? (
              <>
                <span className="t-sm t-medium">
                  {t(K.stage.label, {
                    index: job.stage.index,
                    total: job.stage.total,
                    step: t(job.stage.labelKey),
                  })}
                </span>
                <ProgressBar
                  value={
                    job.progress.total
                      ? job.progress.done / job.progress.total
                      : 0
                  }
                  label={t(K.stage.progress, {
                    done: job.progress.done,
                    total: job.progress.total,
                  })}
                />
              </>
            ) : (
              <span className="t-sm t-muted">{t(K.stage.done)}</span>
            )}
          </div>
        )}

        {!assistant && job.teammates.length > 0 && (
          <p
            className="t-xs t-muted row gap-1"
            style={{ alignItems: "center" }}
          >
            <UsersThree size={14} aria-hidden="true" />{" "}
            {t(K.role.withTeam, {
              names: job.teammates.map((m) => m.name).join(", "),
            })}
          </p>
        )}

        {job.action === "on_hold" && job.holdReason && (
          <p className="t-sm t-error row-top gap-2">
            <PauseCircle size={18} className="shrink-0" aria-hidden="true" />{" "}
            {t(K.hold.reason, { reason: job.holdReason })}
          </p>
        )}
        {job.action === "waiting_materials" && (
          <p className="t-sm t-warning row gap-2">
            <Truck size={16} aria-hidden="true" />{" "}
            {t(K.today.scheduledFor, {
              date: dayLabel(job.scheduledFor, lang),
            })}
          </p>
        )}
        {job.clashesWith.length > 0 && (
          <p className="t-xs t-warning row gap-1">
            <CalendarBlank size={14} aria-hidden="true" /> {t(K.upcoming.clash)}
            : {job.clashesWith.join(", ")}
          </p>
        )}

        <Button
          block
          variant={blocked ? "secondary" : "primary"}
          onClick={onOpen}
        >
          {t(actionKey)}
        </Button>
      </div>
    </Card>
  );
}
