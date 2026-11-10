# Mahfud.md

**Dokumentasi Markdown yang disahkan, bukan sekadar ditulis.**

Mahfud.md adalah package aplikasi dokumentasi berbasis Markdown yang
open-source dan self-hosted 100%. Terinspirasi BookStack, dibangun ulang
dengan stack modern: file `.md` sebagai sumber kebenaran, satu file SQLite
sebagai database, dan alur pengesahan dokumen — draf yang diajukan,
disidangkan, disahkan, lalu berlaku.

- **Markdown adalah sumber kebenaran.** Isi dokumen selalu file `.md`
  polos. Kalau aplikasi ini suatu hari mati, dokumen pengguna tetap hidup.
- **Data tidak pernah meninggalkan server pengguna.** Tidak ada telemetri
  wajib, tidak ada pendaftaran akun pusat, tidak ada versi cloud.
- **Satu perintah untuk mulai.** Instalasi selesai dalam hitungan menit
  di VPS murah, lewat npm atau Docker.
- **Resmi itu jelas.** Pembaca selalu tahu versi mana yang berlaku.

Lisensi: MIT. Semua fitur gratis, tanpa edisi berbayar.

## Struktur konten

Konten disusun empat tingkat yang dipetakan langsung ke folder di disk:

| Tingkat  | Fungsi                                            | Di disk menjadi          |
| -------- | ------------------------------------------------- | ------------------------ |
| Kategori | Pengelompokan besar, mis. "Produk", "Internal"    | Folder tingkat pertama   |
| Seri     | Satu kesatuan dokumen, mis. "Panduan Barita Pro"  | Folder di dalam Kategori |
| Topik    | Pengelompokan artikel di dalam Seri; boleh kosong | Folder di dalam Seri     |
| Artikel  | Satu dokumen Markdown utuh                       | Satu file `.md`          |

Artikel boleh langsung di bawah Seri tanpa Topik. Contoh:

```text
data/docs/
  produk/                          # Kategori
    panduan-barita-pro/            # Seri
      instalasi/                   # Topik
        cara-install.md            # Artikel
        lisensi.md                 # Artikel
      pembaruan.md                 # Artikel langsung di bawah Seri
```

Setiap Artikel memakai frontmatter YAML (`judul`, `slug`, `status`,
`versi`, `ringkasan`) dan isi Markdown murni di bawahnya.

## Status artikel

| Status   | Arti                                                        |
| -------- | ----------------------------------------------------------- |
| Draf     | Sedang ditulis; hanya terlihat oleh penulis dan di atasnya   |
| Diajukan | Siap ditinjau; isi dikunci dari suntingan penulis (v0.5)     |
| Disahkan | Lolos peninjauan dan menerima Putusan setuju (v0.5)           |
| Berlaku  | Versi resmi yang tampil untuk pembaca                        |
| Dicabut  | Tidak berlaku lagi; tetap tersimpan sebagai arsip (v0.5)     |

v0.1 memakai status `Draf` dan `Berlaku`. Alur pengesahan penuh
(Diajukan, Sidang, Putusan, Dicabut) menyusul di v0.5.

## Instalasi

### Jalur npm

```bash
npx mahfud-md@latest init docs-saya
cd docs-saya
npx mahfud-md start
# buka http://localhost:3000
```

### Jalur Docker

```bash
docker run -d -p 3000:3000 -v ./data:/data byma4n/mahfud-md
```

### Dari repo ini (pengembangan)

```bash
git clone https://github.com/byma4n/mahfud-md.git
cd mahfud-md
pnpm install
pnpm dev
# buka http://localhost:3000
```

Persyaratan: Node.js 20+ dan pnpm 12.15.0.

## Perintah CLI

| Perintah              | Fungsi                                                    |
| --------------------- | --------------------------------------------------------- |
| `mahfud init [folder]`| Membuat instansi baru: folder data, database, akun Admin   |
| `mahfud start`        | Menjalankan server (port dari `mahfud.config.json`, bawaan 3000) |
| `mahfud doctor`       | Memeriksa kesehatan instansi: versi Node, izin folder, DB |
| `mahfud backup`       | Menyalin folder data menjadi arsip cadangan bertanggal     |
| `mahfud user:add`     | Membuat pengguna dari terminal (v0.1 penuh)               |

Konfigurasi ada di `mahfud.config.json` di folder instansi:

```json
{
  "port": 3000,
  "namaInstansi": "Dokumentasi Regar Studio",
  "bahasa": "id",
  "pendaftaranTerbuka": false
}
```

## Operasi harian

- **Backup = salin folder instansi** (atau jalankan `mahfud backup`).
  Tidak ada urutan dump database yang rumit.
- **Update = tarik versi baru lalu start ulang**
  (`npm update` atau `docker pull`); migrasi database berjalan otomatis.
- **Pindah server = pindahkan folder.** Instansi tidak terikat pada mesin,
  domain, atau akun mana pun.

## Struktur repo

```text
mahfud-md/
  apps/web/        # aplikasi Next.js (UI + API)
  packages/cli/    # perintah mahfud: init, start, backup, doctor
  packages/db/     # skema Drizzle + migrasi SQLite (12 tabel, FTS5)
  data/docs/       # contoh konten (Kategori > Seri > Topik > Artikel)
  Dockerfile       # image self-hosted (Next.js standalone)
```

## Roadmap

- **v0.1 — MVP:** init/start, CRUD Kategori/Seri/Topik/Artikel,
  editor Markdown + pratinjau, revisi, pencarian full-text, login lokal
  dan empat peran (Admin, Peninjau, Penulis, Pembaca), visibilitas
  internal dan publik per Seri.
- **v0.5 — Alur pengesahan lengkap:** Diajukan, Sidang, Putusan,
  Dicabut, jejak audit, Berita Acara, ekspor PDF/ZIP.
- **v1.0 — Rilis publik:** Docker image resmi, panduan install satu
  halaman, impor BookStack, sinkronisasi Git opsional, backup/restore
  dari panel Admin.

Di luar cakupan, secara permanen: versi cloud resmi, akun pusat, dan
fitur berbayar.

## Status scaffold v0.1

Fondasi ini sudah bisa jalan sebagai aplikasi baca: halaman beranda
menampilkan Kategori > Seri > Topik > Artikel dari `data/docs`, dan
halaman baca me-render file `.md` tersebut. Yang masih TODO menuju MVP
penuh (ditandai `TODO:` di kode):

- CRUD web + autentikasi lokal dan peran (rute `/masuk`, panel admin)
- Editor CodeMirror 6 + autosave (saat ini editor masih textarea sederhana)
- Penulisan balik ke file `.md` + tabel `revisions` dari editor web
- Pencarian FTS5 dari antarmuka (skema dan migrasi sudah siap)
- Render Markdown penuh remark/rehype (saat ini renderer minimal bawaan)
- Penyambungan `packages/db` ke `apps/web` (saat ini web membaca file
  langsung dari disk, sesuai prinsip "Markdown sumber kebenaran")

Keputusan produk dan skema lengkap ada di README ini dan di komentar
skema `packages/db/src/schema.ts`. Blueprint lengkap (PDF v1.2) disimpan
di luar repo sebagai dokumen rancangan.
