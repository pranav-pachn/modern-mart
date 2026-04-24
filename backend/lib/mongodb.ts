import { MongoClient } from "mongodb";

const rawUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/grocery-mart";
const uri = rawUri.replace("mongodb://localhost", "mongodb://127.0.0.1");

type MongoGlobal = typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

const globalForMongo = globalThis as MongoGlobal;

const clientPromise = (async () => {
  if (globalForMongo._mongoClientPromise) {
    try {
      return await globalForMongo._mongoClientPromise;
    } catch {
      globalForMongo._mongoClientPromise = undefined;
    }
  }

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
  });
  const nextPromise = client.connect();
  globalForMongo._mongoClientPromise = nextPromise;
  return await nextPromise;
})();

if (process.env.NODE_ENV !== "production") {
  globalForMongo._mongoClientPromise = clientPromise;
}

export default clientPromise;
