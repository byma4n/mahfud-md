import Link from "next/link";
import { listKonten } from "@/lib/docs";

export default function Beranda() {
  const kategoris = listKonten();

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Dokumentasi yang disahkan, bukan sekadar ditulis.
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Jelajahi dokumentasi di bawah ini. Konten disusun
          Kategori &gt; Seri &gt; Topik &gt; Artikel dan tersimpan sebagai
          file Markdown biasa di folder <code>data/docs</code>.
        </p>
      </section>

      {kategoris.length === 0 ? (
        <p className="rounded-lg border p-6 text-muted-foreground">
          Belum ada konten. Jalankan <code>mahfud init</code> untuk membuat
          Kategori dan Seri pertama, atau tambahkan file .md ke{" "}
          <code>data/docs</code>.
        </p>
      ) : (
        kategoris.map((kategori) => (
          <section key={kategori.slug} className="space-y-4">
            <h2 className="text-xl font-semibold">{kategori.nama}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {kategori.seri.map((seri) => (
                <article
                  key={seri.slug}
                  className="rounded-lg border bg-card p-5"
                >
                  <h3 className="font-semibold">{seri.nama}</h3>
                  {seri.deskripsi ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {seri.deskripsi}
                    </p>
                  ) : null}
                  <ul className="mt-3 space-y-1 text-sm">
                    {seri.artikelLangsung.map((artikel) => (
                      <li key={artikel.slug}>
                        <Link
                          className="underline underline-offset-2"
                          href={`/baca/${kategori.slug}/${seri.slug}/${artikel.slug}`}
                        >
                          {artikel.judul}
                        </Link>
                      </li>
                    ))}
                    {seri.topik.map((topik) =>
                      topik.artikel.map((artikel) => (
                        <li key={artikel.slug}>
                          <Link
                            className="underline underline-offset-2"
                            href={`/baca/${kategori.slug}/${seri.slug}/${topik.slug}/${artikel.slug}`}
                          >
                            {topik.nama} — {artikel.judul}
                          </Link>
                        </li>
                      )),
                    )}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
