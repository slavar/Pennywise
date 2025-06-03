export const riskAllocationMap = {
  low: { bonds: 0.6, etfs: 0.3, stocks: 0.1 },
  mid: { bonds: 0.4, etfs: 0.4, stocks: 0.2 },
  high: { bonds: 0.2, etfs: 0.4, stocks: 0.4 },
} as const;

export const horizonAdjustment = {
  short: { bonds: 0.1, stocks: -0.1 },
  mid: { bonds: 0, stocks: 0 },
  long: { bonds: -0.1, stocks: 0.1 },
} as const;

export const categoryTickers = {
  bonds: ['BND'],
  etfs: ['VOO'],
  stocks: ['AAPL'],
} as const;

export type RiskLevel = keyof typeof riskAllocationMap;
export type Horizon = keyof typeof horizonAdjustment;
export type PortfolioItem = { ticker: string; weight: number };

export function getPortfolio(
  risk: RiskLevel,
  horizon: Horizon
): PortfolioItem[] {
  const base = riskAllocationMap[risk];
  const adjust = horizonAdjustment[horizon];
  const alloc = {
    bonds: base.bonds + adjust.bonds,
    etfs: base.etfs,
    stocks: base.stocks + adjust.stocks,
  } as const;

  const portfolio: PortfolioItem[] = [];
  (Object.keys(alloc) as Array<keyof typeof alloc>).forEach(category => {
    const tickers = categoryTickers[category];
    tickers.forEach(ticker => {
      portfolio.push({
        ticker,
        weight: alloc[category] / tickers.length,
      });
    });
  });
  return portfolio;
}