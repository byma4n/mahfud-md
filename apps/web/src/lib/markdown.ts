// Renderer Markdown minimal bawaan (scaffold v0.1).
// Menangani heading, paragraf, daftar, kode, tautan, tebal/miring, kutipan.
// TODO(v0.1): ganti dengan remark/rehype + rehype-sanitize sesuai blueprint
// Bab 7 agar tabel, footnote, dan sanitasi HTML penuh ikut didukung.

function escapeHtml(teks: string): string {
  return teks
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inline(teks: string): string {
  let hasil = escapeHtml(teks);
  hasil = hasil.replace(/`([^`]+)`/g, "<code>$1</code>");
  hasil = hasil.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  hasil = hasil.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  hasil = hasil.replace(
    /\[([^\]]+)\]\((https?:[^)\s]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );
  return hasil;
}

export function renderMarkdown(md: string): string {
  const baris = md.split(/\r?\n/);
  const html: string[] = [];
  let i = 0;
  let dalamKode = false;
  let bufKode: string[] = [];
  let bufDaftar: string[] | null = null;
  let bufParagraf: string[] = [];

  const tutupParagraf = () => {
    if (bufParagraf.length > 0) {
      html.push(`<p>${inline(bufParagraf.join(" "))}</p>`);
      bufParagraf = [];
    }
  };
  const tutupDaftar = () => {
    if (bufDaftar) {
      html.push(`<ul>${bufDaftar.join("")}</ul>`);
      bufDaftar = null;
    }
  };

  while (i < baris.length) {
    const barisAsli = baris[i];
    const barisTrim = barisAsli.trim();

    if (barisTrim.startsWith("```")) {
      if (dalamKode) {
        html.push(`<pre><code>${escapeHtml(bufKode.join("\n"))}</code></pre>`);
        bufKode = [];
        dalamKode = false;
      } else {
        tutupParagraf();
        tutupDaftar();
        dalamKode = true;
      }
      i += 1;
      continue;
    }
    if (dalamKode) {
      bufKode.push(barisAsli);
      i += 1;
      continue;
    }

    if (barisTrim === "") {
      tutupParagraf();
      tutupDaftar();
      i += 1;
      continue;
    }

    const heading = barisTrim.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      tutupParagraf();
      tutupDaftar();
      const level = heading[1].length;
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      i += 1;
      continue;
    }

    if (barisTrim === "---" || barisTrim === "***") {
      tutupParagraf();
      tutupDaftar();
      html.push("<hr />");
      i += 1;
      continue;
    }

    if (barisTrim.startsWith("> ")) {
      tutupParagraf();
      tutupDaftar();
      html.push(`<blockquote>${inline(barisTrim.slice(2))}</blockquote>`);
      i += 1;
      continue;
    }

    const item = barisTrim.match(/^[-*]\s+(.*)$/);
    if (item) {
      tutupParagraf();
      if (!bufDaftar) bufDaftar = [];
      bufDaftar.push(`<li>${inline(item[1])}</li>`);
      i += 1;
      continue;
    }

    const itemAngka = barisTrim.match(/^\d+\.\s+(.*)$/);
    if (itemAngka) {
      tutupParagraf();
      if (!bufDaftar) bufDaftar = [];
      bufDaftar.push(`<li>${inline(itemAngka[1])}</li>`);
      i += 1;
      continue;
    }

    bufParagraf.push(barisTrim);
    i += 1;
  }
  tutupParagraf();
  tutupDaftar();
  if (dalamKode) {
    html.push(`<pre><code>${escapeHtml(bufKode.join("\n"))}</code></pre>`);
  }
  return html.join("\n");
}
