/**
 * The repository with the parts that have moved onto the server (S1: who may sign in, and Admin's decision on people
 * waiting for a role). Everything else is still the in-memory repository underneath; each later slice moves another
 * module here, one method at a time, coded against the same `Repository` interface the screens use.
 */
import { RepositoryError } from '@/data/repository';
import type { Repository } from '@/data/repository';
import type { Role, SignInRequest } from '@/data/types';
import { supabase } from './client';
import { DEFAULT_COST_RATES, alternatives, computeQuote, mayOffer, maxBundleDiscountInr, quoteProblems, settingsProblem, waterfall } from '@/features/quotes/facilitatorQuote';
import type { QuotePreview } from '@/features/quotes/types';
import { cardFromRow, chainFrom, decisionErrorCode, recordFromRow, statusRowFromRow } from './decisionMapping';
import type { CardRow, RecordRow, StatusRow } from './decisionMapping';
import { captureErrorCode, captureResultOf } from './leadMapping';
import type { CaptureRpc } from './leadMapping';
import { customerViewOf, errorCode, feeFromRow, quoteFromRow } from './quoteMapping';
import { workOrderErrorCode, workOrderFromRows } from './workOrderMapping';
import type { MilestoneRow, WorkOrderRow } from './workOrderMapping';
import type { PartnerAccount } from '@/features/workorders/types';
import type { AcceptanceRow, FeeRow, QuoteRow } from './quoteMapping';

interface PendingRow {
  id: string;
  phone: string;
  name: string;
  requested_role: Role | null;
  created_at: string;
}

async function latestFee() {
  const { data, error } = await supabase().from('fee_settings_versions').select('*').order('version', { ascending: false }).limit(1).returns<FeeRow[]>();
  if (error || !data?.[0]) throw new RepositoryError('network');
  return feeFromRow(data[0]);
}

