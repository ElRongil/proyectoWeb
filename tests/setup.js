import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod;

export default async function globalSetup() {
  mongod = await MongoMemoryServer.create();
  process.env.DB_URI = mongod.getUri();
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
  process.env.JWT_EXPIRES_IN = '15m';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  global.__MONGOD__ = mongod;
}
