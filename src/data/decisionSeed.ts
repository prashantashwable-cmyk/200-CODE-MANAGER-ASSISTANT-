import type { DecisionCard } from '@/features/decisions/decisions';
import { daysAgo, hoursAgo } from './seed';

/** Demo decision cards (is_demo). They load into the repository like every other demo record: no screen holds data. */
export const seedDecisionCards: DecisionCard[] = [
  {
    id: 'dc-1', code: 'AIEC-DC-0001', kind: 'tier_change', status: 'pending',
    title: 'Raise Ganesh Pawar to Senior Scout',
    summary: 'Twelve valid leads in 60 days, three converted, no open integrity flags. Certification passed on 4 October.',
    proposedBy: { role: 'system', name: 'Tier rules' }, createdAt: hoursAgo(5), isDemo: true,
    place: { lat: 18.5913, lng: 73.7389, label: 'Hinjawadi Phase 1' },
    evidence: [{ label: 'Lead validity report, last 60 days', kind: 'log' }, { label: 'Certification: scout level 2', kind: 'document' }],
    impact: ['Commission step rises from level 1 to level 2 for new leads only', 'Offers and contracted prices already agreed do not change'],
    ai: { action: 'approve', confidence: 0.86, model: 'tier-rules-v1' },
  },
  {
    id: 'dc-2', code: 'AIEC-DC-0002', kind: 'payout_release', status: 'pending',
    title: 'Release weekly payout to Anil Deshmukh',
    summary: 'Installation milestone 2 passed independent QC on 9 October. Customer confirmed. One photo had low GPS accuracy and was re-taken on site.',
    proposedBy: { role: 'admin', name: 'Control Tower Admin' }, createdAt: hoursAgo(20), amountInr: 42_000, isDemo: true,
    place: { lat: 18.5362, lng: 73.8940, label: 'Koregaon Park, Pune' },
    evidence: [{ label: 'QC verification report', kind: 'document' }, { label: 'Handover photos (6)', kind: 'photo' }, { label: 'Site location', kind: 'map' }],
    impact: ['Moves INR 42,000 to Anil’s payable list for Friday’s run', 'Closes milestone 2 and opens milestone 3'],
    ai: { action: 'approve', confidence: 0.74, model: 'milestone-gate-v1' },
  },
  {
    id: 'dc-3', code: 'AIEC-DC-0003', kind: 'lead_ownership_dispute', status: 'pending',
    title: 'Two scouts claim the Baner Road site',
    summary: 'Both captured the same shaft within 40 minutes and 90 metres. The earlier capture has better GPS accuracy; the later one has a clearer contact photo.',
    proposedBy: { role: 'system', name: 'Duplicate detection' }, createdAt: daysAgo(1), isDemo: true,
    place: { lat: 18.5590, lng: 73.7868, label: 'Baner Road' },
    evidence: [{ label: 'First capture, accuracy 6 m', kind: 'photo' }, { label: 'Second capture, accuracy 14 m', kind: 'photo' }],
    impact: ['The winner earns the lead commission', 'The other capture is kept as supporting evidence'],
    ai: { action: 'approve', confidence: 0.58, model: 'ownership-v1' },
  },
  {
    id: 'dc-4', code: 'AIEC-DC-0004', kind: 'access_suspension', status: 'info_requested',
    title: 'Safety hold: missing PPE photos on Wakad install',
    summary: 'Two required PPE photos were missing from the day-3 evidence set. A safety hold on new offers was applied automatically; Owner review is due within 24 hours.',
    proposedBy: { role: 'system', name: 'Safety tripwire' }, createdAt: daysAgo(2), isDemo: true,
    place: { lat: 18.5987, lng: 73.7602, label: 'Wakad' },
    evidence: [{ label: 'Day-3 evidence checklist', kind: 'log' }],
    impact: ['The hold keeps this partner out of new offers for this job class until reviewed', 'No existing contract changes'],
  },
];
