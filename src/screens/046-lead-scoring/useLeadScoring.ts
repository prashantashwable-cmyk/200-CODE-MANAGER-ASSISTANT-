import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import type { Lead, ScoreWeightingProfile } from '@/data/types';
import type { LeadScoringStatus, ScoreFactorKey } from './lead-scoring.types';
import { SCORE_FACTOR_KEYS } from './lead-scoring.types';

const POLL_MS = 30_000;

export type WeightDraft = Record<ScoreFactorKey, number>;

interface LeadScoringState {
  status: LeadScoringStatus;
  leads: Lead[];
  profile: ScoreWeightingProfile;
  draft: WeightDraft;
  setDraftWeight: (key: ScoreFactorKey, percent: number) => void;
  draftDirty: boolean;
  pendingShift: number;
  resetDraft: () => void;
  saveWeights: () => Promise<boolean>;
  reload: () => Promise<void>;
}

const toDraft = (profile: ScoreWeightingProfile): WeightDraft => ({
  buildingSize: Math.round(profile.buildingSize * 100),
  constructionReadiness: Math.round(profile.constructionReadiness * 100),
  responsiveness: Math.round(profile.responsiveness * 100),
  territoryHistory: Math.round(profile.territoryHistory * 100),
});

/**
 * Owns the priority-sorted lead list and the weighting profile that drives
 * it. Percent inputs in the UI are just a friendlier unit — normalized back
 * to fractions summing to 1 the moment they're saved, so the repository's
 * weighting math never has to know the screen worked in percent.
 */
export function useLeadScoring(): LeadScoringState {
  const repository = useData();
  const [status, setStatus] = useState<LeadScoringStatus>('loading');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [profile, setProfile] = useState<ScoreWeightingProfile | null>(null);
  const [draft, setDraft] = useState<WeightDraft | null>(null);

  const load = useCallback(async () => {
    try {
      const [leadList, weightProfile] = await Promise.all([
        repository.listLeads({ sort: 'priority' }),
        repository.getScoreWeightingProfile(),
      ]);
      setLeads(leadList);
      setProfile(weightProfile);
      setDraft((current) => current ?? toDraft(weightProfile));
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? current : 'error'));
    }
  }, [repository]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  const draftDirty = useMemo(() => {
    if (!profile || !draft) return false;
    return SCORE_FACTOR_KEYS.some((key) => draft[key] !== Math.round(profile[key] * 100));
  }, [profile, draft]);

  const pendingShift = useMemo(() => {
    if (!profile || !draft) return 0;
    const total = SCORE_FACTOR_KEYS.reduce((sum, key) => sum + draft[key], 0) || 1;
    return SCORE_FACTOR_KEYS.reduce((sum, key) => sum + Math.abs(draft[key] / total - profile[key]), 0);
  }, [profile, draft]);

  const setDraftWeight = useCallback((key: ScoreFactorKey, percent: number) => {
    setDraft((current) => (current ? { ...current, [key]: Math.max(0, Math.min(100, percent)) } : current));
  }, []);

  const resetDraft = useCallback(() => {
    if (profile) setDraft(toDraft(profile));
  }, [profile]);

  const saveWeights = useCallback(async () => {
    if (!draft) return false;
    const total = SCORE_FACTOR_KEYS.reduce((sum, key) => sum + draft[key], 0) || 1;
    try {
      const { profile: saved } = await repository.updateScoreWeightingProfile({
        buildingSize: draft.buildingSize / total,
        constructionReadiness: draft.constructionReadiness / total,
        responsiveness: draft.responsiveness / total,
        territoryHistory: draft.territoryHistory / total,
      });
      setProfile(saved);
      setDraft(toDraft(saved));
      await load();
      return true;
    } catch {
      return false;
    }
  }, [draft, repository, load]);

  return {
    status,
    leads,
    profile: profile ?? { buildingSize: 0.3, constructionReadiness: 0.3, responsiveness: 0.25, territoryHistory: 0.15, updatedAt: '' },
    draft: draft ?? toDraft({ buildingSize: 0.3, constructionReadiness: 0.3, responsiveness: 0.25, territoryHistory: 0.15, updatedAt: '' }),
    setDraftWeight,
    draftDirty,
    pendingShift,
    resetDraft,
    saveWeights,
    reload: load,
  };
}
