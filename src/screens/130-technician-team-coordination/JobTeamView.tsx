import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ChatCircleDots, CheckCircle, Flag, Handshake, Phone, PaperPlaneTilt, ShieldCheck, UserPlus, WifiSlash } from '@phosphor-icons/react';
import { ActionBar, AscensionLine, Avatar, Badge, Button, Card, Checkbox, EmptyState, ErrorState, Field, Input, LoadingState, ProgressBar, Screen, ScreenHeader, Select, SegBar, Sheet, StatTile, TextArea, formatDate, formatDateTime } from '@/design-system';
import type { AscensionStep } from '@/design-system';
import type { BadgeTone } from '@/design-system';
import type { JobTeamView, TeamHandoffView, TeamMemberView } from '@/data/repository';
import { useJobTeam } from './useJobTeam';
import type { ActionResult, TeamState } from './useJobTeam';
import { CHAT_MAX, HANDOFF_MIN, REASON_MIN, TEAM_KEYS as K, TABS, issuePath, jobPath, listPath } from './job-team.types';

type T = ReturnType<typeof useTranslation>['t'];
const errorKey = (code?: string) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const STEP_TONE: Record<string, BadgeTone> = { complete: 'success', current: 'accent', upcoming: 'neutral', blocked: 'warning' };
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Screen 130 — Technician Team Coordination. Coordination laid over the job, SOP and check-in records everyone already has: who is on the
 * job, what each answers for, who is on site and how far along, who holds the lead's authority (and who holds it while the lead is away),
 * a chat only the people on the job can read, and handoff notes so a shift change loses nothing. The lead has the last word on sending the
 * whole checklist to quality check; a team that cannot agree can say so, and Admin hears of it.
 */
export function JobTeamScreen() {
  const { t } = useTranslation();
  const s = useJobTeam();

  if (!s.jobId) {
    return (
      <Screen width="default">
        <ScreenHeader title={t(K.title)} />
        <EmptyState icon={<Handshake size={28} />} title={t(K.pick.title)} body={t(K.pick.body)} actionLabel={t(K.pick.action)} onAction={() => s.goto(listPath)} />
      </Screen>
    );
  }
  if (s.status === 'loading' && !s.view) {
    return (
      <Screen width="default">
        <ScreenHeader title={t(K.title)} />
        <LoadingState label={t(K.loading)} variant="cards" rows={3} />
      </Screen>
    );
  }
  if (s.status === 'not_found') {
    return (
      <Screen width="default">
        <ScreenHeader title={t(K.title)} />
        <EmptyState icon={<Handshake size={28} />} title={t(K.notFound.title)} body={t(K.notFound.body)} actionLabel={t(K.notFound.action)} onAction={() => s.goto(listPath)} />
      </Screen>
    );
  }
  if (s.status === 'error' || !s.view) {
    return (
      <Screen width="default">
        <ScreenHeader title={t(K.title)} />
        <ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} />
      </Screen>
    );
  }
  return <Team s={s} v={s.view} t={t} />;
}

