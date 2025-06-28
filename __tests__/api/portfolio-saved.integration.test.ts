import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import httpMocks from 'node-mocks-http';

let mongod: MongoMemoryServer;
let mongoClient: MongoClient;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  mongoClient = new MongoClient(process.env.MONGODB_URI);
  await mongoClient.connect();
});

afterAll(async () => {
  await mongoClient.close();
  await mongod.stop();
});

describe('GET /api/portfolio-saved', () => {
  let handler: any;

  beforeEach(async () => {
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
    handler = require('../../pages/api/portfolio-saved').default;
    const db = mongoClient.db();
    await db.collection('portfolios').deleteMany({});
    // The test data is updated to use the user's email address as the userId.
    await db.collection('portfolios').insertOne({
      userId: 'test@example.com',
      createdAt: new Date(),
      portfolio: [{ ticker: 'AAPL', weight: 0.5 }],
      performance: [{ date: '2020-01-01', value: 100 }],
      gain: 5,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.dontMock('../../lib/mongodb');
    jest.dontMock('@clerk/nextjs/server');
  });

  it('returns the most recent saved portfolio', async () => {
    const req = httpMocks.createRequest({ method: 'GET' });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    const json = res._getJSONData();
    expect(json.portfolio).toEqual([{ ticker: 'AAPL', weight: 0.5 }]);
    expect(json.performance).toEqual([{ date: '2020-01-01', value: 100 }]);
    expect(json.gain).toBe(5);
  });

  it('rejects unsupported methods', async () => {
    const req = httpMocks.createRequest({ method: 'POST' });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
    expect(res.getHeader('Allow')).toBe('GET');
  });

  it('returns 401 if not authenticated', async () => {
    jest.resetModules();
    jest.doMock('../../lib/mongodb', () => ({
      __esModule: true,
      default: Promise.resolve(mongoClient),
    }));
    // The mock for @clerk/nextjs/server is updated to return an undefined user.
    jest.doMock('@clerk/nextjs/server', () => ({ getAuth: () => ({ user: undefined }) }));
    handler = require('../../pages/api/portfolio-saved').default;
    const req = httpMocks.createRequest({ method: 'GET' });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(401);
    const json = res._getJSONData();
    expect(json.error).toBe('Unauthorized');
  });
});
