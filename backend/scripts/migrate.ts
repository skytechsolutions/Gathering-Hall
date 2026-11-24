import { Pool } from "pg";
import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";

// Load environment variables (.env.local or .env)
const envCandidates = [
  path.resolve(process.cwd(), ".env.local"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, "../.env.local"),
  path.resolve(__dirname, "../.env"),
  path.resolve(__dirname, "../../.env.local"),
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../../frontend/.env.local"),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    config({ path: envPath });
    break;
  }
}

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = Number(process.env.DB_PORT || 5432);
const DB_USER = process.env.DB_USER || "postgres";
const DB_PASSWORD = process.env.DB_PASSWORD || "samij7141";
const TARGET_DB = "Chamkani Gathering Hall";

async function ensureDatabaseExists() {
  console.log(`Checking if database "${TARGET_DB}" exists on PostgreSQL...`);
  // Connect to default maintenance database 'postgres'
  const rootPool = new Pool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: "postgres",
  });

  try {
    const res = await rootPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [TARGET_DB]
    );

    if (res.rows.length === 0) {
      console.log(`Database "${TARGET_DB}" does not exist. Creating it now...`);
      // Database names with spaces must be double-quoted in SQL
      await rootPool.query(`CREATE DATABASE "${TARGET_DB}"`);
      console.log(`✓ Database "${TARGET_DB}" created successfully!`);
    } else {
      console.log(`✓ Database "${TARGET_DB}" already exists.`);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`Could not check/create database via root pool: ${msg}`);
  } finally {
    await rootPool.end();
  }
}

async function runMigration() {
  console.log("==================================================");
  console.log(" PostgreSQL Automated Database Setup & Migration");
  console.log("==================================================");

  // 1. Ensure the database itself exists in PostgreSQL
  await ensureDatabaseExists();

  const connectionString =
    process.env.DATABASE_URL ||
    `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${encodeURIComponent(TARGET_DB)}?schema=public`;

  console.log(`Connecting to target database "${TARGET_DB}"...`);
  const pool = new Pool({ connectionString });

  try {
    const client = await pool.connect();
    console.log("✓ Connected to target database successfully!");
    client.release();

    const sqlPath = path.resolve(__dirname, "../database/pgadmin_schema.sql");
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`Migration SQL file not found at: ${sqlPath}`);
    }

    console.log(`Reading SQL migration file: ${path.basename(sqlPath)}...`);
    const sql = fs.readFileSync(sqlPath, "utf-8");

    console.log("Executing SQL schema and seed data in PostgreSQL...");
    await pool.query(sql);

    console.log("\n==================================================");
    console.log("✓ Migration Completed Successfully!");
    console.log("==================================================");
    console.log("The following have been created in your PostgreSQL database:");
    console.log("  • Database: 'Chamkani Gathering Hall'");
    console.log("  • Table: users (Admin: admin@example.com / password: samij7141)");
    console.log("  • Table: customers (Pre-seeded with sample customer)");
    console.log("  • Table: bookings (Pre-seeded with upcoming booking)");
    console.log("  • Table: reference_values (Event types, shifts)");
    console.log("  • Table: activity_logs, whatsapp_reminders, media_uploads");
    console.log("\nYou can now log in at http://localhost:3000\n");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("\n❌ Migration Failed!");
    console.error(`Error: ${msg}`);
    console.error("\nIf the database does not exist in pgAdmin 4:");
    console.error("1. Open pgAdmin 4 -> Connect to PostgreSQL 18");
    console.error("2. Right-click 'Databases' -> Create -> Database...");
    console.error(`3. Enter name: "${TARGET_DB}" and click Save.`);
    console.error("4. Re-run this command: npm run db:migrate");
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
