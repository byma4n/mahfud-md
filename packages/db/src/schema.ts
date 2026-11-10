// Skema SQLite Mahfud.md — blueprint Bab 8.
// File .md di disk memegang isi dokumen; SQLite memegang pengguna, sesi,
// izin, riwayat revisi, jejak audit, dan indeks pencarian.
// Tabel virtual FTS5 (articles_fts) tidak didefinisikan di sini — ia dibuat
// lewat migrasi SQL 0001_init.sql karena Drizzle tidak memodelkan tabel
// virtual FTS5 secara langsung.

import { relations } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const dibuatPada = () =>
  integer("dibuat_pada", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date());

// ---------------------------------------------------------------------------
// Pengguna dan sesi
// ---------------------------------------------------------------------------

export const users = sqliteTable(
  "users",
  {
    id: id(),
    nama: text("nama").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    // Peran bawaan: admin | peninjau | penulis | pembaca (blueprint Bab 5).
    peran: text("peran").notNull().default("pembaca"),
    aktif: integer("aktif", { mode: "boolean" }).notNull().default(true),
    dibuatPada: dibuatPada(),
  },
  (t) => [uniqueIndex("users_email_unique").on(t.email)],
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    kedaluwarsaPada: integer("kedaluwarsa_pada", {
      mode: "timestamp_ms",
    }).notNull(),
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)],
);

// ---------------------------------------------------------------------------
// Struktur konten: Kategori > Seri > Topik > Artikel
// ---------------------------------------------------------------------------

export const categories = sqliteTable(
  "categories",
  {
    id: id(),
    slug: text("slug").notNull(),
    nama: text("nama").notNull(),
    deskripsi: text("deskripsi"),
    // Visibilitas: internal | publik (blueprint Bab 5).
    visibilitas: text("visibilitas").notNull().default("internal"),
    urutan: integer("urutan").notNull().default(0),
  },
  (t) => [uniqueIndex("categories_slug_unique").on(t.slug)],
);

export const series = sqliteTable(
  "series",
  {
    id: id(),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    nama: text("nama").notNull(),
    deskripsi: text("deskripsi"),
    visibilitas: text("visibilitas").notNull().default("internal"),
    // wajib_sidang: false = mode ringan, artikel langsung Berlaku saat disimpan.
    wajibSidang: integer("wajib_sidang", { mode: "boolean" })
      .notNull()
      .default(true),
    urutan: integer("urutan").notNull().default(0),
  },
  (t) => [
    uniqueIndex("series_category_slug_unique").on(t.categoryId, t.slug),
    index("series_category_id_idx").on(t.categoryId),
  ],
);

export const topics = sqliteTable(
  "topics",
  {
    id: id(),
    seriesId: text("series_id")
      .notNull()
      .references(() => series.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    nama: text("nama").notNull(),
    urutan: integer("urutan").notNull().default(0),
  },
  (t) => [
    uniqueIndex("topics_series_slug_unique").on(t.seriesId, t.slug),
    index("topics_series_id_idx").on(t.seriesId),
  ],
);

export const articles = sqliteTable(
  "articles",
  {
    id: id(),
    seriesId: text("series_id")
      .notNull()
      .references(() => series.id, { onDelete: "cascade" }),
    // topic_id boleh kosong — Artikel boleh langsung di bawah Seri.
    topicId: text("topic_id").references(() => topics.id, {
      onDelete: "set null",
    }),
    slug: text("slug").notNull(),
    judul: text("judul").notNull(),
    pathFile: text("path_file").notNull(),
    // Status: draf | diajukan | disahkan | berlaku | dicabut (blueprint Bab 4).
    // v0.1 memakai draf dan berlaku; sisanya aktif di v0.5.
    status: text("status").notNull().default("draf"),
    revisiBerlakuId: text("revisi_berlaku_id"),
    urutan: integer("urutan").notNull().default(0),
  },
  (t) => [
    uniqueIndex("articles_series_slug_unique").on(t.seriesId, t.slug),
    index("articles_series_id_idx").on(t.seriesId),
    index("articles_topic_id_idx").on(t.topicId),
  ],
);

// ---------------------------------------------------------------------------
// Revisi, putusan, audit, izin, aset
// ---------------------------------------------------------------------------

export const revisions = sqliteTable(
  "revisions",
  {
    id: id(),
    articleId: text("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    nomor: integer("nomor").notNull(),
    isiMd: text("isi_md").notNull(),
    ringkasanDiff: text("ringkasan_diff"),
    penulisId: text("penulis_id").references(() => users.id, {
      onDelete: "set null",
    }),
    // Sumber: web | disk | impor (blueprint Bab 9).
    sumber: text("sumber").notNull().default("web"),
    dibuatPada: dibuatPada(),
  },
  (t) => [
    uniqueIndex("revisions_article_nomor_unique").on(t.articleId, t.nomor),
    index("revisions_article_id_idx").on(t.articleId),
  ],
);

export const verdicts = sqliteTable(
  "verdicts",
  {
    id: id(),
    revisionId: text("revision_id")
      .notNull()
      .references(() => revisions.id, { onDelete: "cascade" }),
    peninjauId: text("peninjau_id").references(() => users.id, {
      onDelete: "set null",
    }),
    // Putusan: sahkan | tolak — selalu dengan catatan (blueprint Bab 4).
    putusan: text("putusan").notNull(),
    catatan: text("catatan").notNull(),
    dibuatPada: dibuatPada(),
  },
  (t) => [index("verdicts_revision_id_idx").on(t.revisionId)],
);

export const auditLog = sqliteTable(
  "audit_log",
  {
    id: id(),
    aktorId: text("aktor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    aksi: text("aksi").notNull(),
    entitas: text("entitas").notNull(),
    entitasId: text("entitas_id").notNull(),
    // Detail disimpan sebagai JSON string (append-only, tanpa tombol hapus).
    detail: text("detail", { mode: "json" }).$type<Record<string, unknown>>(),
    dibuatPada: dibuatPada(),
  },
  (t) => [index("audit_log_entitas_idx").on(t.entitas, t.entitasId)],
);

export const grants = sqliteTable(
  "grants",
  {
    id: id(),
    userId: text("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    peran: text("peran"),
    categoryId: text("category_id").references(() => categories.id, {
      onDelete: "cascade",
    }),
    seriesId: text("series_id").references(() => series.id, {
      onDelete: "cascade",
    }),
    // Level akses: baca | tulis | kelola (blueprint Bab 5).
    levelAkses: text("level_akses").notNull().default("baca"),
  },
  (t) => [
    index("grants_user_id_idx").on(t.userId),
    index("grants_series_id_idx").on(t.seriesId),
  ],
);

export const assets = sqliteTable(
  "assets",
  {
    id: id(),
    articleId: text("article_id").references(() => articles.id, {
      onDelete: "cascade",
    }),
    namaFile: text("nama_file").notNull(),
    pathFile: text("path_file").notNull(),
    ukuran: integer("ukuran").notNull().default(0),
    dibuatPada: dibuatPada(),
  },
  (t) => [index("assets_article_id_idx").on(t.articleId)],
);

// ---------------------------------------------------------------------------
// Relasi
// ---------------------------------------------------------------------------

export const categoriesRelations = relations(categories, ({ many }) => ({
  series: many(series),
  grants: many(grants),
}));

export const seriesRelations = relations(series, ({ one, many }) => ({
  category: one(categories, {
    fields: [series.categoryId],
    references: [categories.id],
  }),
  topics: many(topics),
  articles: many(articles),
  grants: many(grants),
}));

export const topicsRelations = relations(topics, ({ one, many }) => ({
  series: one(series, {
    fields: [topics.seriesId],
    references: [series.id],
  }),
  articles: many(articles),
}));

export const articlesRelations = relations(articles, ({ one, many }) => ({
  series: one(series, {
    fields: [articles.seriesId],
    references: [series.id],
  }),
  topic: one(topics, {
    fields: [articles.topicId],
    references: [topics.id],
  }),
  revisions: many(revisions),
  assets: many(assets),
}));

export const revisionsRelations = relations(revisions, ({ one, many }) => ({
  article: one(articles, {
    fields: [revisions.articleId],
    references: [articles.id],
  }),
  penulis: one(users, {
    fields: [revisions.penulisId],
    references: [users.id],
  }),
  verdicts: many(verdicts),
}));

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  revisions: many(revisions),
  verdicts: many(verdicts),
  grants: many(grants),
}));

// FTS5: tabel virtual articles_fts(article_id, judul, isi) dibuat di
// src/migrations/0001_init.sql beserta trigger sinkronisasinya.
