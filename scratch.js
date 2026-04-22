const { MongoClient } = require("mongodb");
require("dotenv").config({ path: "./backend/.env.local" });

async function check() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log("No MONGODB_URI");
    return;
  }
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  const history = await db.collection("aiHistory").find().toArray();
  console.log("AI History Count in DB:", history.length);
  if (history.length > 0) {
    console.log("Latest item:", history[0].prompt);
  }
  await client.close();
}

check().catch(console.error);
