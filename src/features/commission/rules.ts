/**
 * The commission rules engine, pure (161). Every rate a partner can earn lives in one versioned rule here; no screen and no repository
 * function holds a figure of its own. A rule is a trigger event plus a small set of numbers (a fixed amount, or a share of the deal with a
 * floor, or a pool and how it is split). A version applies from its own day and never reaches back: an entry keeps the version that was in
 * force when it was earned. Tier effects are not set here: they are read from the partner tiers (148), so a better tier is paid better
 * automatically.
 *
 * Every starting figure below is AIEC's own placeholder business decision (the same numbers the ledger already paid before this screen
 * existed), flagged to Admin on the screen.
 */
import { DEFAULT_CREW_RATES, crewShares, qcShares } from './finalPayout';

export const RULE_IDS = ['site_visit', 'lead_qualified', 'conversion', 'referral_bonus', 'sales_close', 'install_pool', 'qc_fee'] as const;
export type CommissionRuleId = (typeof RULE_IDS)[number];

export type RuleGroup = 'surveyor' | 'technician' | 'inspector';
export type RuleTrigger = 'site_visit_verified' | 'lead_qualified' | 'deal_closed' | 'referral_won' | 'handover_issued';
/** `ledger`: new entries are written from this rule today. `cost_report`: only read where AIEC reports what a referral costs. `pending`: the figure is set here and shown to partners; the entry itself is recorded by the payout tracker (162). */
export type RuleLedger = 'ledger' | 'cost_report' | 'pending';

export interface CommissionParams {
  /** A fixed amount in rupees. */
  amount?: number;
  /** A share of the deal's value, in percent. */
  pct?: number;
  /** The least a share-of-deal rule pays, in rupees. */
  floor?: number;
  /** The part of the installation pool the lead keeps on top, in percent. */
  leadBonusPct?: number;
  /** The least part of the crew's share anyone with recorded work receives, in percent. */
  minCrewPct?: number;
}
export type ParamKey = keyof CommissionParams;

export interface ParamDef {
  key: ParamKey;
  unit: 'inr' | 'pct';
  min: number;
  max: number;
  step: number;
}

export interface RuleDef {
  id: CommissionRuleId;
  group: RuleGroup;
  trigger: RuleTrigger;
  ledger: RuleLedger;
  /** The reason key the ledger entries of this rule carry (038 owns the labels). */
  reasonKey: string | null;
  params: ParamDef[];
  /** Whether the person's tier (148) changes what they are paid. */
  tierAware: boolean;
  /** The agreement term (146) that may replace this figure for one person, when Admin has approved it in writing. */
  negotiable: Partial<Record<ParamKey, 'conversionPct' | 'closePct' | 'leadBonusPct' | 'qcFee'>>;
}

const P = {
  amount: (min: number, max: number): ParamDef => ({ key: 'amount', unit: 'inr', min, max, step: 50 }),
  pct: (min: number, max: number): ParamDef => ({ key: 'pct', unit: 'pct', min, max, step: 0.05 }),
};

export const RULE_DEFS: RuleDef[] = [
  { id: 'site_visit', group: 'surveyor', trigger: 'site_visit_verified', ledger: 'pending', reasonKey: 'commission.reason.siteVisitVerified', params: [P.amount(100, 2000)], tierAware: false, negotiable: {} },
  { id: 'lead_qualified', group: 'surveyor', trigger: 'lead_qualified', ledger: 'pending', reasonKey: 'commission.reason.leadQualified', params: [P.amount(500, 5000)], tierAware: false, negotiable: {} },
  { id: 'conversion', group: 'surveyor', trigger: 'deal_closed', ledger: 'ledger', reasonKey: 'commission.reason.leadConverted', params: [P.pct(0.5, 3), { key: 'floor', unit: 'inr', min: 0, max: 25000, step: 500 }], tierAware: true, negotiable: { pct: 'conversionPct' } },
  { id: 'referral_bonus', group: 'surveyor', trigger: 'referral_won', ledger: 'ledger', reasonKey: 'commission.reason.referralReward', params: [P.amount(1000, 25000)], tierAware: false, negotiable: {} },
  { id: 'sales_close', group: 'surveyor', trigger: 'handover_issued', ledger: 'ledger', reasonKey: 'commission.reason.dealClosed', params: [P.pct(0.25, 1)], tierAware: false, negotiable: { pct: 'closePct' } },
  {
    id: 'install_pool',
    group: 'technician',
    trigger: 'handover_issued',
    ledger: 'ledger',
    reasonKey: 'commission.reason.installationCompleted',
    params: [P.pct(0.5, 2), { key: 'leadBonusPct', unit: 'pct', min: 10, max: 40, step: 1 }, { key: 'minCrewPct', unit: 'pct', min: 1, max: 10, step: 1 }],
    tierAware: false,
    negotiable: { leadBonusPct: 'leadBonusPct' },
  },
  { id: 'qc_fee', group: 'inspector', trigger: 'handover_issued', ledger: 'ledger', reasonKey: 'commission.reason.qcCompleted', params: [P.amount(500, 3000)], tierAware: false, negotiable: { amount: 'qcFee' } },
];

