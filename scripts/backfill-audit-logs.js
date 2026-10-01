const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function main() {
  const url = process.argv[2] || process.env.DATABASE_URL;
  if (!url) {
    console.error("Usage: node scripts/backfill-audit-logs.js [DATABASE_URL]");
    console.error("Or set the DATABASE_URL environment variable.");
    process.exit(1);
  }

  const studentsPath = path.join(__dirname, '..', 'data', 'students.json');
  if (!fs.existsSync(studentsPath)) {
    console.error("Cannot find data/students.json at", studentsPath);
    process.exit(1);
  }

  const students = JSON.parse(fs.readFileSync(studentsPath, 'utf8'));
  console.log(`Loaded ${students.length} students from roster.`);

  const isSsl =
    url.includes("sslmode=require") ||
    url.includes("neon.tech") ||
    url.includes("supabase.co") ||
    process.env.NODE_ENV === "production";

  const pool = new Pool({
    connectionString: url,
    ssl: isSsl ? { rejectUnauthorized: false } : undefined,
  });

  const client = await pool.connect();
  try {
    console.log("Connected to database. Ensuring columns exist...");
    await client.query(`
      ALTER TABLE friendship_audit_logs ADD COLUMN IF NOT EXISTS owner_name VARCHAR(128);
      ALTER TABLE friendship_audit_logs ADD COLUMN IF NOT EXISTS friend_name VARCHAR(128);
    `);

    console.log("Creating temporary student lookup table...");
    await client.query(`
      CREATE TEMP TABLE IF NOT EXISTS temp_student_names (
        id INTEGER PRIMARY KEY,
        name VARCHAR(128) NOT NULL
      );
    `);

    const studentIds = [];
    const studentNames = [];
    for (const s of students) {
      studentIds.push(s.id);
      studentNames.push(s.name);
    }

    await client.query(
      `INSERT INTO temp_student_names (id, name)
       SELECT * FROM UNNEST($1::int[], $2::varchar[])
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
      [studentIds, studentNames],
    );

    console.log("Updating friendship_audit_logs where owner_name or friend_name is null...");
    const updateRes = await client.query(`
      UPDATE friendship_audit_logs f
      SET 
        owner_name = COALESCE(f.owner_name, (SELECT name FROM temp_student_names WHERE id = f.owner_id)),
        friend_name = COALESCE(f.friend_name, (SELECT name FROM temp_student_names WHERE id = f.friend_id))
      WHERE f.owner_name IS NULL OR f.friend_name IS NULL;
    `);

    await client.query(`DROP TABLE IF EXISTS temp_student_names;`);

    console.log(`Successfully backfilled names for ${updateRes.rowCount ?? 0} friendship audit log records!`);
  } catch (err) {
    console.error("Backfilling failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
