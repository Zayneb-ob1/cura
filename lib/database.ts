import "server-only";
import mysql, { type Pool, type PoolOptions } from "mysql2/promise";

type DatabaseGlobal = typeof globalThis & { __curaMysqlPool?: Pool };

const databaseGlobal = globalThis as DatabaseGlobal;

function integerEnvironment(name: string, fallback: number, minimum: number, maximum: number) {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isInteger(parsed) ? Math.min(maximum, Math.max(minimum, parsed)) : fallback;
}

function sslOptions(): PoolOptions["ssl"] {
  const ca = process.env.MYSQL_SSL_CA?.replace(/\\n/g, "\n").trim();
  const sslEnabled = process.env.MYSQL_SSL === "true" || process.env.MYSQL_SSL === "required" || Boolean(ca);
  if (!sslEnabled) return undefined;
  return {
    ca: ca || undefined,
    rejectUnauthorized: process.env.MYSQL_SSL_REJECT_UNAUTHORIZED !== "false",
  };
}

function createDatabasePool() {
  const host = process.env.MYSQL_HOST?.trim();
  const user = process.env.MYSQL_USER?.trim();
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE?.trim();
  if (!host || !user || password === undefined || !database) {
    throw new Error("MySQL environment variables are not configured");
  }
  if (process.env.VERCEL && ["127.0.0.1", "localhost", "::1"].includes(host.toLowerCase())) {
    throw new Error("MYSQL_HOST must point to a remote MySQL server when deployed on Vercel");
  }

  return mysql.createPool({
    host,
    port: integerEnvironment("MYSQL_PORT", 3306, 1, 65_535),
    user,
    password,
    database,
    charset: "utf8mb4",
    dateStrings: true,
    waitForConnections: true,
    connectionLimit: integerEnvironment("MYSQL_CONNECTION_LIMIT", 2, 1, 20),
    maxIdle: integerEnvironment("MYSQL_MAX_IDLE", 1, 0, 20),
    idleTimeout: integerEnvironment("MYSQL_IDLE_TIMEOUT_MS", 60_000, 1_000, 600_000),
    connectTimeout: integerEnvironment("MYSQL_CONNECT_TIMEOUT_MS", 10_000, 1_000, 60_000),
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ssl: sslOptions(),
  });
}

export function database() {
  databaseGlobal.__curaMysqlPool ??= createDatabasePool();
  return databaseGlobal.__curaMysqlPool;
}
