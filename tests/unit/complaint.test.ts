import { describe, expect, it } from 'vitest';
import { ACK_HOURS, ACK_HOURS_SAFETY, ackDueAt, acknowledgeProblem, isAckOverdue, raiseProblem, replyProblem, resolveProblem, trustSummaryText } from '@/features/complaints/complaint';

describe('complaint rules', () => {
  it('needs a known category and a described problem of a sensible length', () => {
    expect(raiseProblem({ category: 'defect', text: 'The door sensor keeps failing' })).toBeNull();
    expect(raiseProblem({ category: 'lunch', text: 'The door sensor keeps failing' })).toBe('category_invalid');
    expect(raiseProblem({ category: 'defect', text: 'too short' })).toBe('text_short');
    expect(raiseProblem({ category: 'defect', text: 'x'.repeat(1001) })).toBe('text_long');
    expect(raiseProblem({ category: 'defect', text: '   ' + 'a'.repeat(14) + '   ' })).toBe('text_short'); // spaces do not count
  });
  it('is due for acknowledgement in a day, or four hours when it is about safety, from the shared clock', () => {
    const t = '2026-10-15T10:00:00.000Z';
    expect(Date.parse(ackDueAt('defect', t)) - Date.parse(t)).toBe(ACK_HOURS * 3_600_000);
    expect(Date.parse(ackDueAt('safety', t)) - Date.parse(t)).toBe(ACK_HOURS_SAFETY * 3_600_000);
    const due = ackDueAt('defect', t);
    expect(isAckOverdue({ status: 'open', ackDueAt: due }, Date.parse(due) - 1)).toBe(false);
    expect(isAckOverdue({ status: 'open', ackDueAt: due }, Date.parse(due) + 1)).toBe(true);
    expect(isAckOverdue({ status: 'acknowledged', ackDueAt: due }, Date.parse(due) + 1)).toBe(false);
  });
  it('moves open -> acknowledged -> resolved once, with an outcome and a note, and is then locked', () => {
    expect(acknowledgeProblem({ status: 'open' })).toBeNull();
    expect(acknowledgeProblem({ status: 'acknowledged' })).toBe('not_open');
    expect(acknowledgeProblem({ status: 'resolved' })).toBe('locked');
    const ok = { outcome: 'upheld', note: 'Partner will replace the sensor' };
    expect(resolveProblem({ status: 'open' }, ok)).toBe('not_acknowledged');
    expect(resolveProblem({ status: 'acknowledged' }, ok)).toBeNull();
    expect(resolveProblem({ status: 'acknowledged' }, { ...ok, outcome: 'maybe' })).toBe('outcome_invalid');
    expect(resolveProblem({ status: 'acknowledged' }, { ...ok, note: 'short' })).toBe('note_short');
    expect(resolveProblem({ status: 'resolved' }, ok)).toBe('locked');
  });
  it('summarises a partner in plain counts: no record, clean, or worth watching', () => {
    expect(trustSummaryText({ verifiedMilestones: 0, closedMilestones: 0, complaintsRaised: 0, complaintsUpheld: 0 })).toBe('no_record');
    expect(trustSummaryText({ verifiedMilestones: 4, closedMilestones: 3, complaintsRaised: 1, complaintsUpheld: 0 })).toBe('clean');
    expect(trustSummaryText({ verifiedMilestones: 4, closedMilestones: 3, complaintsRaised: 2, complaintsUpheld: 1 })).toBe('watch');
  });
  it('lets the named partner answer once, in words, until it is resolved', () => {
    expect(replyProblem({ status: 'open' }, 'We will visit tomorrow morning')).toBeNull();
    expect(replyProblem({ status: 'acknowledged' }, 'We will visit tomorrow morning')).toBeNull();
    expect(replyProblem({ status: 'open' }, '   short   ')).toBe('reply_short');
    expect(replyProblem({ status: 'open' }, 'x'.repeat(1001))).toBe('text_long');
    expect(replyProblem({ status: 'open', partnerReply: 'Already answered earlier' }, 'We will visit tomorrow morning')).toBe('already_replied');
    expect(replyProblem({ status: 'resolved' }, 'We will visit tomorrow morning')).toBe('locked');
  });
});
