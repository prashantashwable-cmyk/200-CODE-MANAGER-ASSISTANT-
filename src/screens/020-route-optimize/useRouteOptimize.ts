import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { AssignmentFacts } from '@/data/repository';
import { haversineKm } from '@/design-system';
import type { User } from '@/data/types';
import { AVERAGE_SPEED_KMH, MAX_REASONABLE_KM, SCORE_WEIGHTS } from './route-optimize.types';
import type { Candidate, SuggestStatus, UnassignedTask } from './route-optimize.types';

interface RouteOptimizeState {
  status: SuggestStatus;
  tasks: UnassignedTask[];
  selectedTask: UnassignedTask | null;
  selectTask: (task: UnassignedTask) => void;
  candidates: Candidate[];
  assign: (task: UnassignedTask, candidate: Candidate) => Promise<'assigned' | 'conflict' | { failed: string }>;
  /** People of the right role who are not offered for this task, with the reason from their records. */
  notOffered: Candidate[];
  busyUserId: string | null;
  /** Set when a second admin already assigned the task this session was viewing. */
  conflictTaskId: string | null;
  clearConflict: () => void;
  reload: () => Promise<void>;
}

/**
 * Owns the assignment suggestion engine.
 *
 * The ranking is explicit and never proximity alone — a nearby but already
 * overloaded person is often the wrong pick, which is exactly the failure mode
 * the spec calls out. Assignment is optimistic-locked against the repository's
 * current state so two admins racing on the same task cannot both win.
 */
