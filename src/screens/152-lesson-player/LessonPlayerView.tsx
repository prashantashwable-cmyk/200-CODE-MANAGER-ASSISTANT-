import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Anchor, ArrowCounterClockwise, ArrowRight, CaretLeft, CheckCircle, ClosedCaptioning, CloudSlash, DeviceMobile, DownloadSimple, Gauge, Handshake, Lifebuoy, LockKey, MagnifyingGlass, Parachute, Pause, Play, ShieldCheck, SpeakerHigh, Tag, UserCircle, Warning, Lightning } from '@phosphor-icons/react';
import { AscensionLine, Badge, Button, Card, Chip, EmptyState, ErrorState, LoadingState, ProgressBar, Screen, ScreenHeader, Select } from '@/design-system';
import type { AscensionStep } from '@/design-system';
import type { LessonView, ModuleLessonsView } from '@/data/repository';
import type { LessonVisual } from '@/data/types';
import { referenceHtml, themeTokens } from '@/features/training/reference';
import { LANGS, PLAYER_KEYS as K, SPEEDS, checkBase, pointKey, sceneKey, summaryKey, titleKey } from './lesson-player.types';
import type { LessonLang } from './lesson-player.types';
import { useLessonPlayer } from './useLessonPlayer';
import type { LessonPlayerState } from './useLessonPlayer';

type T = ReturnType<typeof useTranslation>['t'];
const VISUAL_ICON: Record<LessonVisual, ReactNode> = {
  welcome: <Handshake size={64} aria-hidden="true" />,
  promise: <ShieldCheck size={64} aria-hidden="true" />,
  person: <UserCircle size={64} aria-hidden="true" />,
  phone: <DeviceMobile size={64} aria-hidden="true" />,
  warning: <Warning size={64} aria-hidden="true" />,
  harness: <Parachute size={64} aria-hidden="true" />,
  inspect: <MagnifyingGlass size={64} aria-hidden="true" />,
  anchor: <Anchor size={64} aria-hidden="true" />,
  rescue: <Lifebuoy size={64} aria-hidden="true" />,
  power: <Lightning size={64} aria-hidden="true" />,
  lock: <LockKey size={64} aria-hidden="true" />,
  tag: <Tag size={64} aria-hidden="true" />,
  meter: <Gauge size={64} aria-hidden="true" />,
};
const problemKey = (code?: string | null) => (code && code in K.problem ? K.problem[code as keyof typeof K.problem] : K.problem.generic);
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const moduleTitle = (t: T, code: string) => t(`trainingLib.content.${code.toLowerCase()}.title`, { defaultValue: code });
const lessonTitle = (t: T, code: string, order: number, lng?: string) => t(titleKey(code, order), { lng, defaultValue: `${code} ${order}` });

