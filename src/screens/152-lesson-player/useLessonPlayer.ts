import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { LessonCheckView, LessonCompleteResult, LessonView, ModuleLessonsView } from '@/data/repository';
import { sceneIndexAt } from '@/features/training/lesson';
import { readJson, readLessonCache, writeJson, writeLessonCache } from '@/features/training/offline';
import { LANGS, LOCAL_SAVE_EVERY_S, SYNC_EVERY_S, TICK_MS, VOICE_LANG, libraryPath, modulePath, positionKey, prefsKey, sceneKey } from './lesson-player.types';
import type { LessonLang } from './lesson-player.types';

export type LessonPlayerState = ReturnType<typeof useLessonPlayer>;
const codeOf = (e: unknown) => (e instanceof Error ? e.message : 'generic');

interface Prefs {
  speed: number;
  captions: boolean;
  listen: boolean;
  lang: LessonLang | null;
}
const DEFAULT_PREFS: Prefs = { speed: 1, captions: true, listen: false, lang: null };
export interface CheckState {
  selected: number[];
  busy: boolean;
  result: { correct: boolean; attempts: number } | null;
  problem: string | null;
  /** The question being answered: kept on screen with its result even after the lesson no longer lists it as open. */
  shown: LessonCheckView | null;
}
const FRESH_CHECK: CheckState = { selected: [], busy: false, result: null, problem: null, shown: null };
export interface Finished {
  /** `saving` while the record is being written, `pending` while it waits for signal, `saved` once the repository has it. */
  phase: 'saving' | 'pending' | 'saved';
  result: LessonCompleteResult | null;
}

/**
 * Screen 152. One module's lessons for one person, and the player for the lesson they open. Playback is a clock that can only run as far as the
 * next unanswered check; the place is kept on the phone every couple of seconds and on the server whenever there is signal, so a dropped connection
 * resumes at the second it stopped. A lesson is finished by the repository, never by this clock reaching the end on its own.
 */
