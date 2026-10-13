import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import { useToast } from '@/design-system';
import type { JobTeamView, TeamHandoffView, TeamMessageView } from '@/data/repository';
import type { TeamStatus, TeamTab } from './job-team.types';
import { FINAL_ERRORS, POLL_MS, TABS, TEAM_KEYS as K, outboxKey, viewKey } from './job-team.types';
import { newClientId } from '@/features/ids/clientId';

interface OutItem {
  id: string;
  kind: 'message' | 'handoff';
  jobId: string;
  text: string;
  toUserId?: string;
  capturedAt: string;
}
export interface ActionResult {
  ok: boolean;
  code?: string;
}
export interface FailedItem {
  id: string;
  kind: OutItem['kind'];
  code: string;
}

const newId = (): string => newClientId();
const codeOf = (e: unknown) => (e instanceof Error ? e.message : 'generic');
const isFinal = (code: string) => (FINAL_ERRORS as readonly string[]).includes(code);
function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export type TeamState = ReturnType<typeof useJobTeam>;

/**
 * Screen 130. Coordination on top of the same job, SOP and check-in records each person already has: who is on the job and what each answers
 * for, who is on site and how far each has got, the lead's authority (and its temporary delegation), a chat only the people on the job
 * can see, and handoff notes for a shift that ends part-way through. A message or a note written without signal is kept on the phone with
 * its own time and sent when there is some; the arrangements themselves (who does what, who leads) are changed only while online, because
 * two phones deciding differently offline would be worse than waiting.
 */
