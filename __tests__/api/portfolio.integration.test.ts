import { MongoMemoryServer } from 'mongodb-memory-server';
import httpMocks from 'node-mocks-http';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
});

afterAll(async () => {
  await mongod.stop();
});

describe('GET /api/portfolio', () => {
  let handler: any;
  const mockHistData = [
    { date: new Date('2020-01-01'), close: 100 },
    { date: new Date('2020-01-02'), close: 110 },
  ];

  beforeEach(() => {
    jest.resetModules();
    jest.doMock('yahoo-finance2', () => ({
      __esModule: true,
      default: jest.fn().mockImplementation(() => ({
        historical: jest.fn().mockResolvedValue(mockHistData),
      })),
    }));
    handler = require('../../pages/api/portfolio').default;
  });

  it('returns correct portfolio, performance and gain', async () => {
    const req = httpMocks.createRequest({
      method: 'GET',
      query: { risk: 'mid', horizon: 'mid', years: '1' },
    });
    const res = httpMocks.createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    const json = res._getJSONData();
    expect(json.portfolio).toHaveLength(3);
    expect(json.performance).toHaveLength(2);
    expect(json.gain).toBeCloseTo(10);
    expect(json.performance[0].date).toBe('2020-01-01');
  });

  it('applies ticker override correctly', async () => {
    const req = httpMocks.createRequest({
      method: 'GET',
      query: { risk: 'mid', horizon: 'mid', years: '1', tickers: 'AAA,BBB,CCC' },
    });
    const res = httpMocks.createResponse();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    const json = res._getJSONData();
    expect(json.portfolio.map((p: any) => p.ticker)).toEqual(['AAA', 'BBB', 'CCC']);
  });
});