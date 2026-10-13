import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import { useSession } from '@/session/SessionProvider';
import type { SupplierDirectoryRow } from '@/data/repository';
import type { SupplierDirectoryStatus } from './supplier-directory.types';

function splitList(text: string): string[] {
  return [...new Set(text.split(',').map((v) => v.trim()).filter(Boolean))];
}

interface SupplierDirectoryState {
  status: SupplierDirectoryStatus;
  rows: SupplierDirectoryRow[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  specialtyFilter: string | null;
  setSpecialtyFilter: (s: string | null) => void;
  regionFilter: string | null;
  setRegionFilter: (r: string | null) => void;
  specialtyOptions: string[];
  regionOptions: string[];

  openRow: SupplierDirectoryRow | null;
  openDetail: (row: SupplierDirectoryRow) => void;
  closeDetail: () => void;

  inviteOpen: boolean;
  openInvite: () => void;
  closeInvite: () => void;
  inviteName: string;
  setInviteName: (v: string) => void;
  inviteContactName: string;
  setInviteContactName: (v: string) => void;
  inviteContactPhone: string;
  setInviteContactPhone: (v: string) => void;
  inviteCity: string;
  setInviteCity: (v: string) => void;
  inviteCategories: string;
  setInviteCategories: (v: string) => void;
  inviteSpecialties: string;
  setInviteSpecialties: (v: string) => void;
  inviteRegions: string;
  setInviteRegions: (v: string) => void;
  submittingInvite: boolean;
  submitInvite: () => Promise<boolean>;

  approvingKyc: boolean;
  approveKyc: () => Promise<boolean>;
  /** 096: only a manufacturer's order lines get production tracking. */
  setManufacturer: (isManufacturer: boolean) => Promise<boolean>;
  rejectingKyc: boolean;
  rejectKyc: () => Promise<boolean>;

  suspendOpen: boolean;
  openSuspend: () => void;
  closeSuspend: () => void;
  suspendReason: string;
  setSuspendReason: (v: string) => void;
  submittingSuspend: boolean;
  submitSuspend: () => Promise<boolean>;

  addSpecialtyOpen: boolean;
  openAddSpecialty: () => void;
  closeAddSpecialty: () => void;
  specialtyInput: string;
  setSpecialtyInput: (v: string) => void;
  submittingSpecialty: boolean;
  submitAddSpecialty: () => Promise<boolean>;

  mergeOpen: boolean;
  openMerge: () => void;
  closeMerge: () => void;
  mergeCanonicalId: string;
  setMergeCanonicalId: (v: string) => void;
  mergeCandidates: SupplierDirectoryRow[];
  submittingMerge: boolean;
  submitMerge: () => Promise<boolean>;

  reload: () => Promise<void>;
}

export function useSupplierDirectory(): SupplierDirectoryState {
  const repository = useData();
  const { user } = useSession();
  const [status, setStatus] = useState<SupplierDirectoryStatus>('loading');
  const [allRows, setAllRows] = useState<SupplierDirectoryRow[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState<string | null>(null);
  const [regionFilter, setRegionFilter] = useState<string | null>(null);

  const [openSupplierId, setOpenSupplierId] = useState<string | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteContactName, setInviteContactName] = useState('');
  const [inviteContactPhone, setInviteContactPhone] = useState('');
  const [inviteCity, setInviteCity] = useState('');
  const [inviteCategories, setInviteCategories] = useState('');
  const [inviteSpecialties, setInviteSpecialties] = useState('');
  const [inviteRegions, setInviteRegions] = useState('');
  const [submittingInvite, setSubmittingInvite] = useState(false);

  const [approvingKyc, setApprovingKyc] = useState(false);
  const [rejectingKyc, setRejectingKyc] = useState(false);

  const [suspendOpen, setSuspendOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [submittingSuspend, setSubmittingSuspend] = useState(false);

  const [addSpecialtyOpen, setAddSpecialtyOpen] = useState(false);
  const [specialtyInput, setSpecialtyInput] = useState('');
  const [submittingSpecialty, setSubmittingSpecialty] = useState(false);

  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeCanonicalId, setMergeCanonicalId] = useState('');
  const [submittingMerge, setSubmittingMerge] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await repository.getSupplierDirectory();
      setAllRows(list);
      setStatus('ready');
    } catch {
      setStatus((cur) => (cur === 'ready' ? cur : 'error'));
    }
  }, [repository]);

  useEffect(() => {
    void load();
  }, [load]);

  const specialtyOptions = useMemo(() => [...new Set(allRows.flatMap((r) => r.supplier.driveTypeSpecialties))].sort(), [allRows]);
  const regionOptions = useMemo(() => [...new Set(allRows.flatMap((r) => r.supplier.regionsServed))].sort(), [allRows]);

  const rows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allRows
      .filter((r) => !q || r.supplier.name.toLowerCase().includes(q) || r.supplier.city.toLowerCase().includes(q))
      .filter((r) => !specialtyFilter || r.supplier.driveTypeSpecialties.includes(specialtyFilter))
      .filter((r) => !regionFilter || r.supplier.regionsServed.includes(regionFilter));
  }, [allRows, searchQuery, specialtyFilter, regionFilter]);

  const openRow = useMemo(() => allRows.find((r) => r.supplier.id === openSupplierId) ?? null, [allRows, openSupplierId]);

  const openDetail = useCallback((row: SupplierDirectoryRow) => setOpenSupplierId(row.supplier.id), []);
  const closeDetail = useCallback(() => {
    setOpenSupplierId(null);
    setSuspendOpen(false);
    setAddSpecialtyOpen(false);
    setMergeOpen(false);
  }, []);

  const openInvite = useCallback(() => {
    setInviteName('');
    setInviteContactName('');
    setInviteContactPhone('');
    setInviteCity('');
    setInviteCategories('');
    setInviteSpecialties('');
    setInviteRegions('');
    setInviteOpen(true);
  }, []);
  const closeInvite = useCallback(() => setInviteOpen(false), []);

  const submitInvite = useCallback(async () => {
    if (!user || !inviteName.trim() || !inviteContactPhone.trim() || !inviteCity.trim()) return false;
    setSubmittingInvite(true);
    try {
      await repository.inviteSupplier(
        {
          name: inviteName.trim(),
          contactName: inviteContactName.trim() || undefined,
          contactPhone: inviteContactPhone.trim(),
          city: inviteCity.trim(),
          categories: splitList(inviteCategories),
          driveTypeSpecialties: splitList(inviteSpecialties),
          regionsServed: splitList(inviteRegions),
        },
        user.name,
      );
      setInviteOpen(false);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setSubmittingInvite(false);
    }
  }, [repository, user, inviteName, inviteContactName, inviteContactPhone, inviteCity, inviteCategories, inviteSpecialties, inviteRegions, load]);

  const approveKyc = useCallback(async () => {
    if (!openRow || !user) return false;
    setApprovingKyc(true);
    try {
      await repository.setSupplierKycStatus(openRow.supplier.id, 'approved', user.name);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setApprovingKyc(false);
    }
  }, [repository, openRow, user, load]);

  const setManufacturer = useCallback(
    async (isManufacturer: boolean) => {
      if (!openRow || !user) return false;
      try {
        await repository.setSupplierManufacturer(openRow.supplier.id, isManufacturer, user.name);
        await load();
        return true;
      } catch {
        return false;
      }
    },
    [repository, openRow, user, load],
  );

  const rejectKyc = useCallback(async () => {
    if (!openRow || !user) return false;
    setRejectingKyc(true);
    try {
      await repository.setSupplierKycStatus(openRow.supplier.id, 'rejected', user.name);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setRejectingKyc(false);
    }
  }, [repository, openRow, user, load]);

  const openSuspend = useCallback(() => {
    setSuspendReason('');
    setSuspendOpen(true);
  }, []);
  const closeSuspend = useCallback(() => setSuspendOpen(false), []);

  const submitSuspend = useCallback(async () => {
    if (!openRow || !user || !suspendReason.trim()) return false;
    setSubmittingSuspend(true);
    try {
      await repository.suspendSupplier(openRow.supplier.id, suspendReason.trim(), user.name);
      setSuspendOpen(false);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setSubmittingSuspend(false);
    }
  }, [repository, openRow, user, suspendReason, load]);

  const openAddSpecialty = useCallback(() => {
    setSpecialtyInput('');
    setAddSpecialtyOpen(true);
  }, []);
  const closeAddSpecialty = useCallback(() => setAddSpecialtyOpen(false), []);

  const submitAddSpecialty = useCallback(async () => {
    if (!openRow || !specialtyInput.trim()) return false;
    setSubmittingSpecialty(true);
    try {
      await repository.addSupplierSpecialty(openRow.supplier.id, specialtyInput.trim());
      setAddSpecialtyOpen(false);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setSubmittingSpecialty(false);
    }
  }, [repository, openRow, specialtyInput, load]);

  const mergeCandidates = useMemo(() => allRows.filter((r) => r.supplier.id !== openSupplierId && !r.supplier.mergedIntoSupplierId), [allRows, openSupplierId]);

  const openMerge = useCallback(() => {
    setMergeCanonicalId('');
    setMergeOpen(true);
  }, []);
  const closeMerge = useCallback(() => setMergeOpen(false), []);

  const submitMerge = useCallback(async () => {
    if (!openRow || !user || !mergeCanonicalId) return false;
    setSubmittingMerge(true);
    try {
      await repository.mergeSuppliers(mergeCanonicalId, openRow.supplier.id, user.name);
      setMergeOpen(false);
      setOpenSupplierId(null);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setSubmittingMerge(false);
    }
  }, [repository, openRow, user, mergeCanonicalId, load]);

  return {
    status,
    rows,
    searchQuery,
    setSearchQuery,
    specialtyFilter,
    setSpecialtyFilter,
    regionFilter,
    setRegionFilter,
    specialtyOptions,
    regionOptions,
    openRow,
    openDetail,
    closeDetail,
    inviteOpen,
    openInvite,
    closeInvite,
    inviteName,
    setInviteName,
    inviteContactName,
    setInviteContactName,
    inviteContactPhone,
    setInviteContactPhone,
    inviteCity,
    setInviteCity,
    inviteCategories,
    setInviteCategories,
    inviteSpecialties,
    setInviteSpecialties,
    inviteRegions,
    setInviteRegions,
    submittingInvite,
    submitInvite,
    approvingKyc,
    approveKyc,
    setManufacturer,
    rejectingKyc,
    rejectKyc,
    suspendOpen,
    openSuspend,
    closeSuspend,
    suspendReason,
    setSuspendReason,
    submittingSuspend,
    submitSuspend,
    addSpecialtyOpen,
    openAddSpecialty,
    closeAddSpecialty,
    specialtyInput,
    setSpecialtyInput,
    submittingSpecialty,
    submitAddSpecialty,
    mergeOpen,
    openMerge,
    closeMerge,
    mergeCanonicalId,
    setMergeCanonicalId,
    mergeCandidates,
    submittingMerge,
    submitMerge,
    reload: load,
  };
}