export function useLessonPlayer() {
  const repository = useData();
  const { user } = useSession();
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();
  const { moduleId = '' } = useParams();
  const [params] = useSearchParams();
  const order = Number(params.get('lesson')) || null;
  const who = user?.id ?? '';

  const [mv, setMv] = useState<ModuleLessonsView | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [pos, setPos] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [resumedAt, setResumedAt] = useState<number | null>(null);
  const [check, setCheck] = useState<CheckState>(FRESH_CHECK);
  const [finished, setFinished] = useState<Finished | null>(null);
  const [synced, setSynced] = useState(true);
  const [aheadNote, setAheadNote] = useState(false);
  const alive = useRef(true);
  const furthest = useRef(0);
  const posRef = useRef(0);
  const lessonRef = useRef<LessonView | null>(null);
  const finishing = useRef(false);

  const lesson = useMemo(() => (mv && order ? mv.lessons.find((l) => l.order === order) ?? null : null), [mv, order]);
  lessonRef.current = lesson;
  posRef.current = pos;
  const lang: LessonLang = prefs.lang ?? ((LANGS as readonly string[]).includes(i18n.language) ? (i18n.language as LessonLang) : 'en');
  const speechOk = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);
  useEffect(() => {
    if (who) setPrefs({ ...DEFAULT_PREFS, ...(readJson<Partial<Prefs>>(prefsKey(who)) ?? {}) });
  }, [who]);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  const setPref = (patch: Partial<Prefs>) => setPrefs((p) => { const next = { ...p, ...patch }; if (who) writeJson(prefsKey(who), next); return next; });

  /* ------------------------------------------------------------ the module */
  const load = useCallback(async () => {
    if (!user || !moduleId) return;
    try {
      const v = await repository.getModuleLessons(moduleId, user.id);
      if (!alive.current) return;
      setMv(v);
      setFromCache(false);
      setStatus('ready');
      writeLessonCache(user.id, moduleId, v);
    } catch (e) {
      if (!alive.current) return;
      const code = codeOf(e);
      const kept = code === 'generic' || code === 'offline' || /fetch|network|timeout/i.test(code) ? readLessonCache(user.id, moduleId) : null;
      if (kept) { setMv(kept); setFromCache(true); setStatus('ready'); return; }
      setErrorCode(code);
      setStatus((s) => (s === 'ready' ? s : 'error'));
    }
  }, [repository, user, moduleId]);
  useEffect(() => { setStatus('loading'); void load(); }, [load]);
  useEffect(() => { if (online && fromCache) void load(); }, [online]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Puts a fresh view of one lesson (from a write) into the module without disturbing where the clock is. */
  const applyLesson = useCallback((l: LessonView) => {
    setMv((m) => (m ? { ...m, lessons: m.lessons.map((x) => (x.id === l.id ? l : x)) } : m));
  }, []);

  /* ------------------------------------------------------------ opening a lesson */
  const lessonId = lesson?.id ?? null;
  useEffect(() => {
    setPlaying(false);
    setCheck(FRESH_CHECK);
    setFinished(null);
    setAheadNote(false);
    finishing.current = false;
    const l = lessonRef.current;
    if (!l) { setPos(0); furthest.current = 0; setResumedAt(null); return; }
    // The device's own copy wins if it got further than the server heard (the connection dropped mid-lesson).
    const local = who ? readJson<{ positionS: number; furthestS: number }>(positionKey(who, l.id)) : null;
    const useLocal = !!local && l.state !== 'done' && local.furthestS > l.furthestS;
    const f = Math.min(l.allowedS, useLocal ? local.furthestS : l.furthestS);
    const p = Math.min(f, useLocal ? local.positionS : l.positionS);
    furthest.current = f;
    setPos(p);
    setResumedAt(p > 1 ? Math.floor(p) : null);
    setSynced(!useLocal);
  }, [lessonId]); // eslint-disable-line react-hooks/exhaustive-deps

  const openCheckView = lesson ? [...lesson.checks].filter((c) => !c.cleared).sort((a, b) => a.atS - b.atS)[0] ?? null : null;
  const duration = lesson?.durationS ?? 0;
  const cap = lesson?.allowedS ?? 0;
  const currentCheck = check.result ? check.shown : openCheckView;
  const showCheck = !!lesson && !!currentCheck && (!!check.result || pos >= currentCheck.atS - 0.01);
  const atEnd = !!lesson && !openCheckView && duration > 0 && pos >= duration - 0.01;

  /* ------------------------------------------------------------ the clock */
  useEffect(() => {
    if (!playing || !lessonId) return undefined;
    const id = window.setInterval(() => {
      setPos((p) => Math.min(cap, p + (TICK_MS / 1000) * prefs.speed));
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [playing, lessonId, prefs.speed, cap]);
  useEffect(() => {
    furthest.current = Math.max(furthest.current, Math.min(pos, cap));
    if (playing && (pos >= cap - 0.001)) setPlaying(false);
  }, [pos, cap, playing]);

  /* ------------------------------------------------------------ keeping the place */
  const saveLocal = useCallback(() => {
    const l = lessonRef.current;
    if (!who || !l || l.state === 'done') return;
    writeJson(positionKey(who, l.id), { positionS: posRef.current, furthestS: furthest.current, at: new Date().toISOString() });
  }, [who]);
  const flush = useCallback(async (): Promise<boolean> => {
    const l = lessonRef.current;
    if (!user || !l || l.state === 'done') return true;
    try {
      const v = await repository.saveLessonPlayback(l.id, { positionS: posRef.current, furthestS: furthest.current }, user.id);
      if (alive.current) { applyLesson(v); setSynced(true); }
      return true;
    } catch {
      if (alive.current) setSynced(false);
      return false;
    }
  }, [repository, user, applyLesson]);
  useEffect(() => { if (lessonId) saveLocal(); }, [Math.floor(pos / LOCAL_SAVE_EVERY_S), lessonId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!playing || !lessonId) return undefined;
    const id = window.setInterval(() => { saveLocal(); if (navigator.onLine) void flush(); }, SYNC_EVERY_S * 1000);
    return () => window.clearInterval(id);
  }, [playing, lessonId, saveLocal, flush]);
  // A pause, a check, leaving the tab or the screen, and signal coming back all keep the place.
  useEffect(() => { if (lessonId && !playing) { saveLocal(); if (navigator.onLine) void flush(); } }, [playing]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const hide = () => { if (document.visibilityState === 'hidden') { saveLocal(); if (navigator.onLine) void flush(); } };
    document.addEventListener('visibilitychange', hide);
    return () => { document.removeEventListener('visibilitychange', hide); saveLocal(); void flush(); };
  }, [saveLocal, flush, lessonId]);
  useEffect(() => { if (online && lessonId) void flush(); }, [online]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ------------------------------------------------------------ finishing */
  const finish = useCallback(async () => {
    const l = lessonRef.current;
    if (!user || !l || finishing.current) return;
    if (l.state === 'done') { setFinished({ phase: 'saved', result: null }); return; }
    finishing.current = true;
    setFinished({ phase: 'saving', result: null });
    furthest.current = l.durationS;
    if (!navigator.onLine) { setFinished({ phase: 'pending', result: null }); finishing.current = false; return; }
    try {
      await repository.saveLessonPlayback(l.id, { positionS: l.durationS, furthestS: l.durationS }, user.id);
      const r = await repository.completeLesson(l.id, user.id);
      if (!alive.current) return;
      applyLesson(r.lesson);
      setMv(r.module);
      writeLessonCache(user.id, moduleId, r.module);
      try { localStorage.removeItem(positionKey(user.id, l.id)); } catch { /* nothing kept */ }
      setFinished({ phase: 'saved', result: r });
    } catch {
      if (alive.current) setFinished({ phase: 'pending', result: null });
    } finally {
      finishing.current = false;
    }
  }, [repository, user, applyLesson, moduleId]);
  useEffect(() => { if (atEnd && !finished && lesson?.state !== 'done') void finish(); else if (atEnd && !finished && lesson?.state === 'done') setFinished({ phase: 'saved', result: null }); }, [atEnd]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (online && finished?.phase === 'pending') void finish(); }, [online, finished?.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ------------------------------------------------------------ reading aloud */
  const sceneNow = lesson ? sceneIndexAt(lesson, pos) : 0;
  const code = mv?.module.code ?? '';
  useEffect(() => {
    if (!speechOk || !prefs.listen || !playing || !lesson) return undefined;
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(t(sceneKey(code, lesson.order, sceneNow), { lng: lang }));
    u.lang = VOICE_LANG[lang];
    u.rate = prefs.speed;
    synth.speak(u);
    return () => synth.cancel();
    // Read again when the scene, language, speed or on/off changes, not on every tick.
  }, [lessonId, sceneNow, playing, prefs.listen, lang, prefs.speed]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ------------------------------------------------------------ actions */
  const seek = (to: number) => {
    const max = Math.min(furthest.current, cap);
    if (to > max + 0.5) { setAheadNote(true); window.setTimeout(() => setAheadNote(false), 2500); }
    setPos(Math.max(0, Math.min(to, max)));
    setCheck(FRESH_CHECK);
  };
  const toggle = () => {
    if (!lesson) return;
    if (showCheck || (atEnd && finished)) return;
    if (!playing && pos >= cap - 0.001 && cap >= duration) setPos(0);
    setPlaying((p) => !p);
  };
  const replaySection = (i: number) => {
    if (!lesson) return;
    setCheck(FRESH_CHECK);
    setFinished(null);
    setPos(Math.min(lesson.scenes[i].startS, furthest.current));
    setPlaying(true);
  };
  const choose = (i: number) => {
    if (!lesson || !openCheckView) return;
    setCheck((c) => {
      if (c.result) return c;
      const multi = openCheckView.kind === 'multi';
      const selected = multi ? (c.selected.includes(i) ? c.selected.filter((x) => x !== i) : [...c.selected, i]) : [i];
      return { ...c, selected, problem: null };
    });
  };
  const submit = async () => {
    if (!user || !lesson || !openCheckView || check.busy) return;
    if (!navigator.onLine) { setCheck((c) => ({ ...c, problem: 'offline' })); return; }
    setCheck((c) => ({ ...c, busy: true, problem: null }));
    try {
      await flush();
      const r = await repository.answerLessonCheck(lesson.id, openCheckView.id, check.selected, user.id);
      if (!alive.current) return;
      applyLesson(r.lesson);
      setCheck((c) => ({ ...c, busy: false, shown: openCheckView, result: { correct: r.correct, attempts: r.attempts } }));
    } catch (e) {
      if (alive.current) setCheck((c) => ({ ...c, busy: false, problem: codeOf(e) }));
    }
  };
  /** After a correct answer the lesson goes on; after a wrong one the same question is asked again. */
  const proceed = () => {
    const wasCorrect = check.result?.correct;
    setCheck(FRESH_CHECK);
    if (wasCorrect) setPlaying(true);
  };
  const watchAgain = () => {
    if (!lesson || !openCheckView) return;
    replaySection(openCheckView.afterScene);
  };

  return {
    status, errorCode, mv, fromCache, online, lesson, order, lang, prefs, speechOk, synced,
    pos, playing, duration, cap, sceneNow, furthest: furthest.current, resumedAt, showCheck, atEnd, openCheck: currentCheck, check, finished, aheadNote,
    setLang: (l: LessonLang) => setPref({ lang: l }),
    setSpeed: (v: number) => setPref({ speed: v }),
    setCaptions: (v: boolean) => setPref({ captions: v }),
    setListen: (v: boolean) => setPref({ listen: v }),
    retryFinish: () => { void finish(); },
    toggle, seek, replaySection, choose, submit, proceed, watchAgain,
    reload: () => { setStatus('loading'); void load(); },
    openLesson: (n: number) => navigate(modulePath(moduleId, n)),
    toOverview: () => navigate(modulePath(moduleId)),
    toLibrary: () => navigate(libraryPath),
    goto: (path: string) => navigate(path),
    moduleId,
  };
}