export const defOf = (id: CommissionRuleId): RuleDef => RULE_DEFS.find((d) => d.id === id) as RuleDef;
export const isRuleId = (id: string): id is CommissionRuleId => (RULE_IDS as readonly string[]).includes(id);

/** The first version of each rule: the figures the ledger already paid before rules were versioned. */
export const DEFAULT_PARAMS: Record<CommissionRuleId, CommissionParams> = {
  site_visit: { amount: 500 },
  lead_qualified: { amount: 2000 },
  conversion: { pct: 1.5, floor: 5000 },
  referral_bonus: { amount: 5000 },
  sales_close: { pct: 0.5 },
  install_pool: { pct: 1, leadBonusPct: 25, minCrewPct: 5 },
  qc_fee: { amount: 1500 },
};

/** The ledger's older reasons, and the rule each one belongs to. A reason with no rule was not earned from a rate (a contest prize, an exit settlement Admin decided). */
export const RULE_OF_REASON: Record<string, CommissionRuleId | null> = {
  'commission.reason.siteVisitVerified': 'site_visit',
  'commission.reason.leadQualified': 'lead_qualified',
  'commission.reason.leadConverted': 'conversion',
  'commission.reason.dealClosed': 'sales_close',
  'commission.reason.referralReward': 'referral_bonus',
  'commission.reason.installationCompleted': 'install_pool',
  'commission.reason.qcCompleted': 'qc_fee',
  'commission.reason.monthlyBonus': null,
  'commission.reason.contestPrize': null,
  'commission.reason.exitSettlement': null,
  'commission.reason.payoutCorrection': null,
};

/* ------------------------------------------------------------------ versions */

export interface VersionLike {
  version: number;
  effectiveFrom: string;
  params: CommissionParams;
}

/** The version in force on a calendar day (`yyyy-mm-dd`): the latest whose day has arrived. */
export function inForce<T extends VersionLike>(versions: T[], day: string): T | null {
  const live = versions.filter((v) => v.effectiveFrom <= day).sort((a, b) => a.version - b.version);
  return live[live.length - 1] ?? null;
}
/** A version announced for a later day, if any. */
export function upcomingOf<T extends VersionLike>(versions: T[], day: string): T | null {
  const later = versions.filter((v) => v.effectiveFrom > day).sort((a, b) => a.version - b.version);
  return later[0] ?? null;
}

export type ParamsProblem = 'param_missing' | 'param_range' | 'param_unknown';
export function paramsProblem(id: CommissionRuleId, p: CommissionParams): ParamsProblem | null {
  const defs = defOf(id).params;
  for (const k of Object.keys(p) as ParamKey[]) if (p[k] !== undefined && !defs.some((d) => d.key === k)) return 'param_unknown';
  for (const d of defs) {
    const v = p[d.key];
    if (v === undefined || v === null || !Number.isFinite(v)) return 'param_missing';
    if (v < d.min || v > d.max) return 'param_range';
  }
  return null;
}
export const normaliseParams = (id: CommissionRuleId, p: CommissionParams): CommissionParams => {
  const out: CommissionParams = {};
  for (const d of defOf(id).params) if (p[d.key] !== undefined) out[d.key] = Math.round(Number(p[d.key]) * 100) / 100;
  return out;
};
export const sameParams = (a: CommissionParams, b: CommissionParams): boolean => (Object.keys({ ...a, ...b }) as ParamKey[]).every((k) => (a[k] ?? null) === (b[k] ?? null));

