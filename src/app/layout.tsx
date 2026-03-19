import type { Metadata } from "next";

import { SiteHeader } from "@/components/site-header";

import "./globals.css";

export const metadata: Metadata = {
  title: "Scripture Memory",
  description: "Memorize Scripture with game loops, streaks, and encouragement.",
  manifest: "/manifest.webmanifest",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://systemslibrarian.github.io/scripturegame"),
  openGraph: {
    title: "Scripture Memory",
    description: "Memorize Scripture with game loops, streaks, and encouragement.",
    type: "website",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://systemslibrarian.github.io/scripturegame",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "Scripture Memory" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Scripture Memory",
    description: "Memorize Scripture with game loops, streaks, and encouragement.",
    images: ["/icon-512.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <SiteHeader />
          {children}
        </div>
      </body>
    </html>
  );
}
