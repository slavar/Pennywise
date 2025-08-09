import { createMocks } from 'node-mocks-http';
import handlePortfolioSaved from '@/pages/api/portfolio-saved';
import { getAuth } from '@clerk/nextjs/server';
import { vi, type Mock } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({
  getAuth: vi.fn(),
}));

describe('/api/portfolio-saved', () => {
  it('should return a 401 error if the user is not authenticated', async () => {
    (getAuth as unknown as Mock).mockReturnValue({ userId: null });

    const { req, res } = createMocks({
      method: 'GET',
    });

    await handlePortfolioSaved(req, res);

    expect(res._getStatusCode()).toBe(401);
  });
});
