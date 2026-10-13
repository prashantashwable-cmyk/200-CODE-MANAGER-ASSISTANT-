import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { DeliverySopBoard, SopTemplateView } from '@/data/repository';
import { MASTER_CATEGORY, checkSteps } from '@/features/logistics/deliverySop';
import type { SopIssue } from '@/features/logistics/deliverySop';
import type { DeliverySopStep } from '@/data/types';
import type { DeliverySopStatus, DraftStep, PreviewLanguage } from './delivery-sop-checklist.types';

export interface ActionResult {
  ok: boolean;
  /** The repository's error code, for a message that says exactly what to fix. */
  code?: string;
}

const fail = (e: unknown): ActionResult => ({ ok: false, code: e instanceof Error ? e.message : 'generic' });

let stepCounter = 0;
const newKey = () => `k${(stepCounter += 1)}`;

const toDraft = (s: DeliverySopStep): DraftStep => ({
  key: newKey(),
  id: s.id,
  label: s.label,
  labelHi: s.labelHi ?? '',
  labelMr: s.labelMr ?? '',
  hint: s.hint ?? '',
  hintHi: s.hintHi ?? '',
  hintMr: s.hintMr ?? '',
  mandatory: s.mandatory,
  needsPhoto: s.needsPhoto,
});
export const blankStep = (): DraftStep => ({ key: newKey(), label: '', labelHi: '', labelMr: '', hint: '', hintHi: '', hintMr: '', mandatory: true, needsPhoto: false });

/** Local calendar day as yyyy-mm-dd, for a date input. */
const todayInput = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export function useDeliverySop() {
  const repository = useData();
  const { user } = useSession();
  const [status, setStatus] = useState<DeliverySopStatus>('loading');
  const [board, setBoard] = useState<DeliverySopBoard | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('sop-all');

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setBoard(await repository.getDeliverySopBoard(user.id));
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user]);
  useEffect(() => {
    void load();
  }, [load]);
  const reload = () => {
    setStatus('loading');
    void load();
  };

  const templates = useMemo(() => [...(board?.templates ?? [])].sort((a, b) => (a.category === MASTER_CATEGORY ? -1 : b.category === MASTER_CATEGORY ? 1 : a.name.localeCompare(b.name))), [board]);
  const selected: SopTemplateView | null = templates.find((t) => t.id === selectedId) ?? templates[0] ?? null;

  /* ---------------------------------------------------------------- preview */
  const [previewVersion, setPreviewVersion] = useState<number | null>(null);
  const [previewLang, setPreviewLang] = useState<PreviewLanguage>('en');
  // Defaults to the version in force; a scheduled or older one can be looked at instead.
  const previewing = selected ? (selected.versions.find((v) => v.version === previewVersion) ?? selected.versions.find((v) => v.status === 'active') ?? selected.versions[0]) : undefined;
  const select = (id: string) => {
    setSelectedId(id);
    setPreviewVersion(null);
  };

  /* ----------------------------------------------------------------- editor */
  const [editorOpen, setEditorOpen] = useState(false);
  /** Set while starting a brand-new category's first procedure. */
  const [creating, setCreating] = useState(false);
  const [category, setCategory] = useState('');
  const [otherCategory, setOtherCategory] = useState('');
  const [steps, setSteps] = useState<DraftStep[]>([]);
  const [effectiveFrom, setEffectiveFrom] = useState(todayInput());
  const [changeNote, setChangeNote] = useState('');

  const openAmend = () => {
    if (!selected) return;
    const latest = selected.versions[0];
    setCreating(false);
    setSteps(latest ? latest.steps.map(toDraft) : []);
    setEffectiveFrom(todayInput());
    setChangeNote('');
    setEditorOpen(true);
  };
  const openNew = () => {
    setCreating(true);
    setCategory(board?.untemplated[0] ?? '__other');
    setOtherCategory('');
    setSteps([blankStep()]);
    setEffectiveFrom(todayInput());
    setChangeNote('');
    setEditorOpen(true);
  };
  const patchStep = (key: string, patch: Partial<DraftStep>) => setSteps((cur) => cur.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  const moveStep = (key: string, dir: -1 | 1) =>
    setSteps((cur) => {
      const i = cur.findIndex((s) => s.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= cur.length) return cur;
      const next = [...cur];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const removeStep = (key: string) => setSteps((cur) => cur.filter((s) => s.key !== key));
  const addStep = () => setSteps((cur) => [...cur, blankStep()]);

  const chosenCategory = creating ? (category === '__other' ? otherCategory : category) : (selected?.category ?? '');
  const issues: SopIssue[] = useMemo(() => checkSteps(steps, creating || selected?.category !== MASTER_CATEGORY), [steps, creating, selected]);
  const latest = selected?.versions[0];
  const unchanged = !creating && !!latest && JSON.stringify(latest.steps.map((s) => [s.label, s.labelHi ?? '', s.labelMr ?? '', s.hint ?? '', s.hintHi ?? '', s.hintMr ?? '', s.mandatory, s.needsPhoto])) === JSON.stringify(steps.map((s) => [s.label.trim(), s.labelHi.trim(), s.labelMr.trim(), s.hint.trim(), s.hintHi.trim(), s.hintMr.trim(), s.mandatory, s.needsPhoto]));
  const canPublish = issues.length === 0 && changeNote.trim().length >= 4 && effectiveFrom !== '' && (!creating || chosenCategory.trim().length >= 2) && !unchanged;

  const publish = async (): Promise<ActionResult> => {
    if (!user || !canPublish) return { ok: false, code: 'invalid_steps' };
    setBusy(true);
    try {
      const saved = await repository.saveDeliverySopVersion(
        {
          templateId: creating ? undefined : selected?.id,
          category: creating ? chosenCategory : undefined,
          steps: steps.map((s) => ({
            id: s.id,
            label: s.label.trim(),
            labelHi: s.labelHi.trim() || undefined,
            labelMr: s.labelMr.trim() || undefined,
            hint: s.hint.trim() || undefined,
            hintHi: s.hintHi.trim() || undefined,
            hintMr: s.hintMr.trim() || undefined,
            mandatory: s.mandatory,
            needsPhoto: s.needsPhoto,
          })),
          // Local midnight of the chosen day, so "today" starts applying today.
          effectiveFrom: new Date(`${effectiveFrom}T00:00:00`).toISOString(),
          changeNote,
        },
        user.id,
      );
      setEditorOpen(false);
      await load();
      setSelectedId(saved.id);
      setPreviewVersion(null);
      return { ok: true };
    } catch (e) {
      return fail(e);
    } finally {
      setBusy(false);
    }
  };

  return {
    status,
    board,
    reload,
    busy,
    templates,
    selected,
    select,
    previewing,
    previewVersion,
    setPreviewVersion,
    previewLang,
    setPreviewLang,
    editorOpen,
    setEditorOpen,
    creating,
    openAmend,
    openNew,
    category,
    setCategory,
    otherCategory,
    setOtherCategory,
    chosenCategory,
    steps,
    patchStep,
    moveStep,
    removeStep,
    addStep,
    effectiveFrom,
    setEffectiveFrom,
    changeNote,
    setChangeNote,
    issues,
    unchanged,
    canPublish,
    publish,
    minEffective: todayInput(),
  };
}

export type DeliverySopState = ReturnType<typeof useDeliverySop>;
