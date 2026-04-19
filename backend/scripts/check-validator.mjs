import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(backendRoot, "..");

loadEnv(path.join(repoRoot, ".env"));

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/grocery-mart";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db();
    const info = await db.command({ listCollections: 1, filter: { name: 'orders' } });
    console.log(JSON.stringify(info.cursor.firstBatch[0].options.validator, null, 2));
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
