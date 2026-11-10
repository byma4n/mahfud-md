import Link from "next/link";
import { notFound } from "next/navigation";
import { bacaArtikelPenuh } from "@/lib/docs";
import { renderMarkdown } from "@/lib/markdown";

type Props = {
  params: Promise<{ slug?: string[] }>;
};

export default async function BacaArtikel({ params }: Props) {
  const { slug } = await params;
  const artikel = slug ? bacaArtikelPenuh(slug) : null;
  if (!artikel) notFound();

  const labelStatus =
    artikel.status === "berlaku" ? "Berlaku" : artikel.status;

  return (
    <article className="space-y-6">
      <nav className="text-sm text-muted-foreground">
        <Link href="/" className="underline underline-offset-2">
          Beranda
        </Link>
        {" / "}
        <span>{artikel.kategori}</span>
        {" / "}
        <span>{artikel.seri}</span>
        {artikel.topik ? (
          <>
            {" / "}
            <span>{artikel.topik}</span>
          </>
        ) : null}
      </nav>

      <header className="space-y-2 border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight">
          {artikel.judul}
        </h1>
        <p className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span className="rounded-full border px-2 py-0.5">
            Status: {labelStatus}
          </span>
          <span className="rounded-full border px-2 py-0.5">
            Versi {artikel.versi}
          </span>
          <span className="rounded-full border px-2 py-0.5">
            {artikel.pathFile.split("/").slice(-1)[0]}
          </span>
        </p>
        {artikel.ringkasan ? (
          <p className="text-muted-foreground">{artikel.ringkasan}</p>
        ) : null}
      </header>

      <div
        className="prosa"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(artikel.isi) }}
      />
    </article>
  );
}
