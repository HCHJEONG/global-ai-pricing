import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema";

const defaultDatabaseUrl = "file:./data/global-ai-pricing.db";

export type DatabaseClient = ReturnType<typeof drizzle<typeof schema>>;

export type SqliteDatabase = Database.Database;

function pathFromDatabaseUrl(databaseUrl: string): string {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error("Only file: SQLite DATABASE_URL values are supported.");
  }

  return databaseUrl.slice("file:".length);
}

export function resolveDatabasePath(databaseUrl = process.env.DATABASE_URL): string {
  const rawPath = pathFromDatabaseUrl(databaseUrl ?? defaultDatabaseUrl);
  return path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath);
}

export function createSqliteConnection(databaseUrl = process.env.DATABASE_URL) {
  const databasePath = resolveDatabasePath(databaseUrl);
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });

  const sqlite = new Database(databasePath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  return sqlite;
}

export function createDatabaseClient(sqlite = createSqliteConnection()) {
  return drizzle(sqlite, { schema });
}
