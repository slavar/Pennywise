import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import httpMocks from 'node-mocks-http';

let mongod: MongoMemoryServer;
let mongoClient: MongoClient;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.OPENAI_API_KEY = 'test-key';
  mongoClient = new MongoClient(process.env.MONGODB_URI);
  await mongoClient.connect();
});

afterAll(async () => {
  await mongoClient.close();
  await mongod.stop();
});

describe('POST /api/portfolio-analyze', () => {
  const mockOpenAIResponse = {
    choices: [
      { message: { content: '[{"ticker":"AAA","shares":2,"price":10}]' } },
    ],
  };
  const mockHistData = [
    { date: new Date('2020-01-01'), close: 5 },
    { date: new Date('2020-01-02'), close: 10 },
  ];

  let handler: any;

  beforeEach(() => {
    jest.resetModules();
    jest.doMock('../../lib/mongodb', () => ({
      __esModule: true,
      default: Promise.resolve(mongoClient),
    }));
    // The mock for @clerk/nextjs/server is updated to include a mock for clerkClient, which is used to fetch user data.
    jest.doMock('@clerk/nextjs/server', () => ({
      getAuth: () => ({ userId: 'user_test_id' }),
      clerkClient: jest.fn().mockResolvedValue({
        users: {
          getUser: jest.fn().mockResolvedValue({
            id: 'user_test_id',
            primaryEmailAddressId: 'email_id_123',
            emailAddresses: [
              { id: 'email_id_123', emailAddress: 'test@example.com' },
            ],
          }),
        },
      }),
    }));
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockOpenAIResponse,
    } as any);
    jest.doMock('yahoo-finance2', () => ({
      __esModule: true,
      default: jest.fn().mockImplementation(() => ({
        historical: jest.fn().mockResolvedValue(mockHistData),
      })),
    }));
    handler = require('../../pages/api/portfolio-analyze').default;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.dontMock('../../lib/mongodb');
    jest.dontMock('@clerk/nextjs/server');
    jest.dontMock('yahoo-finance2');
  });

  it('returns analyzed portfolio and persists to DB', async () => {
    const req = httpMocks.createRequest({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { text: 'dummy', years: '1' },
    });
    const res = httpMocks.createResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.portfolio).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ticker: 'AAA', shares: 2, price: 10 }),
      ])
    );
    expect(data.performance).toHaveLength(2);
    expect(data.gain).toBeCloseTo((data.performance[1].value / data.performance[0].value - 1) * 100);

    const db = mongoClient.db();
    // The test is updated to check that the portfolio is saved with the user's email address as the userId.
    const saved = await db.collection('portfolios').findOne({ userId: 'test@example.com' });
    expect(saved).toBeTruthy();
    expect(saved.portfolio).toEqual(data.portfolio);
  });

  it('rejects unsupported methods', async () => {
    const req = httpMocks.createRequest({ method: 'GET' });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
    expect(res.getHeader('Allow')).toBe('POST');
  });
});
