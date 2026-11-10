import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

export * from "./schema";

export type MahfudDb = BetterSQLite3Database<typeof schema>;

/**
 * Membuka (atau membuat) database SQLite instansi.
 * Lokasi bawaan: ./data/mahfud.db — bisa diubah lewat MAHFUD_DB_PATH.
 */
export function createDb(dbPath?: string): MahfudDb {
  const path =
    dbPath ?? process.env.MAHFUD_DB_PATH ?? "./data/mahfud.db";
  const sqlite = new Database(path);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema });
}
