import type { Metadata } from "next";
import { Crimson_Text } from "next/font/google";

import { SiteHeader } from "@/components/site-header";
import { AudienceProvider } from "@/lib/audience-context";
import { getAppUrl } from "@/lib/env";
import { TranslationProvider } from "@/lib/translation-context";

import "./globals.css";

const appUrl = getAppUrl();

const crimsonText = Crimson_Text({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-crimson",
});

export const metadata: Metadata = {
  title: "Scripture Journey",
  description: "A calm daily Scripture journey for reading, reflecting, memorizing, and living God's Word.",
  manifest: "/manifest.webmanifest",
  metadataBase: new URL(appUrl),
  openGraph: {
    title: "Scripture Journey",
    description: "A calm daily Scripture journey for reading, reflecting, memorizing, and living God's Word.",
    type: "website",
    url: appUrl,
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "Scripture Journey" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Scripture Journey",
    description: "A calm daily Scripture journey for reading, reflecting, memorizing, and living God's Word.",
    images: ["/icon-512.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={crimsonText.variable}>
      <body>
        <TranslationProvider>
          <AudienceProvider>
          <a className="skip-link" href="#main-content">
            Skip to content
          </a>
          <div className="shell">
            <SiteHeader />
            <div id="main-content">
              {children}
            </div>
          </div>
          <footer className="site-footer">
            <p className="footer-scripture">
              &ldquo;Not to us, O Lord, but to Your name give glory.&rdquo; — Psalm 115:1 (NKJV)
            </p>
            <p className="footer-tagline">Built to draw hearts closer to Christ.</p>
          </footer>
          </AudienceProvider>
        </TranslationProvider>
      </body>
    </html>
  );
}
