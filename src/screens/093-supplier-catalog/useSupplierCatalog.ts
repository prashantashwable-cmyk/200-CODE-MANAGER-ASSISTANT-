import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type {
  CatalogBulkPreviewRow,
  CatalogBulkResult,
  CatalogItemView,
  CatalogPendingReview,
  CatalogSaveResult,
  CatalogSettings,
} from '@/data/repository';
import type { CatalogPriceChange, DriveType, Supplier } from '@/data/types';
import {
  KNOWN_PART_CATEGORIES,
  categoryReferencePrices,
  checkCatalogEntry,
  isMaterialPriceChange,
} from '@/features/suppliers/catalogRules';
import type { CatalogEntryCheck } from '@/features/suppliers/catalogRules';
import { CATALOG_PAGE_SIZE } from './supplier-catalog.types';
import type { CatalogView, SupplierCatalogStatus } from './supplier-catalog.types';

/** What the add/edit sheet holds while being typed — strings until saved. */
export interface CatalogForm {
  id?: string;
  supplierId: string;
  /** A known category key, or `other` with `customCategory` filled in. */
  category: string;
  customCategory: string;
  description: string;
  specification: string;
  driveTypes: DriveType[];
  price: string;
  leadTimeDays: string;
}

export interface CategorySpread {
  category: string;
  lowest: number;
  highest: number;
  listings: number;
}

const EMPTY_FORM: CatalogForm = {
  supplierId: '',
  category: KNOWN_PART_CATEGORIES[0],
  customCategory: '',
  description: '',
  specification: '',
  driveTypes: [],
  price: '',
  leadTimeDays: '',
};

const matchesView = (row: CatalogItemView, view: CatalogView) => {
  if (view === 'discontinued') return row.item.status === 'discontinued' || row.item.status === 'rejected';
  if (view === 'review') return row.item.status === 'pending_review' || row.pendingChange !== null;
  return row.item.status === 'active';
};

