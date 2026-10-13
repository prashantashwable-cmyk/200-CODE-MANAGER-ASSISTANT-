import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { useToast } from '@/design-system';
import type { ReworkPartOption, ReworkView, SnagBoardView, SopMediaInput } from '@/data/repository';
import type { SnagSeverity } from '@/features/qc/snags';
import type { ReworkStatus } from './rework.types';
import { POLL_MS, REWORK_KEYS as K, draftKey } from './rework.types';

export interface ActionResult {
  ok: boolean;
  code?: string;
}
export interface Attachment {
  media: Omit<SopMediaInput, 'capturedAt'>;
  takenAt: string;
}
interface Draft {
  notes: string;
}
const codeOf = (e: unknown) => (e instanceof Error ? e.message : 'generic');

function readDraft(key: string): Draft | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

export type ReworkState = ReturnType<typeof useRework>;

/**
 * Screen 136. Puts a snag (and every snag sharing its cause) in someone's hands and carries the work: the finding with its evidence, the
 * technician's own notes and new photos or video, parts the fix needs that were not delivered, and a way to say the job turned out bigger or
 * cannot be done. Reporting it done hands it to QC to re-check and never closes it.
 */
export function useRework() {
  const repository = useData();
  const { user } = useSession();
  const { snagId } = useParams();
  const { t } = useTranslation();
  const { push } = useToast();
  const navigate = useNavigate();
  const [view, setView] = useState<ReworkView | null>(null);
  const [board, setBoard] = useState<SnagBoardView | null>(null);
  const [status, setStatus] = useState<ReworkStatus>('loading');
  const [busy, setBusy] = useState(false);
  const [options, setOptions] = useState<ReworkPartOption[]>([]);
  const dKey = user && snagId ? draftKey(user.id, snagId) : '';
  const [notes, setNotesState] = useState<string>(() => (dKey ? (readDraft(dKey)?.notes ?? '') : ''));
  const [restored, setRestored] = useState<boolean>(() => !!(dKey && readDraft(dKey)?.notes));
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      if (snagId) setView(await repository.getRework(snagId, user.id));
      else setBoard(await repository.getSnagBoard(user.id));
      setStatus('ready');
    } catch (e) {
      const c = codeOf(e);
      if (c === 'not_found' || c === 'forbidden') setStatus('not_found');
      else setStatus((s) => (s === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user, snagId]);

  useEffect(() => {
    setView(null);
    setBoard(null);
    setStatus('loading');
    setAttachments([]);
    setNotesState(dKey ? (readDraft(dKey)?.notes ?? '') : '');
    void load();
    const poll = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(poll);
  }, [load, dKey]);

  useEffect(() => {
    if (!dKey) return;
    try {
      if (notes.trim() === '') localStorage.removeItem(dKey);
      else localStorage.setItem(dKey, JSON.stringify({ notes }));
    } catch {
      // Not kept.
    }
  }, [dKey, notes]);

  const guard = async (fn: () => Promise<unknown>, okKey?: string): Promise<ActionResult> => {
    if (!navigator.onLine) return { ok: false, code: 'offline' };
    setBusy(true);
    try {
      await fn();
      await load();
      if (okKey) push(t(okKey), 'success');
      return { ok: true };
    } catch (e) {
      return { ok: false, code: codeOf(e) };
    } finally {
      setBusy(false);
    }
  };
  const uid = user?.id ?? '';
  const id = snagId ?? '';

  return {
    status,
    snagId: snagId ?? null,
    view,
    board,
    busy,
    reload: () => {
      setStatus('loading');
      void load();
    },
    notes,
    setNotes: (x: string) => {
      setRestored(false);
      setNotesState(x);
    },
    restored,
    attachments,
    setAttachments,
    options,
    loadOptions: async () => {
      try {
        setOptions(await repository.listReworkPartOptions(uid));
      } catch {
        setOptions([]);
      }
    },
    assign: (techId: string, reason: string) => guard(() => repository.assignRework(id, techId, reason, uid), K.assign.toast),
    start: () => guard(() => repository.startRework(id, uid), K.work.startToast),
    complete: () =>
      guard(async () => {
        await repository.completeRework(id, { notes, evidence: attachments.map((a) => ({ ...a.media, capturedAt: a.takenAt })) }, uid);
        setNotesState('');
        setAttachments([]);
      }, K.work.completeToast),
    handBack: (reason: string) => guard(() => repository.handBackRework(id, reason, uid), K.handBack.toast),
    escalate: (severity: SnagSeverity, note: string) => guard(() => repository.escalateRework(id, { severity, note }, uid), K.escalate.toast),
    requestPart: (input: { description: string; quantity: number; note?: string }) => guard(() => repository.requestReworkPart(id, input, uid), K.parts.toast),
    orderPart: (partId: string, itemId: string, quantity: number) => guard(() => repository.orderReworkPart(id, partId, { itemId, quantity }, uid), K.parts.orderToast),
    goto: (path: string) => navigate(path),
  };
}
