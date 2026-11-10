import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mahfud.md — Dokumentasi Markdown",
  description:
    "Package aplikasi dokumentasi Markdown open-source, self-hosted. File .md sebagai sumber kebenaran.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <header className="border-b">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-lg font-bold tracking-tight">
              Mahfud<span className="text-muted-foreground">.md</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground">
                Beranda
              </Link>
              {/* TODO(v0.1): rute /masuk + panel admin setelah autentikasi lokal jadi */}
              <span className="rounded-full border px-3 py-1 text-xs">
                v0.1 scaffold
              </span>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="border-t">
          <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-muted-foreground">
            Mahfud.md v0.1 — dokumentasi Markdown open-source, self-hosted.
            Data tersimpan di server Anda sendiri.
          </div>
        </footer>
      </body>
    </html>
  );
}
