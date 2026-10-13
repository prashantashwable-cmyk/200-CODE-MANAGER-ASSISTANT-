import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { useToast } from '@/design-system';
import { useTranslation } from 'react-i18next';
import type { AssessmentAttemptView, AssessmentOverviewRow, AssessmentOverviewView, AssessmentResultView, AssessmentView } from '@/data/repository';
import { readJson, writeJson } from '@/features/training/offline';
import { TICK_MS, assessmentPath, draftKey, libraryPath, lessonsPath } from './assessment.types';

export interface ActionResult {
  ok: boolean;
  code?: string;
}
const codeOf = (e: unknown) => (e instanceof Error ? e.message : 'generic');
export type AssessmentState = ReturnType<typeof useAssessment>;
type Answers = Record<string, number[]>;

/**
 * Screen 154. For a partner: one module's test as a short wizard (start, one step per question, a review of everything, then the result). Answers
 * are kept on the phone at every step and on the server at every step boundary, so an interruption loses nothing, and the answers are never judged
 * here: only the repository knows which are right, and it shows them only once the attempt is handed in. For Admin: how each test is doing,
 * who is struggling (a coaching opportunity) and the pass mark and cooldowns.
 */
export function useAssessment() {
  const repository = useData();
  const { user } = useSession();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { push } = useToast();
  const { moduleId = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const isAdmin = user?.role === 'admin';
  const who = user?.id ?? '';
  const stepParam = Number(params.get('step'));
  const [view, setView] = useState<AssessmentView | null>(null);
  const [overview, setOverview] = useState<AssessmentOverviewView | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<AssessmentAttemptView | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [result, setResult] = useState<AssessmentResultView | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<'server' | 'local'>('server');
  const [maxStep, setMaxStep] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), TICK_MS); return () => window.clearInterval(id); }, []);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      if (isAdmin) {
        const o = await repository.getAssessmentOverview(user.id);
        if (alive.current) { setOverview(o); setStatus('ready'); }
      } else if (moduleId) {
        const v = await repository.getAssessment(moduleId, user.id);
        if (alive.current) { setView(v); setStatus('ready'); }
      }
    } catch (e) {
      if (alive.current) { setErrorCode(codeOf(e)); setStatus((s) => (s === 'ready' ? s : 'error')); }
    }
  }, [repository, user, isAdmin, moduleId]);
  useEffect(() => { setStatus('loading'); void load(); }, [load]);

  const questions = attempt?.questions ?? [];
  const total = questions.length;
  const step = attempt ? Math.max(0, Math.min(total + 1, Number.isFinite(stepParam) ? stepParam : 0)) : 0;
  const setStep = useCallback((n: number) => setParams((prev) => { const next = new URLSearchParams(prev); if (n <= 0) next.delete('step'); else next.set('step', String(n)); return next; }, { replace: true }), [setParams]);
  useEffect(() => { setMaxStep((m) => Math.max(m, step)); }, [step]);

  /** Answers are kept on the phone first (an interrupted attempt loses nothing), then on the server at every step boundary. */
  const persist = useCallback(async (next: Answers, att: AssessmentAttemptView | null = attempt) => {
    if (!att || !who) return;
    writeJson(draftKey(who, att.attemptId), next);
    if (!navigator.onLine) { setSaved('local'); return; }
    try {
      await repository.saveAssessmentDraft(att.attemptId, Object.entries(next).map(([questionId, selected]) => ({ questionId, selected })), who);
      if (alive.current) setSaved('server');
    } catch { if (alive.current) setSaved('local'); }
  }, [attempt, repository, who]);

  const begin = async (): Promise<ActionResult> => {
    if (!user) return { ok: false, code: 'generic' };
    if (!navigator.onLine) return { ok: false, code: 'offline' };
    setBusy(true);
    try {
      const a = await repository.startAssessmentAttempt(moduleId, user.id);
      const local = readJson<Answers>(draftKey(user.id, a.attemptId)) ?? {};
      const server = Object.fromEntries(a.answers.map((x) => [x.questionId, x.selected]));
      // The device's own copy wins for a question it has an answer to: it is the later one.
      const merged = { ...server, ...local };
      setAttempt(a);
      setAnswers(merged);
      setResult(null);
      const target = Number.isFinite(stepParam) && stepParam > 0 ? Math.min(stepParam, a.questions.length + 1) : 1;
      setMaxStep(target);
      setStep(target);
      return { ok: true };
    } catch (e) { return { ok: false, code: codeOf(e) }; } finally { if (alive.current) setBusy(false); }
  };

  const goto = (n: number) => { void persist(answers); setStep(Math.max(0, Math.min(total + 1, n))); };
  const choose = (questionId: string, i: number, multi: boolean) => setAnswers((prev) => {
    const cur = prev[questionId] ?? [];
    const sel = multi ? (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i].sort()) : [i];
    const next = { ...prev, [questionId]: sel };
    if (who && attempt) writeJson(draftKey(who, attempt.attemptId), next);
    return next;
  });
  const submit = async (): Promise<ActionResult> => {
    if (!user || !attempt) return { ok: false, code: 'generic' };
    if (!navigator.onLine) return { ok: false, code: 'offline' };
    setBusy(true);
    try {
      const r = await repository.submitAssessment(attempt.attemptId, Object.entries(answers).map(([questionId, selected]) => ({ questionId, selected })), user.id);
      try { localStorage.removeItem(draftKey(user.id, attempt.attemptId)); } catch { /* nothing kept */ }
      setResult(r);
      setAttempt(null);
      setAnswers({});
      setStep(0);
      await load();
      return { ok: true };
    } catch (e) { return { ok: false, code: codeOf(e) }; } finally { if (alive.current) setBusy(false); }
  };

  return {
    status, errorCode, isAdmin, view, overview, attempt, answers, result, busy, saved, maxStep, step, total, questions, online, now, moduleId, partner: params.get('partner'),
    begin, goto, choose, submit, persist: () => persist(answers),
    reload: () => { setStatus('loading'); void load(); },
    toLessons: () => navigate(lessonsPath(moduleId)),
    toLibrary: () => navigate(libraryPath),
    navigateTo: (path: string) => navigate(path),
    toAssessment: (id: string) => navigate(assessmentPath(id)),
    leaveWizard: () => { void persist(answers); setAttempt(null); setStep(0); void load(); },
    clearResult: () => setResult(null),
    saveConfig: async (row: AssessmentOverviewRow, input: { passPercent: number; cooldownHours: [number, number, number] }): Promise<ActionResult> => {
      if (!user) return { ok: false, code: 'generic' };
      setBusy(true);
      try { await repository.saveAssessmentConfig(row.assessmentId, input, user.id); push(t('assessment.admin.saved'), 'success'); await load(); return { ok: true }; } catch (e) { return { ok: false, code: codeOf(e) }; } finally { if (alive.current) setBusy(false); }
    },
  };
}
