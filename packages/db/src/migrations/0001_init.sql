-- Mahfud.md — migrasi awal 0001 (blueprint Bab 8)
-- 11 tabel relasional + 1 tabel virtual FTS5 (articles_fts).
-- Dijalankan lewat `pnpm db:migrate` (packages/db/src/migrate.ts).
-- Skema Drizzle yang setara ada di packages/db/src/schema.ts.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  peran TEXT NOT NULL DEFAULT 'pembaca',
  aktif INTEGER NOT NULL DEFAULT 1,
  dibuat_pada INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (email);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  kedaluwarsa_pada INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  nama TEXT NOT NULL,
  deskripsi TEXT,
  visibilitas TEXT NOT NULL DEFAULT 'internal',
  urutan INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_unique ON categories (slug);

CREATE TABLE IF NOT EXISTS series (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories (id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  nama TEXT NOT NULL,
  deskripsi TEXT,
  visibilitas TEXT NOT NULL DEFAULT 'internal',
  wajib_sidang INTEGER NOT NULL DEFAULT 1,
  urutan INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS series_category_slug_unique ON series (category_id, slug);
CREATE INDEX IF NOT EXISTS series_category_id_idx ON series (category_id);

CREATE TABLE IF NOT EXISTS topics (
  id TEXT PRIMARY KEY,
  series_id TEXT NOT NULL REFERENCES series (id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  nama TEXT NOT NULL,
  urutan INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS topics_series_slug_unique ON topics (series_id, slug);
CREATE INDEX IF NOT EXISTS topics_series_id_idx ON topics (series_id);

CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  series_id TEXT NOT NULL REFERENCES series (id) ON DELETE CASCADE,
  topic_id TEXT REFERENCES topics (id) ON DELETE SET NULL,
  slug TEXT NOT NULL,
  judul TEXT NOT NULL,
  path_file TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draf',
  revisi_berlaku_id TEXT,
  urutan INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS articles_series_slug_unique ON articles (series_id, slug);
CREATE INDEX IF NOT EXISTS articles_series_id_idx ON articles (series_id);
CREATE INDEX IF NOT EXISTS articles_topic_id_idx ON articles (topic_id);

CREATE TABLE IF NOT EXISTS revisions (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL REFERENCES articles (id) ON DELETE CASCADE,
  nomor INTEGER NOT NULL,
  isi_md TEXT NOT NULL,
  ringkasan_diff TEXT,
  penulis_id TEXT REFERENCES users (id) ON DELETE SET NULL,
  sumber TEXT NOT NULL DEFAULT 'web',
  dibuat_pada INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS revisions_article_nomor_unique ON revisions (article_id, nomor);
CREATE INDEX IF NOT EXISTS revisions_article_id_idx ON revisions (article_id);

CREATE TABLE IF NOT EXISTS verdicts (
  id TEXT PRIMARY KEY,
  revision_id TEXT NOT NULL REFERENCES revisions (id) ON DELETE CASCADE,
  peninjau_id TEXT REFERENCES users (id) ON DELETE SET NULL,
  putusan TEXT NOT NULL,
  catatan TEXT NOT NULL,
  dibuat_pada INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS verdicts_revision_id_idx ON verdicts (revision_id);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  aktor_id TEXT REFERENCES users (id) ON DELETE SET NULL,
  aksi TEXT NOT NULL,
  entitas TEXT NOT NULL,
  entitas_id TEXT NOT NULL,
  detail TEXT,
  dibuat_pada INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS audit_log_entitas_idx ON audit_log (entitas, entitas_id);

CREATE TABLE IF NOT EXISTS grants (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users (id) ON DELETE CASCADE,
  peran TEXT,
  category_id TEXT REFERENCES categories (id) ON DELETE CASCADE,
  series_id TEXT REFERENCES series (id) ON DELETE CASCADE,
  level_akses TEXT NOT NULL DEFAULT 'baca'
);
CREATE INDEX IF NOT EXISTS grants_user_id_idx ON grants (user_id);
CREATE INDEX IF NOT EXISTS grants_series_id_idx ON grants (series_id);

CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  article_id TEXT REFERENCES articles (id) ON DELETE CASCADE,
  nama_file TEXT NOT NULL,
  path_file TEXT NOT NULL,
  ukuran INTEGER NOT NULL DEFAULT 0,
  dibuat_pada INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS assets_article_id_idx ON assets (article_id);

-- ---------------------------------------------------------------------------
-- Pencarian full-text (FTS5, blueprint Bab 9).
-- Indeks di atas judul artikel + isi teks polos revisi yang berlaku.
-- Aplikasi mengisi kolom `isi` saat sebuah revisi disahkan (menjadi Berlaku);
-- trigger di bawah menjaga baris FTS tetap ada/terhapus mengikuti artikel.
-- TODO(v0.1): sinkronisasi isi otomatis dari revisions saat pengesahan.
-- ---------------------------------------------------------------------------
CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts USING fts5(
  article_id UNINDEXED,
  judul,
  isi,
  tokenize = 'unicode61'
);

CREATE TRIGGER IF NOT EXISTS articles_fts_insert
AFTER INSERT ON articles BEGIN
  INSERT INTO articles_fts (article_id, judul, isi)
  VALUES (NEW.id, NEW.judul, '');
END;

CREATE TRIGGER IF NOT EXISTS articles_fts_delete
AFTER DELETE ON articles BEGIN
  DELETE FROM articles_fts WHERE article_id = OLD.id;
END;
