import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import { loadDatabaseEnvironment } from "./db-env.mjs";

const connection = await mysql.createConnection(await loadDatabaseEnvironment());
const migrationsDirectory = path.join(process.cwd(), "db", "migrations");

await connection.execute(
  `CREATE TABLE IF NOT EXISTS _cura_migrations (
    name VARCHAR(191) PRIMARY KEY,
    applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
);

const [appliedRows] = await connection.query("SELECT name FROM _cura_migrations");
const applied = new Set(appliedRows.map((row) => String(row.name)));
const files = (await readdir(migrationsDirectory)).filter((file) => file.endsWith(".sql")).sort();

for (const file of files) {
  if (applied.has(file)) continue;
  const contents = await readFile(path.join(migrationsDirectory, file), "utf8");
  const statements = contents.split(/\n-- statement-breakpoint\s*\n/).map((value) => value.trim()).filter(Boolean);
  for (const statement of statements) await connection.query(statement);
  await connection.execute("INSERT IGNORE INTO _cura_migrations (name) VALUES (?)", [file]);
  process.stdout.write(`Applied ${file}\n`);
}

await connection.end();
process.stdout.write("MySQL migrations are up to date.\n");
