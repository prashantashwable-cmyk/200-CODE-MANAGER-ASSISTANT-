/**
 * The final handover checklist's rules, pure (137). It is a completeness gate, not a third inspection: it reads the signals the earlier screens
 * already keep (both quality checks signed off, the snag list, the compliance certificate) and adds what only this moment can confirm, the
 * customer's documentation package. Ready for Handover is the one event that unlocks the walkthrough with the customer.
 */
export type HandoverDocKind = 'warranty_terms' | 'amc_options' | 'user_manual';
export const DOC_KINDS: HandoverDocKind[] = ['warranty_terms', 'amc_options', 'user_manual'];

export const ISSUE_MIN = 10;
export const CORRECTION_MIN = 8;
export const REVIEW_REASON_MIN = 10;
export const REVIEW_NOTE_MIN = 10;

/** What a document was prepared against. If any of it has moved since, the document describes a package the customer no longer has. */
export interface DocBasis {
  quotationCode: string;
  version: number;
  finishTier: string;
  driveType: string;
  /** The as-installed parts log, for the warranty terms that name the parts. */
  materialsConfirmedAt: string | null;
  /** When AMC pricing was last changed, for the options that quote it. */
  pricingUpdatedAt: string | null;
}

export type DocState = 'blocked' | 'pending' | 'issue' | 'outdated' | 'ready';
export type DocBlock = 'no_spec' | 'materials_unconfirmed' | 'no_amc_tiers';

/** Which parts of the basis matter to which document. */
export function basisMoved(kind: HandoverDocKind, was: DocBasis, now: DocBasis): boolean {
  if (was.quotationCode !== now.quotationCode || was.version !== now.version || was.finishTier !== now.finishTier || was.driveType !== now.driveType) return true;
  if (kind === 'warranty_terms') return was.materialsConfirmedAt !== now.materialsConfirmedAt;
  if (kind === 'amc_options') return was.pricingUpdatedAt !== now.pricingUpdatedAt;
  return false;
}

export function blockOf(kind: HandoverDocKind, f: { hasSpec: boolean; materialsConfirmed: boolean; amcTiers: number }): DocBlock | null {
  if (!f.hasSpec) return 'no_spec';
  if (kind === 'warranty_terms' && !f.materialsConfirmed) return 'materials_unconfirmed';
  if (kind === 'amc_options' && f.amcTiers === 0) return 'no_amc_tiers';
  return null;
}

export function docStateOf(i: { block: DocBlock | null; confirmed: { basis: DocBasis } | null; openIssue: boolean; now: DocBasis; kind: HandoverDocKind }): DocState {
  if (i.block) return 'blocked';
  if (i.openIssue) return 'issue';
  if (!i.confirmed) return 'pending';
  return basisMoved(i.kind, i.confirmed.basis, i.now) ? 'outdated' : 'ready';
}

export type ReadinessProblem = 'checks_open' | 'snags_open' | 'certificate_missing' | 'docs_open' | 'review_open';
export interface ReadinessFacts {
  checksSigned: boolean;
  openSnags: number;
  certificateIssued: boolean;
  docStates: DocState[];
  reviewOpen: boolean;
}

/** Everything that has to be true before Ready for Handover can be said. Open snags of any kind stop it: a cosmetic one has to be put right or accepted by the customer. */
export function readinessOf(f: ReadinessFacts): ReadinessProblem[] {
  const out: ReadinessProblem[] = [];
  if (!f.checksSigned) out.push('checks_open');
  if (f.openSnags > 0) out.push('snags_open');
  if (!f.certificateIssued) out.push('certificate_missing');
  if (f.docStates.some((s) => s !== 'ready')) out.push('docs_open');
  if (f.reviewOpen) out.push('review_open');
  return out;
}

export type HandoverProblem = 'issue_required' | 'correction_required' | 'review_reason_required' | 'review_note_required' | 'not_ready' | 'invalid_state' | 'blocked_doc' | 'not_trivial' | 'no_review' | 'already_confirmed' | 'not_found' | 'forbidden';
export const issueProblem = (text: string): HandoverProblem | null => (text.trim().length < ISSUE_MIN ? 'issue_required' : null);
export const correctionProblem = (i: { note: string; state: DocState }): HandoverProblem | null => {
  if (i.state !== 'ready' && i.state !== 'pending') return 'not_trivial';
  return i.note.trim().length < CORRECTION_MIN ? 'correction_required' : null;
};