/** How much a change moves the rule, as the largest relative change of any one number (a number going from nothing is a full change). */
export function changeSize(before: CommissionParams, after: CommissionParams): number {
  let max = 0;
  for (const k of Object.keys({ ...before, ...after }) as ParamKey[]) {
    const a = before[k] ?? 0;
    const b = after[k] ?? 0;
    if (a === b) continue;
    max = Math.max(max, a === 0 ? 1 : Math.abs(b - a) / Math.abs(a));
  }
  return max;
}

/* ------------------------------------------------------------------ amounts */

export interface AmountContext {
  /** The deal's value in rupees, for a share-of-deal rule. */
  dealValue?: number;
  /** What the person's tier adds to a tier-aware rule, in percentage points (148). */
  tierPlusPct?: number;
}

/** What a rule pays one person for one event. For the installation pool this is the whole pool (it is then shared out by `crewShares`). */
export function amountOf(id: CommissionRuleId, p: CommissionParams, ctx: AmountContext = {}): number {
  const value = ctx.dealValue ?? 0;
  switch (id) {
    case 'conversion': {
      const pct = (p.pct ?? 0) + (ctx.tierPlusPct ?? 0);
      return Math.max(p.floor ?? 0, Math.round((value * pct) / 100));
    }
    case 'sales_close':
    case 'install_pool':
      return Math.round((value * (p.pct ?? 0)) / 100);
    default:
      return Math.round(p.amount ?? 0);
  }
}

/** The pay rate of a conversion share once the tier is added, as a number to show. */
export const conversionPctOf = (p: CommissionParams, tierPlusPct = 0): number => Math.round(((p.pct ?? 0) + tierPlusPct) * 100) / 100;

export const crewRatesOf = (p: CommissionParams): { leadBonusShare: number; minCrewShare: number } => ({
  leadBonusShare: (p.leadBonusPct ?? DEFAULT_CREW_RATES.leadBonusShare * 100) / 100,
  minCrewShare: (p.minCrewPct ?? DEFAULT_CREW_RATES.minCrewShare * 100) / 100,
});

/* ------------------------------------------------------------------ stacking */

export interface StackGroup {
  id: 'closing_credit' | 'lead_source' | 'job_role';
  /** In order of precedence: when more than one applies, the first one is paid and the rest are not. */
  rules: CommissionRuleId[];
  /** `person`: one person never receives more than one of these for the same deal or job. `event`: only one of these is paid for the same lead. */
  per: 'person' | 'event';
}

/**
 * Which rules may apply to the same event. Everything not named in a group stacks: a surveyor's capture bonus, their conversion share, and a
 * technician's installation share are different people or different events, so they are all paid. The groups below are the cases where two
 * rules would otherwise pay the same thing twice.
 */
export const STACK_GROUPS: StackGroup[] = [
  { id: 'closing_credit', rules: ['conversion', 'sales_close'], per: 'person' },
  { id: 'lead_source', rules: ['referral_bonus', 'lead_qualified'], per: 'event' },
  { id: 'job_role', rules: ['install_pool', 'qc_fee'], per: 'person' },
];

export interface Candidate {
  ruleId: CommissionRuleId;
  partyId: string;
}
export interface Dropped extends Candidate {
  because: CommissionRuleId;
  group: StackGroup['id'];
}
/** Applies the groups above to what would be paid: returns what stays and what was set aside (and in favour of which rule). */
export function resolveStacking(candidates: Candidate[]): { kept: Candidate[]; dropped: Dropped[] } {
  const dropped: Dropped[] = [];
  let kept = [...candidates];
  for (const g of STACK_GROUPS) {
    const inGroup = kept.filter((c) => g.rules.includes(c.ruleId));
    const scopes = g.per === 'person' ? [...new Set(inGroup.map((c) => c.partyId))] : ['*'];
    for (const scope of scopes) {
      const here = inGroup.filter((c) => g.per === 'event' || c.partyId === scope);
      if (new Set(here.map((c) => c.ruleId)).size < 2) continue;
      const winner = g.rules.find((r) => here.some((c) => c.ruleId === r)) as CommissionRuleId;
      for (const c of here) if (c.ruleId !== winner) dropped.push({ ...c, because: winner, group: g.id });
      kept = kept.filter((c) => !here.includes(c) || c.ruleId === winner);
    }
  }
  return { kept, dropped };
}

