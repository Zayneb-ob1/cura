import { readdir } from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import { loadDatabaseEnvironment } from "./db-env.mjs";

const expectedTables = [
  "_cura_migrations",
  "appointments",
  "blocked_ips",
  "contacts",
  "doctors",
  "form_configs",
  "form_fields",
  "rate_limit_buckets",
  "reviews",
  "site_settings",
];

const config = await loadDatabaseEnvironment();
const connection = await mysql.createConnection(config);

try {
  const [serverRows] = await connection.query(
    "SELECT VERSION() AS version, @@character_set_database AS charset, @@collation_database AS collation",
  );
  const [tableRows] = await connection.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()",
  );
  const availableTables = new Set(tableRows.map((row) => String(row.TABLE_NAME ?? row.table_name)));
  const missingTables = expectedTables.filter((table) => !availableTables.has(table));
  if (missingTables.length > 0) throw new Error(`Missing MySQL tables: ${missingTables.join(", ")}`);

  const migrationFiles = (await readdir(path.join(process.cwd(), "db", "migrations")))
    .filter((file) => file.endsWith(".sql"))
    .sort();
  const [migrationRows] = await connection.query("SELECT name FROM _cura_migrations ORDER BY name");
  const applied = new Set(migrationRows.map((row) => String(row.name)));
  const missingMigrations = migrationFiles.filter((file) => !applied.has(file));
  if (missingMigrations.length > 0) {
    throw new Error(`Unapplied MySQL migrations: ${missingMigrations.join(", ")}`);
  }

  const server = serverRows[0];
  process.stdout.write(
    `MySQL check passed (${server.version}; ${server.charset}/${server.collation}; ${migrationFiles.length} migrations).\n`,
  );
} finally {
  await connection.end();
}
