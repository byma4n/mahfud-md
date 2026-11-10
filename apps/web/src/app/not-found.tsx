import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Halaman tidak ditemukan</h1>
      <p className="text-muted-foreground">
        Artikel yang Anda cari tidak ada, sudah dipindah, atau belum berstatus
        Berlaku.
      </p>
      <Link href="/" className="underline underline-offset-2">
        Kembali ke Beranda
      </Link>
    </div>
  );
}
