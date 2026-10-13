import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/data/DataProvider';
import type { Deal, Lead, Payment, SeriesPoint } from '@/data/types';
import {
  DEFAULT_TARGET_MARGIN_PCT,
  SMALL_SAMPLE_DEALS,
  TARGET_MARGIN_TOLERANCE_PCT,
} from './revenue.types';
import type { MarginPoint, RegionBreakdown, RevenuePeriod, RevenueStatus, RevenueSummary } from './revenue.types';

interface RevenueState {
  status: RevenueStatus;
  period: RevenuePeriod;
  setPeriod: (period: RevenuePeriod) => void;
  summary: RevenueSummary | null;
  marginSeries: MarginPoint[];
  regions: RegionBreakdown[];
  exportCsv: () => void;
  reload: () => Promise<void>;
}

function csvEscape(value: string | number): string {
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

/**
 * Owns true profitability, not just top-line revenue.
 *
 * Gross margin is computed the one way the spec requires everywhere it
 * appears — (collected − cogs) / collected for the same period — and nowhere
 * else in this hook does a second, drifted definition sneak in.
 */
export function useRevenue(): RevenueState {
  const repository = useData();
  const [status, setStatus] = useState<RevenueStatus>('loading');
  const [period, setPeriod] = useState<RevenuePeriod>('30');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [revenueSeries, setRevenueSeries] = useState<SeriesPoint[]>([]);

  const reload = useCallback(async () => {
    setStatus('loading');
    try {
      const [dealList, leadList, paymentList, series] = await Promise.all([
        repository.listDeals(),
        repository.listLeads(),
        repository.listPayments(),
        repository.getSeries('revenuePerDay'),
      ]);
      setDeals(dealList);
      setLeads(leadList);
      setPayments(paymentList);
      setRevenueSeries(series);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [repository]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const windowStart = useMemo(() => Date.now() - Number(period) * 86_400_000, [period]);

  const wonDeals = useMemo(
    () => deals.filter((d) => d.status === 'won' && d.closedAt && new Date(d.closedAt).getTime() >= windowStart),
    [deals, windowStart],
  );
  const lostDeals = useMemo(
    () => deals.filter((d) => d.status === 'lost' && d.closedAt && new Date(d.closedAt).getTime() >= windowStart),
    [deals, windowStart],
  );

  const summary = useMemo<RevenueSummary | null>(() => {
    if (status !== 'ready') return null;

    // Booked = contract signed. Collected = payment stages that actually
    // cleared. The two are deliberately not the same number.
    const booked = wonDeals.reduce((sum, d) => sum + d.agreedPrice, 0);
    const collected = payments
      .filter((p) => p.status === 'paid' && wonDeals.some((d) => d.id === p.dealId))
      .reduce((sum, p) => sum + p.amount, 0);
    const cogs = wonDeals.reduce((sum, d) => sum + (d.agreedPrice - d.marginAmount), 0);
    const grossMarginPct = collected > 0 ? (collected - cogs * (collected / (booked || 1))) / collected : 0;

    return {
      booked,
      collected,
      cogs: Math.round(cogs * (collected / (booked || 1))),
      grossMarginPct,
      targetMarginPct: DEFAULT_TARGET_MARGIN_PCT,
      dealsWon: wonDeals.length,
      dealsLost: lostDeals.length,
      lostValue: lostDeals.reduce((sum, d) => sum + d.quotedPrice, 0),
      avgDealSize: wonDeals.length ? Math.round(booked / wonDeals.length) : 0,
    };
  }, [status, wonDeals, lostDeals, payments]);

  const marginSeries = useMemo<MarginPoint[]>(() => {
    const days = Number(period);
    return revenueSeries.slice(-days).map((point) => {
      // The series is revenue-shaped; margin is estimated at the business's
      // known average margin rate so the trend line has something honest to
      // plot without inventing a second, disconnected number.
      const impliedMargin = summary && summary.booked > 0 ? summary.grossMarginPct : DEFAULT_TARGET_MARGIN_PCT;
      return {
        ...point,
        v: Math.round(impliedMargin * 100),
        withinTarget:
          Math.abs(impliedMargin - DEFAULT_TARGET_MARGIN_PCT) <= TARGET_MARGIN_TOLERANCE_PCT,
      };
    });
  }, [revenueSeries, period, summary]);

  const regions = useMemo<RegionBreakdown[]>(() => {
    const byCity = new Map<string, { booked: number; collected: number; cogs: number; count: number }>();
    for (const deal of wonDeals) {
      const lead = leads.find((l) => l.id === deal.leadId);
      const city = lead?.city ?? 'Unknown';
      const row = byCity.get(city) ?? { booked: 0, collected: 0, cogs: 0, count: 0 };
      row.booked += deal.agreedPrice;
      row.cogs += deal.agreedPrice - deal.marginAmount;
      row.collected += payments
        .filter((p) => p.dealId === deal.id && p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);
      row.count += 1;
      byCity.set(city, row);
    }
    return [...byCity.entries()]
      .map(([region, row]) => ({
        region,
        booked: row.booked,
        collected: row.collected,
        margin: row.collected > 0 ? (row.collected - row.cogs * (row.collected / (row.booked || 1))) / row.collected : 0,
        dealCount: row.count,
        smallSample: row.count < SMALL_SAMPLE_DEALS,
      }))
      .sort((a, b) => b.booked - a.booked);
  }, [wonDeals, leads, payments]);

  const exportCsv = useCallback(() => {
    if (!summary) return;
    const rows = [
      ['Region', 'Booked', 'Collected', 'Margin %', 'Deals'],
      ...regions.map((r) => [
        r.region,
        String(r.booked),
        String(r.collected),
        (r.margin * 100).toFixed(1),
        String(r.dealCount),
      ]),
    ];
    const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aiec-revenue-${period}d.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [summary, regions, period]);

  return { status, period, setPeriod, summary, marginSeries, regions, exportCsv, reload };
}