/* ------------------------------------------------------------------ simulation */

export type SimStage = 'capture' | 'deal_won' | 'handover';
export interface SimCrewMember {
  id: string;
  isLead: boolean;
  minutes: number;
}
export interface SimInput {
  dealValue: number;
  /** A lead the surveyor captured in the field, or one that came as a referral. */
  source: 'field' | 'referral';
  surveyorTier: string;
  /** A second surveyor who took the lead over and closed it (their tier counts only for conversion, which they do not earn). */
  closer: boolean;
  /** The same person captured the lead and closed it (so the closing credit stacks onto the same person). */
  closerIsOriginal: boolean;
  crew: SimCrewMember[];
  inspectors: number;
}

export interface SimLine {
  stage: SimStage;
  ruleId: CommissionRuleId;
  partyId: string;
  /** What the person is, for the screen to label: surveyor, closer, referrer, lead technician, technician, inspector. */
  party: 'surveyor' | 'closer' | 'referrer' | 'technician_lead' | 'technician' | 'inspector';
  amount: number;
  /** Which version of the rule paid it. */
  version: number;
}
export interface SimResult {
  lines: SimLine[];
  dropped: (Dropped & { stage: SimStage })[];
  total: number;
  byStage: Record<SimStage, number>;
  /** Everything paid as a part of the deal's value, in percent. */
  burdenPct: number;
  /** The largest amount one person receives. */
  topParty: { partyId: string; amount: number } | null;
  /** Whether the conversion floor, not the percentage, set the surveyor's share. */
  floorApplied: boolean;
}

export interface Rates {
  paramsOf: (id: CommissionRuleId) => CommissionParams;
  versionOf: (id: CommissionRuleId) => number;
  /** Percentage points a surveyor tier adds to a tier-aware rule (148). */
  tierPlusOf: (tier: string) => number;
}

const SURVEYOR = 'surveyor';
const CLOSER = 'closer';
const REFERRER = 'referrer';

