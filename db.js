import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

let db;

export async function connectDB() {
  const client = new MongoClient(process.env.MONGO_URI);

  await client.connect();

  db = client.db("Nobel_prize");

  console.log("✅ Połączono z MongoDB Atlas");

  return db;
}

export function getDB() {
  return db;
}