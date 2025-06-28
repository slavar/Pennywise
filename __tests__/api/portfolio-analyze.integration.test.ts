import { createMocks } from 'node-mocks-http';
import handlePortfolioAnalyze from '@/pages/api/portfolio-analyze';
import { getAuth } from '@clerk/nextjs/server';
import yahooFinance from 'yahoo-finance2';
import { vi } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({
  getAuth: vi.fn(),
}));

vi.mock('yahoo-finance2', () => ({
  default: vi.fn().mockImplementation(() => ({
    historical: vi.fn().mockResolvedValue([]),
  })),
}));

describe('/api/portfolio-analyze', () => {
  it('should return a 401 error if the user is not authenticated', async () => {
    (getAuth as vi.Mock).mockReturnValue({ userId: null });

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        portfolio: [
          { ticker: 'AAPL', shares: 10 },
          { ticker: 'GOOGL', shares: 5 },
        ],
      },
    });

    await handlePortfolioAnalyze(req, res);

    expect(res._getStatusCode()).toBe(401);
  });
});
