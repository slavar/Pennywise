import { createMocks } from 'node-mocks-http';
import handlePortfolio from '@/pages/api/portfolio';
import { vi } from 'vitest';

vi.mock('yahoo-finance2', () => ({
  default: {
    chart: vi.fn().mockResolvedValue({
      quotes: [
        { date: new Date('2023-01-01'), close: 100 },
        { date: new Date('2023-01-08'), close: 101 },
      ],
    }),
  },
}));

describe('/api/portfolio', () => {
  it('returns chart series for requested tickers', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        tickers: 'VTI,AGG,GLD',
        years: '2',
      },
    });

    await handlePortfolio(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(Array.isArray(data.series)).toBe(true);
    expect(data.series.length).toBe(3);
    expect(data.series[0]).toHaveProperty('symbol');
    expect(Array.isArray(data.series[0].points)).toBe(true);
  });
});
