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
import { captureErrorCode, captureResultOf } from './leadMapping';
import type { CaptureRpc } from './leadMapping';
import { customerViewOf, errorCode, feeFromRow, quoteFromRow } from './quoteMapping';
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
  return {
    ...base,

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
        const card = await base.prepareDecisionPacket(userId, { kind: 'fee_change', title: `Fee below your floor for ${input.leadId}`, summary: `A quote would carry a fee of ${pv.totals.effectivePct}% on partner cost, which is in the "${pv.band}" band and needs the Owner.`, amountInr: pv.totals.feeInr, impact: [`Fee ₹${pv.totals.feeInr}`, `Margin after costs ₹${pv.waterfall.marginInr}`] });
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
}
