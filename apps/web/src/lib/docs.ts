import fs from "node:fs";
import path from "node:path";

// Pembaca konten dari disk — file .md adalah sumber kebenaran (blueprint Bab 8).
// TODO(v0.1): sambungkan ke packages/db agar metadata, status, dan revisi
// ikut terbaca dari SQLite; saat ini web membaca file langsung dari disk.

export type Artikel = {
  slug: string;
  judul: string;
  status: string;
  versi: number;
  ringkasan?: string;
  pathFile: string;
};

export type Topik = {
  slug: string;
  nama: string;
  artikel: Artikel[];
};

export type Seri = {
  slug: string;
  nama: string;
  deskripsi?: string;
  topik: Topik[];
  artikelLangsung: Artikel[];
};

export type Kategori = {
  slug: string;
  nama: string;
  seri: Seri[];
};

export type ArtikelPenuh = Artikel & {
  isi: string;
  kategori: string;
  seri: string;
  topik?: string;
};

const ROOT_KONTEN = path.join(process.cwd(), "..", "..", "data", "docs");

function folderKonten(): string {
  // Di output standalone, cwd adalah apps/web/.next/standalone/apps/web,
  // jadi cari folder data/docs dengan menelusuri ke atas.
  let dir = process.cwd();
  for (let i = 0; i < 6; i += 1) {
    const kandidat = path.join(dir, "data", "docs");
    if (fs.existsSync(kandidat)) return kandidat;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return ROOT_KONTEN;
}

/** "01-instalasi" -> "instalasi"; "cara-install.md" -> "cara-install". */
export function bersihkanSlug(nama: string): string {
  const tanpaEkstensi = nama.replace(/\.md$/i, "");
  return tanpaEkstensi.replace(/^\d+[-_]/, "");
}

function judulDariSlug(slug: string): string {
  return slug
    .split("-")
    .map((kata) => kata.charAt(0).toUpperCase() + kata.slice(1))
    .join(" ");
}

/** Parser frontmatter YAML minimal (cukup untuk judul/slug/status/versi/ringkasan). */
export function parseFrontmatter(teks: string): {
  meta: Record<string, string>;
  isi: string;
} {
  const cocok = teks.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!cocok) return { meta: {}, isi: teks };
  const meta: Record<string, string> = {};
  for (const baris of cocok[1].split(/\r?\n/)) {
    const idx = baris.indexOf(":");
    if (idx > 0) {
      meta[baris.slice(0, idx).trim()] = baris
        .slice(idx + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
    }
  }
  return { meta, isi: cocok[2] };
}

function bacaArtikel(file: string): Artikel {
  // turbopackIgnore: path file berasal dari pemindaian folder data/docs
  // (bukan dari input pengguna) — jangan lacak seluruh proyek saat build.
  const teks = fs.readFileSync(/* turbopackIgnore: true */ file, "utf-8");
  const { meta } = parseFrontmatter(teks);
  const slug = meta.slug ?? bersihkanSlug(path.basename(file));
  return {
    slug,
    judul: meta.judul ?? judulDariSlug(slug),
    status: meta.status ?? "berlaku",
    versi: Number(meta.versi ?? "1"),
    ringkasan: meta.ringkasan,
    pathFile: file,
  };
}

function daftarMd(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".md"))
    .map((e) => path.join(dir, e.name))
    .sort();
}

function daftarFolder(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => path.join(dir, e.name))
    .sort();
}

export function listKonten(): Kategori[] {
  const root = folderKonten();
  return daftarFolder(root).map((dirKategori) => {
    const slugKategori = bersihkanSlug(path.basename(dirKategori));
    const seri: Seri[] = daftarFolder(dirKategori).map((dirSeri) => {
      const slugSeri = bersihkanSlug(path.basename(dirSeri));
      const topik: Topik[] = daftarFolder(dirSeri).map((dirTopik) => ({
        slug: bersihkanSlug(path.basename(dirTopik)),
        nama: judulDariSlug(bersihkanSlug(path.basename(dirTopik))),
        artikel: daftarMd(dirTopik).map(bacaArtikel),
      }));
      return {
        slug: slugSeri,
        nama: judulDariSlug(slugSeri),
        topik,
        artikelLangsung: daftarMd(dirSeri).map(bacaArtikel),
      };
    });
    return { slug: slugKategori, nama: judulDariSlug(slugKategori), seri };
  });
}

export function bacaArtikelPenuh(segmen: string[]): ArtikelPenuh | null {
  // segmen: [kategori, seri, (topik)?, artikel]
  if (segmen.length < 3 || segmen.length > 4) return null;
  const root = folderKonten();
  const cariFolder = (induk: string, slug: string): string | null => {
    const ketemu = daftarFolder(induk).find(
      (d) => bersihkanSlug(path.basename(d)) === slug,
    );
    return ketemu ?? null;
  };
  const dirKategori = cariFolder(root, segmen[0]);
  if (!dirKategori) return null;
  const dirSeri = cariFolder(dirKategori, segmen[1]);
  if (!dirSeri) return null;

  let file: string | null = null;
  let topik: string | undefined;
  if (segmen.length === 4) {
    const dirTopik = cariFolder(dirSeri, segmen[2]);
    if (!dirTopik) return null;
    topik = segmen[2];
    file =
      daftarMd(dirTopik).find(
        (f) => bacaArtikel(f).slug === segmen[3],
      ) ?? null;
  } else {
    file =
      daftarMd(dirSeri).find(
        (f) => bacaArtikel(f).slug === segmen[2],
      ) ?? null;
  }
  if (!file) return null;

  const teks = fs.readFileSync(/* turbopackIgnore: true */ file, "utf-8");
  const { meta, isi } = parseFrontmatter(teks);
  const slug = meta.slug ?? bersihkanSlug(path.basename(file));
  return {
    slug,
    judul: meta.judul ?? judulDariSlug(slug),
    status: meta.status ?? "berlaku",
    versi: Number(meta.versi ?? "1"),
    ringkasan: meta.ringkasan,
    pathFile: file,
    isi,
    kategori: segmen[0],
    seri: segmen[1],
    topik,
  };
}