/* ---------------------------------------------------------------- pieces */

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="stack gap-3" style={{ borderTop: '1px solid var(--color-accent-primary)', paddingTop: 'var(--space-3)' }}>
      <div className="stack gap-1">
        <h3 className="t-sm t-semibold">{title}</h3>
        {hint && <p className="t-xs t-muted">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function Team({ s, v, t }: { s: TeamState; v: JobTeamView; t: T }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const [sheet, setSheet] = useState<null | { kind: 'assign' | 'reassign' | 'delegate' | 'add' | 'lead' | 'signoff' | 'disagree' | 'handoff'; member?: TeamMemberView }>(null);
  const close = () => setSheet(null);
  const unreadHandoffs = v.handoffs.filter((h) => h.waitingForMe).length;
  const onSite = v.members.filter((m) => m.onSiteSince).length;

  return (
    <Screen width="default" className="pb-action-bar">
      <ScreenHeader
        title={t(K.title)}
        subtitle={`${v.job.siteName} · ${v.job.code}`}
        action={
          <Button size="sm" variant="ghost" onClick={() => s.goto(s.isAdmin ? '/admin/map' : jobPath(v.job.id))} aria-label={t(K.back)}>
            <ArrowLeft size={16} aria-hidden="true" /> {t(K.back)}
          </Button>
        }
      />

      <Card className="mb-3">
        <div className="stack gap-3">
          <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
            <Badge tone={v.job.status === 'in_progress' ? 'accent' : v.job.status === 'completed' ? 'success' : v.job.status === 'on_hold' ? 'warning' : 'neutral'} dot>
              {t(K.status[v.job.status])}
            </Badge>
            <span className="t-sm">{t(K.hero.lead, { name: v.lead.name })}</span>
          </div>
          <div className="grid-auto" style={{ ['--min' as string]: '130px' }}>
            <StatTile label={t(K.hero.people)} value={<span className="num">{v.members.length}</span>} />
            <StatTile label={t(K.hero.onSite)} value={<span className="num">{onSite}</span>} />
            <StatTile label={t(K.hero.steps)} value={<span className="num">{`${v.progress.done}/${v.progress.total}`}</span>} />
          </div>
          <ProgressBar value={v.progress.total ? v.progress.done / v.progress.total : 0} label={t(K.hero.steps)} />
        </div>
      </Card>

      {(!s.isOnline || s.waiting > 0) && (
        <p className="t-xs t-muted row gap-2 mb-3" style={{ alignItems: 'center' }} role="status" data-sync={s.waiting > 0 ? 'waiting' : 'offline'}>
          <WifiSlash size={14} aria-hidden="true" /> {s.waiting > 0 ? t(K.chat.notSent, { count: s.waiting }) : t(K.offline)}
        </p>
      )}
      {s.failed.length > 0 && (
        <Card className="mb-3" style={{ borderColor: 'var(--color-error)' }}>
          <div className="stack gap-2" role="alert">
            <strong className="t-sm">{t(K.failed.title)}</strong>
            {s.failed.map((f) => (
              <p key={f.id} className="t-xs">
                {t(errorKey(f.code))}
              </p>
            ))}
            <Button size="sm" variant="secondary" onClick={s.dismissFailed} style={{ width: 'fit-content' }}>
              {t(K.failed.dismiss)}
            </Button>
          </div>
        </Card>
      )}

      <div className="mb-3">
        <SegBar
          label={t(K.tabLabel)}
          value={s.tab}
          onChange={(id) => s.setTab(id as (typeof TABS)[number])}
          items={TABS.map((id) => ({ id, label: `${t(K.tab[id])}${id === 'chat' && v.unread > 0 ? ` (${v.unread})` : id === 'handoffs' && unreadHandoffs > 0 ? ` (${unreadHandoffs})` : ''}` }))}
        />
      </div>

      {s.tab === 'team' && <TeamTab s={s} v={v} t={t} lang={lang} onSheet={setSheet} />}
      {s.tab === 'chat' && <ChatTab s={s} v={v} t={t} lang={lang} onSheet={setSheet} />}
      {s.tab === 'handoffs' && <HandoffTab s={s} v={v} t={t} lang={lang} />}

      {/* One clear primary action per tab. */}
      {s.tab === 'team' && (
        <ActionBar>
          <TeamAction s={s} v={v} t={t} onOpen={() => setSheet({ kind: 'signoff' })} />
        </ActionBar>
      )}
      {s.tab === 'chat' && (
        <ActionBar>
          <Composer s={s} t={t} />
        </ActionBar>
      )}
      {s.tab === 'handoffs' && (
        <ActionBar>
          {s.isAdmin ? (
            <p className="t-xs t-muted">{t(K.handoff.adminCannot)}</p>
          ) : (
            <Button block icon={<Handshake size={18} aria-hidden="true" />} onClick={() => setSheet({ kind: 'handoff' })} data-handoff="open">
              {t(K.handoff.write)}
            </Button>
          )}
        </ActionBar>
      )}

      <Sheets s={s} v={v} t={t} sheet={sheet} onClose={close} />
    </Screen>
  );
}

function TeamAction({ s, v, t, onOpen }: { s: TeamState; v: JobTeamView; t: T; onOpen: () => void }) {
  const so = v.signOff;
  if (s.isAdmin) return <p className="t-xs t-muted">{t(K.admin.readOnly)}</p>;
  if (!so.needed) return <p className="t-xs t-muted">{t(K.signOff.single)}</p>;
  if (so.signedOff) return <p className="t-sm row gap-2" style={{ alignItems: 'center' }}><CheckCircle size={18} weight="fill" color="var(--color-success)" aria-hidden="true" /> {t(K.signOff.done, { name: so.signedOff.byName })}</p>;
  if (!v.viewer.holdsLead) return <p className="t-xs t-muted">{t(so.awaitingLead ? K.signOff.waitingOther : K.signOff.intro)}</p>;
  return (
    <div className="stack gap-1">
      {!so.ready && <p className="t-xs t-muted">{t(so.problem === 'not_ready' ? K.signOff.notReady : K.problem[so.problem === 'job_on_hold' ? 'job_on_hold' : 'read_only'])}</p>}
      <Button block disabled={!so.ready || !!so.problem} icon={<ShieldCheck size={18} aria-hidden="true" />} onClick={onOpen} data-signoff="open">
        {t(K.signOff.button)}
      </Button>
    </div>
  );
}

/* ---------------------------------------------------------------- team tab */

function TeamTab({ s, v, t, lang, onSheet }: { s: TeamState; v: JobTeamView; t: T; lang: string; onSheet: (x: { kind: 'assign' | 'reassign' | 'delegate' | 'add' | 'lead'; member?: TeamMemberView }) => void }) {
  const logSteps: AscensionStep[] = v.log.map((e) => ({
    id: e.id,
    label: `${t(K.log[e.kind])}${e.subjectName ? `: ${e.subjectName}` : ''}`,
    meta: `${formatDateTime(e.at, lang)} · ${t(K.log.by, { name: e.byName })}${e.note && e.kind !== 'steps_assigned' ? ` · ${e.note}` : ''}`,
    status: 'complete',
  }));
  const isLeadNow = v.viewer.role === 'lead' && v.viewer.userId === v.lead.userId;
  return (
    <div className="stack gap-4">
      {v.delegation && (
        <Card style={{ borderColor: 'var(--color-accent-primary)' }}>
          <div className="stack gap-2" data-delegation>
            <p className="t-sm">{t(K.delegation.banner, { name: v.delegation.toName, from: formatDate(`${v.delegation.from}T00:00:00`, lang), until: formatDate(`${v.delegation.until}T00:00:00`, lang) })}</p>
            <p className="t-xs t-muted">{v.delegation.reason}</p>
            {(isLeadNow || s.isAdmin) && (
              <Button size="sm" variant="secondary" style={{ width: 'fit-content' }} disabled={s.busy} onClick={() => void s.endDelegation()}>
                {t(K.delegation.end)}
              </Button>
            )}
          </div>
        </Card>
      )}

      <div className="row gap-2 wrap">
        {(isLeadNow || s.isAdmin) && !v.delegation && v.members.length > 1 && (
          <Button size="sm" variant="secondary" onClick={() => onSheet({ kind: 'delegate' })} data-open="delegate">
            {t(K.delegation.open)}
          </Button>
        )}
        {s.isAdmin && (
          <>
            <Button size="sm" variant="secondary" icon={<UserPlus size={16} aria-hidden="true" />} onClick={() => onSheet({ kind: 'add' })} data-open="add">
              {t(K.admin.add)}
            </Button>
            {v.members.length > 1 && (
              <Button size="sm" variant="secondary" onClick={() => onSheet({ kind: 'lead' })} data-open="lead">
                {t(K.admin.changeLead)}
              </Button>
            )}
          </>
        )}
      </div>

      <div className="grid-auto" style={{ ['--min' as string]: '320px' }}>
        {v.members.map((m) => (
          <MemberCard key={m.userId} m={m} v={v} t={t} lang={lang} canManage={v.canManage} isAdmin={s.isAdmin} onManage={(kind) => onSheet({ kind, member: m })} />
        ))}
      </div>

      <Section title={t(K.log.heading)}>
        {logSteps.length === 0 ? (
          <p className="t-sm t-muted">{t(K.log.empty)}</p>
        ) : (
          <Card>
            <AscensionLine steps={logSteps} className="ds-ascension--multiline" />
          </Card>
        )}
      </Section>
    </div>
  );
}

function MemberCard({ m, v, t, lang, canManage, isAdmin, onManage }: { m: TeamMemberView; v: JobTeamView; t: T; lang: string; canManage: boolean; isAdmin: boolean; onManage: (kind: 'assign' | 'reassign') => void }) {
  return (
    <div data-member={m.userId}>
      <Card>
        <div className="stack gap-3">
          <div className="row gap-3" style={{ alignItems: 'center' }}>
            <Avatar name={m.name} size="md" />
            <div className="stack gap-1 grow">
              <strong className="t-sm">
                {m.name} {m.isMe ? <span className="t-xs t-muted">({t(K.role.me)})</span> : null}
              </strong>
              <div className="row gap-1 wrap">
                <Badge tone={m.role === 'lead' ? 'accent' : 'neutral'}>{t(m.role === 'lead' ? K.role.lead : K.role.assistant)}</Badge>
                {m.delegated && <Badge tone="emerald">{t(K.role.delegated)}</Badge>}
                <Badge tone={m.onSiteSince ? 'success' : 'neutral'} dot>
                  {m.onSiteSince ? t(K.member.onSite) : t(K.member.notOnSite)}
                </Badge>
              </div>
            </div>
          </div>
          <p className="t-xs t-muted">{m.onSiteSince ? t(K.member.onSiteSince, { when: formatDateTime(m.onSiteSince, lang) }) : ''}</p>
          <div className="stack gap-1">
            <span className="t-xs t-muted">{t(K.member.responsibility)}</span>
            <span className="t-sm">{m.responsibility ?? (m.role === 'lead' ? t(K.member.leadOwns) : t(K.member.noResponsibility))}</span>
          </div>
          <ProgressBar value={(m.owned === null ? v.progress.total : m.owned) ? m.ownedDone / (m.owned === null ? v.progress.total : m.owned) : 0} label={t(K.member.ownSteps)} />
          <p className="t-xs">
            {m.owned === null ? t(K.member.wholeJob, { done: m.ownedDone, total: v.progress.total }) : t(K.member.ownSteps, { done: m.ownedDone, total: m.owned })} · {t(K.member.completedBy, { count: m.completedByThem })}
          </p>
          {m.currentStepLabelKey && (
            <p className="t-xs t-muted">
              {t(K.member.now)}: {t(m.currentStepLabelKey)}
            </p>
          )}
          {m.steps.length > 0 && (
            <div className="row gap-1 wrap">
              {m.steps.map((st) => (
                <Badge key={st.id} tone={STEP_TONE[st.status] ?? 'neutral'}>
                  {t(st.labelKey)}
                </Badge>
              ))}
            </div>
          )}
          {m.role === 'assistant' && m.steps.length === 0 && <p className="t-xs t-muted">{t(K.member.noSteps)}</p>}
          <div className="row gap-2 wrap">
            {m.phone && !m.isMe && (
              <a className="ds-btn ds-btn--secondary ds-btn--sm" href={`tel:${m.phone}`}>
                <Phone size={16} aria-hidden="true" /> {t(K.member.call)}
              </a>
            )}
            {canManage && m.role === 'assistant' && (
              <Button size="sm" variant="secondary" onClick={() => onManage('assign')} data-manage={m.userId}>
                {t(K.member.manage)}
              </Button>
            )}
            {isAdmin && (
              <Button size="sm" variant="ghost" onClick={() => onManage('reassign')} data-reassign={m.userId}>
                {t(K.admin.reassign)}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------------- chat tab */

function ChatTab({ s, v, t, lang, onSheet }: { s: TeamState; v: JobTeamView; t: T; lang: string; onSheet: (x: { kind: 'disagree' }) => void }) {
  const end = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' });
  }, [v.messages.length]);
  const open = v.disagreement && !v.disagreement.resolved;
  return (
    <div className="stack gap-3">
      <p className="t-xs t-muted">{t(K.chat.intro)}</p>
      {s.isAdmin && <p className="t-xs t-muted">{t(K.chat.adminNote)}</p>}
      {v.messages.length === 0 ? (
        <EmptyState icon={<ChatCircleDots size={28} />} title={t(K.chat.heading)} body={t(K.chat.empty)} />
      ) : (
        <div className="ds-thread" aria-live="polite" data-chat>
          {v.messages.map((m) => (
            <div key={m.id} className={`ds-bubble-row ${m.mine ? 'ds-bubble-row--own' : ''}`} data-msg={m.id}>
              <div className={`ds-bubble ${m.mine ? 'ds-bubble--own' : ''}`} style={m.kind === 'disagreement' ? { border: '1px solid var(--color-warning)' } : undefined}>
                <span className="ds-bubble__tag">
                  {!m.mine && <strong>{m.authorName}</strong>}
                  {m.kind === 'disagreement' && (
                    <>
                      <Flag size={12} aria-hidden="true" /> {t(K.chat.disagreeTag)}
                    </>
                  )}
                </span>
                <span>{m.text}</span>
                {m.kind === 'disagreement' && m.issueId && (
                  <button type="button" className="ds-bubble__ref" onClick={() => s.goto(issuePath(v.job.id, m.issueId as string))}>
                    {t(K.chat.viewReport)}
                  </button>
                )}
                <span className="ds-bubble__meta">
                  {m.local ? t(K.chat.sending) : formatDateTime(m.createdAt, lang)}
                  {m.unread && !m.mine ? ` · ${t(K.chat.unread)}` : ''}
                </span>
              </div>
            </div>
          ))}
          <div ref={end} />
        </div>
      )}
      {v.disagreement && (
        <Card style={{ borderColor: open ? 'var(--color-warning)' : undefined }}>
          <p className="t-sm">{t(open ? K.chat.disagreeOpen : K.chat.disagreeResolved, { code: v.disagreement.code })}</p>
        </Card>
      )}
      {!s.isAdmin && !open && (
        <Button size="sm" variant="ghost" icon={<Flag size={16} aria-hidden="true" />} style={{ width: 'fit-content' }} onClick={() => onSheet({ kind: 'disagree' })} data-open="disagree">
          {t(K.chat.disagree)}
        </Button>
      )}
    </div>
  );
}

function Composer({ s, t }: { s: TeamState; t: T }) {
  const [text, setText] = useState('');
  const send = () => {
    if (!text.trim()) return;
    s.sendMessage(text);
    setText('');
  };
  return (
    <div className="row gap-2" style={{ alignItems: 'flex-end' }}>
      <div className="grow">
        <Input aria-label={t(K.chat.placeholder)} placeholder={t(K.chat.placeholder)} value={text} maxLength={CHAT_MAX} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} data-composer />
      </div>
      <Button disabled={!text.trim()} icon={<PaperPlaneTilt size={18} aria-hidden="true" />} onClick={send} data-send>
        {t(K.chat.send)}
      </Button>
    </div>
  );
}

/* ---------------------------------------------------------------- handoffs */

function HandoffTab({ s, v, t, lang }: { s: TeamState; v: JobTeamView; t: T; lang: string }) {
  return (
    <div className="stack gap-3">
      <p className="t-xs t-muted">{t(K.handoff.intro)}</p>
      {v.handoffs.length === 0 ? (
        <EmptyState icon={<Handshake size={28} />} title={t(K.handoff.heading)} body={t(K.handoff.empty)} />
      ) : (
        <div className="grid-auto" style={{ ['--min' as string]: '320px' }}>
          {v.handoffs.map((h) => (
            <HandoffCard key={h.id} h={h} s={s} t={t} lang={lang} />
          ))}
        </div>
      )}
    </div>
  );
}

function HandoffCard({ h, s, t, lang }: { h: TeamHandoffView; s: TeamState; t: T; lang: string }) {
  return (
    <div data-handoff-card={h.id}>
      <Card style={h.waitingForMe ? { borderColor: 'var(--color-accent-primary)' } : undefined}>
        <div className="stack gap-2">
          <div className="row gap-2 wrap" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <strong className="t-sm">{t(K.handoff.from, { name: h.fromName })}</strong>
            <Badge tone={h.toUserId ? 'accent' : 'neutral'}>{h.toName ? t(K.handoff.forYou, { name: h.toName }) : t(K.handoff.forTeam)}</Badge>
          </div>
          <p className="t-sm" style={{ whiteSpace: 'pre-wrap' }}>
            {h.text}
          </p>
          {h.openSteps.length > 0 && (
            <div className="stack gap-1">
              <span className="t-xs t-muted">{t(K.handoff.open)}</span>
              <div className="row gap-1 wrap">
                {h.openSteps.map((st) => (
                  <Badge key={st.id} tone="neutral">
                    {t(st.labelKey)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <p className="t-xs t-muted">{h.local ? t(K.handoff.local) : formatDateTime(h.createdAt, lang)}</p>
          {h.acknowledgedBy.length > 0 ? (
            <p className="t-xs t-success row gap-1" style={{ alignItems: 'center' }}>
              <CheckCircle size={14} weight="fill" aria-hidden="true" /> {h.acknowledgedBy.map((a) => t(K.handoff.ackBy, { name: a.name, when: formatDateTime(a.at, lang) })).join(' · ')}
            </p>
          ) : (
            !h.local && <p className="t-xs t-muted">{t(K.handoff.notAcked)}</p>
          )}
          {h.waitingForMe && (
            <Button size="sm" disabled={s.busy} style={{ width: 'fit-content' }} icon={<CheckCircle size={16} aria-hidden="true" />} onClick={() => void s.acknowledge(h.id)} data-ack={h.id}>
              {t(K.handoff.ack)}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------------- sheets */

function Sheets({ s, v, t, sheet, onClose }: { s: TeamState; v: JobTeamView; t: T; sheet: null | { kind: string; member?: TeamMemberView }; onClose: () => void }) {
  const kind = sheet?.kind;
  return (
    <>
      <Sheet open={kind === 'signoff'} onClose={onClose} title={t(K.signOff.confirmTitle)} closeLabel={t('action.close')}>
        <SignOffSheet s={s} t={t} onClose={onClose} />
      </Sheet>
      <Sheet open={kind === 'disagree'} onClose={onClose} title={t(K.chat.disagreeTitle)} closeLabel={t('action.close')}>
        <TextSheet body={t(K.chat.disagreeBody)} label={t(K.chat.disagreeLabel)} hint={t(K.chat.disagreeHint, { count: HANDOFF_MIN })} min={HANDOFF_MIN} go={t(K.chat.disagreeGo)} cancel={t(K.cancel)} t={t} onClose={onClose} onSubmit={(x) => s.flagDisagreement(x)} />
      </Sheet>
      <Sheet open={kind === 'handoff'} onClose={onClose} title={t(K.handoff.title)} closeLabel={t('action.close')}>
        <HandoffSheet s={s} v={v} t={t} onClose={onClose} />
      </Sheet>
      <Sheet open={kind === 'assign' && !!sheet?.member} onClose={onClose} title={t(K.assign.title)} closeLabel={t('action.close')}>
        {sheet?.member && <AssignSheet s={s} v={v} m={sheet.member} t={t} onClose={onClose} />}
      </Sheet>
      <Sheet open={kind === 'delegate'} onClose={onClose} title={t(K.delegation.title)} closeLabel={t('action.close')}>
        <DelegateSheet s={s} v={v} t={t} onClose={onClose} />
      </Sheet>
      <Sheet open={kind === 'add'} onClose={onClose} title={t(K.admin.addTitle)} closeLabel={t('action.close')}>
        <AddSheet s={s} v={v} t={t} onClose={onClose} />
      </Sheet>
      <Sheet open={kind === 'reassign' && !!sheet?.member} onClose={onClose} title={t(K.admin.reassignTitle)} closeLabel={t('action.close')}>
        {sheet?.member && <ReassignSheet s={s} v={v} m={sheet.member} t={t} onClose={onClose} />}
      </Sheet>
      <Sheet open={kind === 'lead'} onClose={onClose} title={t(K.admin.changeLeadTitle)} closeLabel={t('action.close')}>
        <LeadSheet s={s} v={v} t={t} onClose={onClose} />
      </Sheet>
    </>
  );
}

function useSubmit(onClose: () => void, t: T) {
  const [error, setError] = useState<string | null>(null);
  const run = async (fn: () => Promise<ActionResult>) => {
    const r = await fn();
    if (r.ok) {
      setError(null);
      onClose();
    } else setError(t(errorKey(r.code)));
    return r;
  };
  return { error, run };
}

function SignOffSheet({ s, t, onClose }: { s: TeamState; t: T; onClose: () => void }) {
  const { error, run } = useSubmit(onClose, t);
  return (
    <div className="stack gap-3">
      <p className="t-sm">{t(K.signOff.confirmBody)}</p>
      {error && <p className="t-xs t-error" role="alert">{error}</p>}
      <div className="row gap-2 wrap">
        <Button variant="secondary" onClick={onClose}>{t(K.signOff.back)}</Button>
        <Button disabled={s.busy} onClick={() => void run(() => s.signOff())} data-signoff="go">{t(K.signOff.go)}</Button>
      </div>
    </div>
  );
}

function TextSheet({ body, label, hint, min, go, cancel, t, onClose, onSubmit }: { body: string; label: string; hint: string; min: number; go: string; cancel: string; t: T; onClose: () => void; onSubmit: (text: string) => Promise<ActionResult> }) {
  const [text, setText] = useState('');
  const { error, run } = useSubmit(onClose, t);
  const ok = text.trim().length >= min;
  return (
    <div className="stack gap-3">
      <p className="t-sm">{body}</p>
      <Field label={label} hint={hint} required error={error ?? undefined}>
        {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={4} value={text} onChange={(e) => setText(e.target.value)} />}
      </Field>
      <div className="row gap-2 wrap">
        <Button variant="secondary" onClick={onClose}>{cancel}</Button>
        <Button disabled={!ok} onClick={() => void run(() => onSubmit(text))} data-sheet-go>{go}</Button>
      </div>
    </div>
  );
}

function HandoffSheet({ s, v, t, onClose }: { s: TeamState; v: JobTeamView; t: T; onClose: () => void }) {
  const [text, setText] = useState('');
  const [to, setTo] = useState('');
  const ok = text.trim().length >= HANDOFF_MIN;
  const others = v.members.filter((m) => !m.isMe);
  const mine = v.members.find((m) => m.isMe);
  const openSteps = v.steps.filter((st) => st.status !== 'complete' && (mine?.owned === null || mine?.steps.some((x) => x.id === st.id)));
  return (
    <div className="stack gap-3">
      <Field label={t(K.handoff.to)}>
        {({ id }) => (
          <Select id={id} value={to} onChange={(e) => setTo(e.target.value)}>
            <option value="">{t(K.handoff.toTeam)}</option>
            {others.map((m) => <option key={m.userId} value={m.userId}>{m.name}</option>)}
          </Select>
        )}
      </Field>
      <Field label={t(K.handoff.text)} hint={t(K.handoff.textHint, { count: HANDOFF_MIN })} required>
        {({ id, describedBy }) => (
          <div className="stack gap-1">
            <TextArea id={id} aria-describedby={describedBy} rows={5} value={text} onChange={(e) => setText(e.target.value)} data-handoff-text />
            {ok && <span className="t-xs t-success row gap-1" style={{ alignItems: 'center' }}><CheckCircle size={14} weight="fill" aria-hidden="true" /> {t(K.handoff.textOk)}</span>}
          </div>
        )}
      </Field>
      <div className="stack gap-1">
        <span className="t-xs t-muted">{t(K.handoff.open)}</span>
        {openSteps.length === 0 ? <span className="t-xs">{t(K.handoff.openNone)}</span> : <div className="row gap-1 wrap">{openSteps.map((st) => <Badge key={st.id} tone="neutral">{t(st.labelKey)}</Badge>)}</div>}
      </div>
      <div className="row gap-2 wrap">
        <Button variant="secondary" onClick={onClose}>{t(K.cancel)}</Button>
        <Button
          disabled={!ok}
          icon={<Handshake size={18} aria-hidden="true" />}
          onClick={() => {
            s.sendHandoff(text, to || undefined);
            onClose();
          }}
          data-sheet-go
        >
          {t(K.handoff.send)}
        </Button>
      </div>
    </div>
  );
}

function AssignSheet({ s, v, m, t, onClose }: { s: TeamState; v: JobTeamView; m: TeamMemberView; t: T; onClose: () => void }) {
  const [picked, setPicked] = useState<string[]>(m.steps.map((x) => x.id));
  const [resp, setResp] = useState(m.responsibility ?? '');
  const { error, run } = useSubmit(onClose, t);
  const open = v.steps.filter((st) => st.status !== 'complete');
  return (
    <div className="stack gap-3">
      <p className="t-sm">{t(K.assign.body, { name: m.name })}</p>
      <Field label={t(K.assign.responsibility)} hint={t(K.assign.responsibilityHint)}>
        {({ id }) => <Input id={id} value={resp} maxLength={60} onChange={(e) => setResp(e.target.value)} data-resp />}
      </Field>
      <div className="stack gap-2">
        <strong className="t-xs">{t(K.assign.steps)}</strong>
        {open.map((st) => {
          const holder = st.ownerId && st.ownerId !== m.userId ? v.members.find((x) => x.userId === st.ownerId)?.name : null;
          return (
            <Checkbox
              key={st.id}
              checked={picked.includes(st.id)}
              onChange={(x) => setPicked((p) => (x ? [...p, st.id] : p.filter((id) => id !== st.id)))}
              label={<span className="stack"><span className="t-sm">{t(st.labelKey)}</span>{holder && <span className="t-xs t-muted">{t(K.assign.heldBy, { name: holder })}</span>}</span>}
            />
          );
        })}
        <p className="t-xs t-muted">{t(K.assign.doneNote)}</p>
      </div>
      {error && <p className="t-xs t-error" role="alert">{error}</p>}
      <div className="row gap-2 wrap">
        <Button variant="secondary" onClick={onClose}>{t(K.cancel)}</Button>
        <Button disabled={s.busy} onClick={() => void run(() => s.assign(m.userId, picked, resp))} data-sheet-go>{t(K.assign.save)}</Button>
      </div>
    </div>
  );
}

function DelegateSheet({ s, v, t, onClose }: { s: TeamState; v: JobTeamView; t: T; onClose: () => void }) {
  const others = v.members.filter((m) => m.userId !== v.lead.userId);
  const [to, setTo] = useState(others[0]?.userId ?? '');
  const [from, setFrom] = useState(todayKey());
  const [until, setUntil] = useState(todayKey());
  const [reason, setReason] = useState('');
  const { error, run } = useSubmit(onClose, t);
  const ok = !!to && reason.trim().length >= REASON_MIN && until >= from;
  return (
    <div className="stack gap-3">
      <p className="t-sm">{t(K.delegation.body)}</p>
      <Field label={t(K.delegation.to)}>
        {({ id }) => (
          <Select id={id} value={to} onChange={(e) => setTo(e.target.value)}>
            <option value="">{t(K.delegation.pick)}</option>
            {others.map((m) => <option key={m.userId} value={m.userId}>{m.name}</option>)}
          </Select>
        )}
      </Field>
      <div className="grid-2">
        <Field label={t(K.delegation.from)}>{({ id }) => <Input id={id} type="date" value={from} min={todayKey()} onChange={(e) => setFrom(e.target.value)} />}</Field>
        <Field label={t(K.delegation.until)}>{({ id }) => <Input id={id} type="date" value={until} min={from} onChange={(e) => setUntil(e.target.value)} />}</Field>
      </div>
      <Field label={t(K.delegation.reason)} hint={t(K.delegation.reasonHint, { count: REASON_MIN })} required error={error ?? undefined}>
        {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />}
      </Field>
      <div className="row gap-2 wrap">
        <Button variant="secondary" onClick={onClose}>{t(K.cancel)}</Button>
        <Button disabled={!ok || s.busy} onClick={() => void run(() => s.delegate({ toUserId: to, from, until, reason }))} data-sheet-go>{t(K.delegation.go)}</Button>
      </div>
    </div>
  );
}

function AddSheet({ s, v, t, onClose }: { s: TeamState; v: JobTeamView; t: T; onClose: () => void }) {
  const [who, setWho] = useState('');
  const [resp, setResp] = useState('');
  const { error, run } = useSubmit(onClose, t);
  return (
    <div className="stack gap-3">
      <p className="t-sm">{t(K.admin.addBody)}</p>
      {v.addable.length === 0 ? (
        <p className="t-sm t-muted">{t(K.admin.addNone)}</p>
      ) : (
        <Field label={t(K.admin.addPick)}>
          {({ id }) => (
            <Select id={id} value={who} onChange={(e) => setWho(e.target.value)}>
              <option value="">{t(K.admin.addPick)}</option>
              {v.addable.map((a) => <option key={a.id} value={a.id}>{a.name}{a.otherJobsToday > 0 ? ` · ${t(K.admin.addBusy, { count: a.otherJobsToday })}` : ''}</option>)}
            </Select>
          )}
        </Field>
      )}
      <Field label={t(K.assign.responsibility)} hint={t(K.assign.responsibilityHint)} error={error ?? undefined}>
        {({ id }) => <Input id={id} value={resp} maxLength={60} onChange={(e) => setResp(e.target.value)} />}
      </Field>
      <div className="row gap-2 wrap">
        <Button variant="secondary" onClick={onClose}>{t(K.cancel)}</Button>
        <Button disabled={!who || s.busy} onClick={() => void run(() => s.addMember(who, resp))} data-sheet-go>{t(K.admin.addGo)}</Button>
      </div>
    </div>
  );
}

function ReassignSheet({ s, v, m, t, onClose }: { s: TeamState; v: JobTeamView; m: TeamMemberView; t: T; onClose: () => void }) {
  const others = v.members.filter((x) => x.userId !== m.userId);
  const isLead = m.role === 'lead';
  const [reason, setReason] = useState('');
  const [hand, setHand] = useState('');
  const [newLead, setNewLead] = useState(others[0]?.userId ?? '');
  const { error, run } = useSubmit(onClose, t);
  const ok = reason.trim().length >= REASON_MIN && (!isLead || !!newLead);
  return (
    <div className="stack gap-3">
      <p className="t-sm">{t(isLead ? K.admin.reassignLeadBody : K.admin.reassignBody, { name: m.name })}</p>
      {isLead && (
        <Field label={t(K.admin.newLead)}>
          {({ id }) => <Select id={id} value={newLead} onChange={(e) => setNewLead(e.target.value)}>{others.map((x) => <option key={x.userId} value={x.userId}>{x.name}</option>)}</Select>}
        </Field>
      )}
      {!isLead && (
        <Field label={t(K.admin.handTo)}>
          {({ id }) => (
            <Select id={id} value={hand} onChange={(e) => setHand(e.target.value)}>
              <option value="">{t(K.admin.handToLead)}</option>
              {others.filter((x) => x.role === 'assistant').map((x) => <option key={x.userId} value={x.userId}>{x.name}</option>)}
            </Select>
          )}
        </Field>
      )}
      <Field label={t(K.admin.reason)} required error={error ?? undefined}>
        {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />}
      </Field>
      <div className="row gap-2 wrap">
        <Button variant="secondary" onClick={onClose}>{t(K.cancel)}</Button>
        <Button variant="danger" disabled={!ok || s.busy} onClick={() => void run(() => s.reassign(m.userId, { reason, ...(hand ? { handStepsTo: hand } : {}), ...(isLead ? { newLeadId: newLead } : {}) }))} data-sheet-go>{t(K.admin.reassignGo)}</Button>
      </div>
    </div>
  );
}

function LeadSheet({ s, v, t, onClose }: { s: TeamState; v: JobTeamView; t: T; onClose: () => void }) {
  const others = v.members.filter((m) => m.userId !== v.lead.userId);
  const [to, setTo] = useState(others[0]?.userId ?? '');
  const [reason, setReason] = useState('');
  const { error, run } = useSubmit(onClose, t);
  return (
    <div className="stack gap-3">
      <p className="t-sm">{t(K.admin.changeLeadBody)}</p>
      <Field label={t(K.admin.newLead)}>
        {({ id }) => <Select id={id} value={to} onChange={(e) => setTo(e.target.value)}>{others.map((x) => <option key={x.userId} value={x.userId}>{x.name}</option>)}</Select>}
      </Field>
      <Field label={t(K.admin.reason)} required error={error ?? undefined}>
        {({ id, describedBy }) => <TextArea id={id} aria-describedby={describedBy} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />}
      </Field>
      <div className="row gap-2 wrap">
        <Button variant="secondary" onClick={onClose}>{t(K.cancel)}</Button>
        <Button disabled={!to || reason.trim().length < REASON_MIN || s.busy} onClick={() => void run(() => s.changeLead(to, reason))} data-sheet-go>{t(K.admin.changeLeadGo)}</Button>
      </div>
    </div>
  );
}
