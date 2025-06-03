import type { NextApiRequest, NextApiResponse } from 'next';
import yahooFinance from 'yahoo-finance2';
import { subYears } from 'date-fns';
import { getPortfolio, PortfolioItem } from '../../lib/portfolio';

type PerformanceEntry = { date: string; value: number };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{
    portfolio: PortfolioItem[];
    performance: PerformanceEntry[];
    gain: number;
  } | { error: string }>
) {
  try {
    const { risk = 'mid', horizon = 'mid', years = '1' } = req.query;
    const numYears = parseInt(years as string, 10) || 1;
    const portfolio = getPortfolio(
      risk as any,
      horizon as any
    );
    const endDate = new Date();
    const startDate = subYears(endDate, numYears);
    // Create a new instance of the Yahoo Finance client
    const query = new yahooFinance();
    const rawData = await Promise.all(
      portfolio.map(p => 
        query.historical(p.ticker, {
          period1: startDate,
          period2: endDate,
          interval: '1d'
        })
      )
    );
    if (rawData.length === 0) {
      return res.status(400).json({ error: 'No data available' });
    }
    const dates = rawData[0].map(d => d.date.toISOString().slice(0, 10));
    const performance = dates.map((date, idx) => {
      const value = portfolio.reduce((sum, p, ti) => {
        const price = rawData[ti][idx]?.close || 0;
        return sum + price * p.weight;
      }, 0);
      return { date, value };
    });
    const gain = ((
      performance[performance.length - 1].value / performance[0].value - 1
    ) * 100);
    return res.status(200).json({ portfolio, performance, gain });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Internal error' });
  }
}