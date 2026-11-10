#!/usr/bin/env node
// CLI Mahfud.md — scaffold v0.1 (blueprint Bab 10).
// Perintah: init, start, doctor, backup, user:add.
// `user:add` dan pembuatan akun Admin lengkap (hash Argon2id) hadir di MVP
// penuh; scaffold ini menyiapkan folder, konfigurasi, dan pemeriksaan dasar.
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const VERSI = "0.1.0";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// packages/cli/src -> root repo (tata letak monorepo).
const ROOT_REPO = path.resolve(__dirname, "..", "..", "..");

function bacaKonfigurasi(folderInstansi) {
  const file = path.join(folderInstansi, "mahfud.config.json");
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function tulisKonfigurasi(folderInstansi, konfigurasi) {
  fs.writeFileSync(
    path.join(folderInstansi, "mahfud.config.json"),
    JSON.stringify(konfigurasi, null, 2) + "\n",
  );
}

function perintahInit(folderArg) {
  const folder = path.resolve(folderArg ?? "docs-saya");
  const folderData = path.join(folder, "data");
  const folderDocs = path.join(folderData, "docs");
  fs.mkdirSync(path.join(folderDocs, "produk", "panduan-barita-pro"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(folderData, "uploads"), { recursive: true });

  if (!fs.existsSync(path.join(folder, "mahfud.config.json"))) {
    tulisKonfigurasi(folder, {
      port: 3000,
      namaInstansi: "Dokumentasi Saya",
      bahasa: "id",
      pendaftaranTerbuka: false,
      folderKonten: "data/docs",
      database: "data/mahfud.db",
    });
    console.log("Konfigurasi dibuat: mahfud.config.json");
  } else {
    console.log("mahfud.config.json sudah ada, tidak ditimpa.");
  }

  console.log(`Instansi baru dibuat di: ${folder}`);
  console.log("Langkah berikutnya:");
  console.log(`  cd ${path.basename(folder)}`);
  console.log("  mahfud start   # lalu buka http://localhost:3000");
  console.log(
    "Catatan: akun Admin pertama dibuat lewat panel saat pertama jalan " +
      "(MVP penuh) — untuk scaffold ini, buat pengguna lewat `mahfud user:add` setelah MVP penuh tersedia.",
  );
}

function perintahStart() {
  const konfigurasi = bacaKonfigurasi(process.cwd()) ??
    bacaKonfigurasi(ROOT_REPO) ?? { port: 3000 };
  const port = konfigurasi.port ?? 3000;
  console.log(`Menjalankan Mahfud.md di http://localhost:${port} ...`);
  // Jalankan server web dari monorepo. Di instalasi npm, perintah ini
  // diganti oleh server standalone yang ikut ter-bundle (lihat Dockerfile).
  const child = spawn(
    "pnpm",
    ["--filter", "@mahfud-md/web", "start"],
    { cwd: ROOT_REPO, stdio: "inherit", env: { ...process.env, PORT: String(port) } },
  );
  child.on("error", () => {
    console.log("pnpm tidak ditemukan, mencoba npm ...");
    spawn("npm", ["run", "start", "--workspace=@mahfud-md/web"], {
      cwd: ROOT_REPO,
      stdio: "inherit",
      env: { ...process.env, PORT: String(port) },
    });
  });
}

function perintahDoctor() {
  const masalah = [];
  const nodeMayor = Number(process.versions.node.split(".")[0]);
  console.log(`Node.js ${process.version} ${nodeMayor >= 20 ? "(OK)" : "(KURANG: butuh 20+)"}`);
  if (nodeMayor < 20) masalah.push("Node.js di bawah 20");

  const konfigurasi = bacaKonfigurasi(process.cwd()) ?? bacaKonfigurasi(ROOT_REPO);
  console.log(
    `mahfud.config.json ${konfigurasi ? "(OK)" : "(KURANG: tidak ditemukan)"}`,
  );
  if (!konfigurasi) masalah.push("mahfud.config.json tidak ditemukan");

  const folderDocs =
    konfigurasi?.folderKonten ?? path.join(ROOT_REPO, "data", "docs");
  const adaDocs = fs.existsSync(path.resolve(ROOT_REPO, folderDocs));
  console.log(`Folder konten ${adaDocs ? "(OK)" : "(KURANG: tidak ditemukan)"}`);
  if (!adaDocs) masalah.push("folder konten tidak ditemukan");

  const fileDb = path.resolve(
    ROOT_REPO,
    konfigurasi?.database ?? "data/mahfud.db",
  );
  console.log(
    `Database ${fs.existsSync(fileDb) ? "(OK)" : "(belum dibuat — dibuat otomatis saat migrasi pertama)"}`,
  );

  if (masalah.length > 0) {
    console.log(`\nDoctor menemukan ${masalah.length} masalah:`);
    for (const m of masalah) console.log(`  - ${m}`);
    process.exit(1);
  }
  console.log("\nDoctor: instansi sehat.");
}

function perintahBackup() {
  const sumber = path.join(ROOT_REPO, "data");
  const stempel = new Date().toISOString().replace(/[:.]/g, "-");
  const tujuan = path.join(ROOT_REPO, "backup", `mahfud-backup-${stempel}`);
  if (!fs.existsSync(sumber)) {
    console.error("Folder data tidak ditemukan — tidak ada yang dicadangkan.");
    process.exit(1);
  }
  fs.cpSync(sumber, tujuan, { recursive: true });
  console.log(`Cadangan dibuat di: ${tujuan}`);
  console.log("Backup = salin folder instansi (blueprint Bab 10).");
}

function bantuan() {
  console.log(`mahfud ${VERSI} — CLI Mahfud.md`);
  console.log("");
  console.log("Penggunaan: mahfud <perintah> [opsi]");
  console.log("");
  console.log("Perintah:");
  console.log("  init [folder]   Membuat instansi baru (bawaan: docs-saya)");
  console.log("  start           Menjalankan server web");
  console.log("  doctor          Memeriksa kesehatan instansi");
  console.log("  backup          Menyalin folder data menjadi cadangan");
  console.log("  user:add        Membuat pengguna dari terminal (MVP penuh)");
}

const [perintah, arg] = process.argv.slice(2);

switch (perintah) {
  case "init":
    perintahInit(arg);
    break;
  case "start":
    perintahStart();
    break;
  case "doctor":
    perintahDoctor();
    break;
  case "backup":
    perintahBackup();
    break;
  case "user:add":
    console.log(
      "user:add belum tersedia di scaffold v0.1 — hadir di MVP penuh " +
        "bersama pembuatan akun Admin pertama dan hash kata sandi Argon2id.",
    );
    process.exit(1);
    break;
  case "--version":
  case "-v":
    console.log(VERSI);
    break;
  case "--help":
  case "-h":
  case undefined:
    bantuan();
    break;
  default:
    console.error(`Perintah tidak dikenal: ${perintah}`);
    bantuan();
    process.exit(1);
}
