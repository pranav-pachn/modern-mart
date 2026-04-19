import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { MongoClient } from "mongodb";

function loadEnv(filePath) {
  if (!existsSync(filePath)) return;
  const env = readFileSync(filePath, "utf8");
  for (const line of env.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value.replace(/^["']|["']$/g, "");
    }
  }
}

loadEnv(path.resolve(process.cwd(), ".env"));

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/grocery-mart";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db();
    const users = await db.collection("users").find({}).toArray();
    console.log(JSON.stringify(users, null, 2));
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
