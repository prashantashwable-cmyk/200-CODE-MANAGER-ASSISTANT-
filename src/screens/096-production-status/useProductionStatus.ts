import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { ProductionRecordResult, ProductionRecordView } from '@/data/repository';
import type { ProductionStage } from '@/data/types';
import type { DocumentSlotValue } from '@/features/onboarding/DocumentSlot';
import { EVIDENCE_REQUIRED_STAGES } from '@/features/suppliers/production';
import type { ProductionStatusState } from './production-status.types';

type UnavailableReason = Extract<ProductionRecordResult, { status: 'unavailable' }>['reason'];

export function useProductionStatus() {
  const { recordId } = useParams<{ recordId: string }>();
  const repository = useData();
  const { user, role } = useSession();
  const isAdmin = role === 'admin';

  const [status, setStatus] = useState<ProductionStatusState>('loading');
  const [view, setView] = useState<ProductionRecordView | null>(null);
  const [unavailable, setUnavailable] = useState<UnavailableReason | null>(null);

  const load = useCallback(async () => {
    if (!user || !recordId) return;
    try {
      const result = await repository.getProductionRecord(recordId, user.id);
      if (result.status === 'ok') {
        setView(result.view);
        setStatus('ready');
      } else {
        setUnavailable(result.reason);
        setStatus('unavailable');
      }
    } catch {
      setStatus((current) => (current === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user, recordId]);

  useEffect(() => {
    void load();
  }, [load]);

  /* --------------------------------------------------------------- advance */
  const [applyToBatch, setApplyToBatch] = useState(true);
  const [adminNote, setAdminNote] = useState('');
  const [busy, setBusy] = useState(false);

  /** Admin signing off a manufacturer's stage is standing in for them. */
  const adminNoteMissing = isAdmin && adminNote.trim().length < 4;
  const canAdvance = Boolean(view?.canUpdate && view.nextStage && !view.evidenceRequired && !adminNoteMissing && !busy);

  const advance = async (): Promise<'advanced' | 'finished' | 'batch_evidence_missing' | false> => {
    if (!user || !view || !canAdvance) return false;
    setBusy(true);
    try {
      const finishing = view.nextStage === 'complete';
      await repository.advanceProductionStage(
        view.record.id,
        { applyToBatch: applyToBatch && view.batchSiblings.length > 0, note: adminNote.trim() || undefined },
        user.id,
      );
      setAdminNote('');
      await load();
      return finishing ? 'finished' : 'advanced';
    } catch (err) {
      // This part's own evidence is checked before the button enables, so a
      // refusal here means a batch sibling hasn't got its evidence yet.
      return err instanceof Error && err.message === 'evidence_required' ? 'batch_evidence_missing' : false;
    } finally {
      setBusy(false);
    }
  };

  /* -------------------------------------------------------------- evidence */
  const [evidenceFile, setEvidenceFile] = useState<DocumentSlotValue | null>(null);
  const [evidenceNote, setEvidenceNote] = useState('');

  const addEvidence = async (): Promise<boolean> => {
    if (!user || !view || !evidenceFile) return false;
    setBusy(true);
    try {
      const isPdf = /\.pdf$/i.test(evidenceFile.fileName);
      await repository.addProductionEvidence(
        view.record.id,
        { fileName: evidenceFile.fileName, kind: isPdf ? 'document' : 'photo', previewUrl: evidenceFile.previewUrl, note: evidenceNote },
        user.id,
      );
      setEvidenceFile(null);
      setEvidenceNote('');
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setBusy(false);
    }
  };

  /* ---------------------------------------------- secondary: defect / skip */
  const [moreOpen, setMoreOpen] = useState(false);
  const [regressTo, setRegressTo] = useState<ProductionStage | ''>('');
  const [regressReason, setRegressReason] = useState('');
  const [skipStage, setSkipStage] = useState<ProductionStage | ''>('');
  const [skipReason, setSkipReason] = useState('');

  const record = view?.record;
  const currentIndex = record ? record.stages.indexOf(record.currentStage) : -1;
  /** Earlier stages a defect can send the item back to. */
  const regressOptions = record ? record.stages.slice(0, currentIndex) : [];
  /** The current or a later stage that may be dropped for this item. */
  const skipOptions = record
    ? record.stages.slice(currentIndex).filter((s) => s !== 'complete' && !EVIDENCE_REQUIRED_STAGES.includes(s))
    : [];

  const regress = async (): Promise<boolean> => {
    if (!user || !view || !regressTo || regressReason.trim().length < 4) return false;
    setBusy(true);
    try {
      await repository.regressProductionStage(view.record.id, regressTo, regressReason, user.id);
      setRegressTo('');
      setRegressReason('');
      setMoreOpen(false);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setBusy(false);
    }
  };

  const skip = async (): Promise<boolean> => {
    if (!user || !view || !skipStage || skipReason.trim().length < 4) return false;
    setBusy(true);
    try {
      await repository.skipProductionStage(view.record.id, skipStage, skipReason, user.id);
      setSkipStage('');
      setSkipReason('');
      setMoreOpen(false);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setBusy(false);
    }
  };

  return {
    status,
    view,
    unavailable,
    isAdmin,
    reload: load,
    applyToBatch,
    setApplyToBatch,
    adminNote,
    setAdminNote,
    adminNoteMissing,
    canAdvance,
    busy,
    advance,
    evidenceFile,
    setEvidenceFile,
    evidenceNote,
    setEvidenceNote,
    addEvidence,
    moreOpen,
    setMoreOpen,
    regressOptions,
    regressTo,
    setRegressTo,
    regressReason,
    setRegressReason,
    regress,
    skipOptions,
    skipStage,
    setSkipStage,
    skipReason,
    setSkipReason,
    skip,
  };
}

export type ProductionStatusHook = ReturnType<typeof useProductionStatus>;
