import pg from "pg";
import { SEED_FRIENDSHIPS } from "./seed-data";

const { Pool } = pg;

export interface InitDbResult {
  success: boolean;
  message: string;
  tableCreated: boolean;
  insertedCount: number;
  totalRowCount: number;
  error?: string;
}

export async function initDatabaseAndSeed(connectionString?: string): Promise<InitDbResult> {
  const url = connectionString || process.env.DATABASE_URL;
  if (!url) {
    return {
      success: false,
      message: "No DATABASE_URL provided or configured in environment variables.",
      tableCreated: false,
      insertedCount: 0,
      totalRowCount: 0,
    };
  }

  const isSsl =
    url.includes("sslmode=require") ||
    url.includes("neon.tech") ||
    url.includes("supabase.co") ||
    process.env.NODE_ENV === "production";

  const pool = new Pool({
    connectionString: url,
    ssl: isSsl ? { rejectUnauthorized: false } : undefined,
  });

  let client: pg.PoolClient | null = null;
  try {
    client = await pool.connect();

    // 1. Create table with unique constraint
    await client.query(`
      CREATE TABLE IF NOT EXISTS friendships (
        id SERIAL PRIMARY KEY,
        owner_id INTEGER NOT NULL,
        friend_id INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        CONSTRAINT friendships_owner_friend_unique UNIQUE (owner_id, friend_id)
      );
    `);

    // 2. Insert records
    let inserted = 0;
    for (const item of SEED_FRIENDSHIPS) {
      const res = await client.query(
        `INSERT INTO friendships (id, owner_id, friend_id, created_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (owner_id, friend_id) DO NOTHING`,
        [item.id, item.owner_id, item.friend_id, new Date(item.created_at)],
      );
      if (res.rowCount && res.rowCount > 0) {
        inserted += res.rowCount;
      }
    }

    // 3. Reset sequence to MAX(id)
    await client.query(`
      SELECT setval(
        pg_get_serial_sequence('friendships', 'id'),
        COALESCE((SELECT MAX(id) FROM friendships), 1)
      );
    `);

    // 4. Get total rows count
    const countRes = await client.query(`SELECT COUNT(*)::int as count FROM friendships;`);
    const totalRowCount = countRes.rows[0]?.count || 0;

    return {
      success: true,
      message: `Database initialized and seeded successfully. Inserted: ${inserted}, Total rows: ${totalRowCount}.`,
      tableCreated: true,
      insertedCount: inserted,
      totalRowCount,
    };
  } catch (err: any) {
    console.error("Database initialization failed:", err);
    return {
      success: false,
      message: err?.message || "Database initialization failed",
      tableCreated: false,
      insertedCount: 0,
      totalRowCount: 0,
      error: err?.stack || String(err),
    };
  } finally {
    if (client) client.release();
    await pool.end();
  }
}
