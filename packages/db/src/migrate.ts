import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

// Menjalankan migrasi SQL mentah di src/migrations secara berurutan.
// Dipakai `pnpm db:migrate`. Drizzle Kit tetap tersedia untuk generate
// migrasi baru dari perubahan schema (`pnpm db:generate`).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.MAHFUD_DB_PATH ?? "./data/mahfud.db";
const dirMigrasi = path.join(__dirname, "migrations");

const sqlite = new Database(dbPath);
sqlite.pragma("foreign_keys = ON");

const files = fs
  .readdirSync(dirMigrasi)
  .filter((f) => f.endsWith(".sql"))
  .sort();

if (files.length === 0) {
  console.log("Tidak ada file migrasi.");
  process.exit(0);
}

for (const file of files) {
  const sql = fs.readFileSync(path.join(dirMigrasi, file), "utf-8");
  sqlite.exec(sql);
  console.log(`Migrasi diterapkan: ${file}`);
}

sqlite.close();
console.log(`Selesai. Database: ${dbPath}`);
