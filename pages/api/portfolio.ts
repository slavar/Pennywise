import type { NextApiRequest, NextApiResponse } from 'next';
// Handle ESM/CJS interop consistently
import * as yahooFinanceNS from 'yahoo-finance2';
const yahooFinance: any = (yahooFinanceNS as any).default ?? (yahooFinanceNS as any);

export default async function handler(req: any, res: any) {
  try {
    const { tickers = 'BND,VOO,AAPL', years = '5' } = req.query;
    const symbols = String(tickers).split(',').map((s) => s.trim()).filter(Boolean);

    // library currently requires period1 (and optionally period2)
    const y = Math.max(1, Number(years) || 1);
    const now = new Date();
    const period2 = now;
    const period1 = new Date(now.getTime() - y * 365 * 24 * 60 * 60 * 1000);
    const interval = y >= 5 ? '1wk' : '1d';

    const results = await Promise.all(
      symbols.map((sym) => yahooFinance.chart(sym, { period1, period2, interval }))
    );

    const series = results.map((data: any, i: number) => ({
      symbol: symbols[i],
      points: (data?.quotes ?? []).map((q: any) => ({ date: q.date, close: q.close })),
    }));

    return res.status(200).json({ series });
  } catch (err: any) {
    console.error('[/api/portfolio] error', err);
    return res.status(500).json({ error: err?.message || 'Internal error' });
  }
}
