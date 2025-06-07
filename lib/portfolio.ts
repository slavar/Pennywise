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

/** Available asset categories */
export const categories = ['bonds', 'etfs', 'stocks'] as const;
export type Category = typeof categories[number];

/** Fixed list of available ticker options per asset category */
export const categoryTickerOptions = {
  bonds: ['BND', 'AGG', 'TLT'],
  etfs: ['VOO', 'SPY', 'IVV'],
  stocks: ['AAPL', 'MSFT', 'GOOGL'],
} as const;

/** Default selected ticker for each category (first option) */
export const categoryTickers = {
  bonds: [categoryTickerOptions.bonds[0]],
  etfs: [categoryTickerOptions.etfs[0]],
  stocks: [categoryTickerOptions.stocks[0]],
} as const;

export type RiskLevel = keyof typeof riskAllocationMap;
export type Horizon = keyof typeof horizonAdjustment;
/** One line item of the portfolio: category, ticker symbol, and allocation weight */
export type PortfolioItem = { category: Category; ticker: string; weight: number; shares?: number; price?: number };

/**
 * Build a portfolio allocation (ticker + weight) by risk/horizon,
 * optionally overriding the selected tickers per category.
 */
export function getPortfolio(
  risk: RiskLevel,
  horizon: Horizon,
  overrideTickers?: Partial<Record<Category, readonly string[]>>
): PortfolioItem[] {
  const base = riskAllocationMap[risk];
  const adjust = horizonAdjustment[horizon];
  const alloc = {
    bonds: base.bonds + adjust.bonds,
    etfs: base.etfs,
    stocks: base.stocks + adjust.stocks,
  } as const;

  const portfolio: PortfolioItem[] = [];
  categories.forEach(category => {
    const tickers = overrideTickers?.[category] ?? categoryTickers[category];
    tickers.forEach(ticker => {
      portfolio.push({
        category,
        ticker,
        weight: alloc[category] / tickers.length,
      });
    });
  });
  return portfolio;
}