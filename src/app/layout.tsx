import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";

export const metadata: Metadata = {
  title: "Scripture Memory",
  description: "Production-ready scripture memory web app",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <header className="topbar">
            <div className="brand">Scripture Memory</div>
            <nav className="nav">
              <Link href="/">Home</Link>
              <Link href="/play">Play</Link>
              <Link href="/profile">Profile</Link>
              <Link href="/leaderboard">Leaderboard</Link>
              <Link href="/admin">Admin</Link>
              <Link href="/auth">Auth</Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
