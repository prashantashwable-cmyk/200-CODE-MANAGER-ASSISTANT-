/** Screen 149 — Partner Directory. Types and translation keys only. */

import { TIER_IDS } from '@/features/partners/tiers';
import type { DirectorySort, DirectoryStatus, DirectoryType } from '@/data/repository';

export const PAGE = 25;
export const POLL_MS = 60_000;
export const SEARCH_DELAY_MS = 250;
export const REASON_MIN = 15;
export const TYPES = ['all', 'surveyor', 'technician', 'supplier'] as const;
export const STATUSES = ['active', 'pending', 'deactivated', 'rejected', 'all'] as const;
export const SORTS: DirectorySort[] = ['name', 'joined'];
export const KNOWN_SKILLS = ['mechanical', 'electrical', 'safety_rescue', 'mrl_gearless', 'hydraulic'] as const;
export const DEFAULT_STATUS: DirectoryStatus | 'all' = 'active';
export const tierOptions: { value: string; type: DirectoryType; id: string }[] = (Object.keys(TIER_IDS) as DirectoryType[]).flatMap((type) => TIER_IDS[type].map((id) => ({ value: `${type}:${id}`, type, id })));
export const profilePath = (key: string) => `/partner-directory?p=${encodeURIComponent(key)}`;
export const tierPath = (partnerId: string) => `/partner-tiers/${partnerId}`;
export const exitPath = (partnerId: string) => `/partner-exit/${partnerId}`;
export const applicationPath = (id: string) => `/applications/${id}`;
export const messagePath = (supplierId: string) => `/supplier-messages?supplierId=${supplierId}`;
export const whatsappUrl = (phone: string) => `https://wa.me/91${phone.replace(/\D/g, '').slice(-10)}`;
/** The export's columns are the spec's own names, not translated. */
export const CSV_COLUMNS = ['partner_id', 'partner_type', 'active_status', 'tier', 'territory_or_specialty', 'name', 'phone', 'city', 'performance'] as const;
export const territoriesPath = '/admin/territories';
export const leadAssignmentPath = '/admin/leads/assignment';

const rec = <T extends string>(ns: string, keys: readonly T[]) => Object.fromEntries(keys.map((k) => [k, `${ns}.${k}`])) as Record<T, string>;
const PROBLEMS = ['not_admin', 'not_found', 'reason_required', 'not_surveyor', 'not_active', 'no_change', 'unknown_zone', 'offline', 'generic'] as const;

export const DIRECTORY_KEYS = {
  title: 'partnerDir.title',
  subtitle: 'partnerDir.subtitle',
  loading: 'partnerDir.loading',
  error: { title: 'partnerDir.error.title', body: 'partnerDir.error.body' },
  search: { label: 'partnerDir.search.label', placeholder: 'partnerDir.search.placeholder' },
  type: rec('partnerDir.type', TYPES),
  typeOne: rec('partnerDir.typeOne', ['surveyor', 'technician', 'supplier'] as const),
  status: rec('partnerDir.status', STATUSES),
  statusOne: rec('partnerDir.statusOne', ['active', 'pending', 'deactivated', 'rejected'] as const),
  filters: { toggle: 'partnerDir.filters.toggle', status: 'partnerDir.filters.status', tier: 'partnerDir.filters.tier', anyTier: 'partnerDir.filters.anyTier', zone: 'partnerDir.filters.zone', anyZone: 'partnerDir.filters.anyZone', sort: 'partnerDir.filters.sort', clear: 'partnerDir.filters.clear' },
  sort: rec('partnerDir.sort', SORTS),
  summary: { count: 'partnerDir.summary.count' },
  more: { button: 'partnerDir.more.button', shown: 'partnerDir.more.shown' },
  empty: { title: 'partnerDir.empty.title', body: 'partnerDir.empty.body', action: 'partnerDir.empty.action' },
  noMatch: { title: 'partnerDir.noMatch.title', body: 'partnerDir.noMatch.body', action: 'partnerDir.noMatch.action' },
  export: { button: 'partnerDir.export.button', busy: 'partnerDir.export.busy', done: 'partnerDir.export.done', failed: 'partnerDir.export.failed', note: 'partnerDir.export.note' },
  row: {
    open: 'partnerDir.row.open',
    inHand: { surveyor: 'partnerDir.row.inHand.surveyor', technician: 'partnerDir.row.inHand.technician', supplier: 'partnerDir.row.inHand.supplier' },
    perf: { surveyor: 'partnerDir.row.perf.surveyor', technician: 'partnerDir.row.perf.technician', technicianNew: 'partnerDir.row.perf.technicianNew', supplier: 'partnerDir.row.perf.supplier', supplierNew: 'partnerDir.row.perf.supplierNew' },
    noTerritory: 'partnerDir.row.noTerritory',
    leaving: 'partnerDir.row.leaving',
    roles: 'partnerDir.row.roles',
  },
  skill: rec('partnerDir.skill', KNOWN_SKILLS),
  profile: {
    back: 'partnerDir.profile.back',
    notFound: { title: 'partnerDir.profile.notFound.title', body: 'partnerDir.profile.notFound.body' },
    joined: 'partnerDir.profile.joined',
    tier: 'partnerDir.profile.tier',
    workArea: { zone: 'partnerDir.profile.workArea.zone', skill: 'partnerDir.profile.workArea.skill', category: 'partnerDir.profile.workArea.category' },
    viewProfile: { surveyor: 'partnerDir.profile.viewProfile.surveyor', technician: 'partnerDir.profile.viewProfile.technician', supplier: 'partnerDir.profile.viewProfile.supplier' },
    tierLink: 'partnerDir.profile.tierLink',
    applicationLink: 'partnerDir.profile.applicationLink',
    actions: 'partnerDir.profile.actions',
    call: 'partnerDir.profile.call',
    message: 'partnerDir.profile.message',
    messageSupplier: 'partnerDir.profile.messageSupplier',
    reassign: 'partnerDir.profile.reassign',
    deactivate: 'partnerDir.profile.deactivate',
    openExit: 'partnerDir.profile.openExit',
    deactivateHint: 'partnerDir.profile.deactivateHint',
    deactivateInFlight: 'partnerDir.profile.deactivateInFlight',
    notActive: 'partnerDir.profile.notActive',
    changes: 'partnerDir.profile.changes',
    changeRow: 'partnerDir.profile.changeRow',
  },
  reassign: {
    heading: 'partnerDir.reassign.heading',
    body: 'partnerDir.reassign.body',
    zones: 'partnerDir.reassign.zones',
    noZones: 'partnerDir.reassign.noZones',
    keeps: 'partnerDir.reassign.keeps',
    assignLeads: 'partnerDir.reassign.assignLeads',
    territories: 'partnerDir.reassign.territories',
    reason: 'partnerDir.reassign.reason',
    reasonHint: 'partnerDir.reassign.reasonHint',
    confirm: 'partnerDir.reassign.confirm',
    saved: 'partnerDir.reassign.saved',
    cancel: 'partnerDir.reassign.cancel',
  },
  problem: rec('partnerDir.problem', PROBLEMS),
} as const;
