import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { resolve } from "path";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  config({ path: resolve(process.cwd(), ".env.local") });
}

if (!process.env.DATABASE_URL) {
  config({ path: resolve(process.cwd(), ".env") });
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sql = neon(process.env.DATABASE_URL);

const neonClient = ((query: string, params?: unknown[], options?: unknown) => {
  return sql.query(query, params ?? [], options as never);
}) as typeof sql;

neonClient.query = sql.query.bind(sql);
neonClient.transaction = sql.transaction.bind(sql);
neonClient.unsafe = sql.unsafe.bind(sql);

export const db = drizzle(neonClient, { schema });

export * from "./schema";
