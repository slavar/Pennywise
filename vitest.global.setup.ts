import { MongoMemoryServer } from 'mongodb-memory-server';

export default async function () {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  (global as any).__MONGOD__ = mongod;

  return async () => {
    await mongod.stop();
  };
}