/** What a hypothetical deal would pay out to each party under the rates given. Uses the same share rules as a real handover (`crewShares`, `qcShares`). */
export function simulate(input: SimInput, rates: Rates): SimResult {
  const lines: SimLine[] = [];
  const dropped: SimResult['dropped'] = [];
  const stageCandidates: Record<SimStage, (Candidate & { party: SimLine['party']; amount: number })[]> = { capture: [], deal_won: [], handover: [] };
  const add = (stage: SimStage, c: Candidate, party: SimLine['party'], amount: number) => stageCandidates[stage].push({ ...c, party, amount });
  const conv = rates.paramsOf('conversion');
  const plus = rates.tierPlusOf(input.surveyorTier);
  let floorApplied = false;

  add('capture', { ruleId: 'site_visit', partyId: SURVEYOR }, 'surveyor', amountOf('site_visit', rates.paramsOf('site_visit')));
  if (input.source === 'referral') add('capture', { ruleId: 'referral_bonus', partyId: REFERRER }, 'referrer', amountOf('referral_bonus', rates.paramsOf('referral_bonus')));
  add('capture', { ruleId: 'lead_qualified', partyId: SURVEYOR }, 'surveyor', amountOf('lead_qualified', rates.paramsOf('lead_qualified')));

  const share = Math.round((input.dealValue * ((conv.pct ?? 0) + plus)) / 100);
  floorApplied = (conv.floor ?? 0) > share;
  add('deal_won', { ruleId: 'conversion', partyId: SURVEYOR }, 'surveyor', amountOf('conversion', conv, { dealValue: input.dealValue, tierPlusPct: plus }));

  if (input.closer) {
    const who = input.closerIsOriginal ? SURVEYOR : CLOSER;
    add('handover', { ruleId: 'sales_close', partyId: who }, input.closerIsOriginal ? 'surveyor' : 'closer', amountOf('sales_close', rates.paramsOf('sales_close'), { dealValue: input.dealValue }));
  }
  const ip = rates.paramsOf('install_pool');
  const pool = amountOf('install_pool', ip, { dealValue: input.dealValue });
  const crew = crewShares(pool, input.crew.map((c) => ({ userId: c.id, name: c.id, isLead: c.isLead, minutes: c.minutes, steps: 0 })), crewRatesOf(ip));
  for (const l of crew.lines) add('handover', { ruleId: 'install_pool', partyId: l.userId }, input.crew.find((c) => c.id === l.userId)?.isLead ? 'technician_lead' : 'technician', l.amount);
  if (input.inspectors > 0) {
    const fee = amountOf('qc_fee', rates.paramsOf('qc_fee'));
    const ids = Array.from({ length: input.inspectors }, (_, i) => `qc-${i + 1}`);
    for (const q of qcShares(fee, ids.map((id) => ({ userId: id, name: id, results: 1 })))) add('handover', { ruleId: 'qc_fee', partyId: q.userId }, 'inspector', q.amount);
  }

  for (const stage of ['capture', 'deal_won', 'handover'] as SimStage[]) {
    const { kept, dropped: gone } = resolveStacking(stageCandidates[stage]);
    for (const d of gone) dropped.push({ ...d, stage });
    for (const k of kept) {
      const c = stageCandidates[stage].find((x) => x.ruleId === k.ruleId && x.partyId === k.partyId) as (typeof stageCandidates)[SimStage][number];
      lines.push({ stage, ruleId: k.ruleId, partyId: k.partyId, party: c.party, amount: c.amount, version: rates.versionOf(k.ruleId) });
    }
  }
  // The closing credit and the conversion share can land on one person across two stages: that is the same-person case `closing_credit` governs.
  const conversionPeople = new Set(lines.filter((l) => l.ruleId === 'conversion').map((l) => l.partyId));
  for (const l of [...lines]) {
    if (l.ruleId === 'sales_close' && conversionPeople.has(l.partyId)) {
      lines.splice(lines.indexOf(l), 1);
      dropped.push({ ruleId: 'sales_close', partyId: l.partyId, because: 'conversion', group: 'closing_credit', stage: l.stage });
    }
  }
  const byStage: Record<SimStage, number> = { capture: 0, deal_won: 0, handover: 0 };
  for (const l of lines) byStage[l.stage] += l.amount;
  const total = byStage.capture + byStage.deal_won + byStage.handover;
  const perParty = new Map<string, number>();
  for (const l of lines) perParty.set(l.partyId, (perParty.get(l.partyId) ?? 0) + l.amount);
  const top = [...perParty.entries()].sort((a, b) => b[1] - a[1])[0];
  return {
    lines,
    dropped,
    total,
    byStage,
    burdenPct: input.dealValue > 0 ? Math.round((total / input.dealValue) * 10000) / 100 : 0,
    topParty: top ? { partyId: top[0], amount: top[1] } : null,
    floorApplied,
  };
}

