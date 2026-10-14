import type { Lead } from '@/data/types';
import type { LeadCaptureInput, LeadCaptureResult } from '@/data/repository';

/** What public.submit_lead_capture returns (supabase/migrations/20261014000002_leads.sql). */
export interface CaptureRpc { outcome: 'claims' | 'supporting' | 'review'; leadId: string; ownerLeadId: string | null; reason?: string | null; duplicate: boolean }

/**
 * The screens expect a whole Lead. The server returns ids; the lead shown back is built from what the scout sent, with the
 * server's id. For a supporting capture it carries the OWNER lead's id only: a scout never learns another scout's lead.
 */
export function captureResultOf(rpc: CaptureRpc, input: LeadCaptureInput, nowIso: string): LeadCaptureResult {
  const lead: Lead = {
    ...input.draft, id: rpc.leadId, code: '', originalSurveyorId: input.draft.surveyorId, createdAt: nowIso, updatedAt: nowIso, stageEnteredAt: nowIso, isDemo: false,
  };
  if (rpc.outcome === 'supporting') return { outcome: 'supporting', lead, ownerLeadId: rpc.ownerLeadId ?? rpc.leadId, duplicate: rpc.duplicate };
  if (rpc.outcome === 'review') return { outcome: 'review', lead, ownerLeadId: rpc.ownerLeadId ?? '', decisionCardId: '', duplicate: rpc.duplicate };
  return { outcome: 'claimed', lead, duplicate: rpc.duplicate };
}

export const captureErrorCode = (message: string): string => /forbidden|client_event_id_required|site_name_required|location_invalid/.exec(message)?.[0] ?? 'network';
