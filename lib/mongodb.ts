import { MongoClient, type Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI!;

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db("autarkchat");

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}
