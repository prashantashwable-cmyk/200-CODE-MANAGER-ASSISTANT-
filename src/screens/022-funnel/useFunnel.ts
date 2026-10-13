import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import type { Lead, LeadStage } from '@/data/types';
import { FUNNEL_STAGES, SMALL_SAMPLE_COUNT } from './funnel.types';
import type { BreakdownBy, BreakdownGroup, FunnelStatus, FunnelStep, LostReasonBreakdown } from './funnel.types';

interface FunnelState {
  status: FunnelStatus;
  breakdownBy: BreakdownBy;
  setBreakdownBy: (value: BreakdownBy) => void;
  overall: FunnelStep[];
  groups: BreakdownGroup[];
  biggestDropStage: LeadStage | null;
  lostReasons: LostReasonBreakdown[];
  reload: () => Promise<void>;
}

const rank = (stage: LeadStage) => FUNNEL_STAGES.indexOf(stage);

/** Builds the current-state funnel: a lead counts once, at its current stage. */
function buildSteps(leads: Lead[]): FunnelStep[] {
  const now = Date.now();
  return FUNNEL_STAGES.map((stage, index) => {
    // "Reached" is cumulative width — anyone whose current stage is this one
    // or later (excluding lost) genuinely passed through it at some point,
    // even if they skipped being individually counted here along the way.
    const reached = leads.filter((l) => l.stage !== 'lost' && rank(l.stage) >= index).length;
    const previousReached =
      index === 0
        ? reached
        : leads.filter((l) => l.stage !== 'lost' && rank(l.stage) >= index - 1).length;

    const atStage = leads.filter((l) => l.stage === stage);
    const avgDays = atStage.length
      ? atStage.reduce((sum, l) => sum + (now - new Date(l.stageEnteredAt).getTime()) / 86_400_000, 0) /
        atStage.length
      : 0;

    return {
      stage,
      count: atStage.length,
      reached,
      conversionFromPrevious: index === 0 || previousReached === 0 ? null : reached / previousReached,
      avgDaysInStage: Math.round(avgDays * 10) / 10,
      smallSample: reached < SMALL_SAMPLE_COUNT,
    };
  });
}

/**
 * Owns the funnel view.
 *
 * The one rule worth stating: a lead's CURRENT stage is what counts here, even
 * if its history shows it skipped a stage (auto-quoted and closed same day) or
 * reopened an earlier one. History belongs to the lead's own timeline, not to
 * this aggregate.
 */
export function useFunnel(): FunnelState {
  const repository = useData();
  const [status, setStatus] = useState<FunnelStatus>('loading');
  const [breakdownBy, setBreakdownBy] = useState<BreakdownBy>('none');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [surveyorNames, setSurveyorNames] = useState<Record<string, string>>({});

  const reload = useCallback(async () => {
    setStatus('loading');
    try {
      const [leadList, surveyors] = await Promise.all([
        repository.listLeads(),
        repository.listUsers({ role: 'surveyor' }),
      ]);
      setLeads(leadList);
      setSurveyorNames(Object.fromEntries(surveyors.map((u) => [u.id, u.name])));
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [repository]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const overall = useMemo(() => buildSteps(leads), [leads]);

  const groups = useMemo<BreakdownGroup[]>(() => {
    if (breakdownBy === 'none') return [];

    const keyOf = (lead: Lead): { id: string; label: string } => {
      if (breakdownBy === 'surveyor') {
        return { id: lead.surveyorId, label: surveyorNames[lead.surveyorId] ?? lead.surveyorId };
      }
      if (breakdownBy === 'territory') {
        return { id: lead.city, label: lead.city };
      }
      // No lead-source field is modelled yet; every seeded lead originates
      // from a field survey, so that is the one real source group today.
      return { id: 'field_survey', label: 'field_survey' };
    };

    const byGroup = new Map<string, { label: string; leads: Lead[] }>();
    for (const lead of leads) {
      const { id, label } = keyOf(lead);
      const bucket = byGroup.get(id) ?? { label, leads: [] };
      bucket.leads.push(lead);
      byGroup.set(id, bucket);
    }

    return [...byGroup.entries()]
      .map(([id, bucket]) => {
        const steps = buildSteps(bucket.leads);
        const totalReached = steps[0]?.reached ?? 0;
        const won = bucket.leads.filter((l) => l.stage === 'won').length;
        const closed = bucket.leads.filter((l) => l.stage === 'won' || l.stage === 'lost').length;
        return {
          id,
          label: bucket.label,
          steps,
          totalReached,
          overallConversion: closed > 0 ? won / closed : 0,
        };
      })
      .sort((a, b) => b.totalReached - a.totalReached);
  }, [leads, breakdownBy, surveyorNames]);

  const biggestDropStage = useMemo<LeadStage | null>(() => {
    let worst: { stage: LeadStage; drop: number } | null = null;
    for (const step of overall) {
      if (step.conversionFromPrevious === null) continue;
      const drop = 1 - step.conversionFromPrevious;
      if (!worst || drop > worst.drop) worst = { stage: step.stage, drop };
    }
    return worst?.stage ?? null;
  }, [overall]);

  const lostReasons = useMemo<LostReasonBreakdown[]>(() => {
    const lost = leads.filter((l) => l.stage === 'lost');
    const byReason = new Map<string, Lead[]>();
    for (const lead of lost) {
      const reason = lead.lostReason ?? 'other';
      byReason.set(reason, [...(byReason.get(reason) ?? []), lead]);
    }
    return [...byReason.entries()]
      .map(([reason, group]) => ({ reason, count: group.length, leads: group }))
      .sort((a, b) => b.count - a.count);
  }, [leads]);

  return {
    status,
    breakdownBy,
    setBreakdownBy,
    overall,
    groups,
    biggestDropStage,
    lostReasons,
    reload,
  };
}
