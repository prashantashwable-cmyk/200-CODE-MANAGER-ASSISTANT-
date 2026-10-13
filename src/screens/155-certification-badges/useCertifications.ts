import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { CertificationsView } from '@/data/repository';
import { readJson, writeJson } from '@/features/training/offline';
import { assessmentPath, libraryPath } from './certifications.types';

export type CertificationsState = ReturnType<typeof useCertifications>;
const cacheKey = (userId: string) => `aiec.certifications.${userId}`;

/**
 * Screen 155. The partner's own record of certifications, read from the same badges the job gate (151) and the skills view (157) use, so what they see
 * is exactly what decides their eligibility. The last good copy is kept on the phone so the credential is there on site without signal.
 */
export function useCertifications() {
  const repository = useData();
  const { user } = useSession();
  const navigate = useNavigate();
  const [view, setView] = useState<CertificationsView | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [fromCache, setFromCache] = useState(false);
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      if (!navigator.onLine) throw new Error('offline');
      const v = await repository.getCertifications(user.id);
      if (!alive.current) return;
      setView(v);
      setFromCache(false);
      setStatus('ready');
      writeJson(cacheKey(user.id), v);
    } catch {
      if (!alive.current) return;
      const kept = readJson<CertificationsView>(cacheKey(user.id));
      if (kept) { setView(kept); setFromCache(true); setStatus('ready'); } else setStatus((s) => (s === 'ready' ? s : 'error'));
    }
  }, [repository, user]);
  useEffect(() => { void load(); const id = window.setInterval(() => void load(), 60_000); return () => window.clearInterval(id); }, [load]);
  useEffect(() => { const on = () => void load(); window.addEventListener('online', on); window.addEventListener('offline', on); return () => { window.removeEventListener('online', on); window.removeEventListener('offline', on); }; }, [load]);

  return {
    status, view, fromCache, busy,
    reload: () => { setStatus('loading'); void load(); },
    goto: (path: string) => navigate(path),
    toLibrary: () => navigate(libraryPath),
    toAssessment: (moduleId: string) => navigate(assessmentPath(moduleId)),
    setHidden: async (hidden: boolean) => {
      if (!user) return;
      setBusy(true);
      try { await repository.setCertificationVisibility(hidden, user.id); await load(); } finally { if (alive.current) setBusy(false); }
    },
  };
}