export function useSupplierCatalog() {
  const repository = useData();
  const { user, role } = useSession();
  const isAdmin = role === 'admin';
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState<SupplierCatalogStatus>('loading');
  const [items, setItems] = useState<CatalogItemView[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  /** The supplier a supplier login manages; null for Admin. */
  const [ownSupplier, setOwnSupplier] = useState<Supplier | null>(null);
  const [reviews, setReviews] = useState<CatalogPendingReview[]>([]);
  const [settings, setSettings] = useState<CatalogSettings | null>(null);

  const [view, setView] = useState<CatalogView>(searchParams.get('view') === 'review' ? 'review' : 'active');
  const [search, setSearch] = useState('');
  const [supplierFilter, setSupplierFilter] = useState(searchParams.get('supplierId') ?? '');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [driveTypeFilter, setDriveTypeFilter] = useState('');
  const [pageCount, setPageCount] = useState(1);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      if (isAdmin) {
        const [nextItems, nextSuppliers, nextReviews, nextSettings] = await Promise.all([
          repository.listCatalogItems(),
          repository.listSuppliers(),
          repository.listPendingCatalogReviews(),
          repository.getCatalogSettings(),
        ]);
        setItems(nextItems);
        setSuppliers(nextSuppliers);
        setReviews(nextReviews);
        setSettings(nextSettings);
        setStatus('ready');
        return;
      }
      const own = await repository.getSupplierForUser(user.id);
      if (!own) {
        setStatus('no_supplier');
        return;
      }
      const [nextItems, nextSettings] = await Promise.all([
        repository.listCatalogItems({ supplierId: own.id }),
        repository.getCatalogSettings(),
      ]);
      setOwnSupplier(own);
      setItems(nextItems);
      setSettings(nextSettings);
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? 'ready' : 'error'));
    }
  }, [repository, user, isAdmin]);

  useEffect(() => {
    void load();
  }, [load]);

  // A new filter starts from the top of the list again.
  useEffect(() => setPageCount(1), [view, search, supplierFilter, categoryFilter, driveTypeFilter]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter((row) => {
      if (!matchesView(row, view)) return false;
      if (supplierFilter && row.item.supplierId !== supplierFilter) return false;
      if (categoryFilter && row.item.category !== categoryFilter) return false;
      // An item for any drive type fits every drive-type filter.
      if (driveTypeFilter && row.item.driveTypes.length > 0 && !row.item.driveTypes.includes(driveTypeFilter as DriveType)) {
        return false;
      }
      if (!needle) return true;
      return [row.item.description, row.item.specification, row.item.category, row.supplierName]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [items, view, search, supplierFilter, categoryFilter, driveTypeFilter]);

  const visible = filtered.slice(0, pageCount * CATALOG_PAGE_SIZE);
  const viewCounts = useMemo(
    () => ({
      active: items.filter((r) => matchesView(r, 'active')).length,
      review: items.filter((r) => matchesView(r, 'review')).length,
      discontinued: items.filter((r) => matchesView(r, 'discontinued')).length,
    }),
    [items],
  );
  const categoriesInUse = useMemo(() => [...new Set(items.map((r) => r.item.category))].sort(), [items]);

  /** The going-rate spread per category across suppliers — shown as-is,
   *  and the input Admin brings to Pricing Rules (070). */
  const spread = useMemo<CategorySpread[]>(() => {
    const byCategory = new Map<string, number[]>();
    for (const row of items) {
      if (row.item.status !== 'active') continue;
      byCategory.set(row.item.category, [...(byCategory.get(row.item.category) ?? []), row.item.unitPrice]);
    }
    return [...byCategory]
      .map(([category, prices]) => ({ category, lowest: Math.min(...prices), highest: Math.max(...prices), listings: prices.length }))
      .sort((a, b) => a.category.localeCompare(b.category));
  }, [items]);

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setDriveTypeFilter('');
    if (isAdmin) setSupplierFilter('');
  };

  /* ------------------------------------------------------ add / edit sheet */
  const [editing, setEditing] = useState<CatalogItemView | 'new' | null>(null);
  const [form, setForm] = useState<CatalogForm>(EMPTY_FORM);
  const [history, setHistory] = useState<CatalogPriceChange[] | null>(null);
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setForm({ ...EMPTY_FORM, supplierId: ownSupplier?.id ?? supplierFilter });
    setHistory(null);
    setEditing('new');
  };

  const openItem = (row: CatalogItemView) => {
    const known = (KNOWN_PART_CATEGORIES as readonly string[]).includes(row.item.category);
    setForm({
      id: row.item.id,
      supplierId: row.item.supplierId,
      category: known ? row.item.category : 'other',
      customCategory: known ? '' : row.item.category,
      description: row.item.description,
      specification: row.item.specification,
      driveTypes: row.item.driveTypes,
      // A supplier editing while their change waits starts from the asked
      // price, so they revise the ask rather than silently retracting it.
      // Admin starts from the live price: saving another detail must never
      // quietly approve the supplier's ask.
      price: String(isAdmin ? row.item.unitPrice : (row.pendingChange?.toPrice ?? row.item.unitPrice)),
      leadTimeDays: String(row.item.leadTimeDays),
    });
    setHistory(null);
    setEditing(row);
    void repository
      .listCatalogPriceHistory(row.item.id)
      .then(setHistory)
      .catch(() => setHistory([]));
  };

  const closeEditor = () => setEditing(null);
  const updateForm = (patch: Partial<CatalogForm>) => setForm((current) => ({ ...current, ...patch }));
  const toggleDriveType = (driveType: DriveType) =>
    setForm((current) => ({
      ...current,
      driveTypes: current.driveTypes.includes(driveType)
        ? current.driveTypes.filter((d) => d !== driveType)
        : [...current.driveTypes, driveType],
    }));

  const editingRow = editing && editing !== 'new' ? editing : null;
  const formCategory = form.category === 'other' ? form.customCategory.trim().toLowerCase().replace(/\s+/g, '_') : form.category;
  const formPrice = form.price.trim() === '' ? Number.NaN : Number(form.price.replace(/[,\s₹]/g, ''));
  const formLead = form.leadTimeDays.trim() === '' ? Number.NaN : Number(form.leadTimeDays);

  /** The same check the repository runs — shown while typing. */
  const formCheck = useMemo<CatalogEntryCheck>(() => {
    const reference = categoryReferencePrices(items.filter((r) => r.item.id !== form.id).map((r) => r.item));
    return checkCatalogEntry(
      {
        category: formCategory,
        description: form.description,
        specification: form.specification,
        driveTypes: form.driveTypes,
        unitPrice: formPrice,
        leadTimeDays: formLead,
      },
      reference,
    );
  }, [items, form, formCategory, formPrice, formLead]);

  /** Whether a supplier's save will wait for Admin, and by how much it moves. */
  const pricePreview = useMemo(() => {
    const live = editingRow?.item.unitPrice;
    if (!live || !Number.isFinite(formPrice) || formPrice === live) return null;
    const pct = Math.round(((formPrice - live) / live) * 1000) / 10;
    const threshold = settings?.priceReviewThresholdPct ?? 10;
    return { pct, needsReview: !isAdmin && isMaterialPriceChange(live, formPrice, threshold) };
  }, [editingRow, formPrice, settings, isAdmin]);

  const editable = editing === 'new' || (editingRow !== null && (editingRow.item.status === 'active' || editingRow.item.status === 'pending_review'));
  const canSave =
    editable && formCheck.errors.length === 0 && Boolean(form.supplierId) && formCategory.length > 0 && !saving;

  const save = async (): Promise<CatalogSaveResult['outcome'] | null> => {
    if (!user || !canSave) return null;
    setSaving(true);
    try {
      const result = await repository.saveCatalogItem(
        {
          id: form.id,
          supplierId: form.supplierId,
          category: formCategory,
          description: form.description,
          specification: form.specification,
          driveTypes: form.driveTypes,
          unitPrice: formPrice,
          leadTimeDays: formLead,
        },
        user.id,
      );
      setEditing(null);
      await load();
      return result.outcome;
    } catch {
      return null;
    } finally {
      setSaving(false);
    }
  };

  const setItemStatus = async (next: 'active' | 'discontinued'): Promise<boolean> => {
    if (!user || !editingRow) return false;
    setSaving(true);
    try {
      await repository.setCatalogItemStatus(editingRow.item.id, next, user.id);
      setEditing(null);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------------------------------------------ reviews */
  const [reviewBusyId, setReviewBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const decide = async (changeId: string, decision: 'approve' | 'reject'): Promise<boolean> => {
    if (!user) return false;
    if (decision === 'reject' && rejectReason.trim().length < 4) return false;
    setReviewBusyId(changeId);
    try {
      await repository.reviewCatalogPriceChange(changeId, decision, user.id, decision === 'reject' ? rejectReason : undefined);
      setRejectingId(null);
      setRejectReason('');
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setReviewBusyId(null);
    }
  };

  /* -------------------------------------------------------- bulk upload */
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkSupplierId, setBulkSupplierId] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [bulkPreview, setBulkPreview] = useState<CatalogBulkPreviewRow[] | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const openBulk = () => {
    setBulkSupplierId(ownSupplier?.id ?? supplierFilter);
    setBulkText('');
    setBulkPreview(null);
    setBulkOpen(true);
  };

  const setBulkInput = (text: string) => {
    setBulkText(text);
    // Any edit makes an earlier check stale — re-check before applying.
    setBulkPreview(null);
  };

  const readBulkFile = async (file: File) => setBulkInput(await file.text());

  const checkBulk = async () => {
    if (!user || !bulkSupplierId || !bulkText.trim()) return;
    setBulkBusy(true);
    try {
      setBulkPreview(await repository.previewCatalogBulkUpload(bulkSupplierId, bulkText, user.id));
    } catch {
      setBulkPreview([]);
    } finally {
      setBulkBusy(false);
    }
  };

  const bulkApplicable = (bulkPreview ?? []).filter((r) => r.verdict !== 'invalid' && r.action !== 'unchanged').length;

  const applyBulk = async (): Promise<CatalogBulkResult | null> => {
    if (!user || !bulkSupplierId || bulkApplicable === 0) return null;
    setBulkBusy(true);
    try {
      const result = await repository.applyCatalogBulkUpload(bulkSupplierId, bulkText, user.id);
      setBulkOpen(false);
      await load();
      return result;
    } catch {
      return null;
    } finally {
      setBulkBusy(false);
    }
  };

  /* ------------------------------------------------ review threshold */
  const [thresholdDraft, setThresholdDraft] = useState('');
  useEffect(() => {
    if (settings) setThresholdDraft(String(settings.priceReviewThresholdPct));
  }, [settings]);
  const thresholdValue = Number(thresholdDraft);
  const thresholdValid = Number.isFinite(thresholdValue) && thresholdValue >= 1 && thresholdValue <= 50;

  const saveThreshold = async (): Promise<boolean> => {
    if (!user || !thresholdValid) return false;
    try {
      setSettings(await repository.updateCatalogSettings(thresholdValue, user.id));
      return true;
    } catch {
      return false;
    }
  };

  const ownPendingCount = items.filter((r) => matchesView(r, 'review')).length;

  return {
    status,
    isAdmin,
    ownSupplier,
    suppliers,
    settings,
    reload: load,

    view,
    setView,
    viewCounts,
    search,
    setSearch,
    supplierFilter,
    setSupplierFilter,
    categoryFilter,
    setCategoryFilter,
    driveTypeFilter,
    setDriveTypeFilter,
    categoriesInUse,
    clearFilters,
    totalItems: items.length,
    filtered,
    visible,
    hasMore: visible.length < filtered.length,
    showMore: () => setPageCount((n) => n + 1),
    spread,

    reviews,
    ownPendingCount,
    reviewBusyId,
    rejectingId,
    setRejectingId,
    rejectReason,
    setRejectReason,
    decide,

    editing,
    editingRow,
    form,
    updateForm,
    toggleDriveType,
    formCheck,
    pricePreview,
    editable,
    canSave,
    saving,
    history,
    openNew,
    openItem,
    closeEditor,
    save,
    setItemStatus,

    bulkOpen,
    setBulkOpen,
    bulkSupplierId,
    setBulkSupplierId,
    bulkText,
    setBulkInput,
    readBulkFile,
    bulkPreview,
    bulkBusy,
    bulkApplicable,
    openBulk,
    checkBulk,
    applyBulk,

    thresholdDraft,
    setThresholdDraft,
    thresholdValid,
    saveThreshold,
  };
}

export type SupplierCatalogState = ReturnType<typeof useSupplierCatalog>;
