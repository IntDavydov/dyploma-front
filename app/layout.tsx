import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shop-Sync Gateway",
  description: "Global Shop-Sync Gateway Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur">
          <div className="container mx-auto flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 bg-accent rounded-sm flex items-center justify-center">
                 <svg className="h-4 w-4 text-accent-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                 </svg>
              </div>
              <Link href="/" className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
                Shop-Sync Gateway
              </Link>
            </div>
            {/* Nav links removed as requested */}
          </div>
        </header>
        <main className="flex-1">
          <div className="container mx-auto py-12 px-6">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