export function useRouteOptimize(): RouteOptimizeState {
  const repository = useData();
  const { user: me } = useSession();

  const [status, setStatus] = useState<SuggestStatus>('loading');
  const [tasks, setTasks] = useState<UnassignedTask[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [conflictTaskId, setConflictTaskId] = useState<string | null>(null);
  /** Real open work and blocks for the selected task, read from the repository. */
  const [facts, setFacts] = useState<{ taskId: string; rows: AssignmentFacts[] } | null>(null);

  const reload = useCallback(async () => {
    setStatus('loading');
    try {
      const [leads, jobs, allUsers] = await Promise.all([
        repository.listLeads({ stage: ['contacted', 'site_visit'] }),
        repository.listJobs({ status: ['scheduled', 'materials_pending'] }),
        repository.listUsers(),
      ]);

      const leadTasks: UnassignedTask[] = leads
        .filter((l) => l.surveyorId === '')
        .map((l) => ({
          id: `lead-${l.id}`,
          kind: 'leadFollowUp',
          title: l.siteName,
          address: l.address,
          location: l.location,
          requiredSkills: [],
          role: 'surveyor',
          lead: l,
        }));

      const jobTasks: UnassignedTask[] = jobs
        .filter((j) => !j.technicianId)
        .map((j) => ({
          id: `job-${j.id}`,
          kind: 'jobAssignment',
          title: j.siteName || j.code,
          address: j.address,
          location: j.location,
          requiredSkills: [],
          role: 'technician',
          job: j,
        }));

      setUsers(allUsers);
      setTasks([...leadTasks, ...jobTasks]);
      setSelectedTaskId((current) => current ?? leadTasks[0]?.id ?? jobTasks[0]?.id ?? null);
      setStatus(leadTasks.length + jobTasks.length === 0 ? 'empty' : 'ready');
    } catch {
      setStatus('error');
    }
  }, [repository]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;

  useEffect(() => {
    if (!selectedTask || !me) return undefined;
    let live = true;
    const target = selectedTask.lead ? { leadId: selectedTask.lead.id } : { jobId: selectedTask.job!.id };
    void repository
      .getAssignmentFacts(target, me.id)
      .then((rows) => { if (live) setFacts({ taskId: selectedTask.id, rows }); })
      .catch(() => { if (live) setStatus('error'); });
    return () => { live = false; };
  }, [repository, selectedTask, me]);

  const ranked = useMemo<Candidate[]>(() => {
    if (!selectedTask || facts?.taskId !== selectedTask.id) return [];
    const byUser = new Map(facts.rows.map((f) => [f.userId, f]));
    const pool = users.filter((u) => u.role === selectedTask.role && byUser.has(u.id));

    return pool.map((user) => {
      const f = byUser.get(user.id)!;
      const distanceKm = user.location
        ? Math.round(haversineKm(user.location, selectedTask.location) * 10) / 10
        : Number.POSITIVE_INFINITY;
      // Real open work (leads held, or unfinished jobs led or crewed): a nearby but overloaded person should rank behind someone a little further away.
      const workload = f.openWork;
      const isNewJoiner = !user.joinedAt || Date.now() - new Date(user.joinedAt).getTime() < 14 * 86_400_000;
      // A job needing a skill the person lacks is not offered at all (see the block); everyone offered matches.
      const skillMatch = f.hasSkill ? 1 : 0;

      const proximityScore = Number.isFinite(distanceKm)
        ? Math.max(0, 1 - distanceKm / MAX_REASONABLE_KM)
        : 0;
      const workloadScore = Math.max(0, 1 - workload / 6);

      const score =
        proximityScore * SCORE_WEIGHTS.proximity +
        workloadScore * SCORE_WEIGHTS.workload +
        skillMatch * SCORE_WEIGHTS.skill;

      return {
        user,
        distanceKm,
        etaMinutes: Number.isFinite(distanceKm)
          ? Math.round((distanceKm / AVERAGE_SPEED_KMH) * 60)
          : -1,
        currentWorkload: workload,
        skillMatch,
        score,
        unavailable: f.block !== null,
        unavailableReason: f.block ?? undefined,
        isNewJoiner,
      } satisfies Candidate;
    });
  }, [selectedTask, users, facts]);

  const candidates = useMemo(
    () => ranked.filter((c) => !c.unavailable && c.distanceKm <= MAX_REASONABLE_KM).sort((a, b) => b.score - a.score),
    [ranked],
  );
  const notOffered = useMemo(
    () => ranked.filter((c) => c.unavailable || c.distanceKm > MAX_REASONABLE_KM).sort((a, b) => a.user.name.localeCompare(b.user.name)),
    [ranked],
  );

  const assign = useCallback(
    async (task: UnassignedTask, candidate: Candidate): Promise<'assigned' | 'conflict' | { failed: string }> => {
      if (!me) return { failed: 'forbidden' };
      setBusyUserId(candidate.user.id);
      try {
        if (task.kind === 'leadFollowUp' && task.lead) {
          // Re-check against the live record immediately before writing, so two admins cannot both assign it.
          const fresh = await repository.getLead(task.lead.id);
          if (fresh && fresh.surveyorId !== '') {
            setConflictTaskId(task.id);
            await reload();
            return 'conflict';
          }
          await repository.reassignLead(task.lead.id, candidate.user.id, 'Assigned from best-match suggestions', me.name);
        } else if (task.kind === 'jobAssignment' && task.job) {
          // The repository refuses if someone got there first, and applies every check a technician must pass to lead a job.
          await repository.assignJobLead(task.job.id, candidate.user.id, me.id);
        }
        setTasks((current) => current.filter((t) => t.id !== task.id));
        setSelectedTaskId(null);
        return 'assigned';
      } catch (err) {
        const code = err instanceof Error ? err.message : 'generic';
        if (code === 'already_assigned') {
          setConflictTaskId(task.id);
          await reload();
          return 'conflict';
        }
        return { failed: code };
      } finally {
        setBusyUserId(null);
      }
    },
    [repository, reload, me],
  );

  return {
    status,
    tasks,
    selectedTask,
    selectTask: (task) => setSelectedTaskId(task.id),
    candidates,
    notOffered,
    assign,
    busyUserId,
    conflictTaskId,
    clearConflict: () => setConflictTaskId(null),
    reload,
  };
}
