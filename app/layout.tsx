import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthButton } from "@/components/AuthButton";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Code Mimic",
  description: "Recreate web pages with HTML and JavaScript, get scored, and learn better ways to write them.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <header className="flex items-center gap-6 border-b border-border bg-panel px-4 py-2.5">
          <Link href="/" className="font-mono text-sm font-semibold tracking-tight">
            <span className="text-accent">&lt;</span>code<span className="text-accent">/</span>mimic<span className="text-accent">&gt;</span>
          </Link>
          <nav className="flex gap-4 text-sm text-muted">
            <Link href="/" className="hover:text-foreground">Challenges</Link>
            <Link href="/leaderboard" className="hover:text-foreground">Leaderboard</Link>
          </nav>
          <div className="ml-auto">
            <AuthButton />
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
