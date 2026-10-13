import { describe, expect, it } from 'vitest';
import type { Payment } from '@/data/types';
import { bucketFor, computeCashIn, computeTotalReceivable, daysOverdue, remainingBalance } from '@/features/payments/aging';
import { allocate, crewShares, installPoolOf, qcShares } from '@/features/commission/finalPayout';
import { splitTax, supplyType } from '@/features/tax/gst';
import { deductionFor } from '@/features/tax/tds';
import { DEFAULT_PARAMS, amountOf } from '@/features/commission/rules';

const DAY = 86_400_000;
const now = Date.parse('2026-10-08T10:00:00Z');
const pay = (p: Partial<Payment>): Payment => ({ id: 'p', dealId: 'd', stage: 'advance', amount: 100_000, status: 'due', dueDate: new Date(now).toISOString(), ...p }) as Payment;

describe('overdue and collected (one definition for every screen)', () => {
  it('buckets by days past due, and a dispute is never "overdue"', () => {
    expect(bucketFor(pay({ dueDate: new Date(now + DAY).toISOString() }), now)).toBe('current');
    expect(bucketFor(pay({ dueDate: new Date(now - 10 * DAY).toISOString() }), now)).toBe('d30');
    expect(bucketFor(pay({ dueDate: new Date(now - 45 * DAY).toISOString() }), now)).toBe('d60');
    expect(bucketFor(pay({ dueDate: new Date(now - 120 * DAY).toISOString() }), now)).toBe('d90plus');
    expect(bucketFor(pay({ status: 'disputed', dueDate: new Date(now - 120 * DAY).toISOString() }), now)).toBe('disputed');
    expect(daysOverdue(pay({ dueDate: new Date(now - 3 * DAY).toISOString() }), now)).toBe(3);
  });
  it('counts partial payments once, on both sides', () => {
    const list = [pay({ status: 'paid', amount: 50_000 }), pay({ status: 'due', amount: 100_000, amountReceived: 30_000 })];
    expect(remainingBalance(list[1])).toBe(70_000);
    expect(computeCashIn(list)).toBe(80_000);
    expect(computeTotalReceivable(list)).toBe(70_000);
  });
});

describe('installation pool split', () => {
  it('never loses or invents a rupee', () => {
    for (const total of [1, 7, 999, 12_345]) {
      const parts = allocate(total, [1, 1, 1]);
      expect(parts.reduce((a, b) => a + b, 0)).toBe(total);
    }
  });
  it('gives the lead the bonus and shares the rest by time on site', () => {
    const pool = installPoolOf(2_500_000);
    expect(pool).toBe(25_000);
    const { lines, basis, notPaid } = crewShares(pool, [
      { userId: 'lead', name: 'L', isLead: true, minutes: 600, steps: 5 },
      { userId: 'a', name: 'A', isLead: false, minutes: 300, steps: 3 },
      { userId: 'idle', name: 'I', isLead: false, minutes: 0, steps: 0 },
    ]);
    expect(basis).toBe('time');
    expect(notPaid).toEqual(['idle']);
    expect(lines.reduce((s, l) => s + l.amount, 0)).toBe(pool);
    const lead = lines.find((l) => l.userId === 'lead')!;
    expect(lead.leadBonus).toBe(Math.round(pool * 0.25));
    expect(lead.amount).toBeGreaterThan(lines.find((l) => l.userId === 'a')!.amount);
  });
  it('splits the inspection fee by results recorded, adding up exactly', () => {
    const parts = qcShares(1500, [{ userId: 'x', name: 'X', results: 2 }, { userId: 'y', name: 'Y', results: 1 }]);
    expect(parts.reduce((s, p) => s + p.amount, 0)).toBe(1500);
    expect(parts[0].amount).toBe(1000);
  });
});

describe('commission rules', () => {
  it('pays the conversion share with its floor, plus the tier points', () => {
    const p = DEFAULT_PARAMS.conversion;
    expect(amountOf('conversion', p, { dealValue: 100_000 })).toBe(p.floor);
    expect(amountOf('conversion', p, { dealValue: 2_000_000 })).toBe(Math.round((2_000_000 * (p.pct ?? 0)) / 100));
    expect(amountOf('conversion', p, { dealValue: 2_000_000, tierPlusPct: 0.5 })).toBe(Math.round((2_000_000 * ((p.pct ?? 0) + 0.5)) / 100));
  });
});

describe('GST', () => {
  it('splits CGST + SGST within a state and IGST across states, always adding back', () => {
    expect(supplyType('27AABCV1234A1Z5', '27AAACA0000A1Z5')).toBe('intra');
    expect(supplyType('29AABCV1234A1Z5', '27AAACA0000A1Z5')).toBe('inter');
    expect(supplyType(null, '27AAACA0000A1Z5')).toBe('intra');
    const s = splitTax(1801, 'intra');
    expect(s.cgst + s.sgst).toBe(1801);
    expect(splitTax(1801, 'inter')).toEqual({ cgst: 0, sgst: 0, igst: 1801 });
  });
});

describe('TDS', () => {
  const base = { baseRate: 2, threshold: 20_000, panOnFile: true, deductedBefore: 0 };
  it('takes nothing below the limit', () => {
    expect(deductionFor({ ...base, grossBefore: 0, gross: 15_000 }).amount).toBe(0);
  });
  it('catches up on everything paid once the year passes the limit', () => {
    const d = deductionFor({ ...base, grossBefore: 15_000, gross: 10_000 });
    expect(d.amount).toBe(500);
    expect(d.catchUp).toBe(300);
  });
  it('uses the higher rate without a PAN', () => {
    expect(deductionFor({ ...base, panOnFile: false, grossBefore: 30_000, gross: 10_000 }).rate).toBe(20);
  });
});
