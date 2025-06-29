import { createMocks } from 'node-mocks-http';
import handlePortfolio from '@/pages/api/portfolio';
import yahooFinance from 'yahoo-finance2';
import { vi } from 'vitest';

vi.mock('yahoo-finance2', () => {
  const historical = vi.fn().mockImplementation(ticker => {
    const mockData = [
      { date: new Date('2023-01-01'), close: 100 },
      { date: new Date('2023-01-02'), close: 101 },
    ];
    switch (ticker) {
      case 'VTI':
      case 'AGG':
      case 'GLD':
      case 'BND':
      case 'IVV':
      case 'QQQ':
      case 'VOO':
      case 'VEA':
      case 'VWO':
        return Promise.resolve(mockData);
      default:
        return Promise.resolve([]);
    }
  });

  return {
    default: vi.fn().mockImplementation(() => ({
      historical,
    })),
  };
});

describe('/api/portfolio', () => {
  it('should return a portfolio', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        risk: 'high',
        horizon: 'long',
      },
    });

    await handlePortfolio(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.portfolio).toBeDefined();
    expect(data.performance).toBeDefined();
    expect(data.gain).toBeDefined();
  });
});
