import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { CommChannel, CommTemplate, Language, LeadStage } from '@/data/types';
import { extractMergeFields } from '@/features/communication/templateRender';
import { KNOWN_MERGE_FIELDS } from './comm-templates.types';
import type { CommTemplatesStatus } from './comm-templates.types';

const POLL_MS = 60_000;

export interface TemplateGroupSummary {
  groupId: string;
  name: string;
  channel: CommChannel;
  associatedStage: LeadStage | 'any';
  status: CommTemplate['status'];
  languages: Language[];
  updatedAt: string;
}

interface CommTemplatesState {
  status: CommTemplatesStatus;
  groups: TemplateGroupSummary[];
  channelFilter: CommChannel | null;
  setChannelFilter: (c: CommChannel | null) => void;
  stageFilter: LeadStage | 'any' | null;
  setStageFilter: (s: LeadStage | 'any' | null) => void;
  query: string;
  setQuery: (q: string) => void;

  openGroupId: string | null;
  openEditor: (groupId: string) => void;
  closeEditor: () => void;
  editorLanguage: Language;
  setEditorLanguage: (lang: Language) => void;
  editorVariants: CommTemplate[];
  currentVariant: CommTemplate | undefined;
  draftBody: string;
  setDraftBody: (body: string) => void;
  insertField: (token: string) => void;
  unknownFields: string[];
  concurrentEditDetected: boolean;
  save: () => Promise<boolean>;
  setTemplateActiveStatus: (active: boolean) => Promise<boolean>;
  revertToVersion: (version: number) => Promise<boolean>;
  reload: () => Promise<void>;
}

/**
 * Owns the template library. Every automated sequence, trigger rule, and
 * quick-send anywhere in the app pulls its copy from these same records —
 * this screen is the one governed source, never a one-off hard-coded string.
 */
export function useCommTemplates(): CommTemplatesState {
  const repository = useData();
  const { user } = useSession();
  const [status, setStatus] = useState<CommTemplatesStatus>('loading');
  const [templates, setTemplates] = useState<CommTemplate[]>([]);

  const [channelFilter, setChannelFilter] = useState<CommChannel | null>(null);
  const [stageFilter, setStageFilter] = useState<LeadStage | 'any' | null>(null);
  const [query, setQuery] = useState('');

  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const [editorLanguage, setEditorLanguage] = useState<Language>('en');
  const [draftBody, setDraftBody] = useState('');
  /** The body as it was the moment this editor session opened — diverging
   *  from the live fetched value means another admin saved a change while
   *  we had this open. */
  const [openedBody, setOpenedBody] = useState('');

  const load = useCallback(async () => {
    try {
      const list = await repository.listCommTemplates();
      setTemplates(list);
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

  const groups = useMemo<TemplateGroupSummary[]>(() => {
    const byGroup = new Map<string, CommTemplate[]>();
    for (const t of templates) {
      const list = byGroup.get(t.groupId) ?? [];
      list.push(t);
      byGroup.set(t.groupId, list);
    }
    const q = query.trim().toLowerCase();
    return [...byGroup.entries()]
      .map(([groupId, variants]) => {
        const primary = variants.find((v) => v.language === 'en') ?? variants[0];
        return {
          groupId,
          name: primary.name,
          channel: primary.channel,
          associatedStage: primary.associatedStage,
          status: primary.status,
          languages: variants.map((v) => v.language),
          updatedAt: variants.reduce((latest, v) => (v.updatedAt > latest ? v.updatedAt : latest), primary.updatedAt),
        };
      })
      .filter((g) => !channelFilter || g.channel === channelFilter)
      .filter((g) => !stageFilter || g.associatedStage === stageFilter)
      .filter((g) => !q || g.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [templates, channelFilter, stageFilter, query]);

  const editorVariants = useMemo(() => templates.filter((t) => t.groupId === openGroupId), [templates, openGroupId]);
  const currentVariant = useMemo(() => editorVariants.find((v) => v.language === editorLanguage), [editorVariants, editorLanguage]);

  const openEditor = useCallback(
    (groupId: string) => {
      setOpenGroupId(groupId);
      setEditorLanguage('en');
      const variant = templates.find((t) => t.groupId === groupId && t.language === 'en');
      setDraftBody(variant?.body ?? '');
      setOpenedBody(variant?.body ?? '');
    },
    [templates],
  );

  const closeEditor = useCallback(() => setOpenGroupId(null), []);

  const changeLanguage = useCallback(
    (lang: Language) => {
      setEditorLanguage(lang);
      const variant = editorVariants.find((v) => v.language === lang);
      setDraftBody(variant?.body ?? '');
      setOpenedBody(variant?.body ?? '');
    },
    [editorVariants],
  );

  const concurrentEditDetected = Boolean(currentVariant && currentVariant.body !== openedBody && draftBody !== currentVariant.body);

  const insertField = useCallback((token: string) => {
    setDraftBody((cur) => `${cur}${cur && !cur.endsWith(' ') ? ' ' : ''}{{${token}}}`);
  }, []);

  const unknownFields = useMemo(
    () => extractMergeFields(draftBody).filter((f) => !(KNOWN_MERGE_FIELDS as readonly string[]).includes(f)),
    [draftBody],
  );

  const save = useCallback(async () => {
    if (!currentVariant || !user) return false;
    try {
      await repository.saveCommTemplateBody(currentVariant.id, draftBody, user.name);
      await load();
      return true;
    } catch {
      return false;
    }
  }, [repository, currentVariant, draftBody, user, load]);

  const setTemplateActiveStatus = useCallback(
    async (active: boolean) => {
      if (!currentVariant) return false;
      if (active && unknownFields.length > 0) return false;
      try {
        // Status applies to every language variant of the logical template.
        await Promise.all(editorVariants.map((v) => repository.setCommTemplateStatus(v.id, active ? 'active' : 'draft')));
        await load();
        return true;
      } catch {
        return false;
      }
    },
    [repository, currentVariant, editorVariants, unknownFields, load],
  );

  const revertToVersion = useCallback(
    async (version: number) => {
      if (!currentVariant || !user) return false;
      const target = currentVariant.versions.find((v) => v.version === version);
      if (!target) return false;
      try {
        await repository.saveCommTemplateBody(currentVariant.id, target.body, user.name);
        setDraftBody(target.body);
        await load();
        return true;
      } catch {
        return false;
      }
    },
    [repository, currentVariant, user, load],
  );

  return {
    status,
    groups,
    channelFilter,
    setChannelFilter,
    stageFilter,
    setStageFilter,
    query,
    setQuery,
    openGroupId,
    openEditor,
    closeEditor,
    editorLanguage,
    setEditorLanguage: changeLanguage,
    editorVariants,
    currentVariant,
    draftBody,
    setDraftBody,
    insertField,
    unknownFields,
    concurrentEditDetected,
    save,
    setTemplateActiveStatus,
    revertToVersion,
    reload: load,
  };
}