export function useJobTeam() {
  const repository = useData();
  const { user } = useSession();
  const { jobId } = useParams();
  const [params, setParams] = useSearchParams();
  const { t } = useTranslation();
  const { push } = useToast();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const oKey = user && !isAdmin ? outboxKey(user.id) : '';
  const vKey = user && jobId ? viewKey(user.id, jobId) : '';
  const [server, setServer] = useState<JobTeamView | null>(() => (vKey ? readJson<JobTeamView>(vKey) : null));
  const [status, setStatus] = useState<TeamStatus>(() => (server || !jobId ? 'ready' : 'loading'));
  const [outbox, setOutbox] = useState<OutItem[]>(() => (oKey ? (readJson<OutItem[]>(oKey) ?? []) : []));
  const [failed, setFailed] = useState<FailedItem[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [busy, setBusy] = useState(false);
  const outRef = useRef(outbox);
  outRef.current = outbox;
  const flushing = useRef(false);
  const tabParam = params.get('tab');
  const tab: TeamTab = (TABS as string[]).includes(tabParam ?? '') ? (tabParam as TeamTab) : 'team';

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const persist = useCallback(
    (next: OutItem[]) => {
      outRef.current = next;
      setOutbox(next);
      if (!oKey) return;
      try {
        if (next.length === 0) localStorage.removeItem(oKey);
        else localStorage.setItem(oKey, JSON.stringify(next));
      } catch {
        // Held while the screen is open.
      }
    },
    [oKey],
  );

  const load = useCallback(async () => {
    if (!user || !jobId || !navigator.onLine) return;
    try {
      const fresh = await repository.getJobTeam(jobId, user.id);
      setServer(fresh);
      try {
        localStorage.setItem(viewKey(user.id, jobId), JSON.stringify(fresh));
      } catch {
        // Not cached.
      }
      setStatus('ready');
    } catch (e) {
      const code = codeOf(e);
      if (code === 'not_found' || code === 'forbidden') setStatus('not_found');
      else setStatus((c) => (c === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user, jobId]);

  const flush = useCallback(async () => {
    if (!user || flushing.current || !navigator.onLine || outRef.current.length === 0) return;
    flushing.current = true;
    try {
      for (const item of [...outRef.current]) {
        try {
          if (item.kind === 'message') await repository.postTeamMessage(item.jobId, { text: item.text, clientId: item.id, capturedAt: item.capturedAt }, user.id);
          else await repository.addHandoffNote(item.jobId, { text: item.text, ...(item.toUserId ? { toUserId: item.toUserId } : {}), clientId: item.id, capturedAt: item.capturedAt }, user.id);
          persist(outRef.current.filter((q) => q.id !== item.id));
        } catch (e) {
          const code = codeOf(e);
          if (!isFinal(code)) break;
          persist(outRef.current.filter((q) => q.id !== item.id));
          setFailed((f) => [...f, { id: item.id, kind: item.kind, code }]);
        }
      }
    } finally {
      flushing.current = false;
      await load();
    }
  }, [repository, user, persist, load]);

  useEffect(() => {
    const kept = vKey ? readJson<JobTeamView>(vKey) : null;
    setServer(kept);
    setStatus(kept || !jobId ? 'ready' : 'loading');
    void load().then(() => flush());
    const poll = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(poll);
  }, [load, flush, vKey, jobId]);
  useEffect(() => {
    if (isOnline) void flush();
  }, [isOnline, flush]);

  // Reading the chat is what marks it read.
  useEffect(() => {
    if (tab !== 'chat' || !user || !jobId || !server || server.unread === 0 || !isOnline) return;
    void repository.markTeamMessagesRead(jobId, user.id).then(() => load());
  }, [tab, server, user, jobId, isOnline, repository, load]);

  const mine = useMemo(() => outbox.filter((o) => o.jobId === jobId), [outbox, jobId]);
  const view: JobTeamView | null = useMemo(() => {
    if (!server || !user) return server;
    const localMessages: TeamMessageView[] = mine
      .filter((o) => o.kind === 'message')
      .map((o) => ({ id: `local-${o.id}`, authorId: user.id, authorName: user.name, text: o.text, createdAt: o.capturedAt, kind: 'message' as const, issueId: null, mine: true, unread: false, local: true }));
    const localHandoffs: TeamHandoffView[] = mine
      .filter((o) => o.kind === 'handoff')
      .map((o) => ({ id: `local-${o.id}`, fromUserId: user.id, fromName: user.name, toUserId: o.toUserId ?? null, toName: o.toUserId ? (server.members.find((m) => m.userId === o.toUserId)?.name ?? null) : null, text: o.text, openSteps: [], createdAt: o.capturedAt, acknowledgedBy: [], mine: true, waitingForMe: false, local: true }));
    return { ...server, messages: [...server.messages, ...localMessages].sort((a, b) => a.createdAt.localeCompare(b.createdAt)), handoffs: [...localHandoffs, ...server.handoffs] };
  }, [server, mine, user]);

  const enqueue = (kind: OutItem['kind'], text: string, toUserId?: string) => {
    if (!jobId) return;
    persist([...outRef.current, { id: newId(), kind, jobId, text: text.trim(), ...(toUserId ? { toUserId } : {}), capturedAt: new Date().toISOString() }]);
    void flush();
  };

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
  const jid = jobId ?? '';

  return {
    status,
    reload: () => {
      setStatus('loading');
      void load();
    },
    isAdmin: !!isAdmin,
    jobId: jobId ?? null,
    view,
    tab,
    setTab: (next: TeamTab) => setParams(next === 'team' ? {} : { tab: next }, { replace: true }),
    isOnline,
    busy,
    waiting: mine.length,
    failed,
    dismissFailed: () => setFailed([]),
    sendMessage: (text: string) => {
      enqueue('message', text);
    },
    sendHandoff: (text: string, toUserId?: string) => {
      enqueue('handoff', text, toUserId);
      push(t(navigator.onLine ? K.handoff.toast : K.handoff.toastQueued), 'success');
    },
    acknowledge: (noteId: string) => guard(() => repository.acknowledgeHandoff(noteId, uid), K.handoff.toastAck),
    assign: (memberId: string, stepIds: string[], responsibility: string) => guard(() => repository.assignTeamSteps(jid, memberId, { stepIds, responsibility }, uid), K.assign.toast),
    delegate: (input: { toUserId: string; from: string; until: string; reason: string }) => guard(() => repository.delegateLead(jid, input, uid), K.delegation.toast),
    endDelegation: () => guard(() => repository.endLeadDelegation(jid, uid), K.delegation.toastEnded),
    addMember: (technicianId: string, responsibility: string) => guard(() => repository.addTeamMember(jid, technicianId, { stepIds: [], responsibility }, uid), K.admin.toastAdded),
    reassign: (memberId: string, input: { reason: string; handStepsTo?: string; newLeadId?: string }) => guard(() => repository.reassignTeamMember(jid, memberId, input, uid), K.admin.toastReassigned),
    changeLead: (newLeadId: string, reason: string) => guard(() => repository.changeJobLead(jid, newLeadId, reason, uid), K.admin.toastLead),
    flagDisagreement: (note: string) => guard(() => repository.flagTeamDisagreement(jid, note, uid), K.chat.toastDisagree),
    signOff: () => guard(() => repository.signOffForQuality(jid, uid), K.signOff.toast),
    goto: (path: string) => navigate(path),
  };
}
