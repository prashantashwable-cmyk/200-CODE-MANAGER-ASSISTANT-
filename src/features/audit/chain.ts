/**
 * The automated-action log is append-only (187): each entry carries a sequence number and a hash that includes the one before it, so an entry changed or removed after the fact breaks every hash from there on.
 * This makes tampering visible; it does not make it impossible. The hash is a fast, non-cryptographic fingerprint: a real backend would write the log to storage that cannot be altered (write-once, signed).
 * Pure: the repository writes with it and the screen verifies with it.
 */
export const GENESIS = '0'.repeat(28);

export interface ChainCore {
  id: string;
  seq: number;
  sourceKey: string;
  triggeringCondition: string;
  actionTaken: string;
  affectedRecordId: string;
  affectedRecordType: string;
  subjectLabel?: string;
  unitId?: string;
  ruleId?: string;
  at: string;
}

/** cyrb53: a well-mixed 53-bit string hash with a seed. Two seeds make 106 bits of fingerprint. Not cryptographic. */
function cyrb53(str: string, seed: number): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i += 1) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
const hex14 = (n: number): string => n.toString(16).padStart(14, '0');

export function hashOf(prevHash: string, e: ChainCore): string {
  const canonical = JSON.stringify([prevHash, e.id, e.seq, e.sourceKey, e.triggeringCondition, e.actionTaken, e.affectedRecordId, e.affectedRecordType, e.subjectLabel ?? '', e.unitId ?? '', e.ruleId ?? '', e.at]);
  return hex14(cyrb53(canonical, 1)) + hex14(cyrb53(canonical, 2));
}

export interface ChainLink extends Omit<ChainCore, 'seq'> { seq?: number; prevHash?: string; hash?: string }
export interface ChainCheck { ok: boolean; count: number; headHash: string; /** The first entry whose own fingerprint or link no longer matches. */ brokenAtSeq: number | null }

/** Walks the whole log in order and says whether every entry still matches what was written. */
export function verifyChain(list: ChainLink[]): ChainCheck {
  let prev = GENESIS;
  for (let i = 0; i < list.length; i += 1) {
    const e = list[i];
    if (e.seq !== i + 1 || e.prevHash !== prev || e.hash !== hashOf(prev, { ...e, seq: e.seq })) return { ok: false, count: list.length, headHash: prev, brokenAtSeq: i + 1 };
    prev = e.hash;
  }
  return { ok: true, count: list.length, headHash: prev, brokenAtSeq: null };
}

export const codeOf = (seq: number): string => `AIEC-AL-${String(seq).padStart(6, '0')}`;
