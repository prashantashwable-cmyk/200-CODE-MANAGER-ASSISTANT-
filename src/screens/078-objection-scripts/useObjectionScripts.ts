import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { ObjectionCategory } from '@/data/types';
import type { ObjectionScriptListItem } from '@/data/repository';
import type { ObjectionScriptsStatus, ObjectionStatusFilter } from './objection-scripts.types';

const POLL_MS = 60_000;

interface ObjectionScriptsState {
  status: ObjectionScriptsStatus;
  items: ObjectionScriptListItem[];
  statusFilter: ObjectionStatusFilter;
  setStatusFilter: (s: ObjectionStatusFilter) => void;
  categoryFilter: ObjectionCategory | null;
  setCategoryFilter: (c: ObjectionCategory | null) => void;
  query: string;
  setQuery: (q: string) => void;

  openId: string | null;
  openDetail: (id: string) => void;
  closeDetail: () => void;
  current: ObjectionScriptListItem | undefined;

  editing: boolean;
  startEdit: () => void;
  cancelEdit: () => void;
  draftResponse: string;
  setDraftResponse: (v: string) => void;
  saveEdit: () => Promise<boolean>;

  approve: (id: string) => Promise<boolean>;
  archive: (id: string) => Promise<boolean>;
  restore: (id: string) => Promise<boolean>;

  addOpen: boolean;
  openAdd: () => void;
  closeAdd: () => void;
  draftCategory: ObjectionCategory;
  setDraftCategory: (c: ObjectionCategory) => void;
  draftNewResponse: string;
  setDraftNewResponse: (v: string) => void;
  draftSourceNote: string;
  setDraftSourceNote: (v: string) => void;
  canSubmitNew: boolean;
  submitNew: () => Promise<boolean>;

  reload: () => Promise<void>;
}

export function useObjectionScripts(): ObjectionScriptsState {
  const repository = useData();
  const { user } = useSession();
  const [status, setStatus] = useState<ObjectionScriptsStatus>('loading');
  const [items, setItems] = useState<ObjectionScriptListItem[]>([]);

  const [statusFilter, setStatusFilter] = useState<ObjectionStatusFilter>('approved');
  const [categoryFilter, setCategoryFilter] = useState<ObjectionCategory | null>(null);
  const [query, setQuery] = useState('');

  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draftResponse, setDraftResponse] = useState('');

  const [addOpen, setAddOpen] = useState(false);
  const [draftCategory, setDraftCategory] = useState<ObjectionCategory>('safety_new_brand');
  const [draftNewResponse, setDraftNewResponse] = useState('');
  const [draftSourceNote, setDraftSourceNote] = useState('');

  const load = useCallback(async () => {
    try {
      const list = await repository.listObjectionScripts();
      setItems(list);
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((it) => it.script.status === statusFilter)
      .filter((it) => !categoryFilter || it.script.category === categoryFilter)
      .filter((it) => !q || it.script.category.replace(/_/g, ' ').includes(q) || it.script.responseText.toLowerCase().includes(q) || it.script.code.toLowerCase().includes(q))
      .sort((a, b) => b.script.updatedAt.localeCompare(a.script.updatedAt));
  }, [items, statusFilter, categoryFilter, query]);

  const current = useMemo(() => items.find((it) => it.script.id === openId), [items, openId]);

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
    setDraftResponse(current.script.responseText);
    setEditing(true);
  }, [current]);
  const cancelEdit = useCallback(() => setEditing(false), []);

  const saveEdit = useCallback(async () => {
    if (!current || !user || !draftResponse.trim()) return false;
    try {
      await repository.saveObjectionScriptResponse(current.script.id, draftResponse.trim(), user.name);
      setEditing(false);
      await load();
      return true;
    } catch {
      return false;
    }
  }, [repository, current, user, draftResponse, load]);

  const approve = useCallback(
    async (id: string) => {
      try {
        await repository.setObjectionScriptStatus(id, 'approved');
        await load();
        return true;
      } catch {
        return false;
      }
    },
    [repository, load],
  );

  const archive = useCallback(
    async (id: string) => {
      try {
        await repository.setObjectionScriptStatus(id, 'archived');
        closeDetail();
        await load();
        return true;
      } catch {
        return false;
      }
    },
    [repository, load, closeDetail],
  );

  const restore = useCallback(
    async (id: string) => {
      try {
        await repository.setObjectionScriptStatus(id, 'approved');
        await load();
        return true;
      } catch {
        return false;
      }
    },
    [repository, load],
  );

  const openAdd = useCallback(() => {
    setDraftCategory('safety_new_brand');
    setDraftNewResponse('');
    setDraftSourceNote('');
    setAddOpen(true);
  }, []);
  const closeAdd = useCallback(() => setAddOpen(false), []);

  const canSubmitNew = draftNewResponse.trim().length > 0;

  const submitNew = useCallback(async () => {
    if (!user || !canSubmitNew) return false;
    try {
      await repository.createObjectionScript({
        category: draftCategory,
        responseText: draftNewResponse.trim(),
        sourceNote: draftSourceNote.trim() || undefined,
        createdBy: user.name,
      });
      setAddOpen(false);
      setStatusFilter('suggested');
      await load();
      return true;
    } catch {
      return false;
    }
  }, [repository, user, canSubmitNew, draftCategory, draftNewResponse, draftSourceNote, load]);

  return {
    status,
    items: filtered,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    query,
    setQuery,
    openId,
    openDetail,
    closeDetail,
    current,
    editing,
    startEdit,
    cancelEdit,
    draftResponse,
    setDraftResponse,
    saveEdit,
    approve,
    archive,
    restore,
    addOpen,
    openAdd,
    closeAdd,
    draftCategory,
    setDraftCategory,
    draftNewResponse,
    setDraftNewResponse,
    draftSourceNote,
    setDraftSourceNote,
    canSubmitNew,
    submitNew,
    reload: load,
  };
}
