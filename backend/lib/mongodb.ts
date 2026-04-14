import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Missing MONGODB_URI environment variable.");
}

type MongoGlobal = typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

const globalForMongo = globalThis as MongoGlobal;

const clientPromise =
  globalForMongo._mongoClientPromise ?? new MongoClient(uri).connect();

if (process.env.NODE_ENV !== "production") {
  globalForMongo._mongoClientPromise = clientPromise;
}

export default clientPromise;