export function withServer(base: Repository): Repository {
  const previewFor = async (userId: string, lines: Parameters<Repository['previewFacilitatorQuote']>[1]['lines'], bundleDiscountInr?: number): Promise<QuotePreview> => {
    const [fee, who] = await Promise.all([latestFee(), supabase().from('profiles').select('role').eq('id', userId).maybeSingle<{ role: string }>()]);
    if (who.error || !who.data || (who.data.role !== 'owner' && who.data.role !== 'admin')) throw new RepositoryError('forbidden');
    const input = { lines, settings: fee.settings, ...(bundleDiscountInr != null ? { bundleDiscountInr } : {}) };
    const totals = computeQuote(input);
    const actor = who.data.role === 'owner' ? 'owner' : 'sales';
    return {
      totals, problems: quoteProblems(input), band: totals.band, actor, allowed: mayOffer(totals.band, actor),
      maxDiscountInr: maxBundleDiscountInr(lines, fee.settings, actor), waterfall: waterfall(totals.feeInr, totals.gstOnFeeInr, fee.costRates ?? DEFAULT_COST_RATES),
      alternatives: alternatives(totals.baseInr, fee.settings), feeVersion: fee.version,
    };
  };
  const acceptances = async (ids: string[]) => {
    if (ids.length === 0) return [] as AcceptanceRow[];
    const { data, error } = await supabase().from('quote_acceptances').select('quote_id, line_id, accepted_at').in('quote_id', ids).returns<AcceptanceRow[]>();
    if (error) throw new RepositoryError('network');
    return data ?? [];
  };
  const loadQuotes = async () => {
    const { data, error } = await supabase().from('facilitator_quotes').select('*').order('created_at', { ascending: false }).returns<QuoteRow[]>();
    if (error) throw new RepositoryError('network');
    const rows = data ?? [];
    const acc = await acceptances(rows.map((r) => r.id));
    return rows.map((r) => quoteFromRow(r, acc));
  };
  // ---- 208 work orders: reads go through row-level security, every change through a database function that checks who is asking ----
  const roleOf = async (userId: string) => (await supabase().from('profiles').select('role').eq('id', userId).maybeSingle<{ role: string }>()).data?.role;
  const loadOrders = async (userId: string, ids?: string[]) => {
    if (ids && ids.length === 0) return [];
    const base = supabase().from('work_orders').select('*').order('created_at', { ascending: false });
    const { data, error } = await (ids ? base.in('id', ids) : base).returns<WorkOrderRow[]>();
    if (error) throw new RepositoryError(workOrderErrorCode(error.message));
    const rows = data ?? [];
    if (rows.length === 0) return [];
    const ms = await supabase().from('work_order_milestones').select('*').in('work_order_id', rows.map((r) => r.id)).order('position').returns<MilestoneRow[]>();
    if (ms.error) throw new RepositoryError(workOrderErrorCode(ms.error.message));
    const role = await roleOf(userId);
    return rows.map((r) => workOrderFromRows(r, ms.data ?? [], { id: userId, role }));
  };
  const actOnOrder = async (userId: string, fn: string, args: Record<string, unknown>, id: string) => {
    const { error } = await supabase().rpc(fn, args);
    if (error) throw new RepositoryError(workOrderErrorCode(error.message));
    const [view] = await loadOrders(userId, [id]);
    if (!view) throw new RepositoryError('not_found');
    return view;
  };
  const repo: Repository = {
    ...base,

    // ---- 201 Decision Desk: the database decides who may decide and chains every record ----
    listDecisionCards: async (userId, filter) => {
      const who = await supabase().from('profiles').select('role').eq('id', userId).maybeSingle<{ role: string }>();
      const isOwner = who.data?.role === 'owner';
      const isAdmin = who.data?.role === 'admin';
      const open = (q: any) => (filter?.status === 'open' ? q.in('status', ['pending', 'info_requested']) : filter?.status ? q.eq('status', filter.status) : q);
      const kind = (q: any) => (filter?.kind ? q.eq('kind', filter.kind) : q);
      if (isAdmin) {
        const { data, error } = await kind(open(supabase().from('decision_cards_status').select('*'))).order('created_at', { ascending: false }).returns();
        if (error) throw new RepositoryError(decisionErrorCode(error.message));
        return { level: 'status' as const, cards: [], statusRows: ((data ?? []) as StatusRow[]).map(statusRowFromRow) };
      }
      const { data, error } = await kind(open(supabase().from('decision_cards').select('*'))).order('created_at', { ascending: false }).returns();
      if (error) throw new RepositoryError(decisionErrorCode(error.message));
      void isOwner; // row-level security already limits a delegate to the cards handed to them
      return { level: 'detail' as const, cards: ((data ?? []) as CardRow[]).map(cardFromRow), statusRows: [] };
    },
    getDecisionCard: async (userId, cardId) => {
      const who = await supabase().from('profiles').select('role').eq('id', userId).maybeSingle<{ role: string }>();
      if (who.data?.role === 'admin') {
        const { data, error } = await supabase().from('decision_cards_status').select('*').eq('id', cardId).maybeSingle<StatusRow>();
        if (error || !data) throw new RepositoryError(error ? decisionErrorCode(error.message) : 'not_found');
        return { level: 'status' as const, card: statusRowFromRow(data) };
      }
      const [card, recs] = await Promise.all([
        supabase().from('decision_cards').select('*').eq('id', cardId).maybeSingle<CardRow>(),
        supabase().from('decision_records').select('*').eq('card_id', cardId).order('seq').returns<RecordRow[]>(),
      ]);
      if (card.error || !card.data) throw new RepositoryError(card.error ? decisionErrorCode(card.error.message) : 'not_found');
      return { level: 'detail' as const, card: cardFromRow(card.data), records: (recs.data ?? []).map(recordFromRow) };
    },
    prepareDecisionPacket: async (_userId, input) => {
      const { data, error } = await supabase().rpc('prepare_decision', {
        p_kind: input.kind, p_title: input.title, p_summary: input.summary, p_amount_inr: input.amountInr ?? null, p_place: input.place ?? null,
        p_evidence: input.evidence ?? [], p_impact: input.impact ?? [], p_recommendation: input.recommendation ?? null,
      });
      if (error || !data) throw new RepositoryError(decisionErrorCode(error?.message ?? ''));
      const card = await supabase().from('decision_cards').select('*').eq('id', (data as { id: string }).id).maybeSingle<CardRow>();
      if (card.data) return cardFromRow(card.data);
      // Admin cannot read the full card back: the packet it prepared is returned from what it just sent.
      return { id: (data as { id: string }).id, code: (data as { code: string }).code, kind: input.kind, title: input.title, summary: input.summary, status: 'pending', proposedBy: { role: 'admin', name: '' }, createdAt: new Date().toISOString(), evidence: input.evidence ?? [], impact: input.impact ?? [], isDemo: false, ...(input.amountInr != null ? { amountInr: input.amountInr } : {}) };
    },
    decideDecisionCard: async (_userId, input) => {
      const { data, error } = await supabase().rpc('decide_decision', { p_card: input.cardId, p_action: input.action, p_reason: input.reason, p_edits: input.edits ?? null, p_delegate_to: input.delegateTo ?? null });
      if (error || !data) throw new RepositoryError(decisionErrorCode(error?.message ?? ''));
      const [card, rec] = await Promise.all([
        supabase().from('decision_cards').select('*').eq('id', input.cardId).maybeSingle<CardRow>(),
        supabase().from('decision_records').select('*').eq('card_id', input.cardId).order('seq', { ascending: false }).limit(1).returns<RecordRow[]>(),
      ]);
      if (!card.data || !rec.data?.[0]) throw new RepositoryError('network');
      return { card: cardFromRow(card.data), record: recordFromRow(rec.data[0]) };
    },
    verifyDecisionChain: async () => {
      const { data, error } = await supabase().rpc('verify_decision_chain');
      if (error) throw new RepositoryError(decisionErrorCode(error.message));
      const head = await supabase().from('decision_records').select('hash').order('seq', { ascending: false }).limit(1).returns<{ hash: string }[]>();
      return chainFrom((data ?? []) as { ok: boolean; checked: number; broken_at: number | null }[], head.data?.[0]?.hash ?? '');
    },

    // ---- 205 lead capture: the database decides who owns the site ----
    submitLeadCapture: async (_userId, input) => {
      const d = input.draft;
      const { data, error } = await supabase().rpc('submit_lead_capture', {
        p_client_event_id: input.clientEventId, p_site_name: d.siteName, p_contact_name: d.contactName, p_contact_phone: d.contactPhone, p_builder_name: d.builderName,
        p_address: d.address, p_city: d.city, p_pincode: d.pincode, p_lat: d.location.lat, p_lng: d.location.lng, p_accuracy_m: input.accuracyM ?? null,
        p_captured_at: input.capturedAt ?? null, p_device_sent_at: input.deviceSentAt ?? null,
      });
      if (error || !data) throw new RepositoryError(captureErrorCode(error?.message ?? ''));
      return captureResultOf(data as CaptureRpc, input, new Date().toISOString());
    },

    // ---- 206/207 facilitator quote: the database prices, owns the fee history and records acceptance ----
    getFeeSettings: async () => {
      const { data, error } = await supabase().from('fee_settings_versions').select('*').order('version', { ascending: false }).returns<FeeRow[]>();
      if (error) throw new RepositoryError(errorCode(error.message));
      const all = (data ?? []).map(feeFromRow);
      if (all.length === 0) throw new RepositoryError('forbidden');
      return { current: all[0], history: all };
    },
    saveFeeSettings: async (_userId, settings, costRates, reason) => {
      const bad = settingsProblem(settings);
      if (bad) throw new RepositoryError(bad);
      if (reason.trim().length < 10) throw new RepositoryError('reason_short');
      const { data, error } = await supabase().from('fee_settings_versions').insert({ version: 0, settings, cost_rates: costRates ?? DEFAULT_COST_RATES, set_by_name: '', reason: reason.trim() }).select('*').single<FeeRow>();
      if (error || !data) throw new RepositoryError(errorCode(error?.message ?? ''));
      return feeFromRow(data);
    },
    previewFacilitatorQuote: (userId, input) => previewFor(userId, input.lines, input.bundleDiscountInr),
    saveFacilitatorQuote: async (userId, input) => {
      const pv = await previewFor(userId, input.lines, input.bundleDiscountInr);
      if (pv.problems.length) throw new RepositoryError(pv.problems[0]);
      if (!pv.allowed) {
        const card = await repo.prepareDecisionPacket(userId, { kind: 'fee_change', title: `Fee below your floor for ${input.leadId}`, summary: `A quote would carry a fee of ${pv.totals.effectivePct}% on partner cost, which is in the "${pv.band}" band and needs the Owner.`, amountInr: pv.totals.feeInr, impact: [`Fee ₹${pv.totals.feeInr}`, `Margin after costs ₹${pv.waterfall.marginInr}`] });
        return { status: 'needs_owner', cardId: card.id, preview: pv };
      }
      const lead = (await base.listLeads()).find((l) => l.id === input.leadId);
      const existing = await supabase().from('facilitator_quotes').select('*').eq('client_event_id', input.clientEventId).maybeSingle<QuoteRow>();
      if (existing.data) return { status: 'saved', quote: quoteFromRow(existing.data) };
      // The database recomputes the fee, the totals, the code and who made it: only the lines and the discount are ours to send.
      const { data, error } = await supabase().from('facilitator_quotes').insert({
        code: 'pending', lead_ref: input.leadId, lead_id: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.leadId) ? input.leadId : null, site_name: lead?.siteName ?? input.leadId, components: input.lines, bundle_discount_inr: input.bundleDiscountInr ?? 0,
        totals: {}, client_event_id: input.clientEventId,
      }).select('*').single<QuoteRow>();
      if (error || !data) throw new RepositoryError(errorCode(error?.message ?? ''));
      return { status: 'saved', quote: quoteFromRow(data) };
    },
    listFacilitatorQuotes: () => loadQuotes(),
    sendFacilitatorQuote: async (_userId, quoteId) => {
      const { data, error } = await supabase().from('facilitator_quotes').update({ status: 'sent' }).eq('id', quoteId).select('*').single<QuoteRow>();
      if (error || !data) throw new RepositoryError(errorCode(error?.message ?? ''));
      return quoteFromRow(data);
    },
    getMyQuote: async () => {
      const all = await loadQuotes(); // row-level security returns only this customer's sent quotes
      const q = all.find((x) => x.status !== 'draft');
      return q ? customerViewOf(q) : null;
    },
    acceptQuoteComponents: async (_userId, quoteId, lineIds) => {
      for (const id of lineIds) {
        const { error } = await supabase().from('quote_acceptances').insert({ quote_id: quoteId, line_id: id, customer_id: quoteId });
        if (error && !/duplicate key/.test(error.message)) throw new RepositoryError(errorCode(error.message));
      }
      const q = (await loadQuotes()).find((x) => x.id === quoteId);
      if (!q) throw new RepositoryError('not_found');
      return customerViewOf(q);
    },

    // ---- 208 work orders: the database issues, splits, gates and records ----
    listWorkOrders: (userId) => loadOrders(userId),
    listPartnerAccounts: async (userId) => {
      const role = await roleOf(userId);
      if (role !== 'owner' && role !== 'admin') throw new RepositoryError('forbidden');
      const { data, error } = await supabase().from('profiles').select('id, name, role').eq('status', 'active').in('role', ['technician', 'supplier']).order('name').returns<PartnerAccount[]>();
      if (error) throw new RepositoryError(workOrderErrorCode(error.message));
      return data ?? [];
    },
    createWorkOrdersFromQuote: async (userId, quoteId, partners) => {
      const { data, error } = await supabase().rpc('create_work_orders', { p_quote: quoteId, p_partners: partners });
      if (error) throw new RepositoryError(workOrderErrorCode(error.message));
      return loadOrders(userId, (data as string[] | null) ?? []);
    },
    acceptWorkOrder: (userId, id) => actOnOrder(userId, 'accept_work_order', { p_wo: id }, id),
    startWorkOrder: (userId, id) => actOnOrder(userId, 'start_work_order', { p_wo: id }, id),
    submitMilestoneEvidence: (userId, id, milestoneId, names) => actOnOrder(userId, 'submit_milestone_evidence', { p_wo: id, p_ms: milestoneId, p_evidence: names }, id),
    verifyMilestone: (userId, id, milestoneId) => actOnOrder(userId, 'verify_milestone', { p_wo: id, p_ms: milestoneId }, id),
    recordMilestonePayment: (userId, id, milestoneId, reference) => actOnOrder(userId, 'record_milestone_payment', { p_wo: id, p_ms: milestoneId, p_reference: reference }, id),

    // Row-level security returns these only to a signed-in, active Admin (of the same world, real or demo).
    listSignInRequests: async () => {
      const { data, error } = await supabase()
        .from('profiles')
        .select('id, phone, name, requested_role, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .returns<PendingRow[]>();
      if (error) throw new RepositoryError('network');
      return (data ?? []).map<SignInRequest>((r) => ({
        id: r.id,
        phone: r.phone,
        name: r.name,
        requestedRole: r.requested_role,
        waitingSince: r.created_at,
      }));
    },

    decideSignInRequest: async (requestId, input) => {
      if (input.approve && !input.role) throw new RepositoryError('role_required');
      const note = input.note?.trim() || null;
      const patch = input.approve
        ? { role: input.role, status: 'active', decision_note: note }
        : { status: 'rejected', decision_note: note };
      // Only while it is still waiting: if another Admin answered first, nothing changes and we say so.
      const { data, error } = await supabase().from('profiles').update(patch).eq('id', requestId).eq('status', 'pending').select('id');
      if (error) throw new RepositoryError(/last_admin|forbidden_field/.exec(error.message)?.[0] ?? 'network');
      if (!data || data.length === 0) throw new RepositoryError('not_pending');
    },
  };
  return repo;
}
