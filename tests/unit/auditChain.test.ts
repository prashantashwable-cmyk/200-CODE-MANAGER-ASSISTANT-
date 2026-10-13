import { describe, expect, it } from 'vitest';
import { GENESIS, hashOf, verifyChain } from '@/features/audit/chain';
import type { ChainLink } from '@/features/audit/chain';

function build(n: number): ChainLink[] {
  const out: ChainLink[] = [];
  let prev = GENESIS;
  for (let i = 1; i <= n; i += 1) {
    const core = { id: `e${i}`, seq: i, sourceKey: 'test.step', triggeringCondition: `cond ${i}`, actionTaken: `did ${i}`, affectedRecordId: `r${i}`, affectedRecordType: 'other', at: new Date(Date.UTC(2026, 9, 1, 0, i)).toISOString() };
    const hash = hashOf(prev, core);
    out.push({ ...core, prevHash: prev, hash });
    prev = hash;
  }
  return out;
}

describe('automated-action audit chain', () => {
  it('verifies an untouched log', () => {
    expect(verifyChain(build(5))).toMatchObject({ ok: true, count: 5, brokenAtSeq: null });
  });
  it('finds an edited entry', () => {
    const log = build(5);
    log[2] = { ...log[2], actionTaken: 'did something else' };
    expect(verifyChain(log)).toMatchObject({ ok: false, brokenAtSeq: 3 });
  });
  it('finds a removed entry', () => {
    const log = build(5);
    log.splice(1, 1);
    expect(verifyChain(log).ok).toBe(false);
  });
});
