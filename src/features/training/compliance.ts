/**
 * The training compliance tracker's rules, pure (158). The tracker keeps no training record of its own: it reads what lessons (152), tests (154),
 * certifications (155), refreshers (156) and assigned training (157) already know and says, for each partner, whether every training that is
 * required of them and can be taught in the app today is current, and if not, why.
 *
 * Three honest simplifications are stated on screen: only modules with lessons in the app are counted (a module nobody can take yet cannot make anyone
 * non-compliant), a rate over a handful of people is shown as counts, and a wave of renewals that all fall due together (people certified together) is
 * recognised as a wave, not a sudden failure.
 *
 * THE SAMPLE SIZE, THE WAVE WINDOW AND THE REMINDER WINDOWS BELOW ARE PLACEHOLDER DECISIONS flagged to Admin on screen.
 */

/** Why one required training is not current. Each asks for a different response. */
export type ComplianceReason = 'never_started' | 'in_progress' | 'update_needed' | 'test_pending' | 'failed' | 'lapsed';
export const REASONS: ComplianceReason[] = ['never_started', 'in_progress', 'test_pending', 'failed', 'update_needed', 'lapsed'];

/** `nudge`: they have not got to it, a reminder with a date is the right thing. `coaching`: they have tried and not passed, a person should help. `refresher`: it was held and ran out. */
export type ComplianceResponse = 'nudge' | 'coaching' | 'refresher';

/** A training that counts and is fine, one that counts but is close to its end, or one that does not count. */
export type ItemState = 'current' | 'due_soon' | 'grace' | 'new' | ComplianceReason;

/** With fewer people than this in a group a percentage is noise: the count is shown. */
export const SMALL_GROUP = 5;
/** Three people or more whose certification ends within this many days of each other are a wave (certified together), not a run of separate lapses. */
export const WAVE_MIN = 3;
export const WAVE_WINDOW_DAYS = 60;
/** A wave looks back this far for lapses and forward this far for renewals still to come. */
export const WAVE_LOOK_BACK_DAYS = 120;
export const WAVE_LOOK_AHEAD_DAYS = 90;
/** The same person is not reminded about the same thing more often than this. */
export const REMIND_GAP_HOURS = 72;
/** Training asked for in a reminder is due this many days out; safety-critical sooner. */
export const REMIND_DUE_DAYS = 14;
export const REMIND_DUE_DAYS_SAFETY = 7;
/** Admin is asked to look at the figures at least this often. */
export const REVIEW_EVERY_DAYS = 30;
export const NOTE_MAX = 400;
/** Someone who joined this recently and has not begun is just starting, not behind. */
export const NEW_PARTNER_DAYS = 14;
export const TREND_MONTHS = 6;

export const responseOf = (reason: ComplianceReason, fails: number, struggling: boolean): ComplianceResponse => (reason === 'lapsed' ? 'refresher' : reason === 'failed' && struggling && fails > 0 ? 'coaching' : 'nudge');

export type PartnerStatus = 'compliant' | 'due_soon' | 'non_compliant';
export function partnerStatusOf(states: ItemState[]): PartnerStatus {
  if (states.some((s) => REASONS.includes(s as ComplianceReason))) return 'non_compliant';
  if (states.some((s) => s === 'due_soon' || s === 'grace' || s === 'new')) return 'due_soon';
  return 'compliant';
}

export interface GroupRate { compliant: number; total: number; percent: number | null; small: boolean }
/** A rate that says so when the group is too small to read as a percentage. */
export function rateOf(compliant: number, total: number): GroupRate {
  return { compliant, total, percent: total > 0 ? Math.round((compliant / total) * 100) : null, small: total > 0 && total < SMALL_GROUP };
}

export interface WaveInput { moduleId: string; moduleCode: string; safetyCritical: boolean; userId: string; name: string; endsAt: number }
export interface Wave { moduleId: string; moduleCode: string; safetyCritical: boolean; people: { userId: string; name: string; endsAt: string }[]; from: string; to: string; lapsed: number; upcoming: number }

/** Certifications of one module that end close together: what a shared onboarding date looks like once the first renewal cycle comes round. */
export function wavesOf(inputs: WaveInput[], now: number): Wave[] {
  const out: Wave[] = [];
  const byModule = new Map<string, WaveInput[]>();
  const lo = now - WAVE_LOOK_BACK_DAYS * 86_400_000;
  const hi = now + WAVE_LOOK_AHEAD_DAYS * 86_400_000;
  for (const i of inputs) if (i.endsAt >= lo && i.endsAt <= hi) byModule.set(i.moduleId, [...(byModule.get(i.moduleId) ?? []), i]);
  for (const list of byModule.values()) {
    const sorted = [...list].sort((a, b) => a.endsAt - b.endsAt);
    let start = 0;
    while (start < sorted.length) {
      let end = start;
      while (end + 1 < sorted.length && sorted[end + 1].endsAt - sorted[start].endsAt <= WAVE_WINDOW_DAYS * 86_400_000) end += 1;
      const group = sorted.slice(start, end + 1);
      if (group.length >= WAVE_MIN) {
        out.push({
          moduleId: group[0].moduleId, moduleCode: group[0].moduleCode, safetyCritical: group[0].safetyCritical,
          people: group.map((g) => ({ userId: g.userId, name: g.name, endsAt: new Date(g.endsAt).toISOString() })),
          from: new Date(group[0].endsAt).toISOString(), to: new Date(group[group.length - 1].endsAt).toISOString(),
          lapsed: group.filter((g) => g.endsAt <= now).length, upcoming: group.filter((g) => g.endsAt > now).length,
        });
        start = end + 1;
      } else start += 1;
    }
  }
  return out.sort((a, b) => Number(b.safetyCritical) - Number(a.safetyCritical) || b.lapsed - a.lapsed || a.moduleCode.localeCompare(b.moduleCode));
}

/** What a reminder to one partner will do about each of their open trainings. Coaching is never sent as a plain reminder. */
export type SkipReason = 'compliant' | 'recently_reminded' | 'coaching_only' | 'not_active' | 'nothing_to_send';

/** The date a reminder asks for: sooner when any of the training is safety-critical. */
export function reminderDue(now: number, safety: boolean): string {
  return new Date(now + (safety ? REMIND_DUE_DAYS_SAFETY : REMIND_DUE_DAYS) * 86_400_000).toISOString().slice(0, 10);
}

export const recentlyReminded = (lastAt: string | null, now: number): boolean => !!lastAt && now - Date.parse(lastAt) < REMIND_GAP_HOURS * 3_600_000;

export function reviewDueAt(lastReviewAt: string | null, now: number): string {
  return lastReviewAt ? new Date(Date.parse(lastReviewAt) + REVIEW_EVERY_DAYS * 86_400_000).toISOString() : new Date(now).toISOString();
}

export function noteProblem(note: string): 'note_long' | null {
  return note.length > NOTE_MAX ? 'note_long' : null;
}
