import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;

if (!uri) {
  throw new Error("Missing MONGODB_URI environment variable.");
}

type MongoGlobal = typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

const globalForMongo = globalThis as MongoGlobal;

const client = globalForMongo._mongoClientPromise
  ? undefined
  : new MongoClient(uri);

const clientPromise: Promise<MongoClient> =
  globalForMongo._mongoClientPromise ?? client!.connect();

if (process.env.NODE_ENV !== "production") {
  globalForMongo._mongoClientPromise = clientPromise;
}

export default clientPromise;
