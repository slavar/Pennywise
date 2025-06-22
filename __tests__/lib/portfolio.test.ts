import {
  getPortfolio,
  riskAllocationMap,
  horizonAdjustment,
  categories,
  categoryTickerOptions,
  categoryTickers,
} from '../../lib/portfolio';

describe('getPortfolio', () => {
  it('returns default portfolio for mid risk and mid horizon', () => {
    const result = getPortfolio('mid', 'mid');
    const expectedAlloc = { bonds: 0.4, etfs: 0.4, stocks: 0.2 };
    expect(result).toEqual([
      { category: 'bonds', ticker: categoryTickerOptions.bonds[0], weight: expectedAlloc.bonds },
      { category: 'etfs', ticker: categoryTickerOptions.etfs[0], weight: expectedAlloc.etfs },
      { category: 'stocks', ticker: categoryTickerOptions.stocks[0], weight: expectedAlloc.stocks },
    ]);
  });

  it('adjusts allocation based on risk and horizon', () => {
    const result = getPortfolio('low', 'short');
    const base = riskAllocationMap.low;
    const adjust = horizonAdjustment.short;
    const expectedAlloc = {
      bonds: base.bonds + adjust.bonds,
      etfs: base.etfs,
      stocks: base.stocks + adjust.stocks,
    };
    expect(result).toEqual([
      { category: 'bonds', ticker: categoryTickerOptions.bonds[0], weight: expectedAlloc.bonds },
      { category: 'etfs', ticker: categoryTickerOptions.etfs[0], weight: expectedAlloc.etfs },
      { category: 'stocks', ticker: categoryTickerOptions.stocks[0], weight: expectedAlloc.stocks },
    ]);
  });

  it('distributes weight equally among override tickers', () => {
    const override = { bonds: ['X', 'Y'], stocks: ['Z'] } as const;
    const result = getPortfolio('mid', 'mid', override);
    const expectedAlloc = riskAllocationMap.mid;
    expect(result).toEqual([
      { category: 'bonds', ticker: 'X', weight: expectedAlloc.bonds / 2 },
      { category: 'bonds', ticker: 'Y', weight: expectedAlloc.bonds / 2 },
      { category: 'etfs', ticker: categoryTickerOptions.etfs[0], weight: expectedAlloc.etfs },
      { category: 'stocks', ticker: 'Z', weight: expectedAlloc.stocks },
    ]);
  });
});

describe('categories and categoryTickerOptions', () => {
  it('has ticker options for each category', () => {
    categories.forEach(cat => {
      expect(categoryTickerOptions).toHaveProperty(cat);
    });
  });
});