function Footer({ children }: { children: ReactNode }) {
  return <div className="row gap-2" data-sheet-actions style={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>{children}</div>;
}

/**
 * Screen 152 — Video/Interactive Lesson Player. A module's lessons as an Ascension Line, and the player for the one a person opens: timed scenes
 * with captions (and the option to have them read aloud), a speed control, a language track, a place that is kept on the phone, and knowledge
 * checks playback cannot pass until they are answered correctly. A lesson counts as finished only when it has been played through and every
 * check is right. Each lesson leaves a quick-reference sheet to keep.
 */
export function LessonPlayerScreen() {
  const { t } = useTranslation();
  const s = useLessonPlayer();
  const mv = s.mv;
  if (s.status === 'loading' && !mv) return <Screen width="narrow"><ScreenHeader title={t(K.title)} /><LoadingState label={t(K.loading)} variant="block" /></Screen>;
  if (s.status === 'error' || !mv) {
    if (s.errorCode === 'no_lessons') return <Screen width="narrow"><ScreenHeader title={t(K.title)} /><EmptyState icon={<ClosedCaptioning size={28} />} title={t(K.soon.title)} body={t(K.soon.body)} actionLabel={t(K.back)} onAction={s.toLibrary} /></Screen>;
    if (s.errorCode === 'locked') return <Screen width="narrow"><ScreenHeader title={t(K.title)} /><EmptyState icon={<LockKey size={28} />} title={t(K.locked.title)} body={t(K.locked.body)} actionLabel={t(K.back)} onAction={s.toLibrary} /></Screen>;
    if (s.errorCode === 'not_found' || s.errorCode === 'forbidden' || s.errorCode === 'retired' || s.errorCode === 'not_for_you') return <Screen width="narrow"><ScreenHeader title={t(K.title)} /><EmptyState icon={<ClosedCaptioning size={28} />} title={t(K.notFound.title)} body={t(K.notFound.body)} actionLabel={t(K.back)} onAction={s.toLibrary} /></Screen>;
    return <Screen width="narrow"><ScreenHeader title={t(K.title)} /><ErrorState title={t(K.error.title)} body={t(K.error.body)} retryLabel={t('action.retry')} onRetry={s.reload} /></Screen>;
  }
  const code = mv.module.code;
  if (s.order) {
    if (!s.lesson) return <Screen width="narrow"><ScreenHeader title={moduleTitle(t, code)} action={<Button size="sm" variant="ghost" icon={<CaretLeft size={14} />} onClick={s.toOverview}>{t(K.backToModule)}</Button>} /><EmptyState icon={<ClosedCaptioning size={28} />} title={t(K.notFound.title)} body={t(K.notFound.body)} actionLabel={t(K.backToModule)} onAction={s.toOverview} /></Screen>;
    if (s.lesson.state === 'locked') return <Screen width="narrow"><ScreenHeader title={moduleTitle(t, code)} /><EmptyState icon={<LockKey size={28} />} title={t(K.locked.title)} body={t(K.locked.body)} actionLabel={t(K.backToModule)} onAction={s.toOverview} /></Screen>;
    return <Player s={s} mv={mv} lesson={s.lesson} t={t} />;
  }
  return <Overview s={s} mv={mv} t={t} />;
}

/* ------------------------------------------------------------------ the module's lessons */

function downloadReference(t: T, mv: ModuleLessonsView, lessons: LessonView[], lang: LessonLang, heading: string) {
  const code = mv.module.code;
  const html = referenceHtml({
    lang,
    brand: t(K.reference.brand, { lng: lang }),
    heading,
    subtitle: t(K.reference.version, { lng: lang, version: mv.module.version }),
    generated: t(K.reference.generated, { lng: lang, date: new Date().toISOString().slice(0, 10) }),
    footer: t(K.reference.footer, { lng: lang }),
    sections: lessons.map((l) => ({ title: lessonTitle(t, code, l.order, lang), points: Array.from({ length: l.points }, (_, i) => t(pointKey(code, l.order, i + 1), { lng: lang })) })),
    tokens: themeTokens(),
  });
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `aiec-reference-${code.toLowerCase()}${lessons.length === 1 ? `-l${lessons[0].order}` : ''}-${lang}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function Overview({ s, mv, t }: { s: LessonPlayerState; mv: ModuleLessonsView; t: T }) {
  const code = mv.module.code;
  const lessons = mv.lessons;
  const done = lessons.filter((l) => l.state === 'done');
  const steps: AscensionStep[] = lessons.map((l) => ({
    id: l.id,
    label: lessonTitle(t, code, l.order),
    meta: [t(K.overview.minutes, { count: Math.max(1, Math.round(l.durationS / 60)) }), t(K.overview.keyPoints, { count: l.points })].join(' · '),
    status: l.state === 'done' ? 'complete' : l.state === 'current' ? 'current' : 'upcoming',
    onClick: l.state === 'locked' ? undefined : () => s.openLesson(l.order),
    trailing: (
      <span className="row gap-2" style={{ alignItems: 'center' }} data-lesson={l.order} data-state={l.state}>
        {l.updated && <Badge tone="emerald">{t(K.overview.updatedBadge)}</Badge>}
        <Button size="sm" variant={l.state === 'current' ? 'primary' : 'secondary'} disabled={l.state === 'locked'} data-open-lesson={l.order} onClick={() => s.openLesson(l.order)}>
          {l.state === 'done' ? t(K.overview.replay) : l.positionS > 1 ? t(K.overview.resume) : t(K.overview.play)}
        </Button>
      </span>
    ),
  }));
  return (
    <Screen width="narrow">
      <ScreenHeader title={moduleTitle(t, code)} subtitle={t(`trainingLib.content.${code.toLowerCase()}.summary`, { defaultValue: '' })} action={<Button size="sm" variant="ghost" icon={<CaretLeft size={14} />} onClick={s.toLibrary}>{t(K.back)}</Button>} />
      {(!s.online || s.fromCache) && <p className="t-sm row gap-2" role="status" style={{ alignItems: 'center', color: 'var(--color-warning)' }}><CloudSlash size={16} aria-hidden="true" /> {t(K.player.offline)}</p>}
      <div className="stack gap-3" data-overview>
        <Card>
          <div className="stack gap-2">
            <div className="row between gap-2" style={{ alignItems: 'baseline' }}>
              <strong className="t-md" data-progress>{t(K.overview.progress, { done: mv.lessonsDone, total: lessons.length })}</strong>
              {mv.moduleDone && <Badge tone="success">{t('trainingLib.status.completed')}</Badge>}
            </div>
            <ProgressBar value={mv.percent / 100} tone={mv.moduleDone ? 'success' : 'accent'} label={moduleTitle(t, code)} />
            {mv.moduleDone && <p className="t-sm">{t(K.overview.allDone)}</p>}
            {mv.module.changeKey && (mv.module.status === 'update_needed' || lessons.some((l) => l.updated)) && (
              <p className="t-xs" data-changed><strong>{t(K.overview.changed)}</strong> {t(`trainingLib.content.${code.toLowerCase()}.change2`, { defaultValue: '' })}</p>
            )}
          </div>
        </Card>
        {mv.module.assessment && (mv.moduleDone || mv.module.assessment.state !== 'locked') && (
          <Card>
            <div className="stack gap-2" data-test-card={mv.module.assessment.state}>
              <strong className="t-md">{t('trainingLib.detail.testHeading')}</strong>
              <p className="t-sm">{t(`trainingLib.detail.testBody.${mv.module.assessment.state}`, { percent: mv.module.assessment.passPercent })}</p>
              {mv.module.assessment.state !== 'locked' && <Button size="sm" variant={mv.module.assessment.state === 'certified' ? 'secondary' : 'primary'} style={{ width: 'fit-content' }} data-open-test onClick={() => s.goto(`/assessment/${mv.module.id}`)}>{t('trainingLib.detail.testOpen')}</Button>}
            </div>
          </Card>
        )}
        <section className="stack gap-2">
          <h2 className="t-lg">{t(K.overview.lessonsHeading)}</h2>
          <AscensionLine steps={steps} />
          {lessons.some((l) => l.state === 'locked') && <p className="t-xs t-muted">{t(K.overview.lockedHint)}</p>}
        </section>
        <Card>
          <div className="stack gap-2" data-reference>
            <strong className="t-md">{t(K.reference.heading)}</strong>
            <p className="t-sm">{t(K.reference.body)}</p>
            <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
              <Button size="sm" variant="secondary" icon={<DownloadSimple size={16} />} disabled={done.length === 0} data-download-module onClick={() => downloadReference(t, mv, done, s.lang, moduleTitle(t, code))}>{t(K.reference.download)}</Button>
              {done.length === 0 && <span className="t-xs t-muted">{t(K.reference.none)}</span>}
            </div>
            <div className="row gap-2 wrap" role="group" aria-label={t(K.player.language)}>
              {LANGS.map((l) => <span key={l} data-lang-chip={l}><Chip pressed={s.lang === l} onClick={() => s.setLang(l)}>{t(K.lang[l])}</Chip></span>)}
            </div>
          </div>
        </Card>
      </div>
    </Screen>
  );
}

/* ------------------------------------------------------------------ the player */

function Player({ s, mv, lesson, t }: { s: LessonPlayerState; mv: ModuleLessonsView; lesson: LessonView; t: T }) {
  const code = mv.module.code;
  const scene = lesson.scenes[s.sceneNow];
  const caption = t(sceneKey(code, lesson.order, s.sceneNow), { lng: s.lang });
  const replayingDone = lesson.state === 'done';
  return (
    <Screen width="narrow">
      <ScreenHeader title={lessonTitle(t, code, lesson.order, s.lang)} subtitle={moduleTitle(t, code)} action={<Button size="sm" variant="ghost" icon={<CaretLeft size={14} />} data-back-module onClick={s.toOverview}>{t(K.backToModule)}</Button>} />
      {(!s.online || s.fromCache) && <p className="t-sm row gap-2" role="status" data-offline-banner style={{ alignItems: 'center', color: 'var(--color-warning)' }}><CloudSlash size={16} aria-hidden="true" /> {t(K.player.offline)}</p>}
      <div className="stack gap-3" data-player data-lesson={lesson.id} data-playing={s.playing ? '1' : '0'} data-pos={Math.floor(s.pos)}>
        {s.finished ? <Finished s={s} mv={mv} lesson={lesson} t={t} /> : s.showCheck && s.openCheck ? <CheckPanel s={s} lesson={lesson} t={t} /> : (
          <Card>
            <div className="stack gap-3" data-stage>
              <div role="img" aria-label={t(K.visual[scene.visual])} style={{ minHeight: 180, display: 'grid', placeItems: 'center', color: 'var(--color-accent-primary)', background: 'var(--color-bg)', borderRadius: 'var(--radius-md, 12px)' }}>
                {VISUAL_ICON[scene.visual]}
              </div>
              <div className="row between gap-2 t-xs t-muted"><span data-scene-of>{t(K.player.sceneOf, { n: s.sceneNow + 1, total: lesson.scenes.length })}</span>{replayingDone && <Badge tone="success">{t(K.player.replaying)}</Badge>}</div>
              {s.prefs.captions ? <p className="t-md" aria-live="polite" data-caption>{caption}</p> : <p className="t-sm t-muted" data-caption-off>{t(K.player.captionsOff)}</p>}
            </div>
          </Card>
        )}
        {s.resumedAt !== null && !s.finished && s.pos >= 1 && s.resumedAt === Math.floor(s.pos) && !s.playing && <p className="t-xs t-muted" role="status" data-resumed>{t(K.player.resumed, { time: clock(s.resumedAt) })}</p>}
        <Controls s={s} lesson={lesson} t={t} />
        <Sections s={s} lesson={lesson} code={code} t={t} />
      </div>
    </Screen>
  );
}

function Controls({ s, lesson, t }: { s: LessonPlayerState; lesson: LessonView; t: T }) {
  const locked = s.showCheck || !!s.finished;
  return (
    <Card>
      <div className="stack gap-3" data-controls>
        <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
          <Button className="ds-btn--big" icon={s.playing ? <Pause size={22} /> : <Play size={22} />} disabled={locked} data-toggle onClick={s.toggle} aria-label={s.playing ? t(K.player.pause) : t(K.player.play)}>{s.playing ? t(K.player.pause) : t(K.player.play)}</Button>
          <Button variant="secondary" icon={<ArrowCounterClockwise size={18} />} disabled={!!s.finished && s.finished.phase !== 'saved'} data-replay-section onClick={() => s.replaySection(s.sceneNow)}>{t(K.player.replaySection)}</Button>
        </div>
        <div className="stack gap-1">
          <span className="t-sm" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }} data-time>{t(K.player.time, { now: clock(s.pos), total: clock(lesson.durationS) })}</span>
          <input type="range" min={0} max={lesson.durationS} step={1} value={Math.floor(s.pos)} aria-label={t(K.player.timeline)} data-timeline onChange={(e) => s.seek(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--color-accent-primary)' }} />
          <div style={{ position: 'relative', height: 8 }} aria-hidden="true">
            <span style={{ position: 'absolute', left: 0, top: 3, height: 2, width: `${(Math.min(s.cap, lesson.durationS) / lesson.durationS) * 100}%`, background: 'var(--color-border)' }} />
            {lesson.checks.map((c) => <span key={c.id} title={t(K.player.checkMarker)} data-check-marker={c.id} style={{ position: 'absolute', left: `${(c.atS / lesson.durationS) * 100}%`, top: 0, width: 8, height: 8, marginLeft: -4, borderRadius: '50%', background: c.cleared ? 'var(--color-success)' : 'var(--color-accent-primary)' }} />)}
          </div>
          {s.aheadNote && <p className="t-xs" role="status" data-ahead-note style={{ color: 'var(--color-warning)' }}>{t(K.player.aheadNote)}</p>}
        </div>
        <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
          <label className="row gap-1 t-xs" style={{ alignItems: 'center' }}>
            {t(K.player.speed)}
            <Select value={String(s.prefs.speed)} onChange={(e) => s.setSpeed(Number(e.target.value))} data-speed style={{ width: 'auto', minHeight: 36 }}>{SPEEDS.map((v) => <option key={v} value={v}>{t(K.player.speedValue, { value: v })}</option>)}</Select>
          </label>
          <span data-cc><Chip pressed={s.prefs.captions} onClick={() => s.setCaptions(!s.prefs.captions)} icon={<ClosedCaptioning size={16} aria-hidden="true" />}>{t(K.player.captions)}</Chip></span>
          {s.speechOk && <span data-listen><Chip pressed={s.prefs.listen} onClick={() => s.setListen(!s.prefs.listen)} icon={<SpeakerHigh size={16} aria-hidden="true" />}>{t(K.player.listen)}</Chip></span>}
        </div>
        <div className="row gap-2 wrap" role="group" aria-label={t(K.player.language)} style={{ alignItems: 'center' }}>
          <span className="t-xs t-muted">{t(K.player.language)}</span>
          {LANGS.map((l) => <span key={l} data-lang-chip={l}><Chip pressed={s.lang === l} onClick={() => s.setLang(l)}>{t(K.lang[l])}</Chip></span>)}
        </div>
        {!s.synced && <p className="t-xs t-muted" data-unsynced>{t(K.player.synced)}</p>}
      </div>
    </Card>
  );
}

function Sections({ s, lesson, code, t }: { s: LessonPlayerState; lesson: LessonView; code: string; t: T }) {
  return (
    <section className="stack gap-2" data-sections>
      <h2 className="t-md">{t(K.player.sections)}</h2>
      {lesson.scenes.map((sc, i) => {
        const ahead = sc.startS > s.furthest + 0.01;
        return (
          <Card key={sc.id}>
            <div className="row gap-3" style={{ alignItems: 'center' }} data-section={i + 1} data-ahead={ahead ? '1' : '0'}>
              <span className="grow stack">
                <span className="t-sm"><strong>{t(K.player.sceneOf, { n: i + 1, total: lesson.scenes.length })}</strong> · {clock(sc.startS)}</span>
                <span className="t-xs t-muted">{ahead ? t(K.player.sectionAhead) : t(sceneKey(code, lesson.order, i), { lng: s.lang })}</span>
              </span>
              <Button size="sm" variant="ghost" disabled={ahead} data-play-section={i + 1} aria-label={t(K.player.replaySection)} title={t(K.player.replaySection)} onClick={() => s.replaySection(i)} icon={<ArrowCounterClockwise size={18} />} />
            </div>
          </Card>
        );
      })}
    </section>
  );
}

/* ------------------------------------------------------------------ the knowledge check */

function CheckPanel({ s, lesson, t }: { s: LessonPlayerState; lesson: LessonView; t: T }) {
  const check = s.openCheck as NonNullable<LessonPlayerState['openCheck']>;
  const code = (s.mv as ModuleLessonsView).module.code;
  const n = lesson.checks.findIndex((c) => c.id === check.id) + 1;
  const base = checkBase(code, lesson.order, n);
  const res = s.check.result;
  const answered = !!res;
  return (
    <Card>
      <div className="stack gap-3" data-check={check.id} data-kind={check.kind}>
        <div className="row between gap-2" style={{ alignItems: 'baseline' }}>
          <strong className="t-md">{t(K.check.heading)}</strong>
          <span className="t-xs t-muted">{check.kind === 'multi' ? t(K.check.multi) : t(K.check.single)}</span>
        </div>
        <p className="t-sm t-muted">{t(K.check.blocked)}</p>
        <p className="t-md" data-question>{t(`${base}.q`, { lng: s.lang })}</p>
        <div className="stack gap-2" role={check.kind === 'multi' ? 'group' : 'radiogroup'} aria-label={t(`${base}.q`, { lng: s.lang })}>
          {Array.from({ length: check.options }, (_, i) => {
            const on = s.check.selected.includes(i);
            return (
              <button key={i} type="button" role={check.kind === 'multi' ? 'checkbox' : 'radio'} aria-checked={on} data-option={i} disabled={answered} onClick={() => s.choose(i)} className="row gap-3" style={{ textAlign: 'left', minHeight: 48, padding: 'var(--space-3)', borderRadius: 'var(--radius-md, 12px)', border: `1px solid ${on ? 'var(--color-accent-primary)' : 'var(--color-border)'}`, background: on ? 'var(--color-bg)' : 'var(--color-surface)', color: 'inherit', cursor: answered ? 'default' : 'pointer', alignItems: 'center' }}>
                <span aria-hidden="true" style={{ width: 20, height: 20, flex: '0 0 auto', borderRadius: check.kind === 'multi' ? 4 : '50%', border: `2px solid ${on ? 'var(--color-accent-primary)' : 'var(--color-border)'}`, background: on ? 'var(--color-accent-primary)' : 'transparent' }} />
                <span className="t-sm">{t(`${base}.o.${i}`, { lng: s.lang })}</span>
              </button>
            );
          })}
        </div>
        {answered && (
          <div className="stack gap-1" role="status" data-result={res.correct ? 'correct' : 'wrong'}>
            <span className="row gap-2" style={{ alignItems: 'center' }}>
              {res.correct ? <CheckCircle size={18} weight="fill" aria-hidden="true" style={{ color: 'var(--color-success)' }} /> : <Warning size={18} aria-hidden="true" style={{ color: 'var(--color-warning)' }} />}
              <strong className="t-sm">{res.correct ? t(K.check.correct) : t(K.check.notYet)}</strong>
              {!res.correct && <span className="t-xs t-muted">{t(K.check.attempts, { count: res.attempts })}</span>}
            </span>
            <p className="t-sm" data-why>{t(`${base}.why`, { lng: s.lang })}</p>
          </div>
        )}
        {s.check.problem && <p className="t-xs t-error" role="alert" data-problem={s.check.problem}>{t(problemKey(s.check.problem))}</p>}
        {!s.online && !answered && <p className="t-xs t-muted" data-check-offline>{t(K.check.needSignal)}</p>}
        <Footer>
          {!answered && <Button data-submit disabled={s.check.selected.length === 0 || s.check.busy || !s.online} loading={s.check.busy} onClick={() => void s.submit()}>{t(K.check.submit)}</Button>}
          {answered && !res.correct && <Button variant="secondary" data-watch-again onClick={s.watchAgain}>{t(K.check.watchAgain)}</Button>}
          {answered && !res.correct && <Button data-try-again onClick={s.proceed}>{t(K.check.tryAgain)}</Button>}
          {answered && res.correct && <Button data-continue icon={<ArrowRight size={18} />} onClick={s.proceed}>{t(K.check.continue)}</Button>}
        </Footer>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ the end of a lesson */

function Finished({ s, mv, lesson, t }: { s: LessonPlayerState; mv: ModuleLessonsView; lesson: LessonView; t: T }) {
  const f = s.finished as NonNullable<LessonPlayerState['finished']>;
  const code = mv.module.code;
  const result = f.result;
  const moduleDone = result?.moduleDone ?? false;
  const next = result?.nextLessonId ? (result.module.lessons.find((l) => l.id === result.nextLessonId)?.order ?? null) : null;
  return (
    <Card>
      <div className="stack gap-3" data-finished={f.phase} data-module-done={moduleDone ? '1' : '0'}>
        {f.phase === 'saving' && <p className="t-sm" role="status">{t(K.done.saving)}</p>}
        {f.phase === 'pending' && (
          <div className="stack gap-2" data-pending>
            <p className="t-sm" role="status">{t(K.done.pending)}</p>
            <Button variant="secondary" style={{ width: 'fit-content' }} disabled={!s.online} onClick={s.retryFinish} data-retry>{t(K.done.retry)}</Button>
          </div>
        )}
        {f.phase === 'saved' && (
          <>
            <span className="row gap-2" style={{ alignItems: 'center' }}><CheckCircle size={24} weight="fill" aria-hidden="true" style={{ color: 'var(--color-success)' }} /><strong className="t-lg">{t(K.done.heading)}</strong></span>
            <p className="t-sm">{lesson.completedAt && !result ? t(K.done.again) : t(K.done.body, { title: lessonTitle(t, code, lesson.order, s.lang) })}</p>
            {moduleDone && <p className="t-sm" data-module-done-text><strong>{t(K.done.moduleDone, { module: moduleTitle(t, code) })}</strong></p>}
            {moduleDone && mv.module.gatesJobAssignment && <p className="t-xs t-muted">{t(K.done.gateLifted)}</p>}
            <div className="stack gap-1">
              <strong className="t-sm">{t(K.done.points)}</strong>
              <ul className="stack gap-1" style={{ paddingLeft: 'var(--space-4)', margin: 0 }}>
                {Array.from({ length: lesson.points }, (_, i) => <li key={i} className="t-sm">{t(pointKey(code, lesson.order, i + 1), { lng: s.lang })}</li>)}
              </ul>
            </div>
            <Footer>
              <Button variant="secondary" icon={<DownloadSimple size={16} />} data-download-lesson onClick={() => downloadReference(t, mv, [lesson], s.lang, lessonTitle(t, code, lesson.order, s.lang))}>{t(K.reference.lesson)}</Button>
              <Button variant={next || (moduleDone && mv.module.assessment && mv.module.assessment.state !== 'certified') ? 'secondary' : 'primary'} data-to-module onClick={s.toOverview}>{t(K.backToModule)}</Button>
              {moduleDone && mv.module.assessment && result && result.module.module.assessment && result.module.module.assessment.state !== 'certified' && result.module.module.assessment.state !== 'locked' && <Button data-take-test icon={<ArrowRight size={18} />} onClick={() => s.goto(`/assessment/${mv.module.id}`)}>{t('trainingLib.detail.testOpen')}</Button>}
              {next !== null && <Button data-next-lesson icon={<ArrowRight size={18} />} onClick={() => s.openLesson(next)}>{t(K.done.next)}</Button>}
            </Footer>
          </>
        )}
      </div>
    </Card>
  );
}
