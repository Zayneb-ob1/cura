import { readFile } from "node:fs/promises";
import path from "node:path";

export async function loadDatabaseEnvironment() {
  if (!process.env.MYSQL_HOST) {
    try {
      const contents = await readFile(path.join(process.cwd(), ".env.local"), "utf8");
      for (const line of contents.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const separator = trimmed.indexOf("=");
        if (separator < 1) continue;
        const name = trimmed.slice(0, separator).trim();
        const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
        process.env[name] ??= value;
      }
    } catch {
      // cPanel provides these variables directly in production.
    }
  }

  const required = ["MYSQL_HOST", "MYSQL_USER", "MYSQL_PASSWORD", "MYSQL_DATABASE"];
  const missing = required.filter((name) => process.env[name] === undefined || process.env[name] === "");
  if (missing.length > 0) throw new Error(`Missing MySQL environment variables: ${missing.join(", ")}`);

  const host = process.env.MYSQL_HOST.trim();
  if (process.env.VERCEL && ["127.0.0.1", "localhost", "::1"].includes(host.toLowerCase())) {
    throw new Error("MYSQL_HOST must be a remote MySQL hostname on Vercel; localhost is not reachable from Vercel Functions");
  }

  const port = Number.parseInt(process.env.MYSQL_PORT ?? "3306", 10);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("MYSQL_PORT must be an integer between 1 and 65535");
  }

  const ca = process.env.MYSQL_SSL_CA?.replace(/\\n/g, "\n").trim();
  const sslEnabled = process.env.MYSQL_SSL === "true" || process.env.MYSQL_SSL === "required" || Boolean(ca);
  const connectTimeout = Number.parseInt(process.env.MYSQL_CONNECT_TIMEOUT_MS ?? "10000", 10);

  return {
    host,
    port,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    charset: "utf8mb4",
    dateStrings: true,
    connectTimeout: Number.isInteger(connectTimeout) && connectTimeout >= 1_000 ? connectTimeout : 10_000,
    ssl: sslEnabled ? {
      ca: ca || undefined,
      rejectUnauthorized: process.env.MYSQL_SSL_REJECT_UNAUTHORIZED !== "false",
    } : undefined,
  };
}
