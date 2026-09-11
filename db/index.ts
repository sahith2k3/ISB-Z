import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// Singleton connection pool for serverless environments (e.g. Vercel)
let pool: pg.Pool | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not configured. Please add your PostgreSQL connection string in environment variables.",
    );
  }
  if (!dbInstance) {
    const isSsl =
      process.env.DATABASE_URL.includes("sslmode=require") ||
      process.env.DATABASE_URL.includes("neon.tech") ||
      process.env.DATABASE_URL.includes("supabase.co") ||
      process.env.NODE_ENV === "production";

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isSsl ? { rejectUnauthorized: false } : undefined,
    });
    dbInstance = drizzle(pool, { schema });
  }
  return dbInstance;
}

// Lazy proxy to ensure Next.js build-time static generation does not fail if DATABASE_URL is not yet provided
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    const instance = getDb();
    const val = (instance as any)[prop];
    return typeof val === "function" ? val.bind(instance) : val;
  },
});

export * from "./schema";