/** The deals a change is tried on before it is published: a typical one, a small one, a very large one, a reassigned lead, a referral. */
export interface Scenario {
  id: 'typical' | 'small' | 'large' | 'reassigned' | 'referral' | 'one_person';
  input: SimInput;
}
const crewOf = (n: number, minutes: number): SimCrewMember[] => Array.from({ length: n }, (_, i) => ({ id: `tech-${i + 1}`, isLead: i === 0, minutes }));
export const scenariosFor = (tier: string): Scenario[] => [
  { id: 'typical', input: { dealValue: 2_500_000, source: 'field', surveyorTier: tier, closer: false, closerIsOriginal: false, crew: crewOf(3, 480), inspectors: 1 } },
  { id: 'small', input: { dealValue: 300_000, source: 'field', surveyorTier: tier, closer: false, closerIsOriginal: false, crew: crewOf(2, 240), inspectors: 1 } },
  { id: 'large', input: { dealValue: 12_000_000, source: 'field', surveyorTier: tier, closer: false, closerIsOriginal: false, crew: crewOf(5, 960), inspectors: 2 } },
  { id: 'reassigned', input: { dealValue: 2_500_000, source: 'field', surveyorTier: tier, closer: true, closerIsOriginal: false, crew: crewOf(3, 480), inspectors: 1 } },
  { id: 'referral', input: { dealValue: 2_500_000, source: 'referral', surveyorTier: tier, closer: false, closerIsOriginal: false, crew: crewOf(3, 480), inspectors: 1 } },
  { id: 'one_person', input: { dealValue: 2_500_000, source: 'field', surveyorTier: tier, closer: true, closerIsOriginal: true, crew: crewOf(1, 600), inspectors: 1 } },
];

/* ------------------------------------------------------------------ checks before a change goes live */

/** Everything paid on a deal above this share of its value is flagged (placeholder business decision). */
export const BURDEN_WARN_PCT = 5;
/** One person receiving more than this share of everything paid on a deal is flagged (placeholder). */
export const TOP_PARTY_WARN_SHARE = 0.7;
/** A change this large (relative) is significant enough that partners should hear first (placeholder). */
export const SIGNIFICANT_CHANGE = 0.1;
/** Partners should be told this many days ahead of a significant change (placeholder). */
export const NOTICE_DAYS = 7;
export const REASON_MIN = 20;
export const NOTICE_MAX = 300;

export type CheckKind = 'burden_high' | 'floor_pays_more' | 'one_party_dominates' | 'stack_collision' | 'notice_short';
export interface Check {
  kind: CheckKind;
  /** The scenarios it shows up in; the numbers are those of the worst one. */
  scenarios: Scenario['id'][];
  /** Numbers for the sentence, never prose. */
  facts: Record<string, number | string>;
}

/** What a result shows that its owner should look at: the check the simulation exists for. */
export function resultChecks(scenario: Scenario['id'], r: SimResult): Check[] {
  const out: Check[] = [];
  if (r.burdenPct > BURDEN_WARN_PCT) out.push({ kind: 'burden_high', scenarios: [scenario], facts: { pct: r.burdenPct, limit: BURDEN_WARN_PCT } });
  if (r.floorApplied) out.push({ kind: 'floor_pays_more', scenarios: [scenario], facts: { total: r.total } });
  if (r.topParty && r.total > 0 && r.lines.length > 2 && r.topParty.amount / r.total > TOP_PARTY_WARN_SHARE) out.push({ kind: 'one_party_dominates', scenarios: [scenario], facts: { share: Math.round((r.topParty.amount / r.total) * 100) } });
  if (r.dropped.length > 0 && scenario === 'one_person') out.push({ kind: 'stack_collision', scenarios: [scenario], facts: { count: r.dropped.length } });
  return out;
}

/** One check per kind: the scenarios it shows up in, with the numbers of the worst one. */
export function mergeChecks(all: Check[]): Check[] {
  const by = new Map<CheckKind, Check>();
  for (const c of all) {
    const cur = by.get(c.kind);
    if (!cur) by.set(c.kind, { ...c, scenarios: [...c.scenarios] });
    else {
      cur.scenarios.push(...c.scenarios);
      const worse = typeof c.facts.pct === 'number' && typeof cur.facts.pct === 'number' ? c.facts.pct > cur.facts.pct : false;
      if (worse) cur.facts = c.facts;
    }
  }
  return [...by.values()];
}

/** A check that already held before the change is not news; only what the change brings in needs Admin's eye. */
export function newChecks(after: Check[], before: Check[]): Check[] {
  const had = (kind: CheckKind, sc: Scenario['id']) => before.some((b) => b.kind === kind && b.scenarios.includes(sc));
  return mergeChecks(after.flatMap((c) => (c.scenarios.filter((sc) => !had(c.kind, sc)).length > 0 ? [{ ...c, scenarios: c.scenarios.filter((sc) => !had(c.kind, sc)) }] : [])));
}
