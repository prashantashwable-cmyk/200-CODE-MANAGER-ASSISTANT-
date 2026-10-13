import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { Competitor, CompetitorPricePosition } from '@/data/types';
import type { CompetitorBattlecardsStatus } from './competitor-battlecards.types';

const POLL_MS = 60_000;

function linesToList(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

interface CompetitorBattlecardsState {
  status: CompetitorBattlecardsStatus;
  items: Competitor[];
  query: string;
  setQuery: (q: string) => void;

  openId: string | null;
  openDetail: (id: string) => void;
  closeDetail: () => void;
  current: Competitor | undefined;

  editing: boolean;
  startEdit: () => void;
  cancelEdit: () => void;
  draftPriceSummary: string;
  setDraftPriceSummary: (v: string) => void;
  draftStrengths: string;
  setDraftStrengths: (v: string) => void;
  draftDifferentiation: string;
  setDraftDifferentiation: (v: string) => void;
  saveEdit: () => Promise<boolean>;

  flagSheetOpen: boolean;
  openFlagSheet: () => void;
  closeFlagSheet: () => void;
  flagReason: string;
  setFlagReason: (v: string) => void;
  submitFlag: () => Promise<boolean>;

  addOpen: boolean;
  openAdd: () => void;
  closeAdd: () => void;
  draftName: string;
  setDraftName: (v: string) => void;
  draftPricePosition: CompetitorPricePosition;
  setDraftPricePosition: (v: CompetitorPricePosition) => void;
  canSubmitNew: boolean;
  submitNew: () => Promise<boolean>;

  reload: () => Promise<void>;
}

export function useCompetitorBattlecards(): CompetitorBattlecardsState {
  const repository = useData();
  const { user } = useSession();
  const [status, setStatus] = useState<CompetitorBattlecardsStatus>('loading');
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [query, setQuery] = useState('');

  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draftPriceSummary, setDraftPriceSummary] = useState('');
  const [draftStrengths, setDraftStrengths] = useState('');
  const [draftDifferentiation, setDraftDifferentiation] = useState('');

  const [flagSheetOpen, setFlagSheetOpen] = useState(false);
  const [flagReason, setFlagReason] = useState('');

  const [addOpen, setAddOpen] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftPricePosition, setDraftPricePosition] = useState<CompetitorPricePosition>('comparable');

  const load = useCallback(async () => {
    try {
      const list = await repository.listCompetitors();
      setCompetitors(list);
      setStatus('ready');
    } catch {
      setStatus((cur) => (cur === 'ready' ? cur : 'error'));
    }
  }, [repository]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return competitors;
    return competitors.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.priceSummary.toLowerCase().includes(q) ||
        c.strengths.some((s) => s.toLowerCase().includes(q)) ||
        c.differentiationPoints.some((d) => d.toLowerCase().includes(q)),
    );
  }, [competitors, query]);

  const current = useMemo(() => competitors.find((c) => c.id === openId), [competitors, openId]);

  const openDetail = useCallback((id: string) => {
    setOpenId(id);
    setEditing(false);
  }, []);
  const closeDetail = useCallback(() => {
    setOpenId(null);
    setEditing(false);
  }, []);

  const startEdit = useCallback(() => {
    if (!current) return;
    setDraftPriceSummary(current.priceSummary);
    setDraftStrengths(current.strengths.join('\n'));
    setDraftDifferentiation(current.differentiationPoints.join('\n'));
    setEditing(true);
  }, [current]);
  const cancelEdit = useCallback(() => setEditing(false), []);

  const saveEdit = useCallback(async () => {
    if (!current || !user || !draftPriceSummary.trim()) return false;
    try {
      await repository.updateCompetitorPositioning(
        current.id,
        {
          priceSummary: draftPriceSummary.trim(),
          strengths: linesToList(draftStrengths),
          differentiationPoints: linesToList(draftDifferentiation),
        },
        user.name,
      );
      setEditing(false);
      await load();
      return true;
    } catch {
      return false;
    }
  }, [repository, current, user, draftPriceSummary, draftStrengths, draftDifferentiation, load]);

  const openFlagSheet = useCallback(() => {
    setFlagReason('');
    setFlagSheetOpen(true);
  }, []);
  const closeFlagSheet = useCallback(() => setFlagSheetOpen(false), []);

  const submitFlag = useCallback(async () => {
    if (!current || !user || !flagReason.trim()) return false;
    try {
      await repository.flagCompetitorForReview(current.id, flagReason.trim(), user.name);
      setFlagSheetOpen(false);
      await load();
      return true;
    } catch {
      return false;
    }
  }, [repository, current, user, flagReason, load]);

  const openAdd = useCallback(() => {
    setDraftName('');
    setDraftPricePosition('comparable');
    setAddOpen(true);
  }, []);
  const closeAdd = useCallback(() => setAddOpen(false), []);

  const canSubmitNew = draftName.trim().length > 0;

  const submitNew = useCallback(async () => {
    if (!user || !canSubmitNew) return false;
    try {
      await repository.createCompetitor({
        name: draftName.trim(),
        pricePosition: draftPricePosition,
        priceSummary: '',
        strengths: [],
        differentiationPoints: [],
        createdBy: user.name,
      });
      setAddOpen(false);
      await load();
      return true;
    } catch {
      return false;
    }
  }, [repository, user, canSubmitNew, draftName, draftPricePosition, load]);

  return {
    status,
    items,
    query,
    setQuery,
    openId,
    openDetail,
    closeDetail,
    current,
    editing,
    startEdit,
    cancelEdit,
    draftPriceSummary,
    setDraftPriceSummary,
    draftStrengths,
    setDraftStrengths,
    draftDifferentiation,
    setDraftDifferentiation,
    saveEdit,
    flagSheetOpen,
    openFlagSheet,
    closeFlagSheet,
    flagReason,
    setFlagReason,
    submitFlag,
    addOpen,
    openAdd,
    closeAdd,
    draftName,
    setDraftName,
    draftPricePosition,
    setDraftPricePosition,
    canSubmitNew,
    submitNew,
    reload: load,
  };
}
