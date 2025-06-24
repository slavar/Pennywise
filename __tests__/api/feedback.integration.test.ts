import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import httpMocks from "node-mocks-http";

let mongod: MongoMemoryServer;
let mongoClient: MongoClient;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  mongoClient = new MongoClient(process.env.MONGODB_URI!);
  await mongoClient.connect();
});

afterAll(async () => {
  await mongoClient.close();
  await mongod.stop();
});

describe("/api/feedback", () => {
  let handler: any;
  beforeEach(() => {
    // Patch the db lib for this test
    jest.resetModules();
    jest.doMock("../../lib/mongodb", () => ({
      __esModule: true,
      default: Promise.resolve(mongoClient)
    }));
    handler = require("../../pages/api/feedback").default;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.dontMock("../../lib/mongodb");
  });

  it("returns 201 and saves feedback for valid POST", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { feedback: "This is a test feedback!" },
    });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(201);
    const json = res._getJSONData();
    expect(json.message).toMatch(/submitted/i);
    // Check feedback in DB
    const db = mongoClient.db();
    const rec = await db.collection("UserFeedback").findOne({ feedback: "This is a test feedback!" });
    expect(rec).toBeTruthy();
    expect(typeof rec.createdAt).toBe("object");
  });

  it("returns 400 for missing feedback", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: {},
    });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
    const json = res._getJSONData();
    expect(json.message).toMatch(/required/i);
  });

  it("rejects unsupported method", async () => {
    const req = httpMocks.createRequest({ method: "GET" });
    const res = httpMocks.createResponse();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
    expect(res._getJSONData().message).toMatch(/not allowed/i);
  });
});