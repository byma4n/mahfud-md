# @mahfud-md/db

Skema dan migrasi SQLite Mahfud.md (blueprint Bab 8).

- `src/schema.ts` — 11 tabel relasional Drizzle: `users`, `sessions`,
  `categories`, `series`, `topics`, `articles`, `revisions`, `verdicts`,
  `audit_log`, `grants`, `assets`.
- `src/migrations/0001_init.sql` — DDL yang sama + tabel virtual FTS5
  `articles_fts` beserta trigger sinkronisasinya.
- `src/index.ts` — `createDb(path)`; lokasi bawaan `./data/mahfud.db`.

```bash
pnpm db:generate   # hasilkan migrasi baru dari perubahan schema
pnpm db:migrate    # jalankan migrasi SQL mentah di src/migrations
```

Catatan: `apps/web` pada scaffold v0.1 belum mengimpor package ini — web
membaca file `.md` langsung dari disk. Penyambungan database ke web adalah
TODO menuju MVP penuh